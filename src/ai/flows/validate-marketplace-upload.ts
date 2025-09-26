
'use server';
/**
 * @fileOverview Validates if a user's course is appropriate for a given marketplace category.
 *
 * - validateMarketplaceUpload - A function that validates a course for a marketplace category.
 * - ValidateMarketplaceUploadInput - The input type for the function.
 * - ValidateMarketplaceUploadOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ValidateMarketplaceUploadInputSchema = z.object({
  courseTopic: z.string().describe('The topic of the course being uploaded.'),
  courseOutline: z.string().describe('The JSON string of the full course outline (titles and descriptions).'),
  targetCategory: z.string().describe('The marketplace category the user wants to upload to (e.g., "Technology", "Math").'),
});
export type ValidateMarketplaceUploadInput = z.infer<typeof ValidateMarketplaceUploadInputSchema>;

const ValidateMarketplaceUploadOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the course is appropriate for the target category.'),
  reason: z.string().describe('A brief and clear explanation for the decision. If not appropriate, explain why and suggest a better category if possible.'),
});
export type ValidateMarketplaceUploadOutput = z.infer<typeof ValidateMarketplaceUploadOutputSchema>;

export async function validateMarketplaceUpload(input: ValidateMarketplaceUploadInput): Promise<ValidateMarketplaceUploadOutput> {
  return validateMarketplaceUploadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateMarketplaceUploadPrompt',
  input: {schema: ValidateMarketplaceUploadInputSchema},
  output: {schema: ValidateMarketplaceUploadOutputSchema},
  prompt: `You are an expert content curator for an online learning marketplace. Your job is to determine if a user-submitted course is a good fit for a specific category.

  Here is the course information:
  - Course Topic: {{{courseTopic}}}
  - Course Outline:
  ---
  {{{courseOutline}}}
  ---

  The user wants to upload this course to the following category: **{{{targetCategory}}}**

  Analyze the course topic and outline.
  1.  Decide if the course is appropriate and relevant for the specified category.
  2.  Set the 'isAppropriate' field to true or false.
  3.  Provide a clear, concise reason for your decision.
      - If it IS appropriate, say something like: "This course is a great fit for the {{{targetCategory}}} category."
      - If it is NOT appropriate, explain why. For example: "This course on 'React Native' is more about mobile development and would be a better fit for a 'Mobile Development' or 'Programming' category rather than 'Web Design'."
      - Be polite and helpful in your reasoning.
  `,
});

const validateMarketplaceUploadFlow = ai.defineFlow(
  {
    name: 'validateMarketplaceUploadFlow',
    inputSchema: ValidateMarketplaceUploadInputSchema,
    outputSchema: ValidateMarketplaceUploadOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-2.5-flash') });
    return output!;
  }
);
