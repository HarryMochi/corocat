
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { marketplaceCategories } from '@/lib/marketplace-categories';

const availableCategories = marketplaceCategories.map(c => c.id).join(', ');

const ValidateMarketplaceUploadInputSchema = z.object({
  courseTopic: z.string().describe('The topic of the course being uploaded.'),
  courseOutline: z.string().describe('The JSON string of the full course outline (titles and descriptions.'),
});
export type ValidateMarketplaceUploadInput = z.infer<typeof ValidateMarketplaceUploadInputSchema>;

const ValidateMarketplaceUploadOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the course is appropriate for any of our categories.'),
  category: z.string().optional().describe(`If appropriate, the best-fit category ID from the available list.`),
  reason: z.string().describe('A brief and clear explanation for the decision. If not appropriate, explain why and suggest what the user could do to make it appropriate.'),
});
export type ValidateMarketplaceUploadOutput = z.infer<typeof ValidateMarketplaceUploadOutputSchema>;

export async function validateMarketplaceUpload(input: ValidateMarketplaceUploadInput): Promise<ValidateMarketplaceUploadOutput> {
  return validateMarketplaceUploadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateMarketplaceUploadPrompt',
  input: { schema: ValidateMarketplaceUploadInputSchema },
  output: { schema: ValidateMarketplaceUploadOutputSchema },
  prompt: `You are an expert content curator for an online learning marketplace. Your job is to determine the best category for a user-submitted course.

  Here are the available categories: ${availableCategories}

  Here is the course information:
  - Course Topic: {{{courseTopic}}}
  - Course Outline:
  ---
  {{{courseOutline}}}
  ---

  Analyze the course topic and outline.
  1.  Determine if the course is a good fit for ANY of the available categories.
  2.  If it is a good fit, set 'isAppropriate' to true, and set the 'category' field to the most suitable category ID from the list.
  3.  If it is not a good fit for any category, set 'isAppropriate' to false and do not set the 'category' field.
  4.  Provide a clear, concise reason for your decision.
      - If it IS appropriate, say something like: "This course is a great fit for the [Category Name] category."
      - If it is NOT appropriate, explain why. For example: "This course content does not seem to align with any of our available categories like Technology, Health, or Arts."
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
    const { output } = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    return output!;
  }
);
