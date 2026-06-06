// WebRTC configuration
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const DATA_CHANNEL_OPTIONS = {
  ordered: true,
  maxRetransmits: 30,
};

export class WebRTCService {
  constructor() {
    this.pc = null;
    this.dataChannel = null;
    this.onConnectionStateChange = null;
    this.onDataChannelOpen = null;
    this.onMessage = null;
    this.onError = null;
    this._iceCandidates = [];
    this._iceGatheringDone = null;
  }

  /** Create a new RTCPeerConnection and set up handlers */
  _createPeerConnection() {
    if (this.pc) {
      this.pc.close();
    }
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this._iceCandidates = [];

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._iceCandidates.push(e.candidate);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState;
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this._mapICEState(state));
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
    };

    return this.pc;
  }

  _mapICEState(iceState) {
    const map = {
      new: 'connecting',
      checking: 'connecting',
      connected: 'connected',
      completed: 'connected',
      failed: 'failed',
      disconnected: 'disconnected',
      closed: 'disconnected',
    };
    return map[iceState] || iceState;
  }

  /** Wait for ICE gathering to complete */
  _waitForICEGathering(pc) {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      const check = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      pc.addEventListener('icegatheringstatechange', check);
      // Fallback timeout - some networks are slow
      setTimeout(resolve, 4000);
    });
  }

  /** SENDER: Create offer and wait for ICE */
  async createOffer() {
    const pc = this._createPeerConnection();

    try {
      // Create data channel as sender
      this.dataChannel = pc.createDataChannel('beamit', DATA_CHANNEL_OPTIONS);
      this._setupDataChannel(this.dataChannel);

      const offer = await pc.createOffer();
      
      if (offer.type !== 'offer') {
        throw new Error(`Expected offer type, got ${offer.type}`);
      }

      await pc.setLocalDescription(offer);
      await this._waitForICEGathering(pc);

      // Return the full local description (includes trickled ICE)
      return JSON.stringify({
        type: pc.localDescription.type,
        sdp: pc.localDescription.sdp,
      });
    } catch (err) {
      pc.close();
      this.pc = null;
      throw new Error(`Failed to create offer: ${err.message}`);
    }
  }

  /** RECEIVER: Accept offer, create answer */
  async createAnswer(offerStr) {
    const pc = this._createPeerConnection();

    // Listen for data channel from sender
    pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this._setupDataChannel(this.dataChannel);
    };

    const offerObj = JSON.parse(offerStr);
    
    // Validate offer type
    if (offerObj.type !== 'offer') {
      throw new Error(`Invalid SDP type for createAnswer: expected 'offer', got '${offerObj.type}'`);
    }

    try {
      await pc.setRemoteDescription(offerObj);
    } catch (err) {
      pc.close();
      this.pc = null;
      throw new Error(`Failed to set remote offer: ${err.message}`);
    }

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
    } catch (err) {
      pc.close();
      this.pc = null;
      throw new Error(`Failed to create answer: ${err.message}`);
    }

    await this._waitForICEGathering(pc);

    return JSON.stringify({
      type: pc.localDescription.type,
      sdp: pc.localDescription.sdp,
    });
  }

  /** SENDER: Accept the answer from receiver */
  async acceptAnswer(answerStr) {
    if (!this.pc) throw new Error('No peer connection. Call createOffer first.');
    
    const answerObj = JSON.parse(answerStr);
    
    // Validate answer type
    if (answerObj.type !== 'answer') {
      throw new Error(`Invalid SDP type for acceptAnswer: expected 'answer', got '${answerObj.type}'`);
    }

    // Verify we're in the correct state
    if (this.pc.signalingState !== 'have-local-offer') {
      throw new Error(`Cannot accept answer in state '${this.pc.signalingState}'. Expected 'have-local-offer'. ` +
        `Did you call createOffer() first?`);
    }

    try {
      await this.pc.setRemoteDescription(answerObj);
    } catch (err) {
      throw new Error(`Failed to set remote answer: ${err.message}`);
    }
  }

  _setupDataChannel(channel) {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      if (this.onDataChannelOpen) this.onDataChannelOpen();
      if (this.onConnectionStateChange) this.onConnectionStateChange('connected');
    };

    channel.onclose = () => {
      if (this.onConnectionStateChange) this.onConnectionStateChange('disconnected');
    };

    channel.onerror = (err) => {
      console.error('DataChannel error:', err);
      if (this.onError) this.onError(err);
    };

    channel.onmessage = (event) => {
      if (this.onMessage) this.onMessage(event.data);
    };
  }

  /** Send raw data through the data channel */
  send(data) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    this.dataChannel.send(data);
  }

  /** Check if channel is ready */
  isConnected() {
    return this.dataChannel?.readyState === 'open';
  }

  /** Get buffered amount for backpressure */
  getBufferedAmount() {
    return this.dataChannel?.bufferedAmount ?? 0;
  }

  /** Gracefully close */
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}

export const webrtcService = new WebRTCService();
