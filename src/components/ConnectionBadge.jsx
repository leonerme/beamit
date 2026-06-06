import styles from './ConnectionBadge.module.css';

const STATE_CONFIG = {
  idle:         { label: 'Idle',         color: 'muted' },
  waiting:      { label: 'Waiting',      color: 'warning' },
  connecting:   { label: 'Connecting',   color: 'warning', pulse: true },
  connected:    { label: 'Connected',    color: 'success', pulse: true },
  reconnecting: { label: 'Reconnecting', color: 'warning', pulse: true },
  disconnected: { label: 'Disconnected', color: 'danger' },
  failed:       { label: 'Failed',       color: 'danger' },
};

export function ConnectionBadge({ state }) {
  const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.idle;
  return (
    <div className={`${styles.badge} ${styles[cfg.color]}`} role="status" aria-label={`Connection: ${cfg.label}`}>
      <span className={`${styles.dot} ${cfg.pulse ? styles.pulse : ''}`} />
      <span className={styles.label}>{cfg.label}</span>
    </div>
  );
}
