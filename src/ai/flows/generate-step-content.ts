import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SubStepSchema, ExternalLinkSchema } from './schemas';

export const GenerateStepContentInputSchema = z.object({
  topic: z.string().describe('The overall topic of the course.'),
  outline: z.string().describe('The full course outline as a JSON string.'),
  stepTitle: z.string().describe('The title of the specific step to generate content for.'),
});
export type GenerateStepContentInput = z.infer<typeof GenerateStepContentInputSchema>;

export const GenerateStepContentOutputSchema = z.object({
    subSteps: z.array(SubStepSchema).describe('An array of up to 4 sub-steps, each with rich content and a two-part exercise.'),
    funFact: z.string().describe("A surprising or interesting fun fact related to the step's topic.").optional(),
    externalLinks: z.array(ExternalLinkSchema).describe('An array of 2-3 high-quality external links for further reading.'),
});
export type GenerateStepContentOutput = z.infer<typeof GenerateStepContentOutputSchema>;


export const generateStepContentPrompt = ai.definePrompt({
    name: 'generateStepContentPrompt',
    input: { schema: GenerateStepContentInputSchema },
    output: { schema: GenerateStepContentOutputSchema },
    prompt: `You are an expert AI course creator. Your task is to generate the detailed content for a single step within a larger course.\n\n    The overall course topic is: {{{topic}}}\n    The full course outline is: \n{{{outline}}}\n\n    You are generating content for the step titled: "{{{stepTitle}}}"\n\n    You MUST generate a 'subSteps' array containing a maximum of 4 sub-steps for the given step.\n    For EACH sub-step, you MUST generate:\n\n        1.  A short 'title'.
        2.  Rich HTML 'content' (25-50 words) with diverse tags (h2, h3, p, ul, li, strong, mark, pre, code).
        3.  A one-sentence 'summary' of the content.
        4.  A two-part 'exercise' with a 'multipleChoice' and 'trueOrFalse' question.\n\n    You must also generate an optional 'funFact' and 2-3 'externalLinks'.\n\n    Generate the content for the step "{{{stepTitle}}}". The output must be a single JSON object.`,
});