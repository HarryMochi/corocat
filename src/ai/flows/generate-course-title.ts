import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateCourseTitleInputSchema = z.object({
  topic: z.string().describe('The topic of the course, which might be a full sentence.'),
});
export type GenerateCourseTitleInput = z.infer<typeof GenerateCourseTitleInputSchema>;

export const GenerateCourseTitleOutputSchema = z.object({
  title: z.string().describe('A creative and engaging title for the course.'),
});
export type GenerateCourseTitleOutput = z.infer<typeof GenerateCourseTitleOutputSchema>;


export const generateCourseTitlePrompt = ai.definePrompt({
  name: 'generateCourseTitlePrompt',
  input: { schema: GenerateCourseTitleInputSchema },
  output: { schema: GenerateCourseTitleOutputSchema },
  prompt: `You are an expert AI copywriter specializing in creating compelling course titles. The user will provide a topic or a full sentence describing what they want to learn. Your job is to transform their input into a short, catchy, and professional course title.

    The user's request is: "{{{topic}}}"

    Based on this request, generate a title that is:
    - Clear and concise.
    - Appealing and makes someone want to enroll.
    - Accurately represents the subject.

    Here are some examples:
    - User request: "i want to learn how to make french fries" -> Good title: "The Art of Perfect French Fries"
    - User request: "React" -> Good title: "React: From Beginner to Pro"
    - User request: "Mastering Next.js" -> Good title: "Mastering Next.js: Build and Deploy Modern Web Apps"

    Now, generate a single, high-quality course title based on the user's request: "{{{topic}}}"

    The output must be a single JSON object with a "title" field.`,
});