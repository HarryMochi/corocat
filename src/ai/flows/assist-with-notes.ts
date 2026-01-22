'use server';
/**
 * @fileOverview Assists users with their notes for a course.
 *
 * - assistWithNotes - a function that helps with note-taking.
 * - AssistWithNotesInput - The input type for the assistWithNotes function.
 * - AssistWithNotesOutput - The return type for the assistWithNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const AssistWithNotesInputSchema = z.object({
  topic: z.string().describe('The topic of the course.'),
  notes: z.string().describe('The user\'s current notes.'),
  request: z.string().describe('The user\'s request for assistance with their notes (e.g., summarize, explain, give me ideas).'),
});
export type AssistWithNotesInput = z.infer<typeof AssistWithNotesInputSchema>;

const AssistWithNotesOutputSchema = z.object({
  suggestion: z.string().describe('A helpful suggestion or answer based on the user\'s notes and request.'),
});
export type AssistWithNotesOutput = z.infer<typeof AssistWithNotesOutputSchema>;

export async function assistWithNotes(input: AssistWithNotesInput): Promise<AssistWithNotesOutput> {
  return assistWithNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistWithNotesPrompt',
  input: { schema: AssistWithNotesInputSchema },
  output: { schema: AssistWithNotesOutputSchema },
  prompt: `You are an AI assistant for a learning platform. Your role is to help users with their notes for a course.

  Here is the context:
  - Course Topic: {{{topic}}}
  - User's Notes:
  ---
  {{{notes}}}
  ---

  User's Request: {{{request}}}

  Please provide a helpful response to the user's request. You can summarize, expand on ideas, suggest next steps, or answer questions related to the notes and the course topic. Be concise and encouraging.
  `,
});

const assistWithNotesFlow = ai.defineFlow(
  {
    name: 'assistWithNotesFlow',
    inputSchema: AssistWithNotesInputSchema,
    outputSchema: AssistWithNotesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    return output!;
  }
);
