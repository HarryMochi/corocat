
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Friend request functions
const sendFriendRequest = async (sender: any, receiverEmail: string) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', receiverEmail));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('User not found.');
  }

  const receiver = querySnapshot.docs[0];

  await addDoc(collection(db, 'friendRequests'), {
    senderId: sender.uid,
    senderEmail: sender.email,
    receiverId: receiver.id,
    receiverEmail: receiverEmail,
    status: 'pending',
  });
};

const acceptFriendRequest = async (currentUser: any, request: any) => {
  // Add to friends list for both users
  await setDoc(doc(db, 'users', currentUser.uid, 'friends', request.senderId), { email: request.senderEmail, addedAt: serverTimestamp() });
  await setDoc(doc(db, 'users', request.senderId, 'friends', currentUser.uid), { email: currentUser.email, addedAt: serverTimestamp() });

  // Delete the request
  await deleteDoc(doc(db, 'friendRequests', request.id));
};

const declineFriendRequest = async (requestId: string) => {
  await deleteDoc(doc(db, 'friendRequests', requestId));
};

export { app, auth, db, sendFriendRequest, acceptFriendRequest, declineFriendRequest };
