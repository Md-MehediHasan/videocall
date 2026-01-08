'use client'
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MessageIcon from '@mui/icons-material/Message';
import { useEffect, useRef } from 'react';

export default function IncomingInterface({
  videoSrc,
  username,
  endCallFunc,
  acceptCallFunc,
  messageFunc,
  callState
}) {
  const intervalRef = useRef(null);

  useEffect(() => {
    let sound 
    if (callState === 'outgoing') {
        sound= new Audio('/audio/ring.mp3');

      intervalRef.current = setInterval(() => {
        sound.play();
      }, 3000);
    }
     if (callState === 'incoming') {
        sound= new Audio('/audio/incoming-call.mp3');

      intervalRef.current = setInterval(() => {
        sound.play();
      }, 7000);
    }
    

    const timeout = setTimeout(() => {
    sound.pause();
      sound.currentTime = 0;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      endCallFunc();
    }, 15000);

    // ✅ Cleanup on unmount or state change
    return () => {
     

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      clearTimeout(timeout);
    };
  }, [callState, endCallFunc]);

  return (
    <div className="h-screen w-screen fixed left-1/2 -translate-x-1/2 overflow-hidden box-border">
      <div className="absolute mt-0 sm:mt-12 w-full left-1/2 -translate-x-1/2 h-full space-y-1 overflow-y-hidden">
        <h2 className="text-center text-white text-3xl">
          {callState === 'incoming' ? 'Incoming Call' : 'Ringing'}
        </h2>

        <span className="block bg-green-300 mx-auto w-[120] sm:w-[220] h-[120] sm:h-[220] my-4 rounded-full border border-green-400"></span>

        <h3 className="text-2xl text-white text-center">
          {username || "Md. Mehedi Hasan"}
        </h3>
      </div>

      <video
        ref={videoSrc}
        autoPlay
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover -z-10"
      />

      <div className="absolute left-1/2 -translate-x-1/2 bottom-16 sm:bottom-8 flex w-4/5 justify-around">
        {callState === 'incoming' && (
          <button
            className="bg-green-400 p-3 animate-bounce rounded-full text-white"
            onClick={acceptCallFunc}
          >
            <CallIcon /> Accept
          </button>
        )}

        <button
          className="bg-red-600 p-3 animate-bounce rounded-full text-white"
          onClick={endCallFunc}
        >
          <CallEndIcon /> {callState === 'incoming' ? 'Reject' : 'End Call'}
        </button>

        {callState === 'incoming' && (
          <button
            className="bg-white p-3 rounded-full animate-bounce"
            onClick={messageFunc}
          >
            <MessageIcon /> Message
          </button>
        )}
      </div>
    </div>
  );
}
