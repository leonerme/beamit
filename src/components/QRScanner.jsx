import { useState, useCallback } from 'react';
import { useQRScanner } from '../hooks/useQRScanner.js';
import { decompressSDP } from '../utils/qr.js';
import { Button } from './Button.jsx';
import styles from './QRScanner.module.css';

export function QRScanner({ onScan, label = 'Scan the QR code from the other device' }) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [scanError, setScanError] = useState(null);

  const handleDecode = useCallback((raw) => {
    try {
      const sdp = decompressSDP(raw);
      JSON.parse(sdp); // validate it's JSON
      setScanError(null);
      onScan(sdp);
    } catch {
      setScanError('Invalid QR code — not a BeamIt session code');
      setScanning(false);
    }
  }, [onScan]);

  const { videoRef, canvasRef, hasCamera, error: cameraError } = useQRScanner({
    onDecode: handleDecode,
    enabled: scanning,
  });

  const handleManualSubmit = () => {
    try {
      const sdp = decompressSDP(manualInput.trim());
      JSON.parse(sdp);
      onScan(sdp);
    } catch {
      setScanError('Invalid code — paste the full code from the other device');
    }
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>

      {!pasteMode ? (
        <>
          <div className={`${styles.cameraBox} ${scanning ? styles.active : ''}`}>
            <video
              ref={videoRef}
              className={styles.video}
              playsInline
              muted
              aria-label="Camera feed for QR scanning"
            />
            <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

            {!scanning && (
              <div className={styles.cameraPlaceholder}>
                <CameraIcon />
                <p>Camera preview</p>
              </div>
            )}

            {scanning && (
              <div className={styles.scanOverlay}>
                <div className={styles.scanLine} />
                <div className={styles.scanCorner} style={{ top: 24, left: 24 }} />
                <div className={styles.scanCorner} style={{ top: 24, right: 24, transform: 'rotate(90deg)' }} />
                <div className={styles.scanCorner} style={{ bottom: 24, left: 24, transform: 'rotate(-90deg)' }} />
                <div className={styles.scanCorner} style={{ bottom: 24, right: 24, transform: 'rotate(180deg)' }} />
              </div>
            )}
          </div>

          {(cameraError || hasCamera === false) && (
            <p className={styles.cameraError}>
              {cameraError || 'No camera available'} —{' '}
              <button className={styles.switchLink} onClick={() => setPasteMode(true)}>
                paste code instead
              </button>
            </p>
          )}

          {scanError && <p className={styles.error}>{scanError}</p>}

          <div className={styles.actions}>
            {!scanning ? (
              <Button variant="primary" onClick={() => { setScanError(null); setScanning(true); }}>
                <CameraIcon size={16} /> Start Camera
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setScanning(false)}>
                Stop Camera
              </Button>
            )}
            <Button variant="ghost" onClick={() => { setScanning(false); setPasteMode(true); }}>
              Paste Code
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.pasteMode}>
          <p className={styles.pasteLabel}>Paste the code from the other device:</p>
          <textarea
            className={styles.pasteInput}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste session code here…"
            rows={5}
            aria-label="Paste session code"
          />
          {scanError && <p className={styles.error}>{scanError}</p>}
          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
            >
              Connect
            </Button>
            <Button variant="ghost" onClick={() => { setPasteMode(false); setManualInput(''); setScanError(null); }}>
              Use Camera
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
