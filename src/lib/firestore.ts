import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, getDoc, collectionGroup, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Course, CourseData, MarketplaceCourse, CourseInvitation, CourseInvitationData, UserProfile, UserProfileData, CollaborativeCourse } from './types';
import { FirestorePermissionError, errorEmitter } from './errors';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase';

const coursesCollection = collection(db, 'courses');
const marketplaceCollection = collection(db, 'marketplaceCourses');
const invitationsCollection = collection(db, 'courseInvitations');
const userProfilesCollection = collection(db, 'userProfiles');
const collaborativeCoursesCollection = collection(db, 'collaborativeCourses');


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
      notes: courseData.notes ?? "", // Ensure notes field exists
      learningMode: courseData.learningMode ?? 'solo',
      collaborators: courseData.collaborators ?? [],
      collaboratorEmails: courseData.collaboratorEmails ?? []
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
  const refPath = `courses`; // Simplified path for error message
  try {
    // Get courses where user is owner or collaborator
    const ownerQuery = query(coursesCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const collaboratorQuery = query(coursesCollection, where('collaborators', 'array-contains', userId), orderBy('createdAt', 'desc'));
    
    const [ownerSnapshot, collaboratorSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(collaboratorQuery)
    ]);
    
    const ownerCourses = ownerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    const collaboratorCourses = collaboratorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    
    // Combine and deduplicate
    const allCourses = [...ownerCourses];
    collaboratorCourses.forEach(course => {
      if (!allCourses.find(c => c.id === course.id)) {
        allCourses.push(course);
      }
    });
    
    return allCourses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    await handleFirestoreError(error, refPath, 'list');
    throw error;
  }
}


// Get user data for profile page
export async function getUserData(userId: string) {
    const courses = await getCoursesForUser(userId);
    const userName = courses[0]?.userName;
    
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

// Get PUBLIC user data for profile page from marketplace courses
export async function getPublicProfileData(userId: string) {
    const refPath = `marketplaceCourses`;
    let userName = "Anonymous";
    let creationTime = new Date().toISOString();

    try {
        const q = query(marketplaceCollection, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const publishedCourses = querySnapshot.docs.map(doc => ({ marketplaceId: doc.id, ...doc.data() } as MarketplaceCourse));

        if (publishedCourses.length > 0) {
            userName = publishedCourses[0].userName || "Anonymous";
            // Approximate creation time from the oldest published course
            creationTime = publishedCourses.reduce((oldest, current) => 
                new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
            ).createdAt;
        }

        const coursesCompleted = publishedCourses.filter(c => c.steps.length > 0 && c.steps.every(s => s.completed)).length;
        
        // Note: We can only count PUBLISHED courses here. The total created courses is private.
        // For the profile page, this is an acceptable trade-off to avoid permission errors.
        const coursesCreated = publishedCourses.length;
        const coursesPublished = publishedCourses.length;

        return {
            displayName: userName,
            creationTime,
            coursesCreated,
            coursesCompleted,
            coursesPublished
        };

    } catch (error) {
        await handleFirestoreError(error, refPath, 'list');
        throw error;
    }
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

// User Profile Functions
export async function createUserProfile(userId: string, email: string, displayName: string): Promise<void> {
  const refPath = `userProfiles/${userId}`;
  try {
    const userProfileData: UserProfileData = {
      email,
      displayName,
      createdAt: new Date().toISOString()
    };
    const userDoc = doc(db, 'userProfiles', userId);
    await updateDoc(userDoc, userProfileData).catch(async () => {
      // If document doesn't exist, create it
      await addDoc(userProfilesCollection, { ...userProfileData, id: userId });
    });
  } catch (error) {
    await handleFirestoreError(error, refPath, 'create', { email, displayName });
  }
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const refPath = 'userProfiles';
  try {
    const q = query(userProfilesCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserProfile;
  } catch (error) {
    await handleFirestoreError(error, refPath, 'list');
    throw error;
  }
}

// Course Invitation Functions
export async function sendCourseInvitation(invitationData: CourseInvitationData): Promise<string> {
  const refPath = 'courseInvitations';
  try {
    // Check if user exists with this email
    const existingUser = await getUserByEmail(invitationData.recipientEmail);
    const finalInvitationData = {
      ...invitationData,
      recipientId: existingUser?.id || undefined
    };
    
    const docRef = await addDoc(invitationsCollection, finalInvitationData);
    return docRef.id;
  } catch (error) {
    await handleFirestoreError(error, refPath, 'create', invitationData);
    throw error;
  }
}

export async function getInvitationsForUser(userId: string): Promise<CourseInvitation[]> {
  const refPath = 'courseInvitations';
  try {
    // Get invitations by user ID or email
    const user = auth.currentUser;
    if (!user?.email) return [];
    
    const q = query(
      invitationsCollection, 
      where('recipientEmail', '==', user.email),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseInvitation));
  } catch (error) {
    await handleFirestoreError(error, refPath, 'list');
    throw error;
  }
}

export async function respondToInvitation(invitationId: string, response: 'accepted' | 'declined'): Promise<void> {
  const refPath = `courseInvitations/${invitationId}`;
  try {
    const invitationDoc = doc(db, 'courseInvitations', invitationId);
    await updateDoc(invitationDoc, {
      status: response,
      respondedAt: new Date().toISOString(),
      recipientId: auth.currentUser?.uid
    });
    
    // If accepted, add user to course collaborators
    if (response === 'accepted') {
      const invitationSnapshot = await getDoc(invitationDoc);
      if (invitationSnapshot.exists()) {
        const invitation = invitationSnapshot.data() as CourseInvitation;
        const courseDoc = doc(db, 'courses', invitation.courseId);
        await updateDoc(courseDoc, {
          collaborators: arrayUnion(auth.currentUser?.uid),
          collaboratorEmails: arrayUnion(invitation.recipientEmail)
        });
      }
    }
  } catch (error) {
    await handleFirestoreError(error, refPath, 'update', { status: response });
  }
}