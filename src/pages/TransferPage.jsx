import { useTransfer } from '../hooks/useTransfer.js';
import { DropZone } from '../components/DropZone.jsx';
import { FileCard } from '../components/FileCard.jsx';
import { Button } from '../components/Button.jsx';
import { ConnectionBadge } from '../components/ConnectionBadge.jsx';
import { formatBytes } from '../utils/crypto.js';
import styles from './TransferPage.module.css';

export function TransferPage() {
  const { state, sendFiles, cancelTransfer, downloadFile, disconnect } = useTransfer();
  const { sendQueue, receiveQueue, progressMap, connectionState, mode } = state;

  const isSender = mode === 'sender';
  const isConnected = connectionState === 'connected';

  // Stats
  const totalSent = sendQueue
    .filter((e) => e.status === 'done')
    .reduce((s, e) => s + (e.file?.size ?? 0), 0);

  const totalReceived = receiveQueue
    .filter((e) => e.status === 'verified')
    .reduce((s, e) => s + (e.meta?.size ?? 0), 0);

  const activeSend = sendQueue.find((e) => e.status === 'sending');
  const activeProgress = activeSend ? progressMap[activeSend.fileId] : null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Transfer</h1>
          <ConnectionBadge state={connectionState} />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.modeLabel}>{isSender ? '↑ Sender' : '↓ Receiver'}</span>
          <Button variant="danger" size="sm" onClick={disconnect}>Disconnect</Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar} role="complementary" aria-label="Transfer statistics">
        <div className={styles.stat}>
          <span className={styles.statValue}>{sendQueue.filter(e => e.status === 'done').length}</span>
          <span className={styles.statLabel}>Sent</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{receiveQueue.filter(e => e.status === 'verified').length}</span>
          <span className={styles.statLabel}>Received</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatBytes(totalSent + totalReceived)}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        {activeSend && activeProgress && (
          <>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>{Math.round(activeProgress.percent)}%</span>
              <span className={styles.statLabel}>Progress</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.columns}>
        {/* Send column */}
        <section className={styles.column} aria-label="Files to send">
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>Send</h2>
            <span className={styles.count}>{sendQueue.length}</span>
          </div>

          <DropZone
            onFiles={sendFiles}
            disabled={!isConnected}
          />

          {sendQueue.length > 0 && (
            <div className={styles.fileList} role="list" aria-label="Send queue">
              {sendQueue.map((entry) => (
                <div key={entry.fileId} role="listitem">
                  <FileCard
                    entry={entry}
                    progress={progressMap[entry.fileId]}
                    onCancel={cancelTransfer}
                    direction="send"
                  />
                </div>
              ))}
            </div>
          )}

          {!isConnected && (
            <p className={styles.disconnectedNote}>
              Connection lost. Files cannot be sent.
            </p>
          )}
        </section>

        {/* Divider */}
        <div className={styles.columnDivider} aria-hidden="true">
          <div className={styles.dividerLine} />
          <div className={styles.dividerIcon}>⇄</div>
          <div className={styles.dividerLine} />
        </div>

        {/* Receive column */}
        <section className={styles.column} aria-label="Received files">
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>Receive</h2>
            <span className={styles.count}>{receiveQueue.length}</span>
          </div>

          <div className={styles.receiveArea}>
            {receiveQueue.length === 0 ? (
              <div className={styles.receiveEmpty}>
                <p>Waiting for incoming files…</p>
                <p className={styles.hint}>The other device can drop files to send them here</p>
              </div>
            ) : (
              <div className={styles.fileList} role="list" aria-label="Received files">
                {receiveQueue.map((entry) => (
                  <div key={entry.fileId} role="listitem">
                    <FileCard
                      entry={entry}
                      progress={progressMap[entry.fileId]}
                      onDownload={downloadFile}
                      direction="receive"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
