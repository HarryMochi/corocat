import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { Point, Color, Layer } from "@/lib/types";

declare global {
  export interface Liveblocks {
    Presence: {
      selection: string[];
      cursor: Point | null;
      camera: { x: number; y: number } | null;
      pencilDraft: [x: number, y: number, pressure: number][] | null;
      penColor: Color | null;
      chatMessages?: Array<{
        id: string;
        userId: string;
        userName: string;
        userAvatar?: string;
        message: string;
        timestamp: number;
      }>;
      voiceState?: {
        isInCall: boolean;
        isMuted: boolean;
        isSpeaking: boolean;
      };
    };
    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      layers: LiveMap<string, LiveObject<Layer>>;
      layerIds: LiveList<string>;
    };


    UserMeta: {
      id: string;
      info: {
        displayName: string;
        photoURL: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};
    // Example has two events, using a union
    // | { type: "PLAY" } 
    // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

export { };
