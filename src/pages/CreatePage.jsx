import { useState } from 'react';
import { useTransfer } from '../hooks/useTransfer.js';
import { QRDisplay } from '../components/QRDisplay.jsx';
import { QRScanner } from '../components/QRScanner.jsx';
import { Button } from '../components/Button.jsx';
import { ConnectionBadge } from '../components/ConnectionBadge.jsx';
import styles from './SessionPage.module.css';

export function CreatePage() {
  const { state, acceptAnswer, disconnect } = useTransfer();
  const [step, setStep] = useState('offer'); // 'offer' | 'scan'
  const [scanError, setScanError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const handleScanAnswer = async (answerSDP) => {
    setScanError(null);
    setAccepting(true);
    try {
      await acceptAnswer(answerSDP);
      // Page will switch to transfer automatically via connectionState listener
    } catch (err) {
      setScanError('Failed to connect: ' + err.message);
      setAccepting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Send Files</h1>
          <ConnectionBadge state={state.connectionState} />
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect}>Cancel</Button>
      </div>

      <div className={styles.stepIndicator} role="list" aria-label="Connection steps">
        <div className={`${styles.step} ${step === 'offer' ? styles.stepActive : styles.stepDone}`} role="listitem">
          <span className={styles.stepNum}>{step === 'offer' ? '1' : '✓'}</span>
          <span>Show QR</span>
        </div>
        <div className={styles.stepLine} aria-hidden="true" />
        <div className={`${styles.step} ${step === 'scan' ? styles.stepActive : step === 'offer' ? styles.stepPending : styles.stepDone}`} role="listitem">
          <span className={styles.stepNum}>2</span>
          <span>Scan Answer</span>
        </div>
        <div className={styles.stepLine} aria-hidden="true" />
        <div className={`${styles.step} ${styles.stepPending}`} role="listitem">
          <span className={styles.stepNum}>3</span>
          <span>Transfer</span>
        </div>
      </div>

      <div className={styles.content}>
        {step === 'offer' && (
          <div className={styles.panel} role="main">
            <p className={styles.instruction}>
              Show this QR code to the <strong>receiver's device</strong>. They need to scan it on this same website.
            </p>

            {state.sdpOffer ? (
              <QRDisplay sdp={state.sdpOffer} label="Receiver scans this" />
            ) : (
              <div className={styles.generating}>
                <div className={styles.spinner} />
                <p>Generating session…</p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep('scan')}
              disabled={!state.sdpOffer}
            >
              Receiver scanned it → Scan their QR
            </Button>
          </div>
        )}

        {step === 'scan' && (
          <div className={styles.panel}>
            <p className={styles.instruction}>
              Scan the <strong>QR code shown on the receiver's device</strong> to complete the connection.
            </p>

            <QRScanner
              onScan={handleScanAnswer}
              label="Scan the receiver's QR code"
            />

            {scanError && <p className={styles.error}>{scanError}</p>}
            {accepting && <p className={styles.connecting}>Establishing connection…</p>}

            <Button variant="ghost" size="sm" onClick={() => setStep('offer')}>
              ← Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
