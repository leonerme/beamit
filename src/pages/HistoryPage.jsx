import { useApp } from '../hooks/useAppState.jsx';
import { formatBytes } from '../utils/crypto.js';
import { formatTimestamp, getFileIcon, shortId } from '../utils/files.js';
import { Button } from '../components/Button.jsx';
import styles from './HistoryPage.module.css';

export function HistoryPage() {
  const { state, dispatch } = useApp();
  const { transferHistory } = state;

  const totalBytes = transferHistory.reduce((s, h) => s + (h.size || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>History</h1>
          <p className={styles.subtitle}>{transferHistory.length} transfers · {formatBytes(totalBytes)} total</p>
        </div>
        {transferHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
          >
            Clear All
          </Button>
        )}
      </div>

      {transferHistory.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <p>No transfer history yet</p>
          <p className={styles.emptyHint}>Completed transfers will appear here</p>
        </div>
      ) : (
        <div className={styles.list} role="list" aria-label="Transfer history">
          {transferHistory.map((entry) => (
            <div key={entry.id} className={styles.item} role="listitem">
              <div className={styles.itemIcon}>
                {getFileIcon({ name: entry.filename, type: '' })}
              </div>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{entry.filename}</span>
                <span className={styles.itemMeta}>
                  {formatBytes(entry.size)} · {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              <div className={styles.itemRight}>
                <span className={`${styles.dirBadge} ${entry.direction === 'send' ? styles.sent : styles.received}`}>
                  {entry.direction === 'send' ? '↑ Sent' : '↓ Received'}
                </span>
                <span className={`${styles.verifyBadge} ${entry.verified ? styles.ok : styles.warn}`}>
                  {entry.verified ? '✓' : '⚠'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
