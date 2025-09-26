
'use server';

import { generateFullCourse, type GenerateFullCourseInput, type GenerateFullCourseOutput } from '@/ai/flows/generate-full-course';
import { askStepQuestion, type AskStepQuestionInput, type AskStepQuestionOutput } from '@/ai/flows/ask-step-question';
import { assistWithNotes, type AssistWithNotesInput, type AssistWithNotesOutput } from '@/ai/flows/assist-with-notes';
import { validateMarketplaceUpload, type ValidateMarketplaceUploadInput, type ValidateMarketplaceUploadOutput } from '@/ai/flows/validate-marketplace-upload';
import { generateStepQuiz, type GenerateStepQuizInput, type GenerateStepQuizOutput } from '@/ai/flows/generate-step-quiz';


export async function generateCourseAction(input: GenerateFullCourseInput): Promise<GenerateFullCourseOutput> {
    try {
        const result = await generateFullCourse(input);
        if (!result.course || result.course.length === 0) {
            throw new Error("The AI failed to generate a course for this topic. Please try a different topic.");
        }
        return result;
    } catch (error) {
        console.error("Error in generateCourseAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while generating the course.");
    }
}

export async function askQuestionAction(input: AskStepQuestionInput): Promise<AskStepQuestionOutput> {
    try {
        return await askStepQuestion(input);
    } catch (error) {
        console.error("Error in askQuestionAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while getting the answer.");
    }
}

export async function assistWithNotesAction(input: AssistWithNotesInput): Promise<AssistWithNotesOutput> {
    try {
        return await assistWithNotes(input);
    } catch (error) {
        console.error("Error in assistWithNotesAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while assisting with notes.");
    }
}


export async function validateMarketplaceUploadAction(input: ValidateMarketplaceUploadInput): Promise<ValidateMarketplaceUploadOutput> {
    try {
        return await validateMarketplaceUpload(input);
    } catch (error) {
        console.error("Error in validateMarketplaceUploadAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred during validation.");
    }
}

export async function generateQuizAction(input: GenerateStepQuizInput): Promise<GenerateStepQuizOutput> {
    try {
        return await generateStepQuiz(input);
    } catch (error) {
        console.error("Error in generateQuizAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while generating the quiz.");
    }
}
