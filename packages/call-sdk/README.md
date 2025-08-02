# Call SDK

A comprehensive React SDK for building video calling applications with MediaSoup. This SDK provides a complete solution for real-time video communication with features like participant management, device control, screen sharing, and error handling.

## Features

- 🎥 **Video Calling**: High-quality video calls with MediaSoup
- 🎤 **Audio Management**: Microphone control and audio device selection
- 📹 **Video Management**: Camera control and video device selection
- 🖥️ **Screen Sharing**: Share your screen with other participants
- 👥 **Participant Management**: Handle multiple participants with ease
- 🔄 **Auto-reconnection**: Automatic reconnection on connection loss
- 🛠️ **Device Management**: Dynamic audio/video device switching
- ⚡ **React Hooks**: Easy-to-use React hooks for state management
- 🚨 **Error Handling**: Comprehensive error handling and recovery
- 📱 **Responsive**: Works on desktop and mobile devices

## Installation

```bash
npm install @call/sdk
# or
yarn add @call/sdk
```

## Quick Start

### 1. Wrap your app with CallProvider

```tsx
import React from "react";
import { CallProvider } from "@call/sdk";
import VideoCall from "./VideoCall";

function App() {
  return (
    <CallProvider signalingUrl="ws://localhost:3001">
      <VideoCall />
    </CallProvider>
  );
}

export default App;
```

### 2. Use the SDK hooks in your components

```tsx
import React, { useEffect } from "react";
import { useCall, useParticipants, useMediaDevices } from "@call/sdk";

function VideoCall() {
  const {
    joinCall,
    leaveCall,
    isConnected,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  } = useCall();

  const { participants, self } = useParticipants();
  const { audioInputDevices, videoInputDevices } = useMediaDevices();

  useEffect(() => {
    // Join the call when component mounts
    joinCall({
      roomId: "my-room",
      displayName: "John Doe",
      initialAudioEnabled: true,
      initialVideoEnabled: true,
    });

    return () => {
      leaveCall();
    };
  }, [joinCall, leaveCall]);

  return (
    <div>
      <div>Status: {isConnected ? "Connected" : "Disconnected"}</div>

      {/* Render participants */}
      {participants.map((participant) => (
        <div key={participant.id}>
          <video
            ref={(el) => {
              if (el && participant.stream) {
                el.srcObject = participant.stream;
              }
            }}
            autoPlay
            playsInline
          />
          <p>{participant.displayName}</p>
        </div>
      ))}

      {/* Controls */}
      <button onClick={toggleMicrophone}>Toggle Mic</button>
      <button onClick={toggleCamera}>Toggle Camera</button>
      <button onClick={startScreenShare}>Share Screen</button>
    </div>
  );
}
```

## API Reference

### Hooks

#### `useCall()`

Main hook for call functionality.

```tsx
const {
  // Connection state
  isConnected,
  isConnecting,
  isReconnecting,
  connectionError,

  // Participants
  self,
  participants,
  participantCount,
  dominantSpeaker,
  pinnedParticipant,

  // Media state
  localStream,
  isMicrophoneEnabled,
  isCameraEnabled,
  isScreenShareEnabled,

  // Call actions
  joinCall,
  leaveCall,

  // Media controls
  toggleMicrophone,
  toggleCamera,
  startScreenShare,
  stopScreenShare,

  // Participant management
  pinParticipant,
  unpinParticipant,
  getParticipantById,

  // Device management
  changeAudioDevice,
  changeVideoDevice,

  // Call statistics
  stats,

  // Advanced
  callClient,
} = useCall();
```

#### `useParticipants()`

Hook for participant management.

```tsx
const {
  self,
  participants,
  pinnedParticipant,
  dominantSpeaker,
  activeParticipants,
  participantCount,
  pinParticipant,
  unpinParticipant,
  getParticipantById,
  isParticipantSpeaking,
  isParticipantSharingScreen,
  getSortedParticipants,
} = useParticipants();
```

#### `useMediaDevices()`

Hook for media device management.

```tsx
const {
  audioInputDevices,
  audioOutputDevices,
  videoInputDevices,
  selectedAudioInput,
  selectedAudioOutput,
  selectedVideoInput,
  hasAudioPermission,
  hasVideoPermission,
  isLoading,
  error,
  setAudioInput,
  setAudioOutput,
  setVideoInput,
  refreshDevices,
  requestPermissions,
} = useMediaDevices();
```

### Components

#### `CallProvider`

Provider component that wraps your app and provides call context.

```tsx
<CallProvider signalingUrl="ws://localhost:3001">
  {/* Your app components */}
</CallProvider>
```

**Props:**

- `signalingUrl` (string): WebSocket URL for the MediaSoup server
- `children` (ReactNode): Child components

