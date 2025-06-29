import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Participant {
  socketId: string;
  userId: string;
  isHost: boolean;
  stream?: MediaStream;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  participants: Participant[];
  isConnected: boolean;
  isHost: boolean;
  joinRoom: (roomId: string, userId: string) => Promise<void>;
  leaveRoom: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  toggleMute: () => void;
  isMuted: boolean;
  reconnect: () => Promise<void>;
  isConnecting: boolean;
}

export const useWebRTC = (): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingAnswersRef = useRef<Map<string, RTCSessionDescription>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const currentRoomRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // STUN servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.ekiga.net" },
      { urls: "stun:stun.ideasip.com" },
      { urls: "stun:stun.schlund.de" },
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.voiparound.com" },
      { urls: "stun:stun.voipbuster.com" },
      { urls: "stun:stun.voipstunt.com" },
      { urls: "stun:stun.voxgratia.org" },
      { urls: "stun:stun.xten.com" },
    ],
    iceCandidatePoolSize: 10,
  };

  const createPeerConnection = useCallback((socketId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream tracks
    if (localStreamRef.current) {
      console.log(`Adding tracks to peer connection for ${socketId}:`, localStreamRef.current.getTracks());
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`Adding track to peer connection:`, track.kind, track.enabled);
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${socketId}:`, event.candidate);
        socketRef.current?.emit("ice-candidate", {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log(`🎥 Received track from ${socketId}:`, event.track.kind, event.streams);
      if (event.streams && event.streams[0]) {
        setParticipants((prev) => {
          const updated = prev.map((p) =>
            p.socketId === socketId
              ? { ...p, stream: event.streams[0] }
              : p
          );
          console.log("Updated participants with stream:", updated);
          return updated;
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${socketId}:`, peerConnection.connectionState);
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${socketId}:`, peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === "connected" || peerConnection.iceConnectionState === "completed") {
        console.log(`✅ ICE connection established with ${socketId}`);
      } else if (peerConnection.iceConnectionState === "failed" || peerConnection.iceConnectionState === "disconnected") {
        console.log(`❌ ICE connection failed/disconnected with ${socketId}`);
      }
    };

    peerConnection.onsignalingstatechange = () => {
      console.log(`Signaling state for ${socketId}:`, peerConnection.signalingState);
    };

    return peerConnection;
  }, []);

  const joinRoom = async (roomId: string, userId: string) => {
    try {
      console.log(`Joining room ${roomId} as ${userId}`);
      
      // Store references for reconnection
      currentRoomRef.current = roomId;
      currentUserIdRef.current = userId;
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      console.log("✅ Local stream obtained");

      // Connect to signaling server
      if (!socketRef.current) {
        socketRef.current = io("http://localhost:1285");
        setupSocketListeners();
      }

      // Join room
      socketRef.current.emit("join-room", { roomId, userId });
      setIsConnected(true);
      console.log("✅ Joined room successfully");
    } catch (error) {
      console.error("Error joining room:", error);
      throw error;
    }
  };

  // Handle pending answers when peer connections are ready
  useEffect(() => {
    peerConnectionsRef.current.forEach(async (peerConnection, socketId) => {
      const pendingAnswer = pendingAnswersRef.current.get(socketId);
      if (pendingAnswer && peerConnection.signalingState === "have-local-offer") {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingAnswer));
          pendingAnswersRef.current.delete(socketId);
        } catch (error) {
          console.error("Error setting pending answer:", error);
        }
      }
    });
  }, [participants]);

  const leaveRoom = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    // Close peer connections
    peerConnectionsRef.current.forEach((connection) => {
      connection.close();
    });
    peerConnectionsRef.current.clear();

    // Clear pending answers
    pendingAnswersRef.current.clear();

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setParticipants([]);
    setIsConnected(false);
    setIsHost(false);
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const reconnect = async () => {
    console.log("🔄 Attempting to reconnect...");
    setIsConnecting(true);
    try {
      // Close all existing connections
      peerConnectionsRef.current.forEach((connection) => {
        connection.close();
      });
      peerConnectionsRef.current.clear();
      pendingAnswersRef.current.clear();
      pendingCandidatesRef.current.clear();
      
      // Rejoin the room
      if (currentRoomRef.current && currentUserIdRef.current) {
        await joinRoom(currentRoomRef.current, currentUserIdRef.current);
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socketRef.current.on("room-participants", (existingParticipants: Participant[]) => {
      console.log("Received existing participants:", existingParticipants);
      setParticipants(existingParticipants);
      setIsHost(existingParticipants.length === 0);
      
      // Create peer connections for existing participants
      existingParticipants.forEach((participant) => {
        const peerConnection = createPeerConnection(participant.socketId);
        peerConnectionsRef.current.set(participant.socketId, peerConnection);
        
        // Wait a bit before creating offer to ensure connection is ready
        setTimeout(() => {
          // Create and send offer
          peerConnection.createOffer().then((offer) => {
            return peerConnection.setLocalDescription(offer);
          }).then(() => {
            socketRef.current?.emit("offer", {
              to: participant.socketId,
              offer: peerConnection.localDescription,
            });
          }).catch((error) => {
            console.error("Error creating offer:", error);
          });
        }, 500);
      });
    });

    socketRef.current.on("user-joined", (newParticipant: Participant) => {
      console.log("User joined:", newParticipant);
      setParticipants((prev) => {
        const updated = [...prev, newParticipant];
        console.log("Updated participants after join:", updated);
        return updated;
      });
      
      // Create peer connection for new participant, but DO NOT create an offer.
      const peerConnection = createPeerConnection(newParticipant.socketId);
      peerConnectionsRef.current.set(newParticipant.socketId, peerConnection);
      // The new participant will wait for an offer from the existing participant.
    });

    socketRef.current.on("user-left", ({ socketId }) => {
      console.log("User left:", socketId);
      setParticipants((prev) => {
        const updated = prev.filter((p) => p.socketId !== socketId);
        console.log("Updated participants after leave:", updated);
        return updated;
      });
      
      // Close peer connection
      const peerConnection = peerConnectionsRef.current.get(socketId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(socketId);
      }
      
      // Remove pending answer
      pendingAnswersRef.current.delete(socketId);
    });

    socketRef.current.on("offer", async ({ from, offer }) => {
      try {
        console.log(`Received offer from ${from}`, offer);
        let peerConnection = peerConnectionsRef.current.get(from);
        
        if (!peerConnection) {
          console.log(`Creating new peer connection for ${from}`);
          peerConnection = createPeerConnection(from);
          peerConnectionsRef.current.set(from, peerConnection);
        }
        
        console.log(`Setting remote description for ${from}, current state:`, peerConnection.signalingState);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`✅ Remote description set for ${from}`);

        // Add any pending ICE candidates
        const pendingCandidates = pendingCandidatesRef.current.get(from) || [];
        if (pendingCandidates.length > 0) {
          console.log(`Processing ${pendingCandidates.length} pending ICE candidates for ${from}`);
          for (const candidate of pendingCandidates) {
            try {
              await peerConnection.addIceCandidate(candidate);
              console.log(`✅ Added pending ICE candidate for ${from}`);
            } catch (error) {
              console.error(`Error adding pending ICE candidate for ${from}:`, error);
            }
          }
          pendingCandidatesRef.current.delete(from);
        }

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log(`Sending answer to ${from}`, answer);
        socketRef.current?.emit("answer", {
          to: from,
          answer: peerConnection.localDescription,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socketRef.current.on("answer", async ({ from, answer }) => {
      try {
        console.log(`Received answer from ${from}`, answer);
        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          console.log(`Setting remote answer for ${from}, current state:`, peerConnection.signalingState);
          // Check if we're in the right state to set remote description
          if (peerConnection.signalingState === "have-local-offer") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`Successfully set remote answer for ${from}`);
          } else {
            console.log(`Storing pending answer for ${from}, current state:`, peerConnection.signalingState);
            // Store the answer for later if we're not ready
            pendingAnswersRef.current.set(from, answer);
          }
        }
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    });

    socketRef.current.on("ice-candidate", async ({ from, candidate }) => {
      try {
        console.log(`Received ICE candidate from ${from}:`, candidate);
        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          // Check if we have a remote description
          if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
            console.log(`Adding ICE candidate to ${from}, remote description type:`, peerConnection.remoteDescription.type);
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(`✅ ICE candidate added successfully for ${from}`);
          } else {
            console.log(`⚠️ Storing ICE candidate for ${from} - no remote description yet`);
            // Store candidate for later
            const pendingCandidates = pendingCandidatesRef.current.get(from) || [];
            pendingCandidates.push(new RTCIceCandidate(candidate));
            pendingCandidatesRef.current.set(from, pendingCandidates);
          }
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });
  };

  return {
    localStream,
    participants,
    isConnected,
    isHost,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    toggleMute,
    isMuted,
    reconnect,
    isConnecting,
  };
}; 