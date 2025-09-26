
'use server';
/**
 * @fileOverview Answers questions about a specific course step, with full course context.
 *
 * - askStepQuestion - A function that answers a question about a step.
 * - AskStepQuestionInput - The input type for the askStepQuestion function.
 * - AskStepQuestionOutput - The return type for the askStepQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const AskStepQuestionInputSchema = z.object({
  topic: z.string().describe('The topic of the course.'),
  courseOutline: z.string().describe('The JSON string of the full course outline (titles and descriptions).'),
  stepTitle: z.string().describe('The title of the specific step the user is on.'),
  stepContent: z.string().describe('The content of the specific step the user is on.'),
  question: z.string().describe('The user\'s question about the step.'),
  history: z.array(z.object({
    role: z.enum(['user', 'bot']),
    content: z.string(),
  })).describe('The history of the conversation so far.'),
});
export type AskStepQuestionInput = z.infer<typeof AskStepQuestionInputSchema>;

const AskStepQuestionOutputSchema = z.object({
  answer: z.string().describe('A helpful and concise answer to the user\'s question.'),
});
export type AskStepQuestionOutput = z.infer<typeof AskStepQuestionOutputSchema>;

export async function askStepQuestion(input: AskStepQuestionInput): Promise<AskStepQuestionOutput> {
  return askStepQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askStepQuestionPrompt',
  input: {schema: AskStepQuestionInputSchema},
  output: {schema: AskStepQuestionOutputSchema},
  prompt: `You are an AI assistant for a learning platform. Your role is to answer user questions about the course content. You have access to the entire course outline, the content of the current step, and the conversation history.

  Here is the full course context:
  - Course Topic: {{{topic}}}
  - Full Course Outline:
  ---
  {{{courseOutline}}}
  ---

  Here is the context for the user's CURRENT step:
  - Current Step Title: {{{stepTitle}}}
  - Current Step Content:
  ---
  {{{stepContent}}}
  ---

  Here is the conversation history:
  {{#each history}}
    - {{role}}: {{content}}
  {{/each}}

  User's New Question: {{{question}}}

  Please provide a clear, concise, and helpful answer to the user's question.
  - Base your answer primarily on the provided step content.
  - You can also reference other steps from the course outline if the question is about how concepts relate.
  - If the question cannot be answered from the provided information, politely state that.
  `,
});

const askStepQuestionFlow = ai.defineFlow(
  {
    name: 'askStepQuestionFlow',
    inputSchema: AskStepQuestionInputSchema,
    outputSchema: AskStepQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-2.5-flash') });
    return output!;
  }
);
