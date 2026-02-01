
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, getDoc, collectionGroup, runTransaction, arrayUnion, arrayRemove, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { Course, CourseData, MarketplaceCourse, Step, User } from './types';
import { FirestorePermissionError } from './server-errors';
import { FirebaseError } from 'firebase/app';

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
    const docRef = await addDoc(
      collection(db, 'courses'),
      { ...courseData, notes: courseData.notes ?? "" }
    );
    return docRef.id;
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'permission-denied' || error.code === 'unauthenticated')
    ) {
      throw new FirestorePermissionError(
        `Firestore permission denied for operation 'create' on path '${refPath}'.`,
        refPath,
        'create',
        courseData
      );
    }
    throw error;
  }
}


export async function getCoursesForUser(userId: string): Promise<Course[]> {
  const refPath = 'courses';

  try {
    /* 1️⃣ Courses owned by user */
    const ownedQuery = query(
      collection(db, 'courses'),
      where('userId', '==', userId)
    );

    /* 2️⃣ Fetch collaborative courses (filter later) */
    const collaborativeQuery = query(
      collection(db, 'courses'),
      where('courseMode', '==', 'Collaborative')
    );

    const [ownedSnap, collabSnap] = await Promise.all([
      getDocs(ownedQuery),
      getDocs(collaborativeQuery),
    ]);

    /* 3️⃣ Filter collaborative courses by invitedFriends (User[]) */
    const collaborativeDocs = collabSnap.docs.filter(doc => {
      const data = doc.data();
      return (
        Array.isArray(data.invitedFriends) &&
        data.invitedFriends.some((friend: User) => friend.uid === userId)
      );
    });

    /* 4️⃣ Merge & remove duplicates */
    const allDocs = [...ownedSnap.docs, ...collaborativeDocs];

    const unique = new Map<string, any>();
    allDocs.forEach(doc => unique.set(doc.id, doc));

    /* 5️⃣ Normalize data */
    return Array.from(unique.values()).map(doc => {
      const data = doc.data();

      return {
        ...data,
        id: doc.id,
        createdAt: toISOString(data.createdAt),
      } as Course;
    });

  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'permission-denied' || error.code === 'unauthenticated')
    ) {
      throw new FirestorePermissionError(
        `Firestore permission denied for operation 'list' on path '${refPath}'.`,
        refPath,
        'list'
      );
    }
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
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'get' on path '${refPath}'.`, refPath, 'get');
    }
    throw error;
  }
}

export async function getCourseByTopic(topic: string): Promise<Course | null> {
  const refPath = `courses`;
  try {
    const q = query(collection(db, "courses"), where("topic", "==", topic));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      return { ...data, id: docSnap.id, createdAt: toISOString(data.createdAt) } as Course;
    }
    return null;
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'get' on path '${refPath}'.`, refPath, 'get');
    }
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
      photoURL: userData.photoURL || null,
      creationTime: toISOString(userData.creationTime),
      activeCourses: 0, coursesCompleted: 0, coursesPublished: publishedCourses.length,
      aboutMe: userData.aboutMe || '',
      socials: userData.socials || {},
      favoriteCourses: userData.favoriteCourses || [],
      friends: userData.friends || [],
    };
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'get' on path '${refPath}'.`, refPath, 'get');
    }
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: { [key: string]: any }
): Promise<{ message: string; success: boolean }> {
  const refPath = `users/${userId}`;
  try {
    await updateDoc(doc(db, "users", userId), updates);
    return { message: "Successfully Updated The Field!", success: true };
  } catch (error: any) {
    if (
      error instanceof FirebaseError &&
      (error.code === "permission-denied" || error.code === "unauthenticated")
    ) {
      throw new Error(
        `Firestore permission denied for operation 'update' on path '${refPath}'.`
      );
    }
    throw error;
  }
}

export async function updateCourse(courseId: string, updates: Partial<CourseData>): Promise<void> {
  const refPath = `courses/${courseId}`;
  try {
    await updateDoc(doc(db, 'courses', courseId), updates);
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'update' on path '${refPath}'.`, refPath, 'update', updates);
    }
    throw error;
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  const refPath = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'delete' on path '${refPath}'.`, refPath, 'delete');
    }
    throw error;
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
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'create' on path '${refPath}'.`, refPath, 'create', marketplaceCourse);
    }
    throw error;
  }
}
export async function addNotification(userId: string, message: string, type: string, data?: any): Promise<void> {
  const refPath = `users/${userId}/notifications`;
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), { message, createdAt: new Date().toISOString(), read: false, type: type });
  } catch (error) {
    console.error("Failed to add notification:", error);
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
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'list' on path '${refPath}'.`, refPath, 'list');
    }
    throw error;
  }
}

export async function getAllMarketplaceCourses(): Promise<MarketplaceCourse[]> {
  const refPath = 'marketplaceCourses';
  try {
    const querySnapshot = await getDocs(collection(db, 'marketplaceCourses'));
    return querySnapshot.docs.map(processMarketplaceDoc);
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'list' on path '${refPath}'.`, refPath, 'list');
    }
    throw error;
  }
}

