"use client";

import { 
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { db, getUserByEmail } from "@/lib/firebase";

export async function sendFriendRequest(
  fromUserId: string,
  toUserEmail: string,
  fromUserName: string,
  fromUserAvatar:string
): Promise<{ success: boolean; message: string }> {

  try {
    const toUser = await getUserByEmail(toUserEmail);
    if (!toUser) {
      return { success: false, message: "User not found." };
    }

    const toUserId = toUser.id;

    if (fromUserId === toUserId) {
      return { success: false, message: "Cannot friend yourself." };
    }

    // ⭐ Check if already friends
    const friendDoc = await getDoc(
      doc(db, "users", fromUserId, "friends", toUserId)
    );

    if (friendDoc.exists()) {
      return { success: false, message: "You are already friends." };
    }

    // ---- CHECK IF YOU SENT THEM A REQUEST ----
    const q1 = query(
      collection(db, "friendRequests"),
      where("from", "==", fromUserId),
      where("to", "==", toUserId),
      where("status", "==", "pending")
    );

    // ---- CHECK IF THEY SENT YOU A REQUEST ----
    const q2 = query(
      collection(db, "friendRequests"),
      where("from", "==", toUserId),
      where("to", "==", fromUserId),
      where("status", "==", "pending")
    );

    const [r1, r2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    if (!r1.empty || !r2.empty) {
      return { success: false, message: "A pending friend request already exists." };
    }

    // ---- CREATE REQUEST ----
    const reqRef = await addDoc(collection(db, "friendRequests"), {
      from: fromUserId,
      to: toUserId,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    const requestId = reqRef.id;



    // ⭐ NEW: Add second notification: "Check your socials..."
    await addDoc(collection(db, "users", toUserId, "notifications"), {
      type: "friend_request",
      message: "Check your socials, someone wants to add you.",
      fromUserId,
      fromUserName,
      fromUserAvatar:fromUserAvatar || null,
      createdAt: serverTimestamp(),
      isRead: false,
    });
  
    return { success: true, message: "Friend request sent!" };

  } catch (error: any) {
    console.error("Error sending friend request:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}
