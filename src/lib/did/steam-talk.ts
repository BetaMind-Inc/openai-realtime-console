
interface ElementOptions {
  iceGatheringStatusLabel: HTMLElement
  signalingStatusLabel: HTMLElement
  iceStatusLabel: HTMLElement
  streamingStatusLabel: HTMLElement
  peerStatusLabel: HTMLElement
  talkVideo: HTMLVideoElement
}

declare global {
  interface Window {
    webkitRTCPeerConnection?: typeof RTCPeerConnection;
    mozRTCPeerConnection?: typeof RTCPeerConnection;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;

class StreamTalk {
  RTCPeerConnection: typeof RTCPeerConnection | undefined
  DID_API_URL: string
  DID_API_KEY: string
  peerConnection: any
  streamId: any
  sessionId: any
  sessionClientAnswer: any
  statsIntervalId: any
  videoIsPlaying: any
  lastBytesReceived: any
  iceGatheringStatusLabel: HTMLElement | undefined
  signalingStatusLabel: HTMLElement | undefined
  iceStatusLabel: HTMLElement | undefined
  peerStatusLabel: HTMLElement | undefined
  streamingStatusLabel: HTMLElement | undefined
  talkVideo: HTMLVideoElement | undefined
  constructor() {
    this.DID_API_URL = 'https://api.d-id.com'
    this.DID_API_KEY = 'bi50b2FuQGJldGFtaW5kLmNvLmpw:ktnxC8rHsaPjefaEEX_Jk'
  }

  onInit({
    iceGatheringStatusLabel,
    signalingStatusLabel,
    iceStatusLabel,
    peerStatusLabel,
    streamingStatusLabel,
    talkVideo,
  }: ElementOptions) {
    this.iceGatheringStatusLabel = iceGatheringStatusLabel
    this.signalingStatusLabel = signalingStatusLabel
    this.iceStatusLabel = iceStatusLabel
    this.peerStatusLabel = peerStatusLabel
    this.streamingStatusLabel = streamingStatusLabel
    this.talkVideo = talkVideo
    if (typeof window !== 'undefined') {
      this.RTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection;
    }
  }

  async onConnect() {
    if (this.peerConnection && this.peerConnection.connectionState === 'connected') {
      return;
    }
    this.stopAllStreams()
    this.closePC()
    const sessionResponse = await fetch(`${this.DID_API_URL}/talks/streams`, {
      method: 'POST',
      headers: {'Authorization': `Basic ${this.DID_API_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        source_url: "https://raw.githubusercontent.com/jjmlovesgit/D-id_Streaming_Chatgpt/main/oracle_pic.jpg",
      }),
    });
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
    this.streamId = newStreamId;
    this.sessionId = newSessionId;
    try {
      this.sessionClientAnswer = await this.createPeerConnection(offer, iceServers);
    } catch (e) {
      console.log('error during streaming setup', e);
      this.stopAllStreams();
      this.closePC();
      return;
    }

    const sdpResponse = await fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}/sdp`,
      {
        method: 'POST',
        headers: {Authorization: `Basic ${this.DID_API_KEY}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({answer: this.sessionClientAnswer, session_id: this.sessionId})
      });
  }

  async createPeerConnection(offer: any, iceServers: any) {
    if (!this.peerConnection) {
      this.peerConnection = new RTCPeerConnection({ iceServers });
      this.peerConnection.addEventListener('icegatheringstatechange', () => this.onIceGatheringStateChange(), true);
      this.peerConnection.addEventListener('icecandidate', (e: any) => this.onIceCandidate(e), true);
      this.peerConnection.addEventListener('iceconnectionstatechange', () => this.onIceConnectionStateChange(), true);
      this.peerConnection.addEventListener('connectionstatechange', () => this.onConnectionStateChange(), true);
      this.peerConnection.addEventListener('signalingstatechange', () => this.onSignalingStateChange(), true);
      this.peerConnection.addEventListener('track', (e: any) => this.onTrack(e), true);
    }

    await this.peerConnection.setRemoteDescription(offer);
    console.log('set remote sdp OK');

    const sessionClientAnswer = await this.peerConnection.createAnswer();
    console.log('create local sdp OK');

    await this.peerConnection.setLocalDescription(sessionClientAnswer);
    console.log('set local sdp OK');
    console.log('this.peerConnection', this.peerConnection);

    return sessionClientAnswer;
  }

  stopAllStreams() {
    if (this.talkVideo?.srcObject) {
      console.log('stopping video streams');
      (this.talkVideo.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      this.talkVideo.srcObject = null;
    }
  }

  onIceGatheringStateChange() {
    if (this.iceGatheringStatusLabel) {
      this.iceGatheringStatusLabel.innerText = this.peerConnection.iceGatheringState;
      this.iceGatheringStatusLabel.className = 'iceGatheringState-' + this.peerConnection.iceGatheringState;
    }
  }

  onIceCandidate(event: any) {
    console.log('onIceCandidate', event);
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

      fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}/ice`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          session_id: this.sessionId,
        }),
      });
    }
  }

  onIceConnectionStateChange() {
    if (this.iceStatusLabel) {
      this.iceStatusLabel.innerText = this.peerConnection.iceConnectionState;
      this.iceStatusLabel.className = 'iceConnectionState-' + this.peerConnection.iceConnectionState;
    }
    if (this.peerConnection.iceConnectionState === 'failed' || this.peerConnection.iceConnectionState === 'closed') {
      this.stopAllStreams();
      this.closePC();
    }
  }

  onConnectionStateChange() {
    // not supported in firefox
    if (this.peerStatusLabel) {
      this.peerStatusLabel.innerText = this.peerConnection.connectionState;
      this.peerStatusLabel.className = 'peerConnectionState-' + this.peerConnection.connectionState;
    }
  }

  onSignalingStateChange() {
    if (this.signalingStatusLabel) {
      this.signalingStatusLabel.innerText = this.peerConnection.signalingState;
      this.signalingStatusLabel.className = 'signalingState-' + this.peerConnection.signalingState;
    }
  }

  onTrack(event: any) {
    /**
     * The following code is designed to provide information about wether currently there is data
     * that's being streamed - It does so by periodically looking for changes in total stream data size
     *
     * This information in our case is used in order to show idle video while no talk is streaming.
     * To create this idle video use the POST https://api.d-id.com/talks endpoint with a silent audio file or a text script with only ssml breaks
     * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
     * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
     */

    if (!event.track) return;

    this.statsIntervalId = setInterval(async () => {
      if (this.peerConnection) {
        const stats = await this.peerConnection.getStats(event.track);
        stats.forEach((report: any) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            const videoStatusChanged = this.videoIsPlaying !== report.bytesReceived > this.lastBytesReceived;

            if (videoStatusChanged) {
              this.videoIsPlaying = report.bytesReceived > this.lastBytesReceived;
              this.onVideoStatusChange(this.videoIsPlaying, event.streams[0]);
            }
            this.lastBytesReceived = report.bytesReceived;
          }
        });
      }
    }, 500);
  }

  setVideoElement(stream: any) {
    if (!stream) return;
    if (!this.talkVideo) return;
    this.talkVideo.srcObject = stream;
    this.talkVideo.loop = false;

    // safari hotfix
    if (this.talkVideo.paused) {
      this.talkVideo
        .play()
        .then((_) => {})
        .catch((e) => {});
    }
  }

  playIdleVideo() {
    if (this.talkVideo) {
      this.talkVideo.srcObject = null;
      this.talkVideo.src = 'oracle_Idle.mp4';
      this.talkVideo.loop = true;
    }
  }

  onVideoStatusChange(videoIsPlaying: any, stream: any) {
    let status;
    if (videoIsPlaying) {
      status = 'streaming';
      const remoteStream = stream;
      this.setVideoElement(remoteStream);
    } else {
      status = 'empty';
      this.playIdleVideo();
    }
    if (this.streamingStatusLabel) {
      this.streamingStatusLabel.innerText = status;
      this.streamingStatusLabel.className = 'streamingState-' + status;
    }
  }

  closePC() {
    if (!this.peerConnection) {
      return;
    }
    console.log('stopping peer connection');
    this.peerConnection.close();
    this.peerConnection.removeEventListener('icegatheringstatechange', () => this.onIceGatheringStateChange(), true);
    this.peerConnection.removeEventListener('icecandidate', (e: any) => this.onIceCandidate(e), true);
    this.peerConnection.removeEventListener('iceconnectionstatechange', () => this.onIceConnectionStateChange(), true);
    this.peerConnection.removeEventListener('connectionstatechange', () => this.onConnectionStateChange(), true);
    this.peerConnection.removeEventListener('signalingstatechange', () => this.onSignalingStateChange(), true);
    this.peerConnection.removeEventListener('track', (e: any) => this.onTrack(e), true);
    clearInterval(this.statsIntervalId);
    if (this.iceGatheringStatusLabel) {
      this.iceGatheringStatusLabel.innerText = '';
    }
    if (this.signalingStatusLabel) {
      this.signalingStatusLabel.innerText = '';
    }
    if (this.iceStatusLabel) {
      this.iceStatusLabel.innerText = '';
    }
    if (this.peerStatusLabel) {
      this.peerStatusLabel.innerText = '';
    }
    console.log('stopped peer connection');
    this.peerConnection = null;
  }

  async onTalk(contents: string) {
    console.log('contents', contents);
    console.log('this.peerConnection?', this.sessionId);
    if (this.peerConnection?.signalingState === 'stable' || this.peerConnection?.iceConnectionState === 'connected') {


      const talkResponse = await this.fetchWithRetries(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.DID_API_KEY}`,
          'Content-Type': 'application/json'
       },
        body: JSON.stringify({
          script: {
            type: 'text',
            subtitles: 'false',
            provider: { type: 'microsoft', voice_id: 'en-US-ChristopherNeural' },
            ssml: false,
            input: contents  //send the openAIResponse to D-id
          },
          config: {
            fluent: true,
            stitch: true,
          },
          driver_url: 'bank://lively/',
          session_id: this.sessionId
        })
      });
    }
  }

  async onDestroy() {
    await fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${this.DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: this.sessionId }),
    });

    this.stopAllStreams();
    this.closePC();
  }

  async fetchWithRetries(url: string, options: any, retries = 3): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retries <= maxRetryCount) {
        const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
        return this.fetchWithRetries(url, options, retries + 1);
      } else {
        throw new Error(`Max retries exceeded. error: ${err}`);
      }
    }
  }
}

export default StreamTalk;