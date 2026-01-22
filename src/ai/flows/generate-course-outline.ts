/**
 * @fileOverview Generates a course outline based on user input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateCourseOutlineInputSchema = z.object({
  topic: z.string().describe('The topic of the course.'),
  knowledgeLevel: z.string().describe("The user's current knowledge level (e.g., 'Beginner', 'Intermediate')."),
  masteryLevel: z.string().describe("The desired depth of the course (e.g., 'Quick Overview', 'Normal Path')."),
  additionalComments: z.string().optional().describe('Any additional instructions or comments from the user.'),
});
export type GenerateCourseOutlineInput = z.infer<typeof GenerateCourseOutlineInputSchema>;

export const GenerateCourseOutlineOutputSchema = z.object({
  outline: z.array(z.object({
    step: z.number().describe('The step number.'),
    title: z.string().describe('The title of the step.'),
    shortTitle: z.string().describe('A very short, 1-2 word title for the step.'),
    description: z.string().describe('A brief description of what the step covers.'),
  })).describe('A structured course outline with the specified number of steps.'),
});
export type GenerateCourseOutlineOutput = z.infer<typeof GenerateCourseOutlineOutputSchema>;


export const generateCourseOutlinePrompt = ai.definePrompt({
  name: 'generateCourseOutlinePrompt',
  input: { schema: GenerateCourseOutlineInputSchema },
  output: { schema: GenerateCourseOutlineOutputSchema },
  prompt: `You are an expert AI course creator. Your task is to generate a structured course outline.\n\n    The MOST IMPORTANT requirement is to generate an outline with an appropriate number of steps based on the user's desired mastery level.\n    - User's Desired Mastery Level: {{{masteryLevel}}}\n    - 'Quick Overview': 5-7 steps.\n    - 'Normal Path': 12-15 steps.\n\n    For each step, you MUST generate:\n    - A step number.\n    - A descriptive title.\n    - A very short, 1-2 word title for navigation.\n    - A brief description of what the step covers.\n\n    Pay close attention to user preferences:\n    - User's Current Knowledge: {{{knowledgeLevel}}}\n    - User's Special Requests: {{{additionalComments}}}\n
    Topic: {{{topic}}}\n
    Generate a complete, high-quality, personalized course outline. The output must be a single JSON object.`,
});