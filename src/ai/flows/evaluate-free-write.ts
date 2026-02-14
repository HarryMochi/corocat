
'use server';
/**
 * @fileOverview Evaluates a user's free-write answer for a course exercise.
 *
 * - evaluateFreeWrite - A function that evaluates the user's answer.
 * - EvaluateFreeWriteInput - The input type for the function.
 * - EvaluateFreeWriteOutput - The return type for the function.
 */

import { ai, llama3Model } from '../genkit';
import { z } from 'genkit';

const EvaluateFreeWriteInputSchema = z.object({
  lessonContent: z.string().describe('The full HTML content of the lesson the user was taught.'),
  question: z.string().describe('The free-write question that was posed to the user.'),
  userAnswer: z.string().describe('The user\'s submitted answer to the question.'),
});
export type EvaluateFreeWriteInput = z.infer<typeof EvaluateFreeWriteInputSchema>;

const EvaluateFreeWriteOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s answer is fundamentally correct.'),
  feedback: z.string().describe('Constructive feedback for the user, explaining what was right and what could be improved.'),
  score: z.number().min(0).max(100).describe('A score from 0 to 100 representing the quality of the answer.'),
});
export type EvaluateFreeWriteOutput = z.infer<typeof EvaluateFreeWriteOutputSchema>;

export async function evaluateFreeWrite(input: EvaluateFreeWriteInput): Promise<EvaluateFreeWriteOutput> {
  return evaluateFreeWriteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateFreeWritePrompt',
  input: { schema: EvaluateFreeWriteInputSchema },
  output: { schema: EvaluateFreeWriteOutputSchema },
  prompt: `You are an AI teaching assistant. Your job is to evaluate a user's free-write answer based on the lesson they just learned. Be fair but thorough.

    **Lesson Content:**
    ---
    {{{lessonContent}}}
    ---

    **Question Asked:**
    "{{{question}}}"

    **User's Answer:**
    "{{{userAnswer}}}"

    **Your Task:**
    1.  **Analyze the user's answer:** Compare the user's answer to the provided lesson content. Is it accurate? Does it demonstrate understanding?
    2.  **Determine correctness:** Set 'isCorrect' to true if the answer is mostly right, false otherwise.
    3.  **Provide feedback:** Write clear, constructive feedback. If the answer is correct, praise the user and reinforce the key concepts. If it's incorrect, gently explain the misunderstanding and guide them toward the correct answer. Your feedback should be a short paragraph.
    4.  **Assign a score:** Rate the answer on a scale of 0 to 100.

    Evaluate the user's answer now.`,
});

const evaluateFreeWriteFlow = ai.defineFlow(
  {
    name: 'evaluateFreeWriteFlow',
    inputSchema: EvaluateFreeWriteInputSchema,
    outputSchema: EvaluateFreeWriteOutputSchema,
  },
  async input => {
    // Use a fast and efficient model for this evaluation task.
    const { output } = await prompt(input, { model: llama3Model });
    return output!;
  }
);
