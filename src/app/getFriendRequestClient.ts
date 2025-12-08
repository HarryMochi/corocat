"use client";

import { 
  collection, query, where, getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getFriendRequests(userId: string) {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("to", "==", userId),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);
  
    return snapshot.docs.map(doc => ({
      id: doc.id,       // <-- THIS is all you need
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading friend requests:", error);
    return [];
  }
}
