import { createContext, useContext, useReducer } from 'react';

const initialState = {
  // Connection
  mode: null, // 'sender' | 'receiver'
  connectionState: 'idle', // idle|waiting|connecting|connected|disconnected|failed
  sdpOffer: null,
  sdpAnswer: null,

  // Transfer
  sendQueue: [],
  receiveQueue: [],
  progressMap: {}, // fileId -> progress object
  transferHistory: [],

  // UI
  page: 'home', // home|create|join|transfer|history|settings
  settings: {
    chunkSize: 65536,
    showNotifications: true,
    autoDownload: true,
    soundEnabled: false,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.state };

    case 'SET_SDP_OFFER':
      return { ...state, sdpOffer: action.sdp };

    case 'SET_SDP_ANSWER':
      return { ...state, sdpAnswer: action.sdp };

    case 'UPDATE_SEND_QUEUE':
      return { ...state, sendQueue: action.queue };

    case 'ADD_TO_RECEIVE_QUEUE': {
      const existing = state.receiveQueue.find((f) => f.fileId === action.file.fileId);
      if (existing) return state;
      return {
        ...state,
        receiveQueue: [action.file, ...state.receiveQueue],
      };
    }

    case 'UPDATE_RECEIVE_FILE': {
      return {
        ...state,
        receiveQueue: state.receiveQueue.map((f) =>
          f.fileId === action.fileId ? { ...f, ...action.updates } : f
        ),
      };
    }

    case 'SET_PROGRESS': {
      return {
        ...state,
        progressMap: {
          ...state.progressMap,
          [action.fileId]: action.progress,
        },
      };
    }

    case 'ADD_HISTORY': {
      const entry = {
        ...action.entry,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      };
      const history = [entry, ...state.transferHistory].slice(0, 200);
      return { ...state, transferHistory: history };
    }

    case 'CLEAR_HISTORY':
      return { ...state, transferHistory: [] };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'RESET_SESSION':
      return {
        ...initialState,
        settings: state.settings,
        transferHistory: state.transferHistory,
        page: 'home',
      };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
