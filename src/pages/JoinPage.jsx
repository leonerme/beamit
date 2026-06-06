import { useState } from 'react';
import { useTransfer } from '../hooks/useTransfer.js';
import { QRDisplay } from '../components/QRDisplay.jsx';
import { QRScanner } from '../components/QRScanner.jsx';
import { Button } from '../components/Button.jsx';
import { ConnectionBadge } from '../components/ConnectionBadge.jsx';
import styles from './SessionPage.module.css';

export function JoinPage() {
  const { state, joinSession, dispatch } = useTransfer();
  const [step, setStep] = useState('scan'); // 'scan' | 'answer'
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const handleScanOffer = async (offerSDP) => {
    setJoinError(null);
    setJoining(true);
    try {
      await joinSession(offerSDP);
      setStep('answer');
    } catch (err) {
      setJoinError('Failed to process offer: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Receive Files</h1>
          <ConnectionBadge state={state.connectionState} />
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
      </div>

      <div className={styles.stepIndicator} role="list" aria-label="Connection steps">
        <div className={`${styles.step} ${step === 'scan' ? styles.stepActive : styles.stepDone}`} role="listitem">
          <span className={styles.stepNum}>{step === 'scan' ? '1' : '✓'}</span>
          <span>Scan Offer</span>
        </div>
        <div className={styles.stepLine} aria-hidden="true" />
        <div className={`${styles.step} ${step === 'answer' ? styles.stepActive : styles.stepPending}`} role="listitem">
          <span className={styles.stepNum}>2</span>
          <span>Show QR</span>
        </div>
        <div className={styles.stepLine} aria-hidden="true" />
        <div className={`${styles.step} ${styles.stepPending}`} role="listitem">
          <span className={styles.stepNum}>3</span>
          <span>Receive</span>
        </div>
      </div>

      <div className={styles.content}>
        {step === 'scan' && (
          <div className={styles.panel}>
            <p className={styles.instruction}>
              Scan the <strong>QR code shown on the sender's device</strong> to begin the handshake.
            </p>

            <QRScanner
              onScan={handleScanOffer}
              label="Scan the sender's QR code"
            />

            {joinError && <p className={styles.error}>{joinError}</p>}
            {joining && <p className={styles.connecting}>Processing offer…</p>}
          </div>
        )}

        {step === 'answer' && (
          <div className={styles.panel}>
            <p className={styles.instruction}>
              Show this QR code to the <strong>sender's device</strong>. They need to scan it to complete the connection.
            </p>

            {state.sdpAnswer ? (
              <>
                <QRDisplay sdp={state.sdpAnswer} label="Sender scans this" />

                {state.connectionState === 'connected' && (
                  <div className={styles.connectedNotice}>
                    <p>Connected! The sender has scanned your answer.</p>
                    <Button variant="primary" size="md" onClick={() => dispatch({ type: 'SET_PAGE', page: 'transfer' })}>
                      Continue to transfer
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.generating}>
                <div className={styles.spinner} />
                <p>Generating answer…</p>
              </div>
            )}

            <p className={styles.waitingText}>
              Waiting for sender to scan…
              <ConnectionBadge state={state.connectionState} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
