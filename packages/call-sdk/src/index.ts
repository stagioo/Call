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
} from './types/call';

export type {
  Self,
  Participant,
  MediaState,
  BaseParticipant,
  MediaPermissions,
} from './types/participant';

export { CallConnectionStatus } from './types/call';

// Service (for advanced usage)
export { MediasoupService } from './services/mediasoup-service';
