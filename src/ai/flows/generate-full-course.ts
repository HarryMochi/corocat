'use server';
/**
 * @fileOverview Generates a complete, structured course with all step content included.
 *
 * - generateFullCourse - A function that generates a structured course outline and content.
 * - GenerateFullCourseInput - The input type for the function.
 * - GenerateFullCourseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';



const GenerateFullCourseInputSchema = z.object({
  topic: z.string().describe('The topic of the course.'),
  knowledgeLevel: z.string().describe("The user's current knowledge level (e.g., 'Beginner', 'Intermediate')."),
  masteryLevel: z.string().describe("The desired depth of the course (e.g., 'Quick Overview', 'Normal Path', 'Long Mastery')."),
  additionalComments: z.string().optional().describe('Any additional instructions or comments from the user (e.g., "focus on practical examples").'),
});
export type GenerateFullCourseInput = z.infer<typeof GenerateFullCourseInputSchema>;

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

const GenerateFullCourseOutputSchema = z.object({
  course: z.array(z.object({
    step: z.number().describe('The step number.'),
    title: z.string().describe('The title of the step.'),
    shortTitle: z.string().describe('A very short, 1-2 word title for the step.'),
    description: z.string().describe('A brief description of what the step covers.'),
    subSteps: z.array(SubStepSchema).describe('An array of 5-7 sub-steps, each with rich content and a two-part exercise.'),
    funFact: z.string().describe("A surprising or interesting fun fact related to the step's topic.").optional(),
    externalLinks: z.array(ExternalLinkSchema).describe('An array of 2-3 high-quality external links for further reading.').optional(),
  })).describe('A structured course with the specified number of steps, including all content.'),
});
export type GenerateFullCourseOutput = z.infer<typeof GenerateFullCourseOutputSchema>;

export async function generateFullCourse(input: GenerateFullCourseInput): Promise<GenerateFullCourseOutput> {
  return generateFullCourseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFullCoursePrompt',
  input: {schema: GenerateFullCourseInputSchema},
  output: {schema: GenerateFullCourseOutputSchema},
  prompt: `You are an expert AI course creator. Your task is to generate a complete, personalized course with rich, engaging content and comprehensive exercises.\n\n    The MOST IMPORTANT requirement is to generate a course with an appropriate number of steps based on the user's desired mastery level.\n    - User's Desired Mastery Level: {{{masteryLevel}}}\n    - 'Quick Overview': 5-7 steps.\n    - 'Normal Path': 12-15 steps.\n    - 'Long Mastery': 20-25 steps.\n\n    The second MOST IMPORTANT requirement is the STRUCTURE and QUALITY of each sub-step.\n    - Each step MUST have a 'subSteps' array containing 5-7 sub-steps.\n    - For EACH sub-step, you MUST generate:\n\n        1.  A short 'title' for the clickable card.\n\n        2.  Rich HTML 'content' for the lesson. This content should be very concise. Aim for about 25-50 words. It should still be visually engaging and well-structured. It MUST include:\n            - A main title using an <h2> tag.\n            - Sub-headings using <h3> tags to break up content.\n            - Paragraphs using <p> tags.\n            - Bullet points using <ul> and <li> for lists.\n            - Bolded keywords using <strong> tags.\n            - Highlighted text using <mark> tags for important definitions or concepts.\n            - At least one code block using <pre><code>...</code></pre> to showcase examples.\n            - DO NOT output a single wall of text. The content should be broken up and easy to read.\n\n        3.  A two-part 'exercise' object to test the user's knowledge on the 'content' you just generated. It MUST contain:\n            a.  'multipleChoice': A question with 3-4 options and the correct answer index.\n            b.  'trueOrFalse': A statement that is either true or false, with the correct boolean answer.\n\n    For each parent step, you must also generate:\n    - A step number, title, shortTitle, description, an optional funFact, and 2-3 externalLinks.\n
    Pay close attention to user preferences:\n    - User's Current Knowledge: {{{knowledgeLevel}}}\n    - User's Special Requests: {{{additionalComments}}}\n
    Topic: {{{topic}}}\n
    Generate a complete, high-quality, personalized course. The output must be a single JSON object.`,
});

const generateFullCourseFlow = ai.defineFlow(
  {
    name: 'generateFullCourseFlow',
    inputSchema: GenerateFullCourseInputSchema,
    outputSchema: GenerateFullCourseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-2.5-flash') });

    if (!output || !output.course || output.course.length === 0) {
        throw new Error(`AI failed to generate any steps for this topic. Please try again.`);
    }

    const completeSteps = output.course.filter(step => step.description && step.subSteps && step.subSteps.length > 0);

    if (completeSteps.length === 0) {
      throw new Error('AI failed to generate any complete steps. Please try again.');
    }

    return { course: completeSteps };
  }
);
