import { sha256File, sha256Buffer } from '../utils/crypto.js';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const BUFFERED_AMOUNT_LOW_THRESHOLD = 1024 * 1024; // 1MB
const MAX_BUFFER = 4 * 1024 * 1024; // 4MB backpressure

const MSG_TYPE = {
  FILE_META: 'FILE_META',
  CHUNK: 'CHUNK',
  CHUNK_ACK: 'CHUNK_ACK',
  FILE_DONE: 'FILE_DONE',
  FILE_VERIFIED: 'FILE_VERIFIED',
  FILE_ERROR: 'FILE_ERROR',
  CANCEL: 'CANCEL',
  PING: 'PING',
  PONG: 'PONG',
};

export class FileTransferService {
  constructor(rtcService) {
    this.rtc = rtcService;
    this.sendQueue = [];
    this.isSending = false;
    this.currentTransfer = null;
    this.receiveBuffers = new Map(); // fileId -> { meta, chunks, received }

    // Callbacks
    this.onProgress = null;
    this.onFileMeta = null;
    this.onFileReceived = null;
    this.onTransferComplete = null;
    this.onTransferError = null;
    this.onQueueUpdate = null;

    this._setupMessageHandler();
  }

  _setupMessageHandler() {
    this.rtc.onMessage = (data) => {
      try {
        if (typeof data === 'string') {
          const msg = JSON.parse(data);
          this._handleControlMessage(msg);
        } else if (data instanceof ArrayBuffer) {
          this._handleChunkData(data);
        }
      } catch (err) {
        console.error('Message handling error:', err);
      }
    };
  }

  async _handleControlMessage(msg) {
    switch (msg.type) {
      case MSG_TYPE.FILE_META:
        this._initReceiveBuffer(msg);
        break;

      case MSG_TYPE.FILE_DONE:
        await this._finalizeReceive(msg.fileId);
        break;

      case MSG_TYPE.CHUNK_ACK:
        this._handleAck(msg);
        break;

      case MSG_TYPE.FILE_VERIFIED:
        if (this.onTransferComplete) {
          this.onTransferComplete({ fileId: msg.fileId, verified: true });
        }
        break;

      case MSG_TYPE.FILE_ERROR:
        if (this.onTransferError) {
          this.onTransferError({ fileId: msg.fileId, reason: msg.reason });
        }
        break;

      case MSG_TYPE.CANCEL:
        this._handleRemoteCancel(msg.fileId);
        break;

      case MSG_TYPE.PING:
        this._sendControl({ type: MSG_TYPE.PONG, ts: msg.ts });
        break;

      default:
        break;
    }
  }

  _handleChunkData(buffer) {
    // Protocol: first 36 bytes = fileId (UTF-8), next 4 bytes = chunkIndex (uint32), rest = data
    const view = new DataView(buffer);
    const fileIdBytes = new Uint8Array(buffer, 0, 36);
    const fileId = new TextDecoder().decode(fileIdBytes);
    const chunkIndex = view.getUint32(36, false);
    const chunkData = buffer.slice(40);

    const entry = this.receiveBuffers.get(fileId);
    if (!entry) return;

    entry.chunks[chunkIndex] = chunkData;
    entry.receivedBytes += chunkData.byteLength;

    // Progress callback
    if (this.onProgress) {
      const now = Date.now();
      const elapsed = (now - entry.startTime) / 1000;
      const speed = elapsed > 0 ? entry.receivedBytes / elapsed : 0;
      const remaining = entry.meta.size - entry.receivedBytes;
      const eta = speed > 0 ? remaining / speed : 0;

      this.onProgress({
        fileId,
        direction: 'receive',
        filename: entry.meta.name,
        transferred: entry.receivedBytes,
        total: entry.meta.size,
        percent: Math.min(100, (entry.receivedBytes / entry.meta.size) * 100),
        speed,
        eta,
      });
    }

    // Send ACK
    this._sendControl({ type: MSG_TYPE.CHUNK_ACK, fileId, chunkIndex });
  }

  _initReceiveBuffer(msg) {
    this.receiveBuffers.set(msg.fileId, {
      meta: msg.meta,
      chunks: [],
      receivedBytes: 0,
      startTime: Date.now(),
    });

    if (this.onFileMeta) {
      this.onFileMeta({
        fileId: msg.fileId,
        meta: msg.meta,
        status: 'receiving',
      });
    }
  }

