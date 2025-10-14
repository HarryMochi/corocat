
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, getDoc, collectionGroup, runTransaction, arrayUnion, arrayRemove, onSnapshot, writeBatch } from 'firebase/firestore';
import type { Course, CourseData, MarketplaceCourse, Step } from './types';
import { FirestorePermissionError, errorEmitter } from './errors';
import { FirebaseError } from 'firebase/app';

async function handleFirestoreError(error: unknown, refPath: string, operation: 'get' | 'list' | 'create' | 'update' | 'delete', resourceData?: any) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
        const customError = new FirestorePermissionError(
            `Firestore permission denied for operation '${operation}' on path '${refPath}'.`,
            refPath,
            operation,
            resourceData
        );
        errorEmitter.emit('permission-error', customError);
        throw customError;
    }
    throw error;
}

const toISOString = (date: any): string => {
    if (!date) return new Date().toISOString();
    if (typeof date.toDate === 'function') return date.toDate().toISOString();
    if (typeof date.seconds === 'number') return new Date(date.seconds * 1000).toISOString();
    if (typeof date === 'string') return date;
    return new Date().toISOString();
};

export async function addCourse(courseData: CourseData): Promise<string> {
  const refPath = 'courses';
  try {
    const docRef = await addDoc(collection(db, 'courses'), { ...courseData, notes: courseData.notes ?? "" });
    return docRef.id;
  } catch (error) {
    await handleFirestoreError(error, refPath, 'create', courseData);
    throw error;
  }
}

export async function getCoursesForUser(userId: string): Promise<Course[]> {
  const refPath = `courses`;
  try {
    const q = query(collection(db, 'courses'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id, createdAt: toISOString(data.createdAt) } as Course;
    });
  } catch (error) {
    await handleFirestoreError(error, refPath, 'list');
    throw error;
  }
}

export async function getCourseById(courseId: string): Promise<Course | null> {
    const refPath = `courses/${courseId}`;
    try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { ...data, id: docSnap.id, createdAt: toISOString(data.createdAt) } as Course;
        }
        return null;
    } catch (error) {
        await handleFirestoreError(error, refPath, 'get');
        throw error;
    }
}

