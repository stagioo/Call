import { useRef, useState } from "react";

type UseMediaControlReturn = {
  localStreamRef: React.RefObject<MediaStream | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraEnabled: boolean;
  micEnabled: boolean;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string | null;
  selectedAudioDeviceId: string | null;
  handleLoadMediaDevices: (params: {
    audio: boolean;
    video: boolean;
  }) => Promise<MediaStream | null>;
  handleSelectVideoDevice: (deviceId: string) => void;
  handleSelectAudioDevice: (deviceId: string) => void;
  handleToggleCamera: () => void;
  handleToggleMic: () => void;
};

export const useMediaControl = (): UseMediaControlReturn => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<
    string | null
  >(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<
    string | null
  >(null);

  // Loads available media devices and optionally gets a stream
  const handleLoadMediaDevices = async (params: {
    audio: boolean;
    video: boolean;
  }) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: params.audio,
        video: params.video,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter((d) => d.kind === "videoinput");
      const audios = devices.filter((d) => d.kind === "audioinput");
      setVideoDevices(videos);
      setAudioDevices(audios);

      if (!selectedVideoDeviceId && videos.length > 0) {
        setSelectedVideoDeviceId(videos[0]?.deviceId || null);
      }
      if (!selectedAudioDeviceId && audios.length > 0) {
        setSelectedAudioDeviceId(audios[0]?.deviceId || null);
      }

      return stream;
    } catch (err) {
      setVideoDevices([]);
      setAudioDevices([]);
      localStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return null;
    }
  };

  const handleSelectVideoDevice = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
      if (localStreamRef.current) {
        const oldStream = localStreamRef.current;
        const oldVideoTrack = oldStream.getVideoTracks()[0];
        if (oldVideoTrack) oldStream.removeTrack(oldVideoTrack);
        const newVideoTrack = stream.getVideoTracks()[0];
        if (newVideoTrack) oldStream.addTrack(newVideoTrack);
        if (videoRef.current) {
          videoRef.current.srcObject = oldStream;
        }
      } else {
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
      setCameraEnabled(true);
    } catch (err) {}
  };

  const handleSelectAudioDevice = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: { exact: deviceId } },
      });
      if (localStreamRef.current) {
        const oldStream = localStreamRef.current;
        const oldAudioTrack = oldStream.getAudioTracks()[0];
        if (oldAudioTrack) oldStream.removeTrack(oldAudioTrack);
        const newAudioTrack = stream.getAudioTracks()[0];
        if (newAudioTrack) oldStream.addTrack(newAudioTrack);
        if (videoRef.current) {
          videoRef.current.srcObject = oldStream;
        }
      } else {
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
      setMicEnabled(true);
    } catch (err) {}
  };

  const handleToggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCameraEnabled(videoTrack.enabled);
  };

  const handleToggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
  };

  return {
    localStreamRef,
    videoRef,
    cameraEnabled,
    micEnabled,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    handleLoadMediaDevices,
    handleSelectVideoDevice,
    handleSelectAudioDevice,
    handleToggleCamera,
    handleToggleMic,
  };
};
