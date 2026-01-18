
import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { User } from '../types';
import { geminiService } from '../services/geminiService';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Sparkles, MessageSquare, BrainCircuit, X, User as UserIcon,
  ChevronRight
} from 'lucide-react';

interface VideoRoomProps {
  roomId: string;
  user: User;
  onEndCall: () => void;
  isInitiator: boolean;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ roomId, user, onEndCall, isInitiator }) => {
  const { localStream, remoteStream, initiateCall, connectionStatus, cleanup } = useWebRTC(roomId, user.id, user.name);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Only the initiator (original caller) starts the handshake
    // to prevent both sides sending offers at once (glare)
    if (isInitiator) {
      initiateCall();
    }
    return () => cleanup();
  }, [isInitiator, initiateCall, cleanup]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleGeminiAnalysis = async () => {
    setIsAnalyzing(true);
    const mockTranscript = "Finalizing the roadmap. We need to focus on signal reliability and AI integration.";
    const [summaryResult, suggestionResult] = await Promise.all([
      geminiService.analyzeMeeting(mockTranscript),
      geminiService.getAiSuggestions(mockTranscript)
    ]);
    if (summaryResult) setAiSummary(summaryResult.summary);
    if (suggestionResult) setAiSuggestions(suggestionResult.suggestions);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-grow flex flex-col gap-4 min-w-0">
        <div className="flex-grow relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a]">
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 p-2 rounded-2xl glass border-white/10 shadow-2xl">
            <button 
              onClick={toggleMic}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${isMicOn ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button 
              onClick={toggleVideo}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${isVideoOn ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button 
              onClick={onEndCall}
              className="px-5 h-11 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-red-500/20"
            >
              <PhoneOff className="w-4 h-4" />
              Leave
            </button>
          </div>

          <div className="absolute inset-0">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                  <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center relative">
                    <UserIcon className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 font-medium mb-1 tracking-wide">Connecting...</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{connectionStatus}</p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-6 right-6 w-44 h-28 rounded-2xl overflow-hidden glass border-white/20 shadow-2xl z-30 ring-1 ring-white/10 group">
            {isVideoOn ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#111]">
                <UserIcon className="w-5 h-5 text-gray-700" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 glass rounded-lg text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
              Me
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-shrink-0 transition-all duration-300 ${aiAssistantOpen ? 'w-full lg:w-80' : 'w-16'}`}>
        {!aiAssistantOpen ? (
          <button 
            onClick={() => setAiAssistantOpen(true)}
            className="w-full h-full glass rounded-[32px] flex flex-col items-center py-8 gap-6 border-white/5 hover:bg-white/10 transition-colors"
          >
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            <div className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 rotate-180">
              AI Assistant
            </div>
          </button>
        ) : (
          <div className="w-full h-full glass rounded-[32px] border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right-4">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm tracking-tight">Intelligence</h3>
              </div>
              <button onClick={() => setAiAssistantOpen(false)} className="text-gray-600 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow p-5 space-y-6 overflow-y-auto no-scrollbar">
              <button 
                onClick={handleGeminiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles className="w-4 h-4" />}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>

              {aiSummary && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-xs leading-relaxed text-gray-300">
                    <span className="text-blue-400 font-bold block mb-1 text-[10px] uppercase">Summary</span>
                    {aiSummary}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Suggestions
                </h4>
                <div className="space-y-2">
                  {(aiSuggestions.length > 0 ? aiSuggestions : ["Discuss Roadmap", "Next Steps"]).map((s, i) => (
                    <div key={i} className="p-3 text-[11px] rounded-xl bg-white/2 border border-white/5 text-gray-400 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-blue-500" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRoom;
