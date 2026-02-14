"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useAuth } from "@/hooks/use-auth";
import { LiveMap, LiveList, LiveObject } from "@liveblocks/client";
import { Layer } from "@/lib/types";

export function Room({ children, courseId }: { children: ReactNode, courseId: string }) {
  const { user } = useAuth();
  
  return (
    <LiveblocksProvider 
      authEndpoint={async (room) => {
        if (!user) throw new Error("Please sign in");

        const response = await fetch('/api/liveblocks-auth', {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            room,
            userId: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || "Anonymous",
            photoURL: user.photoURL
          })
        });

        if (!response.ok) {
          throw new Error("Failed to authenticate");
        }

        return await response.json();
      }}
    >
      <RoomProvider 
        id={courseId}
        initialPresence={{
          cursor: null,
          selection: [],
          pencilDraft: null,
          penColor: null,
          camera: { x: 0, y: 0 },
        }}
        initialStorage={{
          layers: new LiveMap<string, LiveObject<Layer>>(),
          layerIds: new LiveList<string>([]),
        }}
      >
        <ClientSideSuspense fallback={<div className="w-full h-screen flex items-center justify-center">Loading whiteboard…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}