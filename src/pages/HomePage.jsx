import { useTransfer } from '../hooks/useTransfer.js';
import { Button } from '../components/Button.jsx';
import styles from './HomePage.module.css';

export function HomePage() {
  const { createSession, state, dispatch } = useTransfer();

  const handleCreate = async () => {
    try {
      await createSession();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = () => {
    dispatch({ type: 'SET_PAGE', page: 'join' });
  };

  return (
    <div className={styles.page}>
      {/* Ambient background orbs */}
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.hero}>
        <div className={styles.logoMark} aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="var(--accent-primary)" stroke="var(--accent-primary)" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className={styles.title}>
          Send files at<br />
          <span className={styles.highlight}>the speed of light</span>
        </h1>

        <p className={styles.subtitle}>
          Direct device-to-device file transfer over WebRTC.<br />
          No servers, no cloud, no size limits. Completely private.
        </p>

        <div className={styles.cards}>
          <button className={`${styles.modeCard} ${styles.sender}`} onClick={handleCreate} aria-label="Create a new session as sender">
            <div className={styles.cardIcon}>
              <SendIcon />
            </div>
            <div className={styles.cardText}>
              <span className={styles.cardTitle}>Send Files</span>
              <span className={styles.cardDesc}>Create a session and share the QR code with the receiver</span>
            </div>
            <ArrowIcon />
          </button>

          <button className={`${styles.modeCard} ${styles.receiver}`} onClick={handleJoin} aria-label="Join an existing session as receiver">
            <div className={styles.cardIcon}>
              <ReceiveIcon />
            </div>
            <div className={styles.cardText}>
              <span className={styles.cardTitle}>Receive Files</span>
              <span className={styles.cardDesc}>Scan the QR code from the sender to establish connection</span>
            </div>
            <ArrowIcon />
          </button>
        </div>
      </div>

      <div className={styles.features}>
        <Feature icon="🔒" title="End-to-end encrypted" desc="WebRTC DTLS encryption — nobody can intercept your files" />
        <Feature icon="⚡" title="No size limits" desc="Transfer files of any size with chunked streaming" />
        <Feature icon="🔍" title="SHA-256 verified" desc="Every file is verified for integrity after transfer" />
        <Feature icon="📡" title="Peer-to-peer" desc="Files travel directly between devices — no server involved" />
      </div>

      <div className={styles.steps}>
        <h2 className={styles.stepsTitle}>How it works</h2>
        <ol className={styles.stepsList}>
          <li><span>1</span>Sender clicks <strong>Send Files</strong> and a QR code appears</li>
          <li><span>2</span>Receiver scans QR on this same website, a second QR appears</li>
          <li><span>3</span>Sender scans that QR — connection established instantly</li>
          <li><span>4</span>Drag &amp; drop files to transfer at full local network speed</li>
        </ol>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className={styles.feature}>
      <span className={styles.featureIcon}>{icon}</span>
      <div>
        <p className={styles.featureTitle}>{title}</p>
        <p className={styles.featureDesc}>{desc}</p>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function ReceiveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.4 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
