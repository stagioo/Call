import React, { useEffect, useCallback } from 'react';
import {
  CallProvider,
  useCall,
  useParticipants,
  useMediaDevices,
  CallConnectionStatus,
} from '../src';

// Main video call component wrapper
export function VideoCallApp() {
  return (
    <CallProvider wsUrl="wss://your-mediasoup-server.com">
      <VideoCall />
    </CallProvider>
  );
}

// Video call implementation
function VideoCall() {
  const {
    connect,
    disconnect,
    connectionStatus,
    error,
  } = useCall();

  const {
    self,
    participants,
    pinnedParticipant,
    dominantSpeaker,
    getSortedParticipants,
  } = useParticipants();

  const {
    audioInputDevices,
    videoInputDevices,
    selectedAudioInput,
    selectedVideoInput,
    setAudioInput,
    setVideoInput,
    hasAudioPermission,
    hasVideoPermission,
  } = useMediaDevices();

  // Connect to the call when component mounts
  useEffect(() => {
    connect({
      roomId: 'test-room',
      displayName: 'Test User',
      initialAudioEnabled: true,
      initialVideoEnabled: true,
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const handleAudioDeviceChange = useCallback(async (deviceId: string) => {
    try {
      await setAudioInput(deviceId);
    } catch (error) {
      console.error('Failed to change audio device:', error);
    }
  }, [setAudioInput]);

  const handleVideoDeviceChange = useCallback(async (deviceId: string) => {
    try {
      await setVideoInput(deviceId);
    } catch (error) {
      console.error('Failed to change video device:', error);
    }
  }, [setVideoInput]);

  if (connectionStatus === CallConnectionStatus.CONNECTING) {
    return <div>Connecting to call...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!hasAudioPermission || !hasVideoPermission) {
    return <div>Please grant camera and microphone permissions</div>;
  }

  return (
    <div className="video-call">
      {/* Connection status */}
      <div className="connection-status">
        Status: {connectionStatus}
      </div>

      {/* Participant grid */}
      <div className="participant-grid">
        {/* Self preview */}
        {self && (
          <ParticipantTile
            participant={self}
            isSelf={true}
            isPinned={false}
            isSpeaking={false}
          />
        )}

        {/* Remote participants */}
        {getSortedParticipants().map(participant => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            isSelf={false}
            isPinned={pinnedParticipant?.id === participant.id}
            isSpeaking={dominantSpeaker?.id === participant.id}
          />
        ))}
      </div>

      {/* Media controls */}
      <div className="media-controls">
        {/* Audio device selector */}
        <select
          value={selectedAudioInput || ''}
          onChange={(e) => handleAudioDeviceChange(e.target.value)}
        >
          {audioInputDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId}`}
            </option>
          ))}
        </select>

        {/* Video device selector */}
        <select
          value={selectedVideoInput || ''}
          onChange={(e) => handleVideoDeviceChange(e.target.value)}
        >
          {videoInputDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Individual participant video tile
interface ParticipantTileProps {
  participant: any; // Use proper type from SDK
  isSelf: boolean;
  isPinned: boolean;
  isSpeaking: boolean;
}

function ParticipantTile({
  participant,
  isSelf,
  isPinned,
  isSpeaking,
}: ParticipantTileProps) {
  return (
    <div
      className={`participant-tile ${isSelf ? 'self' : ''} ${
        isPinned ? 'pinned' : ''
      } ${isSpeaking ? 'speaking' : ''}`}
    >
      <video
        ref={el => {
          if (el) {
            el.srcObject = new MediaStream([
              participant.videoTrack,
              participant.audioTrack,
            ].filter(Boolean));
          }
        }}
        autoPlay
        playsInline
        muted={isSelf}
      />
      <div className="participant-info">
        <span className="name">{participant.displayName}</span>
        <span className="status">
          {participant.audioEnabled ? '🎤' : '🔇'}
          {participant.videoEnabled ? '📹' : '🚫'}
          {participant.screenShareEnabled ? '🖥️' : ''}
        </span>
      </div>
    </div>
  );
}

export default VideoCallApp;
