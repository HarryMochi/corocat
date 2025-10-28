import { z } from 'genkit';

export const ExternalLinkSchema = z.object({
    title: z.string().describe('The title of the external website or resource.'),
    url: z.string().url().describe('The full URL to the external resource.'),
});

export const ExerciseSchema = z.object({
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

export const SubStepSchema = z.object({
  title: z.string().describe('A short title for this sub-step (for the clickable card).'),
  content: z.string().describe('Rich HTML content for the lesson, including various tags for formatting.'),
  summary: z.string().describe('A single sentence that summarizes the content of the lesson.'),
  exercise: ExerciseSchema.describe('A two-part exercise to test the user on the lesson content.'),
});

export const CourseStepSchema = z.object({
    step: z.number(),
    title: z.string(),
    shortTitle: z.string(),
    description: z.string(),
    subSteps: z.array(SubStepSchema),
    funFact: z.string().optional(),
    externalLinks: z.array(ExternalLinkSchema),
});

export const GenerateFullCourseOutputSchema = z.object({
  title: z.string(),
  course: z.array(CourseStepSchema),
});
export type GenerateFullCourseOutput = z.infer<typeof GenerateFullCourseOutputSchema>;
