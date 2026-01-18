
import React, { useState } from 'react';
import { ArrowRight, Fingerprint, Hash, Sparkles } from 'lucide-react';

interface LobbyProps {
  onJoin: (roomId: string, name: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState(localStorage.getItem('user_name') || '');
  const [roomId, setRoomId] = useState('STREAM-ALPHA');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomId.trim()) {
      onJoin(roomId.toUpperCase(), name);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
      <div className="w-full max-w-md">
        <div className="glass rounded-[40px] p-8 sm:p-12 border-white/10 shadow-[0_32px_128px_-32px_rgba(59,130,246,0.3)]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Alpha 1.0</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">Get Started.</h2>
            <p className="text-sm text-gray-500 font-medium">Enter your credentials to connect to the stream.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Identity</label>
              <div className="relative">
                <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                  className="w-full pl-14 pr-6 py-5 bg-white/[0.03] border border-white/5 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-700 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Meeting Identifier</label>
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ROOM-ID"
                  required
                  className="w-full pl-14 pr-6 py-5 bg-white/[0.03] border border-white/5 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-700 transition-all font-bold tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] group"
            >
              Initialize Sync
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-loose">
              Secure WebRTC Tunnel • Encrypted Signaling • AI Enhanced
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
