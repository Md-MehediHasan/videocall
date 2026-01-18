
import { useState, useRef, useEffect, useCallback } from 'react';
import { signalingService } from '../services/SignalingService';
import { SignallingMessage } from '../types';

const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(roomId: string, userId: string, userName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingService.send({
          type: 'candidate',
          roomId,
          senderId: userId,
          senderName: userName,
          payload: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      setConnectionStatus(pc.connectionState);
    };

    peerConnection.current = pc;
    return pc;
  }, [roomId, userId, userName]);

  const initiateCall = async () => {
    const pc = createPeerConnection();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    signalingService.send({
      type: 'offer',
      roomId,
      senderId: userId,
      senderName: userName,
      payload: offer,
    });
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingService.send({
      type: 'answer',
      roomId,
      senderId: userId,
      senderName: userName,
      payload: answer,
    });
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnection.current) {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  useEffect(() => {
    const unsubscribe = signalingService.addListener((msg: SignallingMessage) => {
      if (msg.roomId !== roomId || msg.senderId === userId) return;

      switch (msg.type) {
        case 'offer':
          handleOffer(msg.payload);
          break;
        case 'answer':
          handleAnswer(msg.payload);
          break;
        case 'candidate':
          handleCandidate(msg.payload);
          break;
        case 'call-ended':
          cleanup();
          break;
      }
    });

    return () => {
      unsubscribe();
      cleanup();
    };
  }, [roomId, userId, cleanup]);

  return {
    localStream,
    remoteStream,
    initiateCall,
    connectionStatus,
    cleanup
  };
}
