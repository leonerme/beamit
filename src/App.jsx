import { AppProvider, useApp } from './hooks/useAppState.jsx';
import { Layout } from './components/Layout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { CreatePage } from './pages/CreatePage.jsx';
import { JoinPage } from './pages/JoinPage.jsx';
import { TransferPage } from './pages/TransferPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

function Router() {
  const { state } = useApp();

  const pages = {
    home: <HomePage />,
    create: <CreatePage />,
    join: <JoinPage />,
    transfer: <TransferPage />,
    history: <HistoryPage />,
    settings: <SettingsPage />,
  };

  return (
    <Layout>
      <a href="#main-content" className="sr-only">Skip to main content</a>
      {pages[state.page] ?? <HomePage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
