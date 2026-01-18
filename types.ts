
export type SignallingMessageType = 
  | 'offer' 
  | 'answer' 
  | 'candidate' 
  | 'call-initiate' 
  | 'call-accepted'
  | 'call-rejected' 
  | 'call-ended' 
  | 'ping';

export interface SignallingMessage {
  type: SignallingMessageType;
  roomId: string;
  senderId: string;
  senderName: string;
  payload?: any;
}

export interface User {
  id: string;
  name: string;
}

export interface CallSession {
  roomId: string;
  caller: User;
  status: 'idle' | 'calling' | 'incoming' | 'active' | 'ended';
  isInitiator?: boolean;
}

export interface AIResponse {
  summary: string;
  suggestions: string[];
}
