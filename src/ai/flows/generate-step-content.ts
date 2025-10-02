
'use server';
/**
 * @fileOverview Generates the detailed content for a single step in a course.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const StepContentInputSchema = z.object({
  topic: z.string().describe('The topic of the course.'),
  courseOutline: z.string().describe('The full course outline as a JSON string.'),
  stepTitle: z.string().describe('The title of the step to generate content for.'),
  knowledgeLevel: z.string().describe("The user's current knowledge level."),
});
export type StepContentInput = z.infer<typeof StepContentInputSchema>;

const ExternalLinkSchema = z.object({
    title: z.string().describe('The title of the external website or resource.'),
    url: z.string().url().describe('The full URL to the external resource.'),
});

const ExerciseSchema = z.object({
    multipleChoice: z.object({
        question: z.string().describe('The multiple-choice question.'),
        options: z.array(z.string()).describe('An array of 3-4 possible answers.'),
        correctAnswerIndex: z.number().describe('The index of the correct answer in the options array.'),
    }).describe('A multiple-choice question to test understanding.'),
    trueOrFalse: z.object({
        question: z.string().describe('The true or false statement.'),
        correctAnswer: z.boolean().describe('Whether the statement is true or false.'),
    }).describe('A true or false question to test a key concept.'),
});

const SubStepSchema = z.object({
  title: z.string().describe('A short title for this sub-step (for the clickable card).'),
  content: z.string().describe('Rich HTML content for the lesson, including various tags for formatting.'),
  exercise: ExerciseSchema.describe('A two-part exercise to test the user on the lesson content.'),
});

const StepContentOutputSchema = z.object({
    subSteps: z.array(SubStepSchema).describe('An array of 5-7 sub-steps, each with rich content and a two-part exercise.'),
    funFact: z.string().describe("A surprising or interesting fun fact related to the step's topic.").optional(),
    externalLinks: z.array(ExternalLinkSchema).describe('An array of 2-3 high-quality external links for further reading.').optional(),
});
export type StepContentOutput = z.infer<typeof StepContentOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateStepContentPrompt',
  input: {schema: StepContentInputSchema},
  output: {schema: StepContentOutputSchema},
  prompt: `You are an expert AI course creator. Your task is to generate the detailed content for a single step of a course, based on the provided topic, outline, and user preferences.\n\n    The MOST IMPORTANT requirement is the STRUCTURE and QUALITY of each sub-step.\n    - You MUST generate a 'subSteps' array containing 5-7 sub-steps for the given step.\n    - For EACH sub-step, you MUST generate:\n\n        1.  A short 'title' for the clickable card.\n
        2.  Rich HTML 'content' for the lesson. This content should be very concise, about a quarter of the word count as before. Aim for about 25-50 words. It should still be visually engaging and well-structured. It MUST include:\n            - A main title using an <h2> tag.\n            - Sub-headings using <h3> tags to break up content.\n            - Paragraphs using <p> tags.\n            - Bullet points using <ul> and <li> for lists.\n            - Bolded keywords using <strong> tags.\n            - Highlighted text using <mark> tags for important definitions or concepts.\n            - At least one code block using <pre><code>...</code></pre> to showcase examples.\n            - DO NOT output a single wall of text. The content should be broken up and easy to read.\n
        3.  A two-part 'exercise' object to test the user's knowledge on the 'content' you just generated. It MUST contain:\n            a.  'multipleChoice': A question with 3-4 options and the correct answer index.\n            b.  'trueOrFalse': A statement that is either true or false, with the correct boolean answer.\n
    You must also generate an optional 'funFact' and 2-3 'externalLinks' for the parent step.\n
    Course Topic: {{{topic}}}\n    User Knowledge Level: {{{knowledgeLevel}}}\n    Full Course Outline: {{{courseOutline}}}\n\n    Generate content for this step ONLY: {{{stepTitle}}}\n\n    Generate the complete, high-quality content for this single step. The output must be a single JSON object.`,
});

export const generateStepContentFlow = ai.defineFlow(
  {
    name: 'generateStepContentFlow',
    inputSchema: StepContentInputSchema,
    outputSchema: StepContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-2.5-flash') });

    if (!output || !output.subSteps || output.subSteps.length === 0) {
        throw new Error(`AI failed to generate content for the step: ${input.stepTitle}`);
    }

    return output;
  }
);
