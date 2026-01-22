
'use server';
/**
 * @fileOverview Generates a quiz for a single course step.
 *
 * - generateStepQuiz - A function that generates a quiz for a step.
 * - GenerateStepQuizInput - The input type for the function.
 * - GenerateStepQuizOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const GenerateStepQuizInputSchema = z.object({
  topic: z.string().describe('The topic of the course.'),
  courseOutline: z.string().describe('The JSON string of the full course outline (titles and descriptions).'),
  stepTitle: z.string().describe('The title of the specific step.'),
  stepContent: z.string().describe('The content of the specific step.'),
});
export type GenerateStepQuizInput = z.infer<typeof GenerateStepQuizInputSchema>;


const MultipleChoiceQuizSchema = z.object({
  type: z.enum(['multipleChoice']).describe("The type of quiz question."),
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('An array of possible answers. For true/false questions, this should be ["True", "False"].'),
  correctAnswerIndex: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});

const QuizSchema = MultipleChoiceQuizSchema;

const GenerateStepQuizOutputSchema = z.object({
  quiz: z.array(QuizSchema).describe('An array of 6 quiz questions to test understanding. Include exactly 4 multiple-choice questions (with 3-4 options each) and 2 true/false questions.'),
});
export type GenerateStepQuizOutput = z.infer<typeof GenerateStepQuizOutputSchema>;

export async function generateStepQuiz(input: GenerateStepQuizInput): Promise<GenerateStepQuizOutput> {
  return generateStepQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStepQuizPrompt',
  input: { schema: GenerateStepQuizInputSchema },
  output: { schema: GenerateStepQuizOutputSchema },
  prompt: `You are an AI assistant who creates quizzes. Your task is to create a quiz for a single step in an online course.

    Here is the context for the course and the step:
    - Course Topic: {{{topic}}}
    - Full Course Outline: {{{courseOutline}}}
    - Current Step Title: {{{stepTitle}}}
    - Current Step Content:
    ---
    {{{stepContent}}}
    ---

    Based on the content of the current step, please generate a "Mini Check" quiz.

    The quiz MUST contain exactly 6 questions in total:
    - 4 multiple-choice questions (with 3-4 options each).
    - 2 true/false questions. For these, the 'options' array must be exactly ["True", "False"].
    
    For each question, provide the question, options, the index of the correct answer, and a brief explanation.

    Generate the quiz now.`,
});

const generateStepQuizFlow = ai.defineFlow(
  {
    name: 'generateStepQuizFlow',
    inputSchema: GenerateStepQuizInputSchema,
    outputSchema: GenerateStepQuizOutputSchema,
  },
  async input => {
    const { output } = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    if (!output || !output.quiz || output.quiz.length < 6) {
      throw new Error('AI failed to generate a complete quiz for this step.');
    }
    return output;
  }
);
