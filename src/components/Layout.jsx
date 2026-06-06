import { useApp } from '../hooks/useAppState.jsx';
import { ConnectionBadge } from './ConnectionBadge.jsx';
import styles from './Layout.module.css';

export function Layout({ children }) {
  const { state, dispatch } = useApp();

  return (
    <div className={styles.shell}>
      <header className={styles.header} role="banner">
        <button
          className={styles.logo}
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'home' })}
          aria-label="BeamIt home"
        >
          <BeamIcon />
          <span>BeamIt</span>
        </button>

        <nav className={styles.nav} role="navigation" aria-label="Main navigation">
          {state.connectionState !== 'idle' && (
            <ConnectionBadge state={state.connectionState} />
          )}
          <button
            className={`${styles.navLink} ${state.page === 'history' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'history' })}
            aria-current={state.page === 'history' ? 'page' : undefined}
          >
            History
          </button>
          <button
            className={`${styles.navLink} ${state.page === 'settings' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })}
            aria-current={state.page === 'settings' ? 'page' : undefined}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className={styles.main} id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className={styles.footer}>
        <p>
          BeamIt · Direct device-to-device transfer via WebRTC ·{' '}
          <span className={styles.footerHighlight}>No servers. No cloud. No limits.</span>
        </p>
      </footer>
    </div>
  );
}

function BeamIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="var(--accent-primary)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
