'use server';

import { z } from 'zod';
import { validateTopicPrompt } from '@/ai/flows/validate-topic';
import { generateCourseTitlePrompt } from '@/ai/flows/generate-course-title';
import { generateCourseOutlinePrompt } from '@/ai/flows/generate-course-outline';
import { generateStepContentPrompt } from '@/ai/flows/generate-step-content';
import type { CourseData, Step } from '@/lib/types';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';

const model = googleAI.model('gemini-2.5-flash');

// Action to validate the course topic
export async function validateTopicAction({ topic }: { topic: string }) {
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
  course: any;
  masteryLevel: string;
  userId: string;
  userName: string;
}): Promise<CourseData> {

  const { title, course, masteryLevel, userId, userName } = data;

  const steps: Step[] = course.map((step: any, index: number) => ({
    stepNumber: index + 1,
    title: step.title,
    shortTitle: step.shortTitle,
    description: step.description,
    subSteps: step.subSteps,
    completed: false,
  }));

  const newCourseData: CourseData = {
    topic: title,
    depth: masteryLevel,
    outline: JSON.stringify(course.map((s: any) => ({ step: s.step, title: s.title, description: s.description })), null, 2),
    steps: steps,
    notes: "",
    createdAt: new Date().toISOString(),
    userId: userId,
    userName: userName,
    isPublic: false,
  };

  return newCourseData;
}
