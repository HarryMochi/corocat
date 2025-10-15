import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SubStepSchema, ExternalLinkSchema } from './schemas';

export const GenerateStepContentInputSchema = z.object({
  topic: z.string().describe('The overall topic of the course.'),
  // Changed to accept a stringified version of the outline
  outline: z.string().describe('The full course outline as a JSON string.'),
  stepTitle: z.string().describe('The title of the specific step to generate content for.'),
});
export type GenerateStepContentInput = z.infer<typeof GenerateStepContentInputSchema>;

export const GenerateStepContentOutputSchema = z.object({
    subSteps: z.array(SubStepSchema).describe('An array of 5-7 sub-steps, each with rich content and a two-part exercise.'),
    funFact: z.string().describe("A surprising or interesting fun fact related to the step's topic.").optional(),
    externalLinks: z.array(ExternalLinkSchema).describe('An array of 2-3 high-quality external links for further reading.').optional(),
});
export type GenerateStepContentOutput = z.infer<typeof GenerateStepContentOutputSchema>;


export const generateStepContentPrompt = ai.definePrompt({
    name: 'generateStepContentPrompt',
    input: { schema: GenerateStepContentInputSchema },
    output: { schema: GenerateStepContentOutputSchema },
    // Fixed the prompt to use a simple variable for the outline.
    prompt: `You are an expert AI course creator. Your task is to generate the detailed content for a single step within a larger course.\n\n    The overall course topic is: {{{topic}}}\n    The full course outline is: \n{{{outline}}}\n\n    You are generating content for the step titled: "{{{stepTitle}}}"\n\n    The MOST IMPORTANT requirement is the STRUCTURE and QUALITY of the sub-steps.\n    - You MUST generate a 'subSteps' array containing 5-7 sub-steps for the given step.\n    - For EACH sub-step, you MUST generate:\n\n        1.  A short 'title' for the clickable card.\n\n        2.  Rich HTML 'content' for the lesson. This content should be very concise. Aim for about 25-50 words. It should still be visually engaging and well-structured. It MUST include:\n            - A main title using an <h2> tag.\n            - Sub-headings using <h3> tags to break up content.\n            - Paragraphs using <p> tags.\n            - Bullet points using <ul> and <li> for lists.\n            - Bolded keywords using <strong> tags.\n            - Highlighted text using <mark> tags for important definitions or concepts.\n            - At least one code block using <pre><code>...</code></pre> to showcase examples.\n            - DO NOT output a single wall of text. The content should be broken up and easy to read.\n\n        3.  A two-part 'exercise' object to test the user's knowledge on the 'content' you just generated. It MUST contain:\n            a.  'multipleChoice': A question with 3-4 options and the correct answer index.\n            b.  'trueOrFalse': A statement that is either true or false, with the correct boolean answer.\n\n    You must also generate:\n    - An optional 'funFact' related to the step's topic.\n    - 2-3 'externalLinks' for further reading.\n
    Generate the content for the step "{{{stepTitle}}}". The output must be a single JSON object.`,
});
