import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    runTransaction,
    arrayUnion,
    arrayRemove,
    writeBatch,
    serverTimestamp,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    FieldValue
} from 'firebase/firestore';
import { Course } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersCollection = collection(db, 'users');
const notificationsCollection = collection(db, 'notifications');
const coursesCollection = collection(db, 'courses');

async function getUserByEmail(email: string) {
    const q = query(usersCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0];
}

export async function sendFriendRequest(fromUserId: string, toUserEmail: string) {
    const fromUserRef = doc(usersCollection, fromUserId);
    const fromUserSnap = await getDoc(fromUserRef);

    if (!fromUserSnap.exists()) {
        throw new Error("Sender user not found");
    }
    const fromUserData = fromUserSnap.data();

    const toUser = await getUserByEmail(toUserEmail);
    if (!toUser) {
        throw new Error("User with that email does not exist.");
    }
    const toUserId = toUser.id;

    if (fromUserId === toUserId) {
        throw new Error("You cannot send a friend request to yourself.");
    }
    
    const toUserData = toUser.data();
    if (toUserData.friends?.includes(fromUserId)) {
        throw new Error("You are already friends with this user.");
    }

    const q = query(notificationsCollection, where("type", "==", "FRIEND_REQUEST"), where("fromUserId", "==", fromUserId), where("toUserId", "==", toUserId));
    const existingRequest = await getDocs(q);
    if(!existingRequest.empty) {
        throw new Error("Friend request already sent.");
    }


    await addDoc(notificationsCollection, {
        fromUserId,
        fromUserName: fromUserData.displayName,
        toUserId,
        type: 'FRIEND_REQUEST',
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    return { success: true, message: "Friend request sent successfully!" };
}

export async function acceptFriendRequest(notificationId: string) {
    const notificationRef = doc(notificationsCollection, notificationId);
    
    return runTransaction(db, async (transaction) => {
        const notificationSnap = await transaction.get(notificationRef);
        if (!notificationSnap.exists() || notificationSnap.data().type !== 'FRIEND_REQUEST' || notificationSnap.data().status !== 'pending') {
            throw new Error("Invalid or already handled friend request.");
        }

        const { fromUserId, toUserId } = notificationSnap.data();
        const fromUserRef = doc(usersCollection, fromUserId);
        const toUserRef = doc(usersCollection, toUserId);

        transaction.update(fromUserRef, { friends: arrayUnion(toUserId) });
        transaction.update(toUserRef, { friends: arrayUnion(fromUserId) });

        transaction.update(notificationRef, { status: 'accepted' });

        return { success: true, message: "Friend request accepted!" };
    });
}

export async function rejectFriendRequest(notificationId: string) {
    const notificationRef = doc(notificationsCollection, notificationId);
    const notificationSnap = await getDoc(notificationRef);

    if (!notificationSnap.exists() || notificationSnap.data().type !== 'FRIEND_REQUEST' || notificationSnap.data().status !== 'pending') {
        throw new Error("Invalid or already handled friend request.");
    }

    await updateDoc(notificationRef, { status: 'rejected' });
    return { success: true, message: "Friend request rejected." };
}

export async function removeFriend(userId: string, friendId: string) {
    const userRef = doc(usersCollection, userId);
    const friendRef = doc(usersCollection, friendId);

    const batch = writeBatch(db);
    batch.update(userRef, { friends: arrayRemove(friendId) });
    batch.update(friendRef, { friends: arrayRemove(userId) });

    await batch.commit();
    return { success: true, message: "Friend removed successfully." };
}

export async function getFriendRequests(userId: string) {
    const q = query(notificationsCollection, where("toUserId", "==", userId), where("type", "==", "FRIEND_REQUEST"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


export async function getFriends(userId: string) {
    const userRef = doc(usersCollection, userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];

    const friendIds = userSnap.data().friends || [];
    if (friendIds.length === 0) return [];

    const friendsQuery = query(usersCollection, where("__name__", "in", friendIds));
    const friendsSnap = await getDocs(friendsQuery);
    return friendsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateUserProfile(userId: string, data: { displayName?: string; photoURL?: string; }) {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, data);
    return { success: true, message: "Profile updated successfully." };
}

export async function acceptSharedCourse(notificationId: string) {
    const notificationRef = doc(notificationsCollection, notificationId);

    return runTransaction(db, async (transaction) => {
        const notifSnap = await transaction.get(notificationRef);
        if (!notifSnap.exists() || notifSnap.data().type !== 'SHARE_COURSE' || notifSnap.data().status !== 'pending') {
            throw new Error("Invalid or already handled share notification.");
        }
        
        const { toUserId, entityId: courseId, fromUserName } = notifSnap.data();
        
        const courseRef = doc(coursesCollection, courseId);
        const courseSnap = await transaction.get(courseRef);

        if(!courseSnap.exists()) {
            throw new Error("Shared course not found.");
        }

        const originalCourse = courseSnap.data() as Course;

        const newCourseData: Omit<Course, 'id'> = {
            ...originalCourse,
            userId: toUserId,
            userName: '', // will be replaced with actual username on client
            originalOwnerId: originalCourse.userId,
            originalOwnerName: fromUserName,
            createdAt: new Date().toISOString(),
            sharedAt: serverTimestamp() as any, // HACK
            notes: "",
            steps: originalCourse.steps.map(step => ({...step, completed: false, quiz: undefined }))
        };

        const newCourseRef = doc(collection(db, 'courses'));
        transaction.set(newCourseRef, newCourseData);
        
        transaction.update(notificationRef, { status: 'accepted' });

        return { success: true, message: "Course added to your library!" };
    });
}

export async function deleteNotification(notificationId: string) {
    const notificationRef = doc(notificationsCollection, notificationId);
    await deleteDoc(notificationRef);
    return { success: true, message: "Notification deleted." };
}

export { app, auth, db };