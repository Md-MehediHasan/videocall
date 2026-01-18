
import React from 'react';
import { User, Phone, X, Check, Video } from 'lucide-react';

interface IncomingCallProps {
  caller: { name: string; id: string };
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCall: React.FC<IncomingCallProps> = ({ caller, onAccept, onReject }) => {
  return (
    <div className="fixed top-8 right-8 z-[200] animate-bounce-in">
      <div className="glass w-80 rounded-3xl p-6 shadow-2xl border border-white/20 ring-1 ring-blue-500/30 overflow-hidden relative">
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>

        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-3 w-full mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 relative">
              <Video className="text-white w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-[#1a1a1a] rounded-full"></div>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Incoming Call</p>
              <h4 className="text-white font-bold text-lg leading-tight truncate max-w-[140px]">
                {caller.name}
              </h4>
            </div>
          </div>

          <div className="w-full flex gap-3">
            <button
              /* Fix: Use the correct prop name 'onReject' instead of 'onRejectCall' */
              onClick={onReject}
              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-red-500/20"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              /* Fix: Use the correct prop name 'onAccept' instead of 'onAcceptCall' */
              onClick={onAccept}
              className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
