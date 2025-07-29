import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
} from 'react';
import {
  CallState,
  CallConfig,
  CallConnectionStatus,
  CallEvent,
} from '../types/call';
import { MediasoupService } from '../services/mediasoup-service';
import { Self, Participant, MediaPermissions } from '../types/participant';

interface CallContextValue extends CallState {
  // Connection methods
  connect: (config: CallConfig) => Promise<void>;
  disconnect: () => Promise<void>;

  // Media control methods
  enableAudio: () => Promise<void>;
  disableAudio: () => void;
  enableVideo: () => Promise<void>;
  disableVideo: () => void;
  enableScreenShare: () => Promise<void>;
  disableScreenShare: () => void;

  // Participant management
  pinParticipant: (participantId: string) => void;
  unpinParticipant: () => void;

  // Device management
  setAudioInputDevice: (deviceId: string) => Promise<void>;
  setVideoInputDevice: (deviceId: string) => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

type CallAction =
  | { type: 'SET_CONNECTION_STATUS'; status: CallConnectionStatus }
  | { type: 'SET_SELF'; self: Self }
  | { type: 'ADD_PARTICIPANT'; participant: Participant }
  | { type: 'REMOVE_PARTICIPANT'; participantId: string }
  | { type: 'SET_DOMINANT_SPEAKER'; participantId: string }
  | { type: 'SET_PINNED_PARTICIPANT'; participantId: string }
  | { type: 'CLEAR_PINNED_PARTICIPANT' }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'SET_PERMISSIONS'; permissions: MediaPermissions }
  | { type: 'RESET' };

const initialState: CallState = {
  connectionStatus: CallConnectionStatus.IDLE,
  self: null,
  participants: new Map(),
  dominantSpeakerId: undefined,
  pinnedParticipantId: undefined,
  error: undefined,
  permissions: {
    audio: false,
    video: false,
    screen: false,
  },
};

function callReducer(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status };

    case 'SET_SELF':
      return { ...state, self: action.self };

    case 'ADD_PARTICIPANT': {
      const newParticipants = new Map(state.participants);
      newParticipants.set(action.participant.id, action.participant);
      return { ...state, participants: newParticipants };
    }

    case 'REMOVE_PARTICIPANT': {
      const newParticipants = new Map(state.participants);
      newParticipants.delete(action.participantId);
      return { ...state, participants: newParticipants };
    }

    case 'SET_DOMINANT_SPEAKER':
      return { ...state, dominantSpeakerId: action.participantId };

    case 'SET_PINNED_PARTICIPANT':
      return { ...state, pinnedParticipantId: action.participantId };

    case 'CLEAR_PINNED_PARTICIPANT':
      return { ...state, pinnedParticipantId: undefined };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.permissions };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface CallProviderProps {
  children: React.ReactNode;
  wsUrl: string;
}

export function CallProvider({ children, wsUrl }: CallProviderProps) {
  const [state, dispatch] = useReducer(callReducer, initialState);
  const mediasoupService = useMemo(() => new MediasoupService(wsUrl), [wsUrl]);

  useEffect(() => {
    // Set up MediaSoup event listeners
    mediasoupService.on(CallEvent.CONNECTION_STATUS_CHANGED, (status: CallConnectionStatus) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status });
    });

    mediasoupService.on('participantJoined', (participant: Participant) => {
      dispatch({ type: 'ADD_PARTICIPANT', participant });
    });

    mediasoupService.on('participantLeft', (participantId: string) => {
      dispatch({ type: 'REMOVE_PARTICIPANT', participantId });
    });

    mediasoupService.on('dominantSpeakerChanged', (participantId: string) => {
      dispatch({ type: 'SET_DOMINANT_SPEAKER', participantId });
    });

    return () => {
      mediasoupService.removeAllListeners();
    };
  }, [mediasoupService]);

  const connect = useCallback(async (config: CallConfig) => {
    try {
      await mediasoupService.connect(config);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error as Error });
      throw error;
    }
  }, [mediasoupService]);

  const disconnect = useCallback(async () => {
    await mediasoupService.disconnect();
    dispatch({ type: 'RESET' });
  }, [mediasoupService]);

  const enableAudio = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    await mediasoupService.produceTrack(track, 'audio');
    dispatch({
      type: 'SET_SELF',
      self: { ...state.self!, audioEnabled: true } as Self,
    });
  }, [mediasoupService, state.self]);

  const disableAudio = useCallback(() => {
    mediasoupService.closeProducer('audio');
    dispatch({
      type: 'SET_SELF',
      self: { ...state.self!, audioEnabled: false } as Self,
    });
  }, [mediasoupService, state.self]);

  const enableVideo = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    await mediasoupService.produceTrack(track, 'video');
    dispatch({
      type: 'SET_SELF',
      self: { ...state.self!, videoEnabled: true } as Self,
    });
  }, [mediasoupService, state.self]);

  const disableVideo = useCallback(() => {
    mediasoupService.closeProducer('video');
    dispatch({
      type: 'SET_SELF',
      self: { ...state.self!, videoEnabled: false } as Self,
    });
  }, [mediasoupService, state.self]);

  const enableScreenShare = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    await mediasoupService.produceTrack(track, 'screen');
    dispatch({
      type: 'SET_SELF',
      self: { ...state.self!, screenShareEnabled: true } as Self,
    });
  }, [mediasoupService, state.self]);

  const disableScreenShare = useCallback(() => {
    mediasoupService.closeProducer('screen');
    dispatch({
      type: 'SET_SELF',
      self: { ...state.self!, screenShareEnabled: false } as Self,
    });
  }, [mediasoupService, state.self]);

  const pinParticipant = useCallback((participantId: string) => {
    dispatch({ type: 'SET_PINNED_PARTICIPANT', participantId });
  }, []);

  const unpinParticipant = useCallback(() => {
    dispatch({ type: 'CLEAR_PINNED_PARTICIPANT' });
  }, []);

  const setAudioInputDevice = useCallback(async (deviceId: string) => {
    if (state.self?.audioEnabled) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const track = stream.getAudioTracks()[0];
      await mediasoupService.produceTrack(track, 'audio');
    }
  }, [mediasoupService, state.self?.audioEnabled]);

  const setVideoInputDevice = useCallback(async (deviceId: string) => {
    if (state.self?.videoEnabled) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const track = stream.getVideoTracks()[0];
      await mediasoupService.produceTrack(track, 'video');
    }
  }, [mediasoupService, state.self?.videoEnabled]);

  const value = useMemo(() => ({
    ...state,
    connect,
    disconnect,
    enableAudio,
    disableAudio,
    enableVideo,
    disableVideo,
    enableScreenShare,
    disableScreenShare,
    pinParticipant,
    unpinParticipant,
    setAudioInputDevice,
    setVideoInputDevice,
  }), [
    state,
    connect,
    disconnect,
    enableAudio,
    disableAudio,
    enableVideo,
    disableVideo,
    enableScreenShare,
    disableScreenShare,
    pinParticipant,
    unpinParticipant,
    setAudioInputDevice,
    setVideoInputDevice,
  ]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
