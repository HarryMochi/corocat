import { ai } from '../genkit';
import { z } from 'genkit';

export const ValidateTopicInputSchema = z.object({
  topic: z.string().describe('The user-provided topic for the course.'),
});
export type ValidateTopicInput = z.infer<typeof ValidateTopicInputSchema>;

export const ValidateTopicOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the topic is appropriate for a general audience.'),
  reason: z.string().describe('A brief explanation for the decision.'),
});
export type ValidateTopicOutput = z.infer<typeof ValidateTopicOutputSchema>;

export const validateTopicPrompt = ai.definePrompt({
  name: 'validateTopicPrompt',
  input: { schema: ValidateTopicInputSchema },
  output: { schema: ValidateTopicOutputSchema },
  prompt: `You are an AI content moderator for an educational platform. Your task is to determine if a user-provided course topic is appropriate.

    A topic is INAPPROPRIATE if it falls into any of these categories:
    1.  **Harmful/Illegal Acts:** Promotes or provides instructions on criminal activities (e.g., "how to rob a bank", "making a bomb").
    2.  **NSFW/Sexually Explicit:** Contains nudity, sexually explicit content, or offensive material.
    3.  **Hate Speech:** Promotes violence, discrimination, or disparages on the basis of race, ethnicity, religion, gender, etc.
    4.  **Gibberish/Spam:** Is random, nonsensical text (e.g., "asjefjwiajf", "fjkdla; fjkdla;").
    5.  **Dangerous/Unethical:** Promotes self-harm, dangerous challenges, or unethical behavior.

    A topic is APPROPRIATE if it is a legitimate subject for education (e.g., "React", "How to make french fries", "Introduction to Quantum Physics").

    User's Topic: "{{{topic}}}"

    Analyze the topic and decide if it is appropriate.

    - If it is APPROPRIATE, set 'isAppropriate' to true and for the 'reason', write a simple confirmation like "The topic is appropriate for course generation."
    - If it is INAPPROPRIATE, set 'isAppropriate' to false and for the 'reason', provide a clear, user-facing explanation like "Your topic is inappropriate". Do not be preachy, just state the policy violation.

    The output must be a single JSON object.`,
});