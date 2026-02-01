"use client";

import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { addCourse } from './firestore';
import type { CourseData } from './types';

export async function acceptSharedCourseClient(userId: string, notificationId: string): Promise<{ success: boolean; message: string }> {
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
        const cleanCourseData: CourseData = {
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
        await addCourse(cleanCourseData);

        // Mark notification as read
        await updateDoc(notifRef, { read: true, status: 'accepted' });

        return { success: true, message: "Course added to your library!" };
    } catch (error: any) {
        console.error("Error accepting shared course:", error);
        return { success: false, message: error.message || "Failed to accept course." };
    }
}
