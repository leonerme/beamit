import { formatBytes, formatSpeed, formatETA } from '../utils/crypto.js';
import { getFileIcon } from '../utils/files.js';
import { ProgressBar } from './ProgressBar.jsx';
import { Button } from './Button.jsx';
import styles from './FileCard.module.css';

export function FileCard({ entry, progress, onCancel, onDownload, direction = 'send' }) {
  const file = entry.file || entry.meta || entry;
  const name = file?.name ?? entry.filename ?? 'Unknown file';
  const size = file?.size ?? 0;
  const status = entry.status ?? 'queued';
  const verified = entry.verified;
  const icon = getFileIcon({ name, type: file?.type || entry.mimeType || '' });

  const pct = progress?.percent ?? (status === 'done' || status === 'verified' ? 100 : 0);
  const speed = progress?.speed ?? 0;
  const eta = progress?.eta ?? 0;

  const isActive = status === 'sending' || (direction === 'receive' && status !== 'verified' && status !== 'error' && pct > 0 && pct < 100);
  const isDone = status === 'done' || status === 'verified';
  const isError = status === 'error' || status === 'cancelled';

  return (
    <div className={`${styles.card} ${isDone ? styles.done : ''} ${isError ? styles.error : ''}`}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>

      <div className={styles.info}>
        <div className={styles.top}>
          <span className={styles.name} title={name}>{name}</span>
          <span className={styles.size}>{formatBytes(size)}</span>
        </div>

        {(isActive || (isDone && pct > 0)) && (
          <ProgressBar
            percent={pct}
            color={isDone ? 'success' : 'primary'}
            animated={isActive}
            label={`${name} transfer progress`}
          />
        )}

        <div className={styles.meta}>
          {isActive && speed > 0 && (
            <>
              <span>{formatSpeed(speed)}</span>
              <span>·</span>
              <span>{formatETA(eta)} left</span>
              <span>·</span>
              <span>{Math.round(pct)}%</span>
            </>
          )}

          {isDone && (
            <span className={`${styles.badge} ${verified !== false ? styles.verified : styles.unverified}`}>
              {verified !== false ? '✓ Verified' : '⚠ Unverified'}
            </span>
          )}

          {isError && (
            <span className={`${styles.badge} ${styles.errBadge}`}>
              {entry.error || 'Transfer failed'}
            </span>
          )}

          {status === 'queued' && (
            <span className={styles.queuedLabel}>Queued</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        {isActive && onCancel && (
          <Button variant="ghost" size="sm" onClick={() => onCancel(entry.fileId)} aria-label="Cancel transfer">
            ✕
          </Button>
        )}
        {isDone && direction === 'receive' && onDownload && (
          <Button variant="ghost" size="sm" onClick={() => onDownload(entry.fileId)} aria-label="Download file">
            ↓
          </Button>
        )}
      </div>
    </div>
  );
}