### Types

#### `CallConfig`

Configuration for joining a call.

```tsx
interface CallConfig {
  roomId: string;
  displayName: string;
  userId?: string;
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
  maxParticipants?: number;
  rtcConfig?: RTCConfiguration;
}
```

#### `Participant`

Represents a remote participant in the call.

```tsx
interface Participant {
  id: string;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  stream?: MediaStream;
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
  screenTrack?: MediaStreamTrack;
  joinedAt: Date;
  connectionState: string;
}
```

#### `Self`

Represents the local participant.

```tsx
interface Self extends BaseParticipant {
  permissions: MediaPermissions;
}
```

### Error Handling

The SDK provides comprehensive error handling with automatic recovery.

```tsx
import { onError, CallErrorType } from "@call/sdk";

// Listen for errors
const unsubscribe = onError((error) => {
  console.error("Call error:", error);

  switch (error.type) {
    case CallErrorType.MEDIA_PERMISSION_DENIED:
      // Handle permission denied
      break;
    case CallErrorType.CONNECTION_FAILED:
      // Handle connection failure
      break;
    case CallErrorType.ROOM_NOT_FOUND:
      // Handle room not found
      break;
    // ... handle other error types
  }
});

// Clean up listener
return unsubscribe;
```

#### Error Types

- `CONNECTION_FAILED` - Failed to connect to the server
- `CONNECTION_LOST` - Connection was lost
- `MEDIA_PERMISSION_DENIED` - User denied media permissions
- `MEDIA_DEVICE_ERROR` - Error with media devices
- `ROOM_NOT_FOUND` - Room doesn't exist
- `ROOM_FULL` - Room has reached capacity
- `TRANSPORT_ERROR` - MediaSoup transport error
- `PRODUCER_ERROR` - MediaSoup producer error
- `CONSUMER_ERROR` - MediaSoup consumer error

## Advanced Usage

### Custom Error Handling

```tsx
import { ErrorHandler, createCallError, CallErrorType } from "@call/sdk";

const errorHandler = ErrorHandler.getInstance();

// Configure retry settings
errorHandler.configure({
  maxRetryAttempts: 5,
  retryDelay: 2000,
});

// Create custom errors
const customError = createCallError(
  CallErrorType.CUSTOM_ERROR,
  "Something went wrong",
  {
    context: { userId: "123" },
    recoverable: true,
  }
);
```

### Direct CallClient Usage

For advanced use cases, you can access the CallClient directly:

```tsx
const { callClient } = useCall();

// Access MediaSoup transports
const sendTransport = callClient?.mediasoupService.sendTransport;
const recvTransport = callClient?.mediasoupService.recvTransport;

// Access signaling client
const signalingClient = callClient?.signalingClient;
```

### Custom Media Constraints

```tsx
const callConfig: CallConfig = {
  roomId: "my-room",
  displayName: "John Doe",
  rtcConfig: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:your-turn-server.com:3478",
        username: "user",
        credential: "pass",
      },
    ],
  },
};
```

## Examples

### Basic Video Call

See the complete example in [`example/VideoCall.tsx`](./example/VideoCall.tsx).

### Screen Sharing

```tsx
function ScreenShareButton() {
  const { isScreenShareEnabled, startScreenShare, stopScreenShare } = useCall();

  const handleScreenShare = async () => {
    try {
      if (isScreenShareEnabled) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error("Screen share error:", error);
    }
  };

  return (
    <button onClick={handleScreenShare}>
      {isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
    </button>
  );
}
```

### Device Selection

```tsx
function DeviceSelector() {
  const {
    audioInputDevices,
    videoInputDevices,
    selectedAudioInput,
    selectedVideoInput,
    setAudioInput,
    setVideoInput,
  } = useMediaDevices();

  return (
    <div>
      <select
        value={selectedAudioInput || ""}
        onChange={(e) => setAudioInput(e.target.value)}
      >
        {audioInputDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>

      <select
        value={selectedVideoInput || ""}
        onChange={(e) => setVideoInput(e.target.value)}
      >
        {videoInputDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Server Setup

This SDK requires a MediaSoup server. Here's a basic setup:

```javascript
// server.js
const mediasoup = require("mediasoup");
const WebSocket = require("ws");

// Create MediaSoup worker
const worker = await mediasoup.createWorker();

// Create router
const router = await worker.createRouter({
  mediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
    },
  ],
});

// WebSocket server
const wss = new WebSocket.Server({ port: 3001 });

wss.on("connection", (ws) => {
  // Handle signaling messages
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    // Handle different message types (joinRoom, createTransport, etc.)
  });
});
```

## Browser Support

- Chrome 74+
- Firefox 67+
- Safari 12.1+
- Edge 79+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact our team.
