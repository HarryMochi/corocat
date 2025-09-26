
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, getDoc, collectionGroup, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Course, CourseData, MarketplaceCourse } from './types';
import { FirestorePermissionError, errorEmitter } from './errors';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase';

const coursesCollection = collection(db, 'courses');
const marketplaceCollection = collection(db, 'marketplaceCourses');


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
    // Re-throw other errors
    throw error;
}

// Create
export async function addCourse(courseData: CourseData): Promise<string> {
  const refPath = 'courses';
  try {
    const docRef = await addDoc(coursesCollection, {
      ...courseData,
      notes: courseData.notes ?? "" // Ensure notes field exists
    });
    return docRef.id;
  } catch (error) {
    await handleFirestoreError(error, refPath, 'create', courseData);
    // The line below will not be reached if an error is thrown, but is required for type safety
    throw error;
  }
}

// Read
export async function getCoursesForUser(userId: string): Promise<Course[]> {
  const refPath = `users/${userId}/courses`;
  try {
    const q = query(coursesCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error) {
    await handleFirestoreError(error, refPath, 'list');
    throw error;
  }
}

// Get user data for profile page
export async function getUserData(userId: string) {
    const courses = await getCoursesForUser(userId);
    // This is a bit of a hack, we're finding the user info from one of their courses
    // In a real app, you might have a separate 'users' collection
    const userName = courses[0]?.userName;
    
    // We can't get user creation date from client-side Firestore queries directly.
    // So we'll find the oldest course and use its creation date as an approximation.
    const creationTime = courses.length > 0 
        ? courses.reduce((oldest, current) => 
            new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
          ).createdAt
        : new Date().toISOString();
    
    const displayName = userName || "Anonymous";

    return {
        displayName,
        creationTime,
        courses
    };
}

// Update
export async function updateCourse(courseId: string, updates: Partial<CourseData>): Promise<void> {
  const refPath = `courses/${courseId}`;
  try {
    const courseDoc = doc(db, 'courses', courseId);
    await updateDoc(courseDoc, updates);
  } catch (error) {
    await handleFirestoreError(error, refPath, 'update', updates);
  }
}

// Delete
export async function deleteCourse(courseId: string): Promise<void> {
  const refPath = `courses/${courseId}`;
  try {
    const courseDoc = doc(db, 'courses', courseId);
    await deleteDoc(courseDoc);
  } catch (error) {
    await handleFirestoreError(error, refPath, 'delete');
  }
}


// Marketplace Functions
export async function addCourseToMarketplace(course: Course, category: string): Promise<string> {
    const refPath = 'marketplaceCourses';
    const marketplaceCourse: Omit<MarketplaceCourse, 'marketplaceId'> = {
        ...course,
        userName: course.userName || "Community Creator",
        originalCourseId: course.id,
        category: category,
        isPublic: true,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
    };
    try {
        const docRef = await addDoc(marketplaceCollection, marketplaceCourse);
        // Also mark the original course as public
        await updateCourse(course.id, { isPublic: true });
        return docRef.id;
    } catch (error) {
        await handleFirestoreError(error, refPath, 'create', marketplaceCourse);
        throw error;
    }
}

export async function getMarketplaceCourses(category: string): Promise<MarketplaceCourse[]> {
    const refPath = `marketplaceCourses (category: ${category})`;
    try {
        const q = query(marketplaceCollection, where('category', '==', category));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ marketplaceId: doc.id, ...doc.data() } as MarketplaceCourse));
    } catch (error) {
        await handleFirestoreError(error, refPath, 'list');
        throw error;
    }
}

export async function getAllMarketplaceCourses(): Promise<MarketplaceCourse[]> {
    const refPath = 'marketplaceCourses';
    try {
        const querySnapshot = await getDocs(marketplaceCollection);
        return querySnapshot.docs.map(doc => ({ marketplaceId: doc.id, ...doc.data() } as MarketplaceCourse));
    } catch (error) {
        await handleFirestoreError(error, refPath, 'list');
        throw error;
    }
}


export async function addCourseFromMarketplace(course: MarketplaceCourse, userId: string, userName: string): Promise<string> {
    const { marketplaceId, originalCourseId, ...courseData } = course;

    const newCourseData: CourseData = {
        ...courseData,
        userId,
        userName,
        isPublic: false, // It's a private copy for the new user
        createdAt: new Date().toISOString(),
    };

    return addCourse(newCourseData);
}

export async function toggleLikeOnMarketplaceCourse(courseId: string, userId: string): Promise<void> {
    const refPath = `marketplaceCourses/${courseId}`;
    const courseRef = doc(db, "marketplaceCourses", courseId);

    try {
        await runTransaction(db, async (transaction) => {
            const courseDoc = await transaction.get(courseRef);
            if (!courseDoc.exists()) {
                throw "Document does not exist!";
            }

            const data = courseDoc.data();
            const likedBy = data.likedBy || [];
            let newLikes = data.likes || 0;

            if (likedBy.includes(userId)) {
                // User has already liked, so unlike
                transaction.update(courseRef, {
                    likes: Math.max(0, newLikes - 1),
                    likedBy: arrayRemove(userId)
                });
            } else {
                // User has not liked, so like
                transaction.update(courseRef, {
                    likes: newLikes + 1,
                    likedBy: arrayUnion(userId)
                });
            }
        });
    } catch (error) {
        await handleFirestoreError(error, refPath, 'update', { userId });
    }
}