export async function getUserProfileData(userId: string) {
    const refPath = `users/${userId}`;
    try {
        const userDoc = await getDoc(doc(collection(db, 'users'), userId));
        if (!userDoc.exists()) throw new Error("User not found");
        const userData = userDoc.data();
        const q = query(collection(db, 'marketplaceCourses'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const publishedCourses = querySnapshot.docs.map(doc => ({ marketplaceId: doc.id, ...doc.data() } as MarketplaceCourse));
        return {
            displayName: userData.displayName || 'Anonymous',
            creationTime: toISOString(userData.creationTime),
            activeCourses: 0, coursesCompleted: 0, coursesPublished: publishedCourses.length,
        };
    } catch (error) {
        await handleFirestoreError(error, refPath, 'get');
        throw error;
    }
}

export async function updateCourse(courseId: string, updates: Partial<CourseData>): Promise<void> {
  const refPath = `courses/${courseId}`;
  try {
    await updateDoc(doc(db, 'courses', courseId), updates);
  } catch (error) {
    await handleFirestoreError(error, refPath, 'update', updates);
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  const refPath = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    await handleFirestoreError(error, refPath, 'delete');
  }
}

export async function addCourseToMarketplace(course: Course, category: string): Promise<string> {
    const refPath = 'marketplaceCourses';
    const marketplaceCourse: Omit<MarketplaceCourse, 'marketplaceId'> = {
        ...course,
        userName: course.userName || "Community Creator",
        originalCourseId: course.id, category, isPublic: true,
        createdAt: new Date().toISOString(), likes: 0, likedBy: [],
    };
    try {
        const docRef = await addDoc(collection(db, 'marketplaceCourses'), marketplaceCourse);
        await updateCourse(course.id, { isPublic: true });
        return docRef.id;
    } catch (error) {
        await handleFirestoreError(error, refPath, 'create', marketplaceCourse);
        throw error;
    }
}

const processMarketplaceDoc = (doc: any) => {
    const data = doc.data();
    return { marketplaceId: doc.id, ...data, createdAt: toISOString(data.createdAt) } as MarketplaceCourse;
};

export async function getMarketplaceCourses(category: string): Promise<MarketplaceCourse[]> {
    const refPath = `marketplaceCourses (category: ${category})`;
    try {
        const q = query(collection(db, 'marketplaceCourses'), where('category', '==', category));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(processMarketplaceDoc);
    } catch (error) {
        await handleFirestoreError(error, refPath, 'list');
        throw error;
    }
}

export async function getAllMarketplaceCourses(): Promise<MarketplaceCourse[]> {
    const refPath = 'marketplaceCourses';
    try {
        const querySnapshot = await getDocs(collection(db, 'marketplaceCourses'));
        return querySnapshot.docs.map(processMarketplaceDoc);
    } catch (error) {
        await handleFirestoreError(error, refPath, 'list');
        throw error;
    }
}

export async function addCourseFromMarketplace(course: MarketplaceCourse, userId: string, userName: string): Promise<string> {
    const { marketplaceId, originalCourseId, ...courseData } = course;
    const resetSteps = courseData.steps.map((step: Step) => {
        const newStep = { ...step, completed: false };
        if (newStep.quiz) {
            const resetQuestions = newStep.quiz.questions.map(q => ({ ...q, userAnswer: null, isCorrect: null }));
            newStep.quiz = { ...newStep.quiz, score: null, questions: resetQuestions };
        }
        return newStep;
    });
    const newCourseData: CourseData = {
        ...courseData, steps: resetSteps, userId, userName,
        isPublic: false, createdAt: new Date().toISOString(), notes: "",
    };
    delete (newCourseData as any).originalCourseId;
    delete (newCourseData as any).marketplaceId;
    return addCourse(newCourseData);
}

export async function toggleLikeOnMarketplaceCourse(courseId: string, userId: string): Promise<void> {
    const refPath = `marketplaceCourses/${courseId}`;
    const courseRef = doc(db, "marketplaceCourses", courseId);
    try {
        await runTransaction(db, async (transaction) => {
            const courseDoc = await transaction.get(courseRef);
            if (!courseDoc.exists()) throw "Document does not exist!";
            const data = courseDoc.data();
            const likedBy = data.likedBy || [];
            let newLikes = data.likes || 0;
            if (likedBy.includes(userId)) {
                transaction.update(courseRef, { likes: Math.max(0, newLikes - 1), likedBy: arrayRemove(userId) });
            } else {
                transaction.update(courseRef, { likes: newLikes + 1, likedBy: arrayUnion(userId) });
            }
        });
    } catch (error) {
        await handleFirestoreError(error, refPath, 'update', { userId });
    }
}

export async function sendFriendRequest(fromId: string, toEmail: string): Promise<void> {
    const refPath = 'friendRequests';
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', toEmail));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) throw new Error("User with that email does not exist.");
        const toUser = querySnapshot.docs[0];
        const toId = toUser.id;
        if (fromId === toId) throw new Error("You cannot send a friend request to yourself.");
        const fromUserDoc = await getDoc(doc(db, 'users', fromId));
        if (!fromUserDoc.exists()) throw new Error("Could not find your user data.");
        const fromData = fromUserDoc.data();
        await addDoc(collection(db, 'friendRequests'), {
            from: fromId, to: toId,
            fromData: { displayName: fromData.displayName || 'Anonymous', photoURL: fromData.photoURL || null },
            status: 'pending', createdAt: new Date().toISOString(),
        });
    } catch (error) {
        await handleFirestoreError(error, refPath, 'create');
        throw error;
    }
}

export function getFriendRequests(userId: string, callback: (requests: any[]) => void): () => void {
    const refPath = 'friendRequests';
    const q = query(collection(db, 'friendRequests'), where('to', '==', userId), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(requests);
    }, (error) => handleFirestoreError(error, refPath, 'list'));
    return unsubscribe;
}

