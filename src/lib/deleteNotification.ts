import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


export async function deleteNotification(userId: string, notificationId: string) {
  if (!userId || !notificationId) return;

  const notifRef = doc(db, "users", userId, "notifications", notificationId);

  try {
    await deleteDoc(notifRef);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}
