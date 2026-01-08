'use client'
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MessageIcon from '@mui/icons-material/Message';
import { useEffect, useRef } from 'react';

export default function InCallInterface({
    localvideoSrc,remoteVideoSrc,
  endCallFunc
  callState
}) {


  
    

    
  return (
    <div className="h-screen w-screen fixed left-1/2 -translate-x-1/2 overflow-hidden box-border">
      <div className="absolute bottom-2 right-2 sm:mt-12 w-full left-1/2 -translate-x-1/2 h-full space-y-1 overflow-y-hidden">
         <video     
        ref={localvideoSrc}
        muted
        autoPlay
        playsInline
        className="fixed inset-0 h-[20vh] w-[30] object-cover -z-10"
      />
      </div>

      <video
        ref={remoteVideoSrc}
        autoPlay
        playsInline
        className="fixed inset-0 h-full w-full object-cover -z-10"
      />

      <div className="absolute left-1/2 -translate-x-1/2 bottom-16 sm:bottom-8 flex w-4/5 justify-around">
        
          <button
            className="bg-green-400 p-3 animate-bounce rounded-full text-white"
           
          >
            <CallIcon /> Accept
          </button>
       

        <button
          className="bg-red-600 p-3 animate-bounce rounded-full text-white"
          onClick={endCallFunc}
        >
          <CallEndIcon />  End Call </button>

       
          <button
            className="bg-white p-3 rounded-full animate-bounce"
           
          >
            <MessageIcon /> Message
          </button>
       
      </div>
    </div>
  );
}
