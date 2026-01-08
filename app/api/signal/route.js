// In-memory signal store
// {
//   roomId: [
//     { type, data, senderId, timestamp }
//   ]
// }
let signals = {};

// ---------------------------------
// GET: fetch signals for a room
// ---------------------------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const selfId = searchParams.get("selfId");  // Pass selfId to filter out own messages

  if (!roomId) {
    return new Response(
      JSON.stringify({ ok: false, message: "roomId required" }),
      { status: 400 }
    );
  }

  if (!signals[roomId]) signals[roomId] = [];

  // If selfId is provided, filter out own messages
  const outgoing = selfId
    ? signals[roomId].filter(msg => msg.senderId !== selfId)
    : [...signals[roomId]];

  // Consume signals once (polling-safe)
  signals[roomId] = [];

  return new Response(JSON.stringify(outgoing), { status: 200 });
}

// ---------------------------------
// POST: store a signal
// ---------------------------------
export async function POST(req) {
  const { roomId, type, data, senderId } = await req.json();

  if (!roomId || !type || !senderId) {
    return new Response(
      JSON.stringify({ ok: false, message: "Invalid payload" }),
      { status: 400 }
    );
  }

  if (!signals[roomId]) signals[roomId] = [];

  // Store the new signal
  signals[roomId].push({
    type,
    data,
    senderId,
    timestamp: Date.now(),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
