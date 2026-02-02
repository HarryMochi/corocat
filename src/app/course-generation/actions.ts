'use server';

import { z } from 'zod';
import { validateTopicPrompt } from '@/ai/flows/validate-topic';
import { generateCourseTitlePrompt } from '@/ai/flows/generate-course-title';
import { generateCourseOutlinePrompt } from '@/ai/flows/generate-course-outline';
import { generateStepContentPrompt } from '@/ai/flows/generate-step-content';
import type { CourseData, Step, User } from '@/lib/types';
import { ai, llama3Model as model } from '@/ai/genkit';
import { checkWhiteboardLimit } from '@/lib/limits';
import { FieldValue } from 'firebase-admin/firestore';

import { adminDb } from '@/lib/admin';
import { checkCourseLimit } from '@/lib/limits';

// Action to validate the course topic
export async function validateTopicAction({ topic, userId }: { topic: string; userId?: string }) {
  // 1. Check Limits (Server-Side Enforcement)
  if (userId) {
    try {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        // Construct a User-like object for the limit checker
        const userObj = { ...userData, uid: userId } as any;
        const check = checkCourseLimit(userObj);

        if (!check.allowed) {
          throw new Error(`Plan limit reached! You can create ${check.limit} courses per hour. Upgrade to Premium.`);
        }
      }
    } catch (error: any) {
      if (error.message.startsWith('Plan limit')) {
        throw error; // Re-throw limit errors
      }
      console.warn("Server-side limit check skipped due to configuration or network:", error);
      // Fail-open for missing admin config, but log it.
    }
  }

  const { output } = await validateTopicPrompt({ topic }, { model });

  if (!output) {
    throw new Error('The AI failed to validate the topic.');
  }

  if (output.isAppropriate === false) {
    throw new Error(output.reason || 'This topic is not suitable for a course.');
  }
  return output;
}

// Action to generate the course title
export async function generateCourseTitleAction({ topic }: { topic: string }) {
  const { output } = await generateCourseTitlePrompt({ topic }, { model });
  return output;
}

// Action to generate the course outline
export async function generateCourseOutlineAction(input: {
  topic: string;
  masteryLevel: string;
  knowledgeLevel: string;
  additionalComments?: string;
}) {
  const { output } = await generateCourseOutlinePrompt(input, { model });
  return output;
}

// Action to generate content for a single step
export async function generateStepContentAction(input: {
  topic: string;
  outline: string;
  stepTitle: string;
}) {
  const { output } = await generateStepContentPrompt(input, { model });
  return output;
}

// Action to prepare the generated course for saving
export async function prepareCourseForSaving(data: {
  title: string;
  course: any[];
  masteryLevel: string;
  userId: string;
  userName: string;
  courseMode: 'Solo' | 'Collaborative';
  invitedFriends: User[];
}): Promise<CourseData> {

  const {
    title,
    course,
    masteryLevel,
    userId,
    userName,
    courseMode,
    invitedFriends,
  } = data;

  const steps =
    courseMode === 'Collaborative'
      ? []
      : course.map((step: any, index: number) => ({
        stepNumber: index + 1,
        title: step.title,
        shortTitle: step.shortTitle,
        description: step.description,
        subSteps: step.subSteps,
        completed: false,
      }));

  return {
    topic: title,
    depth: masteryLevel as CourseData['depth'],
    courseMode,
    invitedFriends: courseMode === 'Collaborative' ? invitedFriends : [],
    outline:
      courseMode === 'Collaborative'
        ? undefined
        : JSON.stringify(
          course.map((s: any) => ({
            step: s.step,
            title: s.title,
            description: s.description,
          })),
        ),
    steps,
    notes: '',
    createdAt: new Date().toISOString(),
    userId,
    userName,
    isPublic: courseMode === 'Collaborative',
  };
}

// Action to create a collaborative course (Whiteboard) with backend limit enforcement
export async function createCollaborativeCourse(data: {
  title: string;
  userId: string;
  userName: string;
  invitedFriends: User[];
  masteryLevel: string;
}): Promise<string> {
  const { title, userId, userName, invitedFriends, masteryLevel } = data;

  // 1. Check Whiteboard Limit
  const userRef = adminDb.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found.');
  }

  const userData = userDoc.data();
  // Construct User-like object
  const userObj = { ...userData, uid: userId } as any;
  // We need to ensure limits exist on the object for valid check, or fallback in logic
  const currentCount = userObj.limits?.whiteboardsCreatedTotal || 0;

  const check = checkWhiteboardLimit(userObj, currentCount);

  if (!check.allowed) {
    throw new Error(`Whiteboard limit reached! You have used ${currentCount} / ${check.limit} whiteboards. Upgrade to Premium for more.`);
  }

  // 2. Prepare Code
  const newCourseData = {
    topic: title,
    depth: masteryLevel,
    courseMode: 'Collaborative',
    invitedFriends: invitedFriends,
    steps: [],
    notes: '',
    createdAt: new Date().toISOString(),
    userId,
    userName,
    isPublic: true, // Collaborative usually public or shared
  };

  // 3. Create Course
  const courseRef = await adminDb.collection('courses').add(newCourseData);

  // 4. Update Limit Counters
  await userRef.update({
    'limits.whiteboardsCreatedTotal': FieldValue.increment(1),
    'limits.lastWhiteboardCreatedAt': new Date().toISOString()
  });

  return courseRef.id;
}

