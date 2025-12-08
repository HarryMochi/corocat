"use client"
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function getFriends(userId: string) {
  try {
    const friendsRef = collection(db, "users", userId, "friends");
    const snap = await getDocs(friendsRef);

    // Step 1: Collect all friendIds
    const friendIds = snap.docs.map(doc => doc.id);

    // Step 2: Fetch profiles
    const friendProfiles = [];
    for (const fid of friendIds) {
      const u = await getDoc(doc(db, "users", fid));
      if (u.exists()) {
        friendProfiles.push({
          id: fid,
          ...u.data()
        });
      }
    }

    return friendProfiles;
  } catch (error) {
    console.error("Error loading friends:", error);
    return [];
  }
}
