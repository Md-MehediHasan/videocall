// server/app/api/signal/route.js

let signals = {};            // { roomId: [ { type, data, senderId } ] }
let activeConnections = {};  // { roomId: Set(peerId) }

// -------------------------------
// GET: poll signals (consume once)
// -------------------------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return new Response(
      JSON.stringify({ ok: false, message: "roomId required" }),
      { status: 400 }
    );
  }

  if (!signals[roomId]) signals[roomId] = [];

  // IMPORTANT: return & clear (polling-safe)
  const roomSignals = [...signals[roomId]];
  signals[roomId] = [];

  return new Response(JSON.stringify(roomSignals), { status: 200 });
}

// -------------------------------
// POST: send signal
// -------------------------------
export async function POST(req) {
  const { roomId, type, data, senderId } = await req.json();

  if (!roomId || !type || !senderId) {
    return new Response(
      JSON.stringify({ ok: false, message: "Invalid payload" }),
      { status: 400 }
    );
  }

  if (!signals[roomId]) signals[roomId] = [];
  if (!activeConnections[roomId])
    activeConnections[roomId] = new Set();

  const peers = activeConnections[roomId];

  // -------------------------------
  // OFFER (only 1 active call)
  // -------------------------------
  if (type === "offer") {
    if (peers.size >= 2) {
      return new Response(
        JSON.stringify({ ok: false, message: "Room busy" }),
        { status: 409 }
      );
    }

    // reset stale state
    peers.clear();
    peers.add(senderId);
    signals[roomId] = [];
  }

  // -------------------------------
  // ANSWER (2nd peer joins)
  // -------------------------------
  if (type === "answer") {
    if (peers.size >= 2 && !peers.has(senderId)) {
      return new Response(
        JSON.stringify({ ok: false, message: "Room full" }),
        { status: 409 }
      );
    }
    peers.add(senderId);
  }

  // -------------------------------
  // ICE (only if peer is part of call)
  // -------------------------------
  if (type === "ice") {
    if (!peers.has(senderId)) {
      return new Response(
        JSON.stringify({ ok: false, message: "Not in call" }),
        { status: 403 }
      );
    }
  }

  // -------------------------------
  // END CALL (cleanup)
  // -------------------------------
  if (type === "end-call") {
    peers.clear();
    signals[roomId] = [];

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // -------------------------------
  // STORE SIGNAL
  // -------------------------------
  signals[roomId].push({
    type,
    data,
    senderId,
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