export function getFriends(userId: string, callback: (friends: any[]) => void): () => void {
    const refPath = `users/${userId}/friends`;
    const q = collection(db, 'users', userId, 'friends');
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const friends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(friends);
    }, (error) => handleFirestoreError(error, refPath, 'list'));
    return unsubscribe;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
    const requestRef = doc(db, 'friendRequests', requestId);
    let fromId: string = '';
    let toName: string = '';
    try {
        await runTransaction(db, async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists()) throw new Error("Friend request not found.");
            const { from, to, fromData } = requestDoc.data();
            fromId = from;
            const toUserDoc = await getDoc(doc(db, 'users', to));
            if (!toUserDoc.exists()) throw new Error("Could not find your user data.");
            const toData = toUserDoc.data();
            toName = toData.displayName || 'Anonymous';
            transaction.set(doc(db, 'users', from, 'friends', to), { displayName: toData.displayName || 'Anonymous', photoURL: toData.photoURL || null });
            transaction.set(doc(db, 'users', to, 'friends', from), { displayName: fromData.displayName || 'Anonymous', photoURL: fromData.photoURL || null });
            transaction.delete(requestRef);
        });
        if (fromId && toName) await addNotification(fromId, `${toName} accepted your friend request.`);
    } catch (error) {
        await handleFirestoreError(error, `friendRequests/${requestId}`, 'update');
        throw error;
    }
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
    const requestRef = doc(db, 'friendRequests', requestId);
    try {
        const requestDoc = await getDoc(requestRef);
        if (!requestDoc.exists()) throw new Error("Friend request not found.");
        const { from, to } = requestDoc.data();
        const toUserDoc = await getDoc(doc(db, 'users', to));
        if (!toUserDoc.exists()) throw new Error("Could not find your user data.");
        const toData = toUserDoc.data();
        const toName = toData.displayName || 'Anonymous';
        await deleteDoc(requestRef);
        await addNotification(from, `${toName} declined your friend request.`);
    } catch (error) {
        await handleFirestoreError(error, `friendRequests/${requestId}`, 'delete');
        throw error;
    }
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) throw new Error("User not found");
        const userName = userDoc.data().displayName || 'Anonymous';
        await runTransaction(db, async (transaction) => {
            transaction.delete(doc(db, 'users', userId, 'friends', friendId));
            transaction.delete(doc(db, 'users', friendId, 'friends', userId));
        });
        await addNotification(friendId, `${userName} removed you from their friends list.`);
    } catch (error) {
        await handleFirestoreError(error, `users/${userId}/friends/${friendId}`, 'delete');
        throw error;
    }
}

export async function addNotification(userId: string, message: string, data?: any): Promise<void> {
    const refPath = `users/${userId}/notifications`;
    try {
        await addDoc(collection(db, 'users', userId, 'notifications'), { message, createdAt: new Date().toISOString(), read: false, ...(data && { data }) });
    } catch (error) {
        console.error("Failed to add notification:", error);
    }
}

export function getNotifications(userId: string, callback: (notifications: any[]) => void): () => void {
    const refPath = `users/${userId}/notifications`;
    const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, createdAt: toISOString(data.createdAt) };
        });
        callback(notifications);
    }, (error) => handleFirestoreError(error, refPath, 'list'));
    return unsubscribe;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const refPath = `users/${userId}/notifications/${notificationId}`;
    try {
        await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
    } catch (error) {
        await handleFirestoreError(error, refPath, 'update');
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const refPath = `users/${userId}/notifications`;
    try {
        const q = query(collection(db, 'users', userId, 'notifications'), where('read', '==', false));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.update(doc.ref, { read: true }));
        await batch.commit();
    } catch (error) {
        await handleFirestoreError(error, refPath, 'update');
    }
}

// Course Sharing
export async function shareCourseWithFriends(course: Course, friendIds: string[], fromUser: { uid: string, displayName: string | null }) {
    const message = `${fromUser.displayName || 'A friend'} shared a course with you: "${course.topic}"`;
    const { id, userId, userName, ...courseData } = course;

    const resetSteps = courseData.steps.map((step: Step) => {
        const newStep = { ...step, completed: false };
        if (newStep.quiz) {
            const resetQuestions = newStep.quiz.questions.map(q => ({ ...q, userAnswer: null, isCorrect: null }));
            newStep.quiz = { ...newStep.quiz, score: null, questions: resetQuestions };
        }
        return newStep;
    });

    const data = { 
        type: 'course-share', 
        courseData: { ...courseData, steps: resetSteps }
    };

    const batch = writeBatch(db);
    friendIds.forEach(friendId => {
        const notifRef = doc(collection(db, 'users', friendId, 'notifications'));
        batch.set(notifRef, { message, createdAt: new Date().toISOString(), read: false, data });
    });

    await batch.commit();
}

export async function addSharedCourse(courseData: Omit<Course, 'id' | 'userId' | 'userName'>, userId: string, userName: string): Promise<string> {
    const newCourseData: CourseData = {
        ...courseData,
        userId,
        userName,
        isPublic: false,
        createdAt: new Date().toISOString(),
        notes: "",
    };

    return addCourse(newCourseData);
}
