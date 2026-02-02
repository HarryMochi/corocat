'use server';
/**
 * @fileOverview Grades a user's free-write answer for a course exercise.
 *
 * - markFreeWriteExercise - A function that provides feedback on a free-write answer.
 * - MarkFreeWriteExerciseInput - The input type for the function.
 * - MarkFreeWriteExerciseOutput - The return type for the function.
 */

import { ai, llama3Model } from '@/ai/genkit';
import { z } from 'genkit';

const MarkFreeWriteExerciseInputSchema = z.object({
  lessonContext: z.string().describe('The HTML content of the lesson the user just completed.'),
  question: z.string().describe('The free-write question that was asked.'),
  userAnswer: z.string().describe("The user's answer to the question."),
});
export type MarkFreeWriteExerciseInput = z.infer<typeof MarkFreeWriteExerciseInputSchema>;

const MarkFreeWriteExerciseOutputSchema = z.object({
  isCorrect: z.boolean().describe('A boolean indicating whether the user\'s answer is substantially correct.'),
  feedback: z.string().describe('Constructive feedback for the user. If the answer is correct, praise them. If incorrect, gently guide them toward the right answer based on the lesson context.'),
});
export type MarkFreeWriteExerciseOutput = z.infer<typeof MarkFreeWriteExerciseOutputSchema>;

export async function markFreeWriteExercise(input: MarkFreeWriteExerciseInput): Promise<MarkFreeWriteExerciseOutput> {
  return markFreeWriteExerciseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'markFreeWriteExercisePrompt',
  input: { schema: MarkFreeWriteExerciseInputSchema },
  output: { schema: MarkFreeWriteExerciseOutputSchema },
  prompt: `You are an encouraging and helpful AI teaching assistant. Your task is to evaluate a user's short free-write answer based on the lesson they just learned.

    Here is the context:
    - Lesson Content: {{{lessonContext}}}
    - Question Asked: {{{question}}}
    - User's Answer: {{{userAnswer}}}

    Your evaluation must be quick and concise. 
    1. Determine if the user's answer is correct based on the lesson content.
    2. Provide brief, constructive feedback. If they are correct, be encouraging. If they are incorrect, gently correct them and point them in the right direction without giving away the direct answer.
    
    Keep your feedback to just one or two sentences. Your tone should be supportive and friendly.`,
});

const markFreeWriteExerciseFlow = ai.defineFlow(
  {
    name: 'markFreeWriteExerciseFlow',
    inputSchema: MarkFreeWriteExerciseInputSchema,
    outputSchema: MarkFreeWriteExerciseOutputSchema,

  },
  async input => {
    // Use a faster, smaller model for this evaluation task.
    const { output } = await prompt(input, { model: llama3Model });
    return output!;
  }
);
