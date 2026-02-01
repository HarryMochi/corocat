'use server';

import { generateFullCourse, type GenerateFullCourseInput, type GenerateFullCourseOutput } from '@/ai/flows/generate-full-course';
import { askStepQuestion, type AskStepQuestionInput, type AskStepQuestionOutput } from '@/ai/flows/ask-step-question';
import { assistWithNotes, type AssistWithNotesInput, type AssistWithNotesOutput } from '@/ai/flows/assist-with-notes';
import { generateStepQuiz, type GenerateStepQuizInput, type GenerateStepQuizOutput } from '@/ai/flows/generate-step-quiz';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    sendFriendRequest as sendFriendRequestFb,
    acceptFriendRequest as acceptFriendRequestFb,
    rejectFriendRequest as rejectFriendRequestFb,
    removeFriend as removeFriendFb,
    getFriendRequests as getFriendRequestsFb,
    getFriends as getFriendsFb,
    updateUserProfile as updateUserProfileFb,
    acceptSharedCourse as acceptSharedCourseFb,
    deleteNotification as deleteNotificationFb,
} from '@/lib/firebase';
import {
    addDoc, collection, query, where, getDocs, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserByEmail } from '@/lib/firebase'


const execAsync = promisify(exec);

export async function generateCourseAction(input: GenerateFullCourseInput): Promise<GenerateFullCourseOutput> {
    try {
        const result = await generateFullCourse(input);
        if (!result.course || result.course.length === 0) {
            throw new Error("The AI failed to generate a course for this topic. Please try a different topic.");
        }
        return result;
    } catch (error) {
        console.error("Error in generateCourseAction:", error);
        if (error instanceof Error) {
            // Check for the specific validation error
            if (error.message.startsWith('TOPIC_VALIDATION_FAILED:')) {
                throw new Error('Your topic is inappropriate');
            }
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while generating the course.");
    }
}

export async function askQuestionAction(input: AskStepQuestionInput): Promise<AskStepQuestionOutput> {
    try {
        return await askStepQuestion(input);
    } catch (error) {
        console.error("Error in askQuestionAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while getting the answer.");
    }
}

export async function assistWithNotesAction(input: AssistWithNotesInput): Promise<AssistWithNotesOutput> {
    try {
        return await assistWithNotes(input);
    } catch (error) {
        console.error("Error in assistWithNotesAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while assisting with notes.");
    }
}

export async function generateQuizAction(input: GenerateStepQuizInput): Promise<GenerateStepQuizOutput> {
    try {
        return await generateStepQuiz(input);
    } catch (error) {
        console.error("Error in generateQuizAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while generating the quiz.");
    }
}

export async function executeCodeAction(code: string): Promise<{ output: string, error?: string }> {
    const filePath = '/tmp/code.js';
    try {
        await fs.writeFile(filePath, code);
        const { stdout, stderr } = await execAsync(`node ${filePath}`);
        if (stderr) {
            return { output: '', error: stderr };
        }
        return { output: stdout };
    } catch (error: any) {
        return { output: '', error: error.message };
    } finally {
        await fs.unlink(filePath);
    }
}



export async function acceptFriendRequest(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
        return await acceptFriendRequestFb(notificationId);
    } catch (error) {
        console.error("Error in acceptFriendRequest:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "An unknown error occurred." };
    }
}

export async function rejectFriendRequest(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
        return await rejectFriendRequestFb(notificationId);
    } catch (error) {
        console.error("Error in rejectFriendRequest:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "An unknown error occurred." };
    }
}

export async function removeFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    try {
        return await removeFriendFb(userId, friendId);
    } catch (error) {
        console.error("Error in removeFriend:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "An unknown error occurred." };
    }
}

export async function getFriendRequests(userId: string): Promise<any[]> {
    try {
        return await getFriendRequestsFb(userId);
    } catch (error) {
        console.error("Error in getFriendRequests:", error);
        return [];
    }
}

export async function getFriends(userId: string): Promise<any[]> {
    try {
        return await getFriendsFb(userId);
    } catch (error) {
        console.error("Error in getFriends:", error);
        return [];
    }
}

export async function updateUserProfile(userId: string, data: { displayName?: string; photoURL?: string; }): Promise<{ success: boolean, message: string }> {
    try {
        return await updateUserProfileFb(userId, data);
    } catch (error: any) {
        console.error("Error in updateUserProfile action:", error);
        return { success: false, message: error.message || "An unknown error occurred." };
    }
}

export async function acceptSharedCourse(userId: string, notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
        const { acceptSharedCourse: acceptSharedCourseFs } = await import('@/lib/firestore');
        return await acceptSharedCourseFs(userId, notificationId);
    } catch (error) {
        console.error("Error accepting shared course:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "An unknown error occurred while accepting the course." };
    }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean, message: string }> {
    try {
        await deleteNotificationFb(notificationId);
        return { success: true, message: "Notification deleted successfully." };
    } catch (error) {
        console.error("Error deleting notification:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "An unknown error occurred." };
    }
}
