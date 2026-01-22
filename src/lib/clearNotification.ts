import { writeBatch, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function clearAllNotifications(userId: string): Promise<void> {
  try {
    const notifsRef = collection(db, "users", userId, "notifications");
    const snapshot = await getDocs(notifsRef);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw error;
  }
}
