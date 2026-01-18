
import React, { useState } from 'react';
import { signalingService } from './services/SignalingService';
import { User, CallSession } from './types';
import Lobby from './components/Lobby';
import VideoRoom from './components/VideoRoom';
import { Phone, Copy, Zap, Shield, Cpu, Globe, CheckCircle2 } from 'lucide-react';

interface PageProps {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  callSession: CallSession | null;
  setCallSession: (session: CallSession | null) => void;
  onEndCall: () => void;
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
}

const Home: React.FC<PageProps> = ({ 
  currentUser, 
  setCurrentUser, 
  callSession, 
  setCallSession,
  onEndCall,
  activeRoomId,
  setActiveRoomId
}) => {
  const [copied, setCopied] = useState(false);

  const handleJoinRoom = (roomId: string, name: string) => {
    const user = { id: Math.random().toString(36).substr(2, 9), name };
    setCurrentUser(user);
    setActiveRoomId(roomId);
    localStorage.setItem('user_name', name);
    
    signalingService.send({
      type: 'ping',
      roomId,
      senderId: user.id,
      senderName: user.name,
    });
  };

  const startCall = () => {
    if (!currentUser) return;
    signalingService.send({
      type: 'call-initiate',
      roomId: activeRoomId,
      senderId: currentUser.id,
      senderName: currentUser.name
    });
    setCallSession({
      roomId: activeRoomId,
      caller: currentUser,
      status: 'calling',
      isInitiator: true
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(activeRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentUser) {
    return <Lobby onJoin={handleJoinRoom} />;
  }

  if (callSession?.status === 'active') {
    return (
      <div className="flex-grow p-4 sm:p-8 animate-slide-up">
        <VideoRoom 
          roomId={callSession.roomId} 
          user={currentUser} 
          onEndCall={onEndCall}
          isInitiator={callSession.isInitiator || false}
        />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full -z-10"></div>
      
      <div className="w-full max-w-5xl flex flex-col items-center text-center">
        <div className="relative mb-12 animate-float">
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full scale-150"></div>
          <div className="relative glass w-32 h-32 rounded-[40px] flex items-center justify-center border-white/20 shadow-2xl">
            <Zap className="w-14 h-14 text-blue-500 fill-blue-500/20" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 px-3 py-1 rounded-full border-4 border-[#050505] text-[10px] font-black uppercase text-black flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Online
          </div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tight text-white max-w-3xl leading-[1.1]">
          System <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Standby.</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-xl mb-12 leading-relaxed font-medium">
          You are currently reachable in <span className="text-white font-bold">{activeRoomId}</span>. 
          Keep this tab open to receive incoming video call notifications.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-20">
          <button 
            onClick={startCall}
            className="flex-grow flex items-center justify-center gap-3 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <Phone className="w-5 h-5 fill-white" />
            Signal Room
          </button>
          <button 
            onClick={copyRoomId}
            className="flex items-center justify-center gap-3 px-8 py-5 glass border-white/10 hover:bg-white/5 text-white rounded-2xl font-bold transition-all active:scale-95 min-w-[160px]"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied' : 'Share ID'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {[
            { icon: Globe, label: 'Broadband Signalling', desc: 'Enterprise-grade simulation of WebSocket data streams.' },
            { icon: Shield, label: 'End-to-End Privacy', desc: 'Secure peer negotiation ensures calls remain private.' },
            { icon: Cpu, label: 'Gemini Analysis', desc: 'Real-time transcript processing powered by Gemini 3 Flash.' }
          ].map((f, i) => (
            <div key={i} className="glass p-8 rounded-[32px] border-white/5 group hover:border-blue-500/30 transition-all cursor-default">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {callSession?.status === 'calling' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
          <div className="glass w-full max-w-md p-10 rounded-[48px] border-white/20 text-center animate-slide-up">
            <div className="relative flex justify-center mb-8">
              <div className="absolute inset-0 bg-blue-600/20 blur-3xl animate-pulse rounded-full"></div>
              <div className="w-24 h-24 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                <Phone className="w-10 h-10 text-blue-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold mb-2">Requesting Sync</h2>
            <p className="text-gray-400 mb-10 font-medium">Alerting all participants in {activeRoomId}...</p>
            <button 
              onClick={onEndCall}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold transition-all border border-red-500/20"
            >
              Cancel Signal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
