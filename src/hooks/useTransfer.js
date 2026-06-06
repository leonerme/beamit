import { useEffect, useRef, useCallback } from 'react';
import { useApp } from './useAppState.jsx';
import { webrtcService } from '../services/webrtc.js';
import { FileTransferService } from '../services/fileTransfer.js';
import { downloadBlob } from '../utils/files.js';

let transferService = null;

export function useTransfer() {
  const { state, dispatch } = useApp();
  const transferServiceRef = useRef(null);
  const pageRef = useRef(state.page);

  useEffect(() => {
    pageRef.current = state.page;
  }, [state.page]);

  // Initialize transfer service
  const initTransferService = useCallback(() => {
    if (transferServiceRef.current) return transferServiceRef.current;

    const svc = new FileTransferService(webrtcService);

    svc.onProgress = (progress) => {
      dispatch({ type: 'SET_PROGRESS', fileId: progress.fileId, progress });
      if (progress.direction === 'receive') {
        dispatch({
          type: 'UPDATE_RECEIVE_FILE',
          fileId: progress.fileId,
          updates: { progress },
        });
      }
    };

    svc.onFileMeta = ({ fileId, meta, status }) => {
      dispatch({
        type: 'ADD_TO_RECEIVE_QUEUE',
        file: {
          fileId,
          meta,
          status,
        },
      });
    };

    svc.onFileReceived = ({ fileId, blob, meta, verified }) => {
      dispatch({
        type: 'UPDATE_RECEIVE_FILE',
        fileId,
        updates: { blob, status: verified ? 'verified' : 'error', verified },
      });

      dispatch({
        type: 'ADD_HISTORY',
        entry: {
          direction: 'receive',
          filename: meta.name,
          size: meta.size,
          verified,
          fileId,
        },
      });

      if (state.settings.autoDownload && verified) {
        downloadBlob(blob, meta.name);
      }
    };

    svc.onTransferComplete = ({ fileId, verified }) => {
      dispatch({
        type: 'UPDATE_RECEIVE_FILE',
        fileId,
        updates: { verified, status: verified ? 'verified' : 'error' },
      });
    };

    svc.onTransferError = ({ fileId, reason }) => {
      dispatch({
        type: 'UPDATE_RECEIVE_FILE',
        fileId,
        updates: { status: 'error', error: reason },
      });
    };

    svc.onQueueUpdate = (queue) => {
      dispatch({ type: 'UPDATE_SEND_QUEUE', queue });

      // Add completed to history
      queue
        .filter((e) => e.status === 'done')
        .forEach((e) => {
          const existing = state.transferHistory.find((h) => h.fileId === e.fileId);
          if (!existing) {
            dispatch({
              type: 'ADD_HISTORY',
              entry: {
                direction: 'send',
                filename: e.file.name,
                size: e.file.size,
                verified: true,
                fileId: e.fileId,
              },
            });
          }
        });
    };

    transferServiceRef.current = svc;
    transferService = svc;
    return svc;
  }, [dispatch]);

  // Setup WebRTC callbacks
  useEffect(() => {
    webrtcService.onConnectionStateChange = (connState) => {
      dispatch({ type: 'SET_CONNECTION_STATE', state: connState });
      if (connState === 'connected') {
        // Keep the receiver on the answer screen until they have a chance to see the QR code.
        if (pageRef.current !== 'join') {
          dispatch({ type: 'SET_PAGE', page: 'transfer' });
        }
      }
    };

    webrtcService.onError = (err) => {
      console.error('WebRTC error:', err);
      dispatch({ type: 'SET_CONNECTION_STATE', state: 'failed' });
    };

    return () => {
      webrtcService.onConnectionStateChange = null;
      webrtcService.onError = null;
    };
  }, [dispatch]);

  const createSession = useCallback(async () => {
    dispatch({ type: 'SET_MODE', mode: 'sender' });
    dispatch({ type: 'SET_CONNECTION_STATE', state: 'waiting' });
    dispatch({ type: 'SET_PAGE', page: 'create' });
    initTransferService();

    try {
      const offer = await webrtcService.createOffer();
      dispatch({ type: 'SET_SDP_OFFER', sdp: offer });
      return offer;
    } catch (err) {
      console.error('Create offer error:', err);
      dispatch({ type: 'SET_CONNECTION_STATE', state: 'failed' });
      throw err;
    }
  }, [dispatch, initTransferService]);

  const joinSession = useCallback(async (offerSDP) => {
    dispatch({ type: 'SET_MODE', mode: 'receiver' });
    dispatch({ type: 'SET_CONNECTION_STATE', state: 'connecting' });
    initTransferService();

    try {
      const answer = await webrtcService.createAnswer(offerSDP);
      dispatch({ type: 'SET_SDP_ANSWER', sdp: answer });
      return answer;
    } catch (err) {
      console.error('Create answer error:', err);
      dispatch({ type: 'SET_CONNECTION_STATE', state: 'failed' });
      throw err;
    }
  }, [dispatch, initTransferService]);

  const acceptAnswer = useCallback(async (answerSDP) => {
    try {
      await webrtcService.acceptAnswer(answerSDP);
      dispatch({ type: 'SET_CONNECTION_STATE', state: 'connecting' });
    } catch (err) {
      console.error('Accept answer error:', err);
      dispatch({ type: 'SET_CONNECTION_STATE', state: 'failed' });
      throw err;
    }
  }, [dispatch]);

  const sendFiles = useCallback(async (files) => {
    const svc = transferServiceRef.current || initTransferService();
    await svc.queueFiles(files);
  }, [initTransferService]);

  const cancelTransfer = useCallback((fileId) => {
    transferServiceRef.current?.cancelTransfer(fileId);
  }, []);

  const disconnect = useCallback(() => {
    webrtcService.close();
    transferServiceRef.current = null;
    transferService = null;
    dispatch({ type: 'RESET_SESSION' });
  }, [dispatch]);

  const downloadFile = useCallback((fileId) => {
    const received = state.receiveQueue.find((f) => f.fileId === fileId);
    if (received?.blob) {
      downloadBlob(received.blob, received.meta?.name ?? 'file');
    }
  }, [state.receiveQueue]);

  return {
    state,
    dispatch,
    createSession,
    joinSession,
    acceptAnswer,
    sendFiles,
    cancelTransfer,
    disconnect,
    downloadFile,
    isConnected: webrtcService.isConnected.bind(webrtcService),
  };
}
