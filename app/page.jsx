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
  const [callState, setCallState] = useState("idle"); // idle | confirming | incoming | in-call | outgoing
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
  // Poll signaling server
  // -------------------------------
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/signal?roomId=${roomId}&selfId=${peerId.current}`
      );
      const messages = await res.json();

      for (const msg of messages) {
        if (msg.type === "offer" && callState === "idle") {
          setIncomingCaller({ id: msg.senderId, offer: msg.data });
          setCallState("incoming");
        }

        if (
          msg.type === "answer" &&
          pc.current?.signalingState === "have-local-offer"
        ) {
          await pc.current.setRemoteDescription(msg.data);

          // Add any pending ICE candidates
          for (const c of pendingCandidates.current) {
            await pc.current.addIceCandidate(c);
          }
          pendingCandidates.current = [];
          setCallState("in-call");
        }

        if (msg.type === "ice") {
          if (pc.current?.remoteDescription) {
            try {
              await pc.current.addIceCandidate(msg.data);
            } catch (err) {
              console.error("ICE error:", err);
            }
          } else {
            pendingCandidates.current.push(msg.data);
          }
        }

        if (msg.type === "end-call") {
          endCall(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ready]);

  // -------------------------------
  // Send signal
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
  // Create PeerConnection
  // -------------------------------
  function createPeerConnection() {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Handle incoming remote streams
    pc.current.ontrack = (e) => {
      console.log("Received remote stream", e.streams[0]);
      // Ensure remoteVideo element is updated with the remote stream
      remoteVideo.current.srcObject = e.streams[0];
    };

    pc.current.onicecandidate = (e) => {
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
    setCallState("outgoing");
    createPeerConnection();
    await startLocalStream();

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    await sendSignal("offer", offer);
  }

  async function acceptCall() {
    createPeerConnection();
    await startLocalStream();

    await pc.current.setRemoteDescription(incomingCaller.offer);

    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);
    await sendSignal("answer", answer);

    // Add pending ICE candidates
    for (const c of pendingCandidates.current) {
      await pc.current.addIceCandidate(c);
    }
    pendingCandidates.current = [];

    setCallState("in-call");
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

    localStream.current.getTracks().forEach((track) => {
      pc.current.addTrack(track, localStream.current);
    });
  }

  function endCall(sendSignalToOther = true) {
    localStream.current?.getTracks().forEach((t) => t.stop());
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
    setSwapped(!swapped);
  }

  // -------------------------------
  // UI
  // -------------------------------
  if (!ready) return <div>Initializing…</div>;

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>WebRTC Video Call</h1>

      {/* Idle state */}
      {callState === "idle" && (
        <button style={styles.callBtn} onClick={startCall}>
          📞 Start Call
        </button>
      )}

      {/* Confirm outgoing call */}
      {callState === "confirming" && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Start the call?</h3>
            <button style={styles.acceptBtn} onClick={confirmCall}>
              Call
            </button>
            <button style={styles.rejectBtn} onClick={() => setCallState("idle")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Incoming call popup */}
      {callState === "incoming" && incomingCaller && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Incoming call from {incomingCaller.id}</h3>
            <button style={styles.acceptBtn} onClick={acceptCall}>
              Accept
            </button>
            <button style={styles.rejectBtn} onClick={rejectCall}>
              Reject
            </button>
          </div>
        </div>
      )}

      {/* In-call UI */}
      {(callState === "in-call" || callState === "outgoing") && (
        <div style={styles.callContainer}>
          {/* Remote video */}
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            style={swapped ? styles.localVideo : styles.remoteVideo}
          />

          {/* Local video */}
          <video
            ref={localVideo}
            autoPlay
            muted
            playsInline
            style={swapped ? styles.remoteVideo : styles.localVideo}
          />

          <div style={styles.controls}>
            <button style={styles.iconBtn} onClick={swapVideos}>
              🔄
            </button>
            <button style={styles.iconBtn} onClick={() => endCall(true)}>
              ❌
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------
// Styles
// -------------------------------
const styles = {
  callBtn: { padding: 12, fontSize: 16, cursor: "pointer" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  acceptBtn: { background: "green", color: "#fff", padding: 8, width: 100 },
  rejectBtn: { background: "red", color: "#fff", padding: 8, width: 100 },
  callContainer: {
    position: "relative",
    width: 900,
    height: 500,
    background: "#000",
  },
  remoteVideo: { width: "100%", height: "100%", objectFit: "cover" },
  localVideo: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 200,
    height: 150,
    border: "2px solid white",
    objectFit: "cover",
  },
  controls: { position: "absolute", top: 20, right: 20, display: "flex", gap: 10 },
  iconBtn: { fontSize: 20, cursor: "pointer", background: "#fff", borderRadius: 5 },
};
