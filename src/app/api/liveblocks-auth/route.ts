import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET!,
});

export async function POST(req: Request) {
  const { room, userId, displayName, photoURL } = await req.json();

  if (!room || !userId) {
    return new Response("Missing room or userId", { status: 400 });
  }

  try {
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        displayName,
        photoURL,
      },
    });


    session.allow(room, session.FULL_ACCESS);


    const { body, status } = await session.authorize();

    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Liveblocks auth error", { status: 500 });
  }
}
