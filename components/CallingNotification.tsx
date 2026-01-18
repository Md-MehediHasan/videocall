
import React from 'react';
import { Video, Bell, Check, X } from 'lucide-react';

interface CallingNotificationProps {
  caller: { name: string; id: string };
  onAccept: () => void;
  onReject: () => void;
}

const CallingNotification: React.FC<CallingNotificationProps> = ({ caller, onAccept, onReject }) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] w-[380px] max-w-[90vw] animate-in slide-in-from-right-8 fade-in duration-500">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/5">
        
        {/* Animated Background Highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div className="h-full bg-blue-500 animate-[progress_5s_linear_infinite]" style={{ width: '100%' }}></div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-5 mb-8">
            {/* The App Icon (GeminiStream Branding) */}
            <div className="flex-shrink-0 relative">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-white/10">
                <Video className="text-white w-9 h-9" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 border-[4px] border-[#0a0a0a] rounded-full flex items-center justify-center shadow-lg">
                <Bell className="w-3 h-3 text-white animate-bounce" />
              </div>
            </div>

            <div className="flex-grow pt-1">
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">Stream Alert</span>
              </div>
              <h4 className="text-white font-extrabold text-2xl leading-none tracking-tight">
                {caller.name}
              </h4>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Incoming Video Call
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-bold text-xs transition-all border border-white/5 group"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Ignore
            </button>
            <button
              onClick={onAccept}
              className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs transition-all shadow-xl shadow-blue-600/30 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Accept Call
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default CallingNotification;
