
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import Layout from './layout';
import Home from './page';
import { User, CallSession, SignallingMessage } from './types';
import { signalingService } from './services/SignalingService';
import CallingNotification from './components/CallingNotification';

const Root = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [activeRoomId, setActiveRoomId] = useState('STREAM-ALPHA');
  const [isReady, setIsReady] = useState(false);

  // Use a ref to keep state accessible to the stable signaling listener
  const stateRef = useRef({ currentUser, callSession, activeRoomId });
  
  useEffect(() => {
    stateRef.current = { currentUser, callSession, activeRoomId };
  }, [currentUser, callSession, activeRoomId]);

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setCurrentUser({
        id: Math.random().toString(36).substr(2, 9),
        name: storedName
      });
    }
    setIsReady(true);
  }, []);

  // STABLE SIGNALING LISTENER: Registered once on mount
  useEffect(() => {
    const handleGlobalSignals = (msg: SignallingMessage) => {
      const { currentUser: curUser, callSession: curSession, activeRoomId: curRoom } = stateRef.current;
      
      if (!curUser) return;
      if (msg.roomId !== curRoom) return;
      if (msg.senderId === curUser.id) return;

      switch (msg.type) {
        case 'call-initiate':
          // If we are idle, show incoming call
          if (!curSession || curSession.status === 'ended' || curSession.status === 'idle') {
            setCallSession({
              roomId: msg.roomId,
              caller: { id: msg.senderId, name: msg.senderName },
              status: 'incoming',
              isInitiator: false
            });
            try { new Audio('https://assets.mixkit.co/sfx/preview/mixkit-modern-classic-door-bell-30.mp3').play(); } catch(e) {}
          }
          break;

        case 'call-accepted':
          // If we were the ones calling, transition to active
          if (curSession?.status === 'calling' && curSession.roomId === msg.roomId) {
            setCallSession(prev => prev ? { ...prev, status: 'active' } : null);
          }
          break;
        
        case 'call-ended':
        case 'call-rejected':
          if (curSession?.roomId === msg.roomId) {
            setCallSession(null);
          }
          break;
      }
    };

    const unsubscribe = signalingService.addListener(handleGlobalSignals);
    return () => {
      unsubscribe();
      signalingService.close();
    };
  }, []); // Run once on mount

  const onAcceptCall = () => {
    if (callSession) {
      // Notify the caller that we accepted
      signalingService.send({
        type: 'call-accepted',
        roomId: callSession.roomId,
        senderId: currentUser!.id,
        senderName: currentUser!.name
      });
      setCallSession({ ...callSession, status: 'active' });
    }
  };

  const onRejectCall = () => {
    if (callSession) {
      signalingService.send({
        type: 'call-rejected',
        roomId: callSession.roomId,
        senderId: currentUser!.id,
        senderName: currentUser!.name
      });
      setCallSession(null);
    }
  };

  const endCall = () => {
    if (callSession) {
      signalingService.send({
        type: 'call-ended',
        roomId: callSession.roomId,
        senderId: currentUser!.id,
        senderName: currentUser!.name
      });
      setCallSession(null);
    }
  };

  if (!isReady) return null;

  return (
    <Layout currentUser={currentUser}>
      <Home 
        currentUser={currentUser} 
        setCurrentUser={setCurrentUser} 
        callSession={callSession}
        setCallSession={setCallSession}
        onEndCall={endCall}
        activeRoomId={activeRoomId}
        setActiveRoomId={setActiveRoomId}
      />
      
      {callSession?.status === 'incoming' && (
        <CallingNotification 
          caller={callSession.caller} 
          onAccept={onAcceptCall} 
          onReject={onRejectCall} 
        />
      )}
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
