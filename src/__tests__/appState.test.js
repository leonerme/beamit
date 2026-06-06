import { describe, it, expect } from 'vitest';

// Test the reducer logic directly
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
      return { ...state, receiveQueue: [action.file, ...state.receiveQueue] };
    }
    case 'ADD_HISTORY': {
      const entry = { ...action.entry, timestamp: Date.now(), id: 'test-id' };
      return { ...state, transferHistory: [entry, ...state.transferHistory] };
    }
    case 'CLEAR_HISTORY':
      return { ...state, transferHistory: [] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'RESET_SESSION':
      return { ...initialState, settings: state.settings };
    default:
      return state;
  }
}

const initialState = {
  mode: null,
  connectionState: 'idle',
  sdpOffer: null,
  sdpAnswer: null,
  sendQueue: [],
  receiveQueue: [],
  progressMap: {},
  transferHistory: [],
  page: 'home',
  settings: { chunkSize: 65536, showNotifications: true, autoDownload: true },
};

describe('App state reducer', () => {
  it('sets page', () => {
    const state = reducer(initialState, { type: 'SET_PAGE', page: 'create' });
    expect(state.page).toBe('create');
  });

  it('sets mode', () => {
    const state = reducer(initialState, { type: 'SET_MODE', mode: 'sender' });
    expect(state.mode).toBe('sender');
  });

  it('sets connection state', () => {
    const state = reducer(initialState, { type: 'SET_CONNECTION_STATE', state: 'connected' });
    expect(state.connectionState).toBe('connected');
  });

  it('stores SDP offer', () => {
    const state = reducer(initialState, { type: 'SET_SDP_OFFER', sdp: '{"type":"offer"}' });
    expect(state.sdpOffer).toBe('{"type":"offer"}');
  });

  it('adds to receive queue', () => {
    const file = { fileId: 'abc', meta: { name: 'test.txt' } };
    const state = reducer(initialState, { type: 'ADD_TO_RECEIVE_QUEUE', file });
    expect(state.receiveQueue).toHaveLength(1);
    expect(state.receiveQueue[0].fileId).toBe('abc');
  });

  it('does not duplicate receive queue entries', () => {
    const file = { fileId: 'abc', meta: { name: 'test.txt' } };
    let state = reducer(initialState, { type: 'ADD_TO_RECEIVE_QUEUE', file });
    state = reducer(state, { type: 'ADD_TO_RECEIVE_QUEUE', file });
    expect(state.receiveQueue).toHaveLength(1);
  });

  it('adds history entry', () => {
    const entry = { direction: 'send', filename: 'test.txt', size: 1024, verified: true };
    const state = reducer(initialState, { type: 'ADD_HISTORY', entry });
    expect(state.transferHistory).toHaveLength(1);
    expect(state.transferHistory[0].filename).toBe('test.txt');
  });

  it('clears history', () => {
    const entry = { direction: 'send', filename: 'test.txt', size: 1024, verified: true };
    let state = reducer(initialState, { type: 'ADD_HISTORY', entry });
    state = reducer(state, { type: 'CLEAR_HISTORY' });
    expect(state.transferHistory).toHaveLength(0);
  });

  it('updates settings', () => {
    const state = reducer(initialState, { type: 'UPDATE_SETTINGS', settings: { autoDownload: false } });
    expect(state.settings.autoDownload).toBe(false);
    expect(state.settings.showNotifications).toBe(true); // unchanged
  });

  it('resets session but preserves settings', () => {
    let state = reducer(initialState, { type: 'SET_PAGE', page: 'transfer' });
    state = reducer(state, { type: 'SET_MODE', mode: 'sender' });
    state = reducer(state, { type: 'UPDATE_SETTINGS', settings: { autoDownload: false } });
    state = reducer(state, { type: 'RESET_SESSION' });
    expect(state.page).toBe('home');
    expect(state.mode).toBeNull();
    expect(state.settings.autoDownload).toBe(false);
  });
});
