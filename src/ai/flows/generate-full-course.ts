
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

const MultipleChoiceQuizSchema = z.object({
    type: z.enum(['multipleChoice']).describe("The type of quiz question."),
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).describe('An array of possible answers. For true/false questions, this should be ["True", "False"].'),
    correctAnswerIndex: z.number().describe('The index of the correct answer in the options array.'),
    explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});

const QuizSchema = MultipleChoiceQuizSchema;

const ExternalLinkSchema = z.object({
    title: z.string().describe('The title of the external website or resource.'),
    url: z.string().url().describe('The full URL to the external resource.'),
});

const ContentBlockSchema = z.object({
  type: z.enum(['coreConcept', 'practicalExample', 'analogy', 'keyTerm']).describe('The type of content block.'),
  content: z.string().describe('The Markdown content for this block. For a `keyTerm`, this should be in the format "Term: Definition".'),
});

const GenerateFullCourseOutputSchema = z.object({
  course: z.array(z.object({
    step: z.number().describe('The step number.'),
    title: z.string().describe('The title of the step.'),
    shortTitle: z.string().describe('A very short, 1-2 word title for the step. This will be displayed on the course path.'),
    description: z.string().describe('A brief description of what the step covers.'),
    contentBlocks: z.array(ContentBlockSchema).describe('An array of different content blocks that make up the step. You must generate a variety of blocks to make the content engaging.'),
    funFact: z.string().describe("A surprising or interesting fun fact related to the step's topic.").optional(),
    externalLinks: z.array(ExternalLinkSchema).describe('An array of 2-3 high-quality external links for further reading.').optional(),
    quiz: z.array(QuizSchema).describe('An array of 6 quiz questions to test understanding. Include exactly 4 multiple-choice questions (with 3-4 options each) and 2 true/false questions.').optional(),
  })).describe('A structured course with the specified number of steps, including all content and a quiz for each step.'),
});
export type GenerateFullCourseOutput = z.infer<typeof GenerateFullCourseOutputSchema>;

export async function generateFullCourse(input: GenerateFullCourseInput): Promise<GenerateFullCourseOutput> {
  return generateFullCourseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFullCoursePrompt',
  input: {schema: GenerateFullCourseInputSchema},
  output: {schema: GenerateFullCourseOutputSchema},
  prompt: `You are an AI course generator and expert educator. Your primary task is to create a complete, structured, and personalized course based on a topic and user preferences.

    The MOST IMPORTANT requirement is to generate a course with an appropriate number of steps based on the user's desired mastery level.
    - User's Desired Mastery Level: {{{masteryLevel}}}
    - If 'Quick Overview', generate about 5-7 steps.
    - If 'Normal Path', generate about 12-15 steps.
    - If 'Long Mastery', generate about 20-25 steps.
    The exact number is less important than providing the right level of detail for the chosen path.

    The second MOST IMPORTANT requirement is to tailor the course to the user's needs.
    - User's Current Knowledge: {{{knowledgeLevel}}}. Adjust the starting point and complexity accordingly. If they are a beginner, start with the absolute basics. If they are intermediate, you can skip introductory concepts.
    - User's Special Requests: {{{additionalComments}}}. Pay close attention to these instructions. For example, if they ask for "many practical examples," ensure the content is rich with them. If they ask to "explain it very easy," use simple language.

    The third MOST IMPORTANT requirement is the QUALITY and STRUCTURE of the content for each step.
    - Instead of a single "content" field, each step MUST have a 'contentBlocks' array.
    - This array must contain a variety of block types to make the lesson engaging and multi-faceted. DO NOT just use one type of block. Mix and match 'coreConcept', 'practicalExample', 'analogy', and 'keyTerm' blocks.
    - It is absolutely forbidden to generate short, one-sentence, or empty content for any block. Each block must be substantial and well-explained.
    - For 'practicalExample' blocks, provide code snippets (using Markdown for code fencing) or detailed real-world scenarios.
    - For 'keyTerm' blocks, use the format "Term: Definition".
    - All content within blocks MUST be well-organized. Use Markdown to structure the text with headings (#, ##), subheadings, bullet points (*), and bold text (**text**) to create a clear hierarchy and improve readability.

    For each and every step, you must generate:
    1.  A step number.
    2.  A clear and concise title.
    3.  A very short, 1-2 word title for display on the course path map.
    4.  A brief one-sentence description of the step's topic.
    5.  A 'contentBlocks' array with detailed, well-structured content using a variety of block types. DO NOT use emojis.
    6.  A surprising or interesting "Fun Fact" related to the step's content.
    7.  An array of 2-3 high-quality, real, and relevant external links for further reading.
    8.  An array of exactly 6 quiz questions for the "Mini Check". This array MUST include 4 'multipleChoice' questions (with 3-4 options) and 2 true/false questions. For true/false questions, the options array must be ["True", "False"]. Each question must be complete and adhere to its schema. If you cannot generate a complete quiz array, omit the quiz property entirely for that step.

    Your goal is to take a user from their current knowledge level to their desired level of mastery for the given topic.

    Topic: {{{topic}}}

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

    // Filter out incomplete steps to prevent schema validation errors downstream.
    const completeSteps = output.course.filter(step => step.description && step.contentBlocks && step.contentBlocks.length > 0);

    if (completeSteps.length === 0) {
      throw new Error('AI failed to generate any complete steps. Please try again.');
    }

    return { course: completeSteps };
  }
);