  async _finalizeReceive(fileId) {
    const entry = this.receiveBuffers.get(fileId);
    if (!entry) return;

    try {
      // Reassemble chunks in order
      const totalSize = entry.chunks.reduce((s, c) => s + c.byteLength, 0);
      const combined = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of entry.chunks) {
        combined.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // Verify hash
      const hash = await sha256Buffer(combined.buffer);
      const verified = hash === entry.meta.hash;

      const blob = new Blob([combined], { type: entry.meta.mimeType || 'application/octet-stream' });

      this._sendControl({
        type: verified ? MSG_TYPE.FILE_VERIFIED : MSG_TYPE.FILE_ERROR,
        fileId,
        reason: verified ? undefined : 'Hash mismatch',
      });

      if (this.onFileReceived) {
        this.onFileReceived({
          fileId,
          blob,
          meta: entry.meta,
          verified,
        });
      }

      this.receiveBuffers.delete(fileId);
    } catch (err) {
      console.error('Finalize receive error:', err);
      this._sendControl({ type: MSG_TYPE.FILE_ERROR, fileId, reason: err.message });
    }
  }

  _handleAck() {
    // ACK received — currently using ordered/reliable channel so acks are informational
    // Could be used for window-based flow control in future
  }

  _handleRemoteCancel(fileId) {
    this.receiveBuffers.delete(fileId);
    if (this.onTransferError) {
      this.onTransferError({ fileId, reason: 'Cancelled by sender' });
    }
  }

  /** Add files to the send queue */
  async queueFiles(files) {
    const entries = await Promise.all(
      Array.from(files).map(async (file) => {
        const hash = await sha256File(file);
        return {
          fileId: crypto.randomUUID(),
          file,
          hash,
          status: 'queued',
        };
      })
    );

    this.sendQueue.push(...entries);
    if (this.onQueueUpdate) this.onQueueUpdate([...this.sendQueue]);
    this._processQueue();
  }

  async _processQueue() {
    if (this.isSending || this.sendQueue.length === 0) return;
    const next = this.sendQueue.find((e) => e.status === 'queued');
    if (!next) return;

    next.status = 'sending';
    this.isSending = true;
    this.currentTransfer = next;
    if (this.onQueueUpdate) this.onQueueUpdate([...this.sendQueue]);

    try {
      await this._sendFile(next);
      next.status = 'done';
    } catch (err) {
      next.status = 'error';
      next.error = err.message;
      if (this.onTransferError) this.onTransferError({ fileId: next.fileId, reason: err.message });
    }

    this.isSending = false;
    this.currentTransfer = null;
    if (this.onQueueUpdate) this.onQueueUpdate([...this.sendQueue]);
    this._processQueue();
  }

  async _sendFile(entry) {
    const { file, fileId, hash } = entry;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Send metadata
    this._sendControl({
      type: MSG_TYPE.FILE_META,
      fileId,
      meta: {
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        hash,
        totalChunks,
        lastModified: file.lastModified,
      },
    });

    const startTime = Date.now();
    let bytesSent = 0;

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      if (entry.status === 'cancelled') break;

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);
      const chunkBuffer = await slice.arrayBuffer();

      // Backpressure: wait if buffer is full
      await this._waitForBuffer();

      // Build packet: [fileId(36 bytes)] [chunkIndex(4 bytes)] [data]
      const fileIdBytes = new TextEncoder().encode(fileId.padEnd(36, '\0').slice(0, 36));
      const header = new ArrayBuffer(40);
      const headerView = new DataView(header);
      new Uint8Array(header).set(fileIdBytes);
      headerView.setUint32(36, i, false);

      const packet = this._concat(header, chunkBuffer);
      this.rtc.send(packet);

      bytesSent += chunkBuffer.byteLength;

      if (this.onProgress) {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const speed = elapsed > 0 ? bytesSent / elapsed : 0;
        const remaining = file.size - bytesSent;
        const eta = speed > 0 ? remaining / speed : 0;

        this.onProgress({
          fileId,
          direction: 'send',
          filename: file.name,
          transferred: bytesSent,
          total: file.size,
          percent: Math.min(100, (bytesSent / file.size) * 100),
          speed,
          eta,
        });
      }
    }

    // Signal done
    this._sendControl({ type: MSG_TYPE.FILE_DONE, fileId });
  }

  _waitForBuffer() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.rtc.getBufferedAmount() < MAX_BUFFER) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  _concat(a, b) {
    const result = new Uint8Array(a.byteLength + b.byteLength);
    result.set(new Uint8Array(a), 0);
    result.set(new Uint8Array(b), a.byteLength);
    return result.buffer;
  }

  _sendControl(obj) {
    try {
      this.rtc.send(JSON.stringify(obj));
    } catch (err) {
      console.error('Control send error:', err);
    }
  }

  cancelTransfer(fileId) {
    const entry = this.sendQueue.find((e) => e.fileId === fileId);
    if (entry) entry.status = 'cancelled';
    this._sendControl({ type: MSG_TYPE.CANCEL, fileId });
  }

  clearQueue() {
    this.sendQueue = this.sendQueue.filter((e) => e.status === 'sending');
    if (this.onQueueUpdate) this.onQueueUpdate([...this.sendQueue]);
  }

  ping() {
    this._sendControl({ type: MSG_TYPE.PING, ts: Date.now() });
  }
}
