/**
 * Types for call management and state
 */

import { Participant, Self, MediaPermissions } from './participant';

/**
 * Supported media types in a call
 */
export type MediaType = 'audio' | 'video' | 'screen';

/**
 * Call connection status
 */
export enum CallConnectionStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed'
}

/**
 * Configuration options for initializing a call
 */
export interface CallConfig {
  /**
   * Unique identifier for the room
   */
  roomId: string;

  /**
   * Initial display name for the local participant
   */
  displayName: string;

  /**
   * Optional user ID for the local participant
   */
  userId?: string;

  /**
   * Whether to join with audio enabled
   * @default false
   */
  initialAudioEnabled?: boolean;

  /**
   * Whether to join with video enabled
   * @default false
   */
  initialVideoEnabled?: boolean;

  /**
   * Maximum number of participants allowed in the call
   * @default 16
   */
  maxParticipants?: number;

  /**
   * WebRTC configuration options
   */
  rtcConfig?: RTCConfiguration;
}

/**
 * Core call state
 */
export interface CallState {
  /**
   * Current connection status of the call
   */
  connectionStatus: CallConnectionStatus;

  /**
   * Local participant information
   */
  self: Self | null;

  /**
   * Map of remote participants indexed by their IDs
   */
  participants: Map<string, Participant>;

  /**
   * ID of the currently dominant speaker
   */
  dominantSpeakerId?: string;

  /**
   * ID of the currently pinned participant
   */
  pinnedParticipantId?: string;

  /**
   * Current error state, if any
   */
  error?: Error;

  /**
   * Current media device permissions
   */
  permissions: MediaPermissions;
}

/**
 * Call statistics and metrics
 */
export interface CallStats {
  /**
   * Round trip time in milliseconds
   */
  rtt: number;

  /**
   * Packet loss percentage
   */
  packetLoss: number;

  /**
   * Bitrate in kilobits per second
   */
  bitrate: number;

  /**
   * Call duration in seconds
   */
  duration: number;
}

/**
 * Events that can be emitted during a call
 */
export enum CallEvent {
  PARTICIPANT_JOINED = 'participantJoined',
  PARTICIPANT_LEFT = 'participantLeft',
  DOMINANT_SPEAKER_CHANGED = 'dominantSpeakerChanged',
  CONNECTION_STATUS_CHANGED = 'connectionStatusChanged',
  MEDIA_STATUS_CHANGED = 'mediaStatusChanged',
  ERROR = 'error'
}

/**
 * Media device settings for the call
 */
export interface MediaSettings {
  /**
   * Selected audio input device ID
   */
  audioInputDeviceId?: string;

  /**
   * Selected audio output device ID
   */
  audioOutputDeviceId?: string;

  /**
   * Selected video input device ID
   */
  videoInputDeviceId?: string;

  /**
   * Audio constraints for the call
   */
  audioConstraints?: MediaTrackConstraints;

  /**
   * Video constraints for the call
   */
  videoConstraints?: MediaTrackConstraints;
}

/**
 * Recording options for the call
 */
export interface RecordingOptions {
  /**
   * Whether to record audio
   */
  audio: boolean;

  /**
   * Whether to record video
   */
  video: boolean;

  /**
   * Recording format
   */
  format: 'webm' | 'mp4';

  /**
   * Quality of the recording (0-1)
   */
  quality?: number;
}