export async function addCourseFromMarketplace(course: MarketplaceCourse, userId: string, userName: string): Promise<string> {
  const { marketplaceId, originalCourseId, ...courseData } = course;
  const resetSteps = (courseData.steps || []).map((step: Step) => {
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
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'update' on path '${refPath}'.`, refPath, 'update', { userId });
    }
    throw error;
  }
}

export async function sendFriendRequest(fromId: string, toId: string): Promise<void> {
  const refPath = 'friendRequests';

  try {
    if (fromId === toId) throw new Error("You cannot send a friend request to yourself.");

    const fromUserDoc = await getDoc(doc(db, 'users', fromId));
    if (!fromUserDoc.exists()) throw new Error("Could not find your user data.");
    const fromData = fromUserDoc.data();

    const requestQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', fromId),
      where('to', '==', toId)
    );
    const requestSnapshot = await getDocs(requestQuery);
    if (!requestSnapshot.empty) throw new Error("Friend request already sent.");

    await addDoc(collection(db, 'friendRequests'), {
      from: fromId, to: toId,
      fromData: { displayName: fromData.displayName || 'Anonymous', photoURL: fromData.photoURL || null },
      status: 'pending', createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'create' on path '${refPath}'.`, refPath, 'create');
    }
    throw error;
  }
}

