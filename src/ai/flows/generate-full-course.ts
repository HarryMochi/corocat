
'use server';
/**
 * @fileOverview Validates the topic, then generates a title, outline, and content for a complete course.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  GenerateCourseOutlineInputSchema,
  generateCourseOutlinePrompt,
  GenerateCourseOutlineOutputSchema
} from './generate-course-outline';
import {
  GenerateStepContentInputSchema,
  generateStepContentPrompt,
  GenerateStepContentOutputSchema
} from './generate-step-content';
import {
  GenerateCourseTitleInputSchema,
  generateCourseTitlePrompt,
  GenerateCourseTitleOutputSchema
} from './generate-course-title';
import {
  ValidateTopicInputSchema,
  validateTopicPrompt,
  ValidateTopicOutputSchema
} from './validate-topic';
import { GenerateFullCourseOutput, GenerateFullCourseOutputSchema } from './schemas';
import { GenerateCourseOutlineInput } from './generate-course-outline';

// Flow to validate the user's topic
const validateTopicFlow = ai.defineFlow(
  {
    name: 'validateTopicFlow',
    inputSchema: ValidateTopicInputSchema,
    outputSchema: ValidateTopicOutputSchema,
  },
  async (input) => {
    const { output } = await validateTopicPrompt(input, { model: googleAI.model('gemini-2.5-flash') });
    if (!output) {
      throw new Error('AI failed to validate the topic.');
    }
    return output;
  }
);

// Flow to generate the course title
const generateCourseTitleFlow = ai.defineFlow(
  {
    name: 'generateCourseTitleFlow',
    inputSchema: GenerateCourseTitleInputSchema,
    outputSchema: GenerateCourseTitleOutputSchema,
  },
  async (input) => {
    const { output } = await generateCourseTitlePrompt(input, { model: googleAI.model('gemini-2.5-flash') });
    if (!output || !output.title) {
      throw new Error('AI failed to generate a course title.');
    }
    return output;
  }
);

// Flow to generate the outline
const generateCourseOutlineFlow = ai.defineFlow(
  {
    name: 'generateCourseOutlineFlow',
    inputSchema: GenerateCourseOutlineInputSchema,
    outputSchema: GenerateCourseOutlineOutputSchema,
  },
  async (input) => {
    const { output } = await generateCourseOutlinePrompt(input, { model: googleAI.model('gemini-2.5-flash') });
    if (!output || !output.outline || output.outline.length === 0) {
      throw new Error('AI failed to generate a course outline.');
    }
    return output;
  }
);

// Flow to generate content for a single step
const generateStepContentFlow = ai.defineFlow(
  {
    name: 'generateStepContentFlow',
    inputSchema: GenerateStepContentInputSchema,
    outputSchema: GenerateStepContentOutputSchema,
  },
  async (input) => {
    const { output } = await generateStepContentPrompt(input, { model: googleAI.model('gemini-2.5-flash') });
    if (!output || !output.subSteps || output.subSteps.length === 0) {
        console.error(`AI failed to generate content for step: ${input.stepTitle}`);
        return { subSteps: [] }; 
    }
    return output;
  }
);

// Main flow that orchestrates the entire process
const generateFullCourseFlow = ai.defineFlow(
  {
    name: 'generateFullCourseFlow',
    inputSchema: GenerateCourseOutlineInputSchema,
    outputSchema: GenerateFullCourseOutputSchema,
  },
  async (input) => {
    // 1. Validate the topic first
    const validationResponse = await validateTopicFlow(input);
    if (!validationResponse.isAppropriate) {
      throw new Error(`TOPIC_VALIDATION_FAILED: ${validationResponse.reason}`);
    }

    // 2. Generate the title first
    const titleResponse = await generateCourseTitleFlow(input);
    const { title } = titleResponse;

    // 3. Generate the outline using the newly generated title for better context
    const outlineResponse = await generateCourseOutlineFlow({ ...input, topic: title });
    const { outline } = outlineResponse;

    // 4. Stringify the outline for the next step
    const outlineString = JSON.stringify(outlineResponse);

    // 5. Create promises for generating each step's content in parallel, using the *new title*
    const contentPromises = outline.map(step =>
      generateStepContentFlow({
        topic: title, // CORRECTED: Use the generated title here
        outline: outlineString,
        stepTitle: step.title,
      })
    );

    // 6. Execute all content generation promises
    const resolvedContent = await Promise.all(contentPromises);

    // 7. Combine the outline with the generated content
    const course = outline.map((step, index) => ({
      ...step,
      ...resolvedContent[index],
    }));

    // 8. Filter out any failed steps
    const completeCourse = course.filter(step => step.subSteps && step.subSteps.length > 0);

    if (completeCourse.length === 0) {
        throw new Error('AI failed to generate content for any of the course steps. Please try again.');
    }

    return { title, course: completeCourse };
  }
);

export async function generateFullCourse(input: GenerateCourseOutlineInput): Promise<GenerateFullCourseOutput> {
  return generateFullCourseFlow(input);
}
