import { Device } from 'mediasoup-client';
import {
  MediaType,
  CallConfig,
  CallConnectionStatus,
  CallEvent
} from '../types/call';
import { EventEmitter } from 'events';

/**
 * Interface for MediaSoup transport options
 */
interface TransportOptions {
  id: string;
  iceParameters: RTCIceParameters;
  iceCandidates: RTCIceCandidate[];
  dtlsParameters: RTCDtlsParameters;
}

/**
 * Interface for MediaSoup producer options
 */
interface ProducerOptions {
  track: MediaStreamTrack;
  encodings?: RTCRtpEncodingParameters[];
  codecOptions?: {
    opusStereo?: boolean;
    opusDtx?: boolean;
    videoGoogleStartBitrate?: number;
  };
}

/**
 * Interface for MediaSoup consumer options
 */
interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: string;
  rtpParameters: RTCRtpParameters;
}

/**
 * Class responsible for handling MediaSoup WebRTC functionality
 */
export class MediasoupService extends EventEmitter {
  private device: Device;
  private sendTransport?: any; // mediasoup-client Transport type
  private recvTransport?: any; // mediasoup-client Transport type
  private producers: Map<string, any>; // mediasoup-client Producer type
  private consumers: Map<string, any>; // mediasoup-client Consumer type
  private connectionStatus: CallConnectionStatus;
  private config: CallConfig;
  private wsUrl: string;
  private ws?: WebSocket;

  constructor(wsUrl: string) {
    super();
    this.wsUrl = wsUrl;
    this.device = new Device();
    this.producers = new Map();
    this.consumers = new Map();
    this.connectionStatus = CallConnectionStatus.IDLE;
  }

  /**
   * Initialize and connect to the MediaSoup server
   */
  async connect(config: CallConfig): Promise<void> {
    try {
      this.config = config;
      this.setConnectionStatus(CallConnectionStatus.CONNECTING);

      // Connect to WebSocket server
      await this.connectWebSocket();

      // Load MediaSoup device
      const routerRtpCapabilities = await this.sendRequest('getRouterRtpCapabilities');
      await this.device.load({ routerRtpCapabilities });

      // Create WebRTC transports
      await this.createSendTransport();
      await this.createRecvTransport();

      // Join the room
      await this.joinRoom();

      this.setConnectionStatus(CallConnectionStatus.CONNECTED);
    } catch (error) {
      this.setConnectionStatus(CallConnectionStatus.FAILED);
      throw error;
    }
  }

  /**
   * Disconnect from the MediaSoup server
   */
  async disconnect(): Promise<void> {
    this.producers.forEach(producer => producer.close());
    this.consumers.forEach(consumer => consumer.close());
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.ws?.close();
    this.setConnectionStatus(CallConnectionStatus.DISCONNECTED);
  }

  /**
   * Produce a media track (audio/video/screen)
   */
  async produceTrack(track: MediaStreamTrack, type: MediaType): Promise<void> {
    if (!this.sendTransport) {
      throw new Error('Send transport not created');
    }

    const producer = await this.sendTransport.produce({
      track,
      encodings: this.getEncodings(type),
      codecOptions: this.getCodecOptions(type),
    });

    this.producers.set(type, producer);

    producer.on('transportclose', () => {
      this.producers.delete(type);
    });

    producer.on('trackended', () => {
      this.closeProducer(type);
    });
  }

  /**
   * Consume a remote participant's track
   */
  async consumeTrack(consumerId: string, producerId: string, kind: string): Promise<MediaStreamTrack> {
    if (!this.recvTransport) {
      throw new Error('Receive transport not created');
    }

    const { rtpParameters } = await this.sendRequest('consume', {
      consumerId,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
    });

    const consumer = await this.recvTransport.consume({
      id: consumerId,
      producerId,
      kind,
      rtpParameters,
    });

    this.consumers.set(consumerId, consumer);
    return consumer.track;
  }

  /**
   * Close a producer for a specific media type
   */
  async closeProducer(type: MediaType): Promise<void> {
    const producer = this.producers.get(type);
    if (producer) {
      producer.close();
      this.producers.delete(type);
      await this.sendRequest('closeProducer', { producerId: producer.id });
    }
  }

  private setConnectionStatus(status: CallConnectionStatus): void {
    this.connectionStatus = status;
    this.emit(CallEvent.CONNECTION_STATUS_CHANGED, status);
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (error) => reject(error);
      this.ws.onmessage = (event) => this.handleWebSocketMessage(event);
    });
  }

  private async sendRequest(type: string, data: any = {}): Promise<any> {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      const request = { type, data, requestId };

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      const handleResponse = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.requestId === requestId) {
          clearTimeout(timeout);
          this.ws?.removeEventListener('message', handleResponse);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        }
      };

      this.ws.addEventListener('message', handleResponse);
      this.ws.send(JSON.stringify(request));
    });
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'newConsumer':
        this.handleNewConsumer(message.data);
        break;
      case 'consumerClosed':
        this.handleConsumerClosed(message.data);
        break;
      // Add more message handlers as needed
    }
  }

  private async createSendTransport(): Promise<void> {
    const transportOptions = await this.sendRequest('createWebRtcTransport', {
      producing: true,
      consuming: false,
    });

    this.sendTransport = this.device.createSendTransport(transportOptions);

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback: () => void, errback: (error: Error) => void) => {
      try {
        await this.sendRequest('connectWebRtcTransport', {
          transportId: this.sendTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error as Error);
      }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback: (arg0: { id: string; }) => void, errback: (error: Error) => void) => {
      try {
        const { id } = await this.sendRequest('produce', {
          transportId: this.sendTransport.id,
          kind,
          rtpParameters,
          appData,
        });
        callback({ id });
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  private async createRecvTransport(): Promise<void> {
    const transportOptions = await this.sendRequest('createWebRtcTransport', {
      producing: false,
      consuming: true,
    });

    this.recvTransport = this.device.createRecvTransport(transportOptions);

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback: () => void, errback: (error: Error) => void) => {
      try {
        await this.sendRequest('connectWebRtcTransport', {
          transportId: this.recvTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  private getEncodings(type: MediaType): RTCRtpEncodingParameters[] {
    if (type === 'video') {
      return [
        { maxBitrate: 100000, scalabilityMode: 'L1T3' },
        { maxBitrate: 300000, scalabilityMode: 'L1T3' },
        { maxBitrate: 900000, scalabilityMode: 'L1T3' },
      ];
    }
    return [];
  }

  private getCodecOptions(type: MediaType): any {
    if (type === 'audio') {
      return {
        opusStereo: true,
        opusDtx: true,
      };
    }
    if (type === 'video') {
      return {
        videoGoogleStartBitrate: 1000,
      };
    }
    return {};
  }

  private async joinRoom(): Promise<void> {
    await this.sendRequest('join', {
      roomId: this.config.roomId,
      rtpCapabilities: this.device.rtpCapabilities,
    });
  }

  private async handleNewConsumer(data: ConsumerOptions): Promise<void> {
    try {
      const stream = await this.consumeTrack(
        data.id,
        data.producerId,
        data.kind
      );
      this.emit('newTrack', { stream, ...data });
    } catch (error) {
      console.error('Error handling new consumer:', error);
    }
  }

  private handleConsumerClosed(data: { consumerId: string }): void {
    const consumer = this.consumers.get(data.consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(data.consumerId);
    }
  }
}
