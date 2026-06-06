import { useState, useEffect } from 'react';
import { generateQRCode, compressSDP } from '../utils/qr.js';
import { Button } from './Button.jsx';
import styles from './QRDisplay.module.css';

export function QRDisplay({ sdp, label = 'Scan with other device' }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!sdp) return;
    const compressed = compressSDP(sdp);
    generateQRCode(compressed)
      .then(setQrUrl)
      .catch((err) => {
        console.error('QR gen error:', err);
        setError('SDP too large for QR — use manual copy below');
      });
  }, [sdp]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(compressSDP(sdp));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowRaw(true);
    }
  };

  if (!sdp) return null;

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>

      {error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
        </div>
      ) : !qrUrl ? (
        <div className={styles.placeholder}>
          <div className={styles.spinner} />
          <span>Generating QR…</span>
        </div>
      ) : (
        <div className={styles.qrContainer}>
          <img src={qrUrl} alt="Session QR Code" className={styles.qrImage} />
          <div className={styles.corner} style={{ top: 8, left: 8 }} />
          <div className={styles.corner} style={{ top: 8, right: 8 }} />
          <div className={styles.corner} style={{ bottom: 8, left: 8 }} />
          <div className={styles.corner} style={{ bottom: 8, right: 8 }} />
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onClick={copyToClipboard}>
          {copied ? '✓ Copied' : 'Copy Code'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? 'Hide' : 'Show'} Raw
        </Button>
      </div>

      {showRaw && (
        <textarea
          className={styles.rawSdp}
          readOnly
          value={compressSDP(sdp)}
          rows={4}
          onClick={(e) => e.target.select()}
          aria-label="Raw SDP code"
        />
      )}
    </div>
  );
}
