"use client";
import { useOthers, useSelf } from "@liveblocks/react/suspense";


export function useActiveUsers() {
  const me = useSelf();
  const others = useOthers();
  

  const users = [
    {
      displayName: me?.info?.displayName || "You",
      photoURL: me?.info?.photoURL || "",
    },
    ...others.map((other) => ({
      displayName: other.info?.displayName || "Anonymous",
      photoURL: other.info?.photoURL || "",
    })),
  ];


  return users.filter(user => user.displayName);
}