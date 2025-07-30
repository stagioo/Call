// Core client and services
export { CallClient } from './services/call-client';
export { MediasoupService } from './services/mediasoup-service';
export { SignalingClient } from './services/signaling-client';
export { MediaManager } from './services/media-manager';

// Core provider and hooks
export { CallProvider, useCall } from './providers/CallProvider';
export { useParticipants } from './hooks/useParticipants';
export { useMediaDevices } from './hooks/useMediaDevices';

// Types
export type {
  CallConfig,
  CallState,
  CallEvent,
  CallStats,
  MediaSettings,
  RecordingOptions,
  ProducerSource,
} from './types/call';

export type {
  Self,
  Participant,
  MediaState,
  BaseParticipant,
  MediaPermissions,
} from './types/participant';

export { CallConnectionStatus } from './types/call';
