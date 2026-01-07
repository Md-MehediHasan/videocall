// Simple in-memory signaling store
let signals = {};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!signals[roomId]) signals[roomId] = [];
  return new Response(JSON.stringify(signals[roomId]));
}

export async function POST(req) {
  const body = await req.json();
  const { roomId, type, data, senderId } = body;
  if (!signals[roomId]) signals[roomId] = [];

  // Only one active call: remove old offers/answers
  if (type === "offer") signals[roomId] = signals[roomId].filter(msg => msg.type !== "offer");

  signals[roomId].push({ type, data, senderId });
  return new Response(JSON.stringify({ ok: true }));
}