export function getFriendRequests(userId: string, callback: (requests: any[]) => void): () => void {
  const refPath = 'friendRequests';
  console.log("This is the userid", userId)
  const q = query(collection(db, 'friendRequests'), where('to', '==', userId), where('status', '==', 'pending'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(requests);
  }, (error) => {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'list' on path '${refPath}'.`, refPath, 'list');
    }
    throw error;
  });
  return unsubscribe;
}

export function getFriends(userId: string, callback: (friends: any[]) => void): () => void {
  const refPath = `users/${userId}/friends`;

  const q = collection(db, 'users', userId, 'friends');
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const friends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(friends);
  }, (error) => {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'list' on path '${refPath}'.`, refPath, 'list');
    }
    throw error;
  });
  return unsubscribe;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, "friendRequests", requestId);

  try {
    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) throw new Error("Friend request not found.");

      const { from, to } = requestSnap.data();

      // ---- Fetch sender (fromUser) ----
      const fromUserRef = doc(db, "users", from);
      const fromUserSnap = await transaction.get(fromUserRef);
      if (!fromUserSnap.exists()) throw new Error("Sender user not found.");
      const fromData = fromUserSnap.data();

      // ---- Fetch receiver (toUser) ----
      const toUserRef = doc(db, "users", to);
      const toUserSnap = await transaction.get(toUserRef);
      if (!toUserSnap.exists()) throw new Error("Your user data not found.");
      const toData = toUserSnap.data();

      const toName = toData.displayName || "Anonymous";

      // ---- Add each other as friends ----
      transaction.set(doc(db, "users", from, "friends", to), {
        displayName: toData.displayName || "Anonymous",
        photoURL: toData.photoURL || null,
      });

      transaction.set(doc(db, "users", to, "friends", from), {
        displayName: fromData.displayName || "Anonymous",
        photoURL: fromData.photoURL || null,
      });

      // ---- Delete pending request ----
      transaction.delete(requestRef);

      // ======================================================
      // 🔥 CREATE NOTIFICATION FOR "from" USER
      // ======================================================
      const notifRef = doc(
        db,
        "users",
        from,
        "notifications",
        requestId
      );

      transaction.set(notifRef, {
        id: requestId,
        type: "friend_request_accepted",
        fromUserId: to,                          // who accepted the request
        fromUserName: toName,                    // receiver’s name
        fromUserAvatar: toData.photoURL || null, // receiver’s avatar
        message: `${toName} accepted your friend request.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      // ======================================================

      return toName;
    });

  } catch (error) {
    console.error(error);
    throw error;
  }
}



export async function rejectFriendRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, "friendRequests", requestId);

  try {
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error("Friend request not found.");

    const { from, to } = requestSnap.data();

    // Fetch receiver (the one rejecting)
    const toUserSnap = await getDoc(doc(db, "users", to));
    if (!toUserSnap.exists()) throw new Error("Could not find your user data.");

    const toData = toUserSnap.data();
    const toName = toData.displayName || "Anonymous";


    await deleteDoc(requestRef);


    const notificationsRef = collection(db, "users", from, "notifications");


    await addDoc(notificationsRef, {
      id: requestId,
      type: "friend_request_rejected",
      fromUserId: to,
      fromUserName: toName,
      fromUserAvatar: toData.photoURL || null,
      message: `${toName} rejected your friend request.`,
      isRead: false,
      createdAt: serverTimestamp(),
    });

  } catch (error) {
    console.error(error);
    throw error;
  }
}


export async function removeFriend(userId: string, friendId: string): Promise<void> {
  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (!userSnap.exists()) throw new Error("User not found");

    const userData = userSnap.data();
    const userName = userData.displayName || "Anonymous";


    const userFriendRef = doc(db, "users", userId, "friends", friendId);
    const friendUserRef = doc(db, "users", friendId, "friends", userId);

    await runTransaction(db, async (transaction) => {
      const userFriendSnap = await transaction.get(userFriendRef);
      const friendUserSnap = await transaction.get(friendUserRef);

      // Remove from both friend lists
      if (userFriendSnap.exists()) {
        transaction.delete(userFriendRef);
      }
      if (friendUserSnap.exists()) {
        transaction.delete(friendUserRef);
      }


      const notifRef = collection(db, "users", friendId, "notifications");

      transaction.set(doc(notifRef), {
        type: "friend_removed",
        fromUserId: userId,
        fromUserName: userName,
        fromUserAvatar: userData.photoURL || null,
        message: `${userName} removed you as a friend.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

    });

  } catch (error) {
    console.error(error);
    throw error;
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
  }, (error) => {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'list' on path '${refPath}'.`, refPath, 'list');
    }
    throw error;
  });
  return unsubscribe;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const refPath = `users/${userId}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
  } catch (error) {
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'update' on path '${refPath}'.`, refPath, 'update');
    }
    throw error;
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
    if (error instanceof FirebaseError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
      throw new FirestorePermissionError(`Firestore permission denied for operation 'update' on path '${refPath}'.`, refPath, 'update');
    }
    throw error;
  }
}

// Course Sharing
export async function shareCourseWithFriends(course: Course, friendIds: string[], fromUser: { uid: string, displayName: string | null, photoURL?: string | null }) {
  const message = `${fromUser.displayName || 'A friend'} shared a course with you: "${course.topic}"`;
  const { id, userId, userName, ...courseData } = course;

  const resetSteps = (courseData.steps || []).map((step: Step) => {
    const newStep = { ...step, completed: false };
    if (newStep.quiz) {
      const resetQuestions = newStep.quiz.questions.map(q => ({ ...q, userAnswer: null, isCorrect: null }));
      newStep.quiz = { ...newStep.quiz, score: null, questions: resetQuestions };
    }
    return newStep;
  });

  const batch = writeBatch(db);
  friendIds.forEach(friendId => {
    const notifRef = doc(collection(db, 'users', friendId, 'notifications'));
    batch.set(notifRef, {
      message,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'course_shared',
      fromUserId: fromUser.uid,
      fromUserName: fromUser.displayName || 'Anonymous',
      fromUserAvatar: fromUser.photoURL || null,
      relatedEntityId: course.id,
      relatedEntityName: course.topic,
      data: {
        courseData: { ...courseData, steps: resetSteps }
      }
    });
  });

  await batch.commit();
}

export async function acceptSharedCourse(userId: string, notificationId: string): Promise<{ success: boolean; message: string }> {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    const notifSnap = await getDoc(notifRef);

    if (!notifSnap.exists()) {
      throw new Error("Notification not found.");
    }

    const notifData = notifSnap.data();
    if (notifData.type !== 'course_shared' || !notifData.data?.courseData) {
      throw new Error("Invalid notification type for course acceptance.");
    }

    const courseData = notifData.data.courseData;
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userName = userSnap.exists() ? (userSnap.data().displayName || 'Anonymous') : 'Anonymous';

    // Ensure all data is properly serialized
    const cleanCourseData = {
      topic: courseData.topic || 'Untitled Course',
      depth: courseData.depth || 'Normal Path',
      courseMode: courseData.courseMode || 'Solo',
      invitedFriends: courseData.invitedFriends || [],
      outline: courseData.outline || undefined,
      steps: courseData.steps || [],
      notes: "",
      isPublic: false,
      userId,
      userName,
      createdAt: new Date().toISOString(),
    };

    // Create the new course for the user
    const newCourseData: CourseData = cleanCourseData as CourseData;

    const courseId = await addCourse(newCourseData);

    // Mark notification as read
    await updateDoc(notifRef, { read: true, status: 'accepted' });

    return { success: true, message: "Course added to your library!" };
  } catch (error: any) {
    console.error("Error accepting shared course:", error);
    return { success: false, message: error.message || "Failed to accept course." };
  }
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