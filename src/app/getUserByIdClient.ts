"use client";

import { db, usersCollection } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";


export async function getUserById(userId: string) {
  try {
    const userRef = doc(usersCollection, userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return null;
    console.log(snap.data)
    return {
      id: snap.id,
      ...snap.data(),
    };
  } catch (error) {
    console.error("Error in getUserById (client):", error);
    return null;
  }
}
