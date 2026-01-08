"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);

  const roomId = "room1";
  const peerId = useRef(null);

  const [ready, setReady] = useState(false);
  const [callState, setCallState] = useState("idle"); 
  // idle | confirming | incoming | in-call
  const [incomingCaller, setIncomingCaller] = useState(null);
  const [swapped, setSwapped] = useState(false);

  // -------------------------------
  // Init peerId
  // -------------------------------
  useEffect(() => {
    peerId.current = crypto.randomUUID();
    setReady(true);
  }, []);

  // -------------------------------
  // Poll signaling server (SAFE)
  // -------------------------------
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/signal?roomId=${roomId}`);
      const messages = await res.json();

      for (const msg of messages) {
        if (msg.senderId === peerId.current) continue;

        if (msg.type === "offer") {
          if (callState !== "idle") continue;
          setIncomingCaller({ id: msg.senderId, offer: msg.data });
          setCallState("incoming");
        }

        if (msg.type === "answer") {
          if (pc.current?.signalingState === "have-local-offer") {
            await pc.current.setRemoteDescription(msg.data);

            for (const c of pendingCandidates.current) {
              await pc.current.addIceCandidate(c);
            }
            pendingCandidates.current = [];
          }
        }

        if (msg.type === "ice") {
          if (pc.current?.remoteDescription) {
            try {
              await pc.current.addIceCandidate(msg.data);
            } 
             catch {}
          }
          else {
              pendingCandidates.current.push(msg.data);
          }
        }

        if (msg.type === "end-call") {
          endCall(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ready, callState]);

  // -------------------------------
  // Signaling
  // -------------------------------
  async function sendSignal(type, data) {
    await fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        type,
        data,
        senderId: peerId.current,
      }),
    });
  }

  // -------------------------------
  // PeerConnection
  // -------------------------------
  function createPeerConnection() {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.ontrack = e => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
      }
    };

    pc.current.onicecandidate = e => {
      if (e.candidate) sendSignal("ice", e.candidate);
    };
  }

  // -------------------------------
  // Call Flow
  // -------------------------------
  function startCall() {
    setCallState("confirming");
  }

  async function confirmCall() {
    setCallState("in-call");
    createPeerConnection();
    await startLocalStream();

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    sendSignal("offer", offer);
  }

  async function acceptCall() {
    setCallState("in-call");
    createPeerConnection();
    await startLocalStream();

    await pc.current.setRemoteDescription(incomingCaller.offer);

    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);
    sendSignal("answer", answer);

    for (const c of pendingCandidates.current) {
      await pc.current.addIceCandidate(c);
    }
    pendingCandidates.current = [];

    setIncomingCaller(null);
  }

  function rejectCall() {
    setIncomingCaller(null);
    setCallState("idle");
  }

  async function startLocalStream() {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }

    localStream.current.getTracks().forEach(track =>
      pc.current.addTrack(track, localStream.current)
    );
  }

  function endCall(sendSignalToOther = true) {
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    pendingCandidates.current = [];

    if (sendSignalToOther) sendSignal("end-call", {});

    setCallState("idle");
    setSwapped(false);
  }

  function swapVideos() {
    setSwapped(s => !s);
  }

  // -------------------------------
  // Render (UNCHANGED STYLING)
  // -------------------------------
  if (!ready) return <div style={{ padding: 20 }}>Initializing…</div>;

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Professional WebRTC Call</h1>

      {callState === "idle" && (
        <button style={styles.callBtn} onClick={startCall}>
          📞 Start Call
        </button>
      )}

      {callState === "confirming" && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Start the call?</h3>
            <div style={{ marginTop: 20 }}>
              <button style={styles.acceptBtn} onClick={confirmCall}>
                ✅ Call
              </button>
              <button
                style={styles.rejectBtn}
                onClick={() => setCallState("idle")}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {callState === "incoming" && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Incoming call</h3>
            <div style={{ marginTop: 20 }}>
              <button style={styles.acceptBtn} onClick={acceptCall}>
                ✅ Accept
              </button>
              <button style={styles.rejectBtn} onClick={rejectCall}>
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {callState === "in-call" && (
        <div style={styles.callContainer}>
          {swapped ? (
            <>
              <video ref={localVideo} autoPlay muted playsInline style={styles.remoteVideo} />
              <video ref={remoteVideo} autoPlay playsInline style={styles.localVideo} />
            </>
          ) : (
            <>
              <video ref={remoteVideo} autoPlay playsInline style={styles.remoteVideo} />
              <video ref={localVideo} autoPlay muted playsInline style={styles.localVideo} />
            </>
          )}

          <div style={styles.controls}>
            <button style={styles.iconBtn} onClick={swapVideos}>🔄</button>
            <button style={styles.iconBtn} onClick={() => endCall(true)}>❌</button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------
// Styles (UNCHANGED)
// -------------------------------
const styles = {
  callBtn: {
    backgroundColor: "greenyellow",
    padding: "10px 20px",
    fontSize: 16,
    cursor: "pointer",
    borderRadius: 6,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    textAlign: "center",
    width: 320,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
  },
  acceptBtn: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px 20px",
    marginRight: 12,
    cursor: "pointer",
    borderRadius: 6,
    fontWeight: "bold",
  },
  rejectBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: 6,
    fontWeight: "bold",
  },
  callContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 900,
    height: 500,
    backgroundColor: "#000",
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  localVideo: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 180,
    height: 135,
    border: "2px solid white",
    borderRadius: 8,
    objectFit: "cover",
  },
  controls: {
    position: "absolute",
    top: 20,
    right: 20,
    display: "flex",
    gap: 12,
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    border: "none",
    borderRadius: 8,
    color: "white",
    fontSize: 22,
    padding: "8px 12px",
    cursor: "pointer",
  },
};
