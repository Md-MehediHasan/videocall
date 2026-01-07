"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  const roomId = "room1";
  const peerId = useRef(null);

  const [ready, setReady] = useState(false);
  const [callState, setCallState] = useState("idle"); // idle | confirming | in-call | incoming | ended
  const [incomingCaller, setIncomingCaller] = useState(null);
  const [swapped, setSwapped] = useState(false);

  // -------------------------------
  // Initialize peerId
  // -------------------------------
  useEffect(() => {
    peerId.current = crypto.randomUUID();
    setReady(true);
  }, []);

  // -------------------------------
  // Initialize RTCPeerConnection
  // -------------------------------
  useEffect(() => {
    if (!ready) return;

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Remote track
    pc.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.current.onicecandidate = (event) => {
      if (event.candidate) sendSignal("ice", event.candidate);
    };

    pollSignals();
  }, [ready]);

  // Assign local stream to video after call starts
  useEffect(() => {
    if (callState === "in-call" && localVideo.current && localStream.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [callState]);

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

  function pollSignals() {
    setInterval(async () => {
      const res = await fetch(`/api/signal?roomId=${roomId}`);
      const messages = await res.json();

      for (const msg of messages) {
        if (msg.senderId === peerId.current) continue;

        if (msg.type === "offer") {
          // Prevent multiple calls
          if (callState === "in-call") continue;

          setIncomingCaller(msg.senderId);
          setCallState("incoming");
        }

        if (msg.type === "answer") {
          if (pc.current.signalingState !== "have-local-offer") continue;
          await pc.current.setRemoteDescription(msg.data);
        }

        if (msg.type === "ice") {
          try {
            await pc.current.addIceCandidate(msg.data);
          } catch {}
        }
      }
    }, 1000);
  }

  // -------------------------------
  // Call handlers
  // -------------------------------
  function startCall() {
    setCallState("confirming");
  }

  async function confirmCall() {
    setCallState("in-call");

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideo.current) localVideo.current.srcObject = localStream.current;

      localStream.current.getTracks().forEach(track =>
        pc.current.addTrack(track, localStream.current)
      );

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      sendSignal("offer", offer);
    } catch (err) {
      console.error("Failed to access camera/mic:", err);
      setCallState("idle");
    }
  }

  async function acceptCall() {
    setCallState("in-call");

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideo.current) localVideo.current.srcObject = localStream.current;

      localStream.current.getTracks().forEach(track =>
        pc.current.addTrack(track, localStream.current)
      );

      await pc.current.setRemoteDescription(incomingCaller.offer);
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      sendSignal("answer", answer);

      setIncomingCaller(null);
    } catch (err) {
      console.error("Failed to accept call:", err);
      setCallState("idle");
    }
  }

  function rejectCall() {
    sendSignal("reject", { from: incomingCaller });
    setIncomingCaller(null);
    setCallState("idle");
  }

  function endCall() {
    localStream.current?.getTracks().forEach(track => track.stop());
    pc.current?.close();
    setCallState("ended");
    setSwapped(false);
    window.location.reload(); // simple reset
  }

  function swapVideos() {
    setSwapped(!swapped);
  }

  // -------------------------------
  // Render
  // -------------------------------
  if (!ready) return <div style={{ padding: 20 }}>Initializing…</div>;

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>WebRTC Video Call</h1>

      {/* IDLE UI */}
      {callState === "idle" && (
        <button style={styles.callBtn} onClick={startCall}>
          📞 Start Call
        </button>
      )}

      {/* CONFIRMATION MODAL */}
      {callState === "confirming" && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Start the call?</h3>
            <div style={{ marginTop: 20 }}>
              <button style={styles.acceptBtn} onClick={confirmCall}>
                ✅ Call
              </button>
              <button style={styles.rejectBtn} onClick={() => setCallState("idle")}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCOMING CALL POPUP */}
      {callState === "incoming" && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Incoming call from {incomingCaller}</h3>
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

      {/* IN CALL UI */}
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
            <button style={styles.iconBtn} onClick={swapVideos} title="Swap Videos">
              🔄
            </button>
            <button style={styles.iconBtn} onClick={endCall} title="End Call">
              ❌
            </button>
          </div>
        </div>
      )}

      {callState === "ended" && <p>Call ended</p>}
    </div>
  );
}

// -------------------------------
// Styles
// -------------------------------
const styles = {
  callBtn: {
    backgroundColor: "greenyellow",
    padding: "10px 20px",
    fontSize: 16,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    background: "#fff",
    padding: 30,
    borderRadius: 8,
    textAlign: "center",
    width: 300,
  },

  acceptBtn: {
    backgroundColor: "green",
    color: "white",
    padding: "8px 16px",
    marginRight: 10,
    cursor: "pointer",
  },

  rejectBtn: {
    backgroundColor: "gray",
    color: "white",
    padding: "8px 16px",
    cursor: "pointer",
  },

  callContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 800,
    height: 450,
    backgroundColor: "#000",
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  localVideo: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 160,
    height: 120,
    border: "2px solid white",
  },

  controls: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 10,
  },

  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    border: "none",
    borderRadius: 5,
    color: "white",
    fontSize: 20,
    padding: "6px 10px",
    cursor: "pointer",
  },
};
