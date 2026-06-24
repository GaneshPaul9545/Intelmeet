import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function useWebRTC(roomId, userData, initialMediaState = { isVideoOn: true, isMicOn: true }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [participants, setParticipants] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(initialMediaState.isMicOn);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialMediaState.isVideoOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Initialize media and socket connection
  const initializeMedia = useCallback(async () => {
    if (!initialMediaState.isVideoOn && !initialMediaState.isMicOn) {
      setLocalStream(null);
      return null;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: initialMediaState.isVideoOn ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: initialMediaState.isMicOn ? { echoCancellation: true, noiseSuppression: true } : false
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get media devices:', err);
      // Try audio-only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setIsVideoEnabled(false);
        return audioStream;
      } catch (audioErr) {
        console.error('Failed to get any media:', audioErr);
        return null;
      }
    }
  }, [initialMediaState.isVideoOn, initialMediaState.isMicOn]);

  // Create peer connection for a specific peer
  const createPeerConnection = useCallback((peerSocketId) => {
    if (peerConnectionsRef.current.has(peerSocketId)) {
      return peerConnectionsRef.current.get(peerSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.set(peerSocketId, remoteStream);
        return updated;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: peerSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeer(peerSocketId);
      }
    };

    peerConnectionsRef.current.set(peerSocketId, pc);
    return pc;
  }, []);

  // Remove a peer
  const removePeer = useCallback((peerSocketId) => {
    const pc = peerConnectionsRef.current.get(peerSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerSocketId);
    }
    setRemoteStreams(prev => {
      const updated = new Map(prev);
      updated.delete(peerSocketId);
      return updated;
    });
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(peerSocketId);
      return updated;
    });
  }, []);

  // Join room
  useEffect(() => {
    if (!roomId || !userData) return;

    let mounted = true;

    const setup = async () => {
      const stream = await initializeMedia();
      if (!mounted) return;

      // Connect socket
      const socket = io(API_BASE_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('join-room', roomId, {
          userId: userData.userId || userData._id,
          userName: userData.userName || userData.name || 'Guest',
          isAudioEnabled: initialMediaState.isMicOn,
          isVideoEnabled: initialMediaState.isVideoOn
        });
      });

      // Existing participants
      socket.on('existing-participants', async (existingPeers) => {
        for (const peer of existingPeers) {
          setParticipants(prev => {
            const updated = new Map(prev);
            updated.set(peer.socketId, {
              userName: peer.userName,
              userId: peer.userId,
              isAudioEnabled: peer.isAudioEnabled,
              isVideoEnabled: peer.isVideoEnabled
            });
            return updated;
          });

          // Create offer to existing peers
          const pc = createPeerConnection(peer.socketId);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { to: peer.socketId, offer });
          } catch (err) {
            console.error('Error creating offer:', err);
          }
        }
      });

      // New user connected
      socket.on('user-connected', async (peerData) => {
        setParticipants(prev => {
          const updated = new Map(prev);
          updated.set(peerData.socketId, {
            userName: peerData.userName,
            userId: peerData.userId,
            isAudioEnabled: peerData.isAudioEnabled ?? true,
            isVideoEnabled: peerData.isVideoEnabled ?? true
          });
          return updated;
        });
      });

      // Receive offer
      socket.on('offer', async ({ from, offer }) => {
        const pc = createPeerConnection(from);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { to: from, answer });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      });

      // Receive answer
      socket.on('answer', async ({ from, answer }) => {
        const pc = peerConnectionsRef.current.get(from);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error handling answer:', err);
          }
        }
      });

      // Receive ICE candidate
      socket.on('ice-candidate', async ({ from, candidate }) => {
        const pc = peerConnectionsRef.current.get(from);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      });

      // Media state changes from peers
      socket.on('peer-audio-toggle', ({ socketId, isAudioEnabled }) => {
        setParticipants(prev => {
          const updated = new Map(prev);
          const peer = updated.get(socketId);
          if (peer) updated.set(socketId, { ...peer, isAudioEnabled });
          return updated;
        });
      });

      socket.on('peer-video-toggle', ({ socketId, isVideoEnabled }) => {
        setParticipants(prev => {
          const updated = new Map(prev);
          const peer = updated.get(socketId);
          if (peer) updated.set(socketId, { ...peer, isVideoEnabled });
          return updated;
        });
      });

      // User disconnected
      socket.on('user-disconnected', ({ socketId }) => {
        removePeer(socketId);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });
    };

    setup();

    return () => {
      mounted = false;
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userData, initializeMedia, createPeerConnection, removePeer]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socketRef.current?.emit('toggle-audio', audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socketRef.current?.emit('toggle-video', videoTrack.enabled);
      }
    }
  }, []);

  // Screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      setIsScreenSharing(true);
      socketRef.current?.emit('screen-share-started');

      // Handle when user stops sharing via browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Screen share error:', err);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Restore camera track
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    setIsScreenSharing(false);
    socketRef.current?.emit('screen-share-stopped');
  }, []);

  // Send chat message
  const sendMessage = useCallback((data) => {
    socketRef.current?.emit('send-message', data);
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    socketRef.current?.disconnect();
  }, []);

  return {
    localStream,
    remoteStreams,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isConnected,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    leaveRoom,
    socket: socketRef
  };
}
