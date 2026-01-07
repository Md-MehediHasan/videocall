// server/app/api/signal/route.js
let signals = {}; // { roomId: [msg, msg, ...] }
let activeConnections = {}; // { roomId: [peerId1, peerId2] }

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId")
  const pearId= searchParams.get("pearId")
  if (!signals[roomId]) signals[roomId] = [];
  const targetSignals= signals[roomId].filter(item=>item.senderId!=pearId)
  return new Response(JSON.stringify(signals[roomId]));
}

export async function POST(req) {
  const body = await req.json();
  const { roomId, type, data, senderId } = body;

  if (!signals[roomId]) signals[roomId] = [];
  if (!activeConnections[roomId]) activeConnections[roomId] = [];

  // Only allow one active call at a time
  if (type === "offer") {
    if (activeConnections[roomId].length > 0) {
      return new Response(JSON.stringify({ ok: false, message: "Room busy" }));
    }
    activeConnections[roomId].push(senderId);
    signals[roomId] = signals[roomId].filter(msg => msg.type !== "offer"); // remove old offers
  }

  if (type === "answer") {
    if (!activeConnections[roomId].includes(senderId)) {
      activeConnections[roomId].push(senderId); // second peer joins
    }
  }

  if (type === "end-call") {
    // Remove all peers from activeConnections
    activeConnections[roomId] = [];
    signals[roomId] = []; // clear old messages
  }

  signals[roomId].push({ type, data, senderId });
  return new Response(JSON.stringify({ ok: true }));
}
