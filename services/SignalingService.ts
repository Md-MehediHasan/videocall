
import { SignallingMessage } from '../types';

/**
 * SignalingService uses BroadcastChannel to simulate WebSocket/SSE 
 * communication for the browser environment.
 */
class SignalingService {
  private channel: BroadcastChannel;
  private listeners: Set<(msg: SignallingMessage) => void> = new Set();

  constructor() {
    this.channel = new BroadcastChannel('gemini_stream_v2_signaling');
    // Using addEventListener for better reliability in multi-tab environments
    this.channel.addEventListener('message', (event) => {
      const msg: SignallingMessage = event.data;
      this.listeners.forEach(listener => {
        try {
          listener(msg);
        } catch (err) {
          console.error("Signaling listener error:", err);
        }
      });
    });
  }

  /**
   * Send a signal to all instances.
   */
  send(msg: SignallingMessage) {
    this.channel.postMessage({
      ...msg,
      timestamp: Date.now()
    });
  }

  addListener(callback: (msg: SignallingMessage) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  close() {
    this.channel.close();
  }
}

export const signalingService = new SignalingService();
