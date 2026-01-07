let rooms = {};

export async function POST(req) {
  const { roomId, type, data, senderId } = await req.json();

  if (!roomId || !senderId) {
    return new Response(
      JSON.stringify({ error: "roomId and senderId required" }),
      { status: 400 }
    );
  }

  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }

  rooms[roomId].push({ type, data, senderId });

  return new Response(JSON.stringify({ ok: true }));
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return new Response(
      JSON.stringify({ error: "roomId required" }),
      { status: 400 }
    );
  }

  const messages = rooms[roomId] || [];
  rooms[roomId] = [];

  return new Response(JSON.stringify(messages));
}
