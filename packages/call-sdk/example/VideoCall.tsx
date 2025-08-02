import { useEffect, useCallback, useRef } from 'react';
import {
  CallProvider,
  useCall,
  useParticipants,
  useMediaDevices,
  onError,
  type CallConfig,
  type Participant,
  type Self,
} from '../src';

// Main video call component wrapper
export function VideoCallApp() {
  return (
    <CallProvider signalingUrl="ws://localhost:3001">
      <VideoCall />
    </CallProvider>
  );
}

// Video call implementation
function VideoCall() {
  const {
    joinCall,
    leaveCall,
    isConnected,
    isConnecting,
    isReconnecting,
    connectionError,
    localStream,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    changeAudioDevice,
    changeVideoDevice,
  } = useCall();

  const {
    self,
    participants,
    pinnedParticipant,
    dominantSpeaker,
    getSortedParticipants,
    pinParticipant,
    unpinParticipant,
  } = useParticipants();

  const {
    audioInputDevices,
    videoInputDevices,
    selectedAudioInput,
    selectedVideoInput,
    hasAudioPermission,
    hasVideoPermission,
    requestPermissions,
  } = useMediaDevices();

  // Connect to the call when component mounts
  useEffect(() => {
    const callConfig: CallConfig = {
      roomId: 'test-room',
      displayName: 'Test User',
      initialAudioEnabled: true,
      initialVideoEnabled: true,
    };

    joinCall(callConfig).catch(error => {
      console.error('Failed to join call:', error);
    });

    return () => {
      leaveCall().catch(error => {
        console.error('Failed to leave call:', error);
      });
    };
  }, [joinCall, leaveCall]);

  // Set up error handling
  useEffect(() => {
    const unsubscribe = onError((error) => {
      console.error('Call error:', error);
      // Handle specific error types
      switch (error.type) {
        case 'MEDIA_PERMISSION_DENIED':
          alert('Please grant camera and microphone permissions');
          break;
        case 'CONNECTION_FAILED':
          alert('Failed to connect to the call. Please try again.');
          break;
        default:
          alert(`Call error: ${error.message}`);
      }
    });

    return unsubscribe;
  }, []);

  const handleAudioDeviceChange = useCallback(async (deviceId: string) => {
    try {
      await changeAudioDevice(deviceId);
    } catch (error) {
      console.error('Failed to change audio device:', error);
    }
  }, [changeAudioDevice]);

  const handleVideoDeviceChange = useCallback(async (deviceId: string) => {
    try {
      await changeVideoDevice(deviceId);
    } catch (error) {
      console.error('Failed to change video device:', error);
    }
  }, [changeVideoDevice]);

  const handleToggleMicrophone = useCallback(async () => {
    try {
      await toggleMicrophone();
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [toggleMicrophone]);

  const handleToggleCamera = useCallback(async () => {
    try {
      await toggleCamera();
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  }, [toggleCamera]);

  const handleScreenShare = useCallback(async () => {
    try {
      if (isScreenShareEnabled) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  }, [isScreenShareEnabled, startScreenShare, stopScreenShare]);

  if (isConnecting) {
    return <div className="loading">Connecting to call...</div>;
  }

  if (isReconnecting) {
    return <div className="loading">Reconnecting...</div>;
  }

  if (connectionError) {
    return (
      <div className="error">
        <h3>Connection Error</h3>
        <p>{connectionError.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!hasAudioPermission || !hasVideoPermission) {
    return (
      <div className="permissions">
        <h3>Media Permissions Required</h3>
        <p>Please grant camera and microphone permissions to join the call.</p>
        <button onClick={requestPermissions}>Grant Permissions</button>
      </div>
    );
  }

  return (
    <div className="video-call">
      {/* Connection status */}
      <div className="connection-status">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="participant-count">
          {participants.length + (self ? 1 : 0)} participants
        </span>
      </div>

      {/* Participant grid */}
      <div className="participant-grid">
        {/* Self preview */}
        {self && (
          <ParticipantTile
            participant={self}
            stream={localStream}
            isSelf={true}
            isPinned={false}
            isSpeaking={false}
            onPin={() => {}}
            onUnpin={() => {}}
          />
        )}

        {/* Remote participants */}
        {getSortedParticipants().map(participant => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            stream={null} // Stream will be handled by the participant tile
            isSelf={false}
            isPinned={pinnedParticipant?.id === participant.id}
            isSpeaking={dominantSpeaker?.id === participant.id}
            onPin={() => pinParticipant(participant.id)}
            onUnpin={unpinParticipant}
          />
        ))}
      </div>

      {/* Media controls */}
      <div className="media-controls">
        <div className="control-group">
          <button
            className={`control-btn ${isMicrophoneEnabled ? 'active' : 'inactive'}`}
            onClick={handleToggleMicrophone}
            title={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicrophoneEnabled ? '🎤' : '🔇'}
          </button>

          <button
            className={`control-btn ${isCameraEnabled ? 'active' : 'inactive'}`}
            onClick={handleToggleCamera}
            title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraEnabled ? '📹' : '🚫'}
          </button>

          <button
            className={`control-btn ${isScreenShareEnabled ? 'active' : 'inactive'}`}
            onClick={handleScreenShare}
            title={isScreenShareEnabled ? 'Stop screen share' : 'Start screen share'}
          >
            🖥️
          </button>

          <button
            className="control-btn leave"
            onClick={() => leaveCall()}
            title="Leave call"
          >
            📞
          </button>
        </div>

        <div className="device-selectors">
          {/* Audio device selector */}
          <select
            value={selectedAudioInput || ''}
            onChange={(e) => handleAudioDeviceChange(e.target.value)}
            title="Select microphone"
          >
            <option value="">Select Microphone</option>
            {audioInputDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>

          {/* Video device selector */}
          <select
            value={selectedVideoInput || ''}
            onChange={(e) => handleVideoDeviceChange(e.target.value)}
            title="Select camera"
          >
            <option value="">Select Camera</option>
            {videoInputDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Individual participant video tile
interface ParticipantTileProps {
  participant: Participant | Self;
  stream: MediaStream | null;
  isSelf: boolean;
  isPinned: boolean;
  isSpeaking: boolean;
  onPin: () => void;
  onUnpin: () => void;
}

function ParticipantTile({
  participant,
  stream,
  isSelf,
  isPinned,
  isSpeaking,
  onPin,
  onUnpin,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handlePinToggle = useCallback(() => {
    if (isPinned) {
      onUnpin();
    } else {
      onPin();
    }
  }, [isPinned, onPin, onUnpin]);

  return (
    <div
      className={`participant-tile ${isSelf ? 'self' : ''} ${
        isPinned ? 'pinned' : ''
      } ${isSpeaking ? 'speaking' : ''}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className="participant-video"
      />
      
      <div className="participant-overlay">
        <div className="participant-info">
          <span className="name">{participant.displayName}</span>
          <div className="status-indicators">
            <span className={`indicator ${participant.audioEnabled ? 'active' : 'inactive'}`}>
              {participant.audioEnabled ? '🎤' : '🔇'}
            </span>
            <span className={`indicator ${participant.videoEnabled ? 'active' : 'inactive'}`}>
              {participant.videoEnabled ? '📹' : '🚫'}
            </span>
            {participant.screenShareEnabled && (
              <span className="indicator active">🖥️</span>
            )}
          </div>
        </div>
        
        {!isSelf && (
          <div className="participant-controls">
            <button
              className={`pin-btn ${isPinned ? 'pinned' : ''}`}
              onClick={handlePinToggle}
              title={isPinned ? 'Unpin participant' : 'Pin participant'}
            >
              📌
            </button>
          </div>
        )}
      </div>
      
      {!participant.videoEnabled && (
        <div className="video-placeholder">
          <div className="avatar">
            {participant.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCallApp;
