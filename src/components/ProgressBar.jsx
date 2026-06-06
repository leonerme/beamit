import styles from './ProgressBar.module.css';

export function ProgressBar({ percent = 0, color = 'primary', animated = true, label }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={styles.track} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div
        className={`${styles.fill} ${styles[color]} ${animated && clamped < 100 ? styles.animated : ''}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
