import { useApp } from '../hooks/useAppState.jsx';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const { settings } = state;

  const update = (key, value) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { [key]: value } });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.sections}>
        <Section title="Transfer">
          <Toggle
            label="Auto-download received files"
            desc="Automatically trigger download when a file is received and verified"
            checked={settings.autoDownload}
            onChange={(v) => update('autoDownload', v)}
          />
        </Section>

        <Section title="Notifications">
          <Toggle
            label="Show notifications"
            desc="Browser notifications when transfers complete"
            checked={settings.showNotifications}
            onChange={(v) => update('showNotifications', v)}
          />
        </Section>

        <Section title="About">
          <div className={styles.about}>
            <div className={styles.aboutRow}>
              <span className={styles.aboutLabel}>Version</span>
              <span className={styles.aboutValue}>1.0.0</span>
            </div>
            <div className={styles.aboutRow}>
              <span className={styles.aboutLabel}>Protocol</span>
              <span className={styles.aboutValue}>WebRTC DataChannels</span>
            </div>
            <div className={styles.aboutRow}>
              <span className={styles.aboutLabel}>Signaling</span>
              <span className={styles.aboutValue}>Manual QR / SDP Exchange</span>
            </div>
            <div className={styles.aboutRow}>
              <span className={styles.aboutLabel}>Chunk size</span>
              <span className={styles.aboutValue}>64 KB</span>
            </div>
            <div className={styles.aboutRow}>
              <span className={styles.aboutLabel}>Integrity</span>
              <span className={styles.aboutValue}>SHA-256</span>
            </div>
            <div className={styles.aboutRow}>
              <span className={styles.aboutLabel}>Backend</span>
              <span className={styles.aboutValue} style={{ color: 'var(--accent-success)' }}>None — fully serverless</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className={styles.toggle}>
      <div className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {desc && <span className={styles.toggleDesc}>{desc}</span>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
        onClick={() => onChange(!checked)}
        aria-label={label}
      >
        <span className={styles.switchThumb} />
      </button>
    </label>
  );
}
