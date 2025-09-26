
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Course, Step, QuizSet } from '@/lib/types';
import { getCoursesForUser, addCourse, updateCourse, deleteCourse as deleteCourseFromDb } from '@/lib/firestore';
import { generateCourseAction, askQuestionAction, assistWithNotesAction, generateQuizAction } from '../actions';
import { useToast } from "@/hooks/use-toast";
import HistorySidebar from '@/components/history-sidebar';
import TopicSelection from '@/components/topic-selection';
import CourseDisplay from '@/components/course-display';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import type { AskStepQuestionOutput, AskStepQuestionInput } from '@/ai/flows/ask-step-question';
import type { AssistWithNotesOutput } from '@/ai/flows/assist-with-notes';
import type { GenerateFullCourseInput } from '@/ai/flows/generate-full-course';
import LearnLayout from '@/components/learn-layout';
import type { Message } from '@/components/step-workspace';
import type { GenerateStepQuizOutput } from '@/ai/flows/generate-step-quiz';


export type GenerationState = {
    status: 'idle' | 'generating' | 'done';
};

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeCourseChatHistory, setActiveCourseChatHistory] = useState<Message[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (!loading) {
        if (!user) {
            router.push('/login');
        } else if (!user.emailVerified) {
            router.push('/verify-email');
        }
    }
  }, [user, loading, router]);
  
  const fetchCourses = useCallback(async () => {
    if (user && user.emailVerified) {
      const userCourses = await getCoursesForUser(user.uid);
      setCourses(userCourses);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  const handleGenerateCourse = async (input: GenerateFullCourseInput) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a course." });
        return;
    }
    
    setGenerationState({ status: 'generating' });
    try {
      const result = await generateCourseAction(input);
      
      const steps: Step[] = result.course.map(step => {
        const newStep: Step = {
            stepNumber: step.step,
            title: step.title,
            shortTitle: step.shortTitle,
            contentBlocks: step.contentBlocks,
            completed: false,
        };

        if (step.funFact) {
            newStep.funFact = step.funFact;
        }
        if (step.externalLinks) {
            newStep.externalLinks = step.externalLinks;
        }
        
        return newStep;
      });

      if (!steps || steps.length === 0) {
        throw new Error("The AI failed to generate a course for this topic. Please try a different topic.");
      }
      
      const newCourseData = {
        topic: input.topic,
        depth: input.masteryLevel as 'Quick Overview' | 'Normal Path' | 'Long Mastery',
        outline: JSON.stringify(result.course.map(s => ({ step: s.step, title: s.title, description: s.description })), null, 2),
        steps: steps,
        notes: "",
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        isPublic: false,
      };

      const newCourseId = await addCourse(newCourseData);
      const newCourse: Course = { id: newCourseId, ...newCourseData };

      setCourses(prev => [newCourse, ...prev]);
      setActiveCourseId(newCourse.id);
      setGenerationState({ status: 'done' });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error Generating Course",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
      setGenerationState({ status: 'idle' });
    }
  };

  const handleUpdateStep = async (courseId: string, stepNumber: number, newStepData: Partial<Step>) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate) return;
    
    const updatedSteps = courseToUpdate.steps.map(step =>
        step.stepNumber === stepNumber ? { ...step, ...newStepData } : step
    );
    const updatedCourse = { ...courseToUpdate, steps: updatedSteps };
    
    setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? updatedCourse : c));

    try {
        await updateCourse(courseId, { steps: updatedSteps });
    } catch (error) {
        console.error("Error updating step in DB:", error);
        toast({ variant: "destructive", title: "Sync Error", description: "Failed to save changes."});
        // Revert UI on failure
        setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? courseToUpdate : c));
    }
  };

  const handleGenerateQuiz = async (course: Course, step: Step): Promise<GenerateStepQuizOutput> => {
    try {
        const stepContentString = step.contentBlocks?.map(b => `### ${b.type}\n${b.content}`).join('\n\n') || '';

        const result = await generateQuizAction({
            topic: course.topic,
            courseOutline: course.outline,
            stepTitle: step.title,
            stepContent: stepContentString,
        });

        if (result.quiz) {
            const newQuizSet: QuizSet = {
                questions: result.quiz.map(q => ({...q, userAnswer: null, isCorrect: null})),
                score: null,
            };
            handleUpdateStep(course.id, step.stepNumber, { quiz: newQuizSet });
        }

        return result;

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error Generating Quiz",
            description: "Could not generate a quiz for this step. Please try again.",
        });
        throw error;
    }
  };

  const handleUpdateNotes = async (courseId: string, newNotes: string) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate) return;
    
    const updatedCourse = { ...courseToUpdate, notes: newNotes };
    
    setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? updatedCourse : c));

    try {
        await updateCourse(courseId, { notes: newNotes });
    } catch (error) {
        console.error("Error updating notes in DB:", error);
        toast({ variant: "destructive", title: "Sync Error", description: "Failed to save notes."});
        // Revert UI on failure
        setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? courseToUpdate : c));
    }
  };
  
  const handleAskQuestion = async (input: AskStepQuestionInput): Promise<AskStepQuestionOutput> => {
    try {
        // Find the current step to create a summarized content string
        const activeCourseForQuestion = courses.find(c => c.topic === input.topic);
        const activeStepForQuestion = activeCourseForQuestion?.steps.find(s => s.title === input.stepTitle);
        const contentString = activeStepForQuestion?.contentBlocks?.map(b => `### ${b.type}\n${b.content}`).join('\n\n') || '';

        return await askQuestionAction({...input, stepContent: contentString });
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error Getting Answer",
            description: "Could not get an answer for this question. Please try again.",
        });
        return { answer: "Sorry, I couldn't process your question. Please try again." };
    }
  };

  const handleAssistWithNotes = async (course: Course, notes: string, request: string): Promise<AssistWithNotesOutput> => {
    try {
        return await assistWithNotesAction({
            topic: course.topic,
            notes: notes,
            request: request,
        });
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error Assisting with Notes",
            description: "Could not get an answer from the AI. Please try again.",
        });
        return { suggestion: "Sorry, I couldn't process your request. Please try again." };
    }
  }

  const handleCreateNew = () => {
    setActiveCourseId(null);
    setActiveCourseChatHistory([]);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const originalCourses = courses;
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      setActiveCourseChatHistory([]);
    }

    try {
        await deleteCourseFromDb(courseId);
    } catch (error) {
        console.error("Error deleting course from DB:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete course from database."});
        setCourses(originalCourses);
    }
  };

  const handleSelectCourse = (id: string) => {
    if (id !== activeCourseId) {
      setActiveCourseId(id);
      setActiveCourseChatHistory([]); // Reset history when switching courses
    }
  }

  if (loading || !isClient || !user || !user.emailVerified) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sidebar = (
    <HistorySidebar
      user={user}
      courses={courses}
      activeCourseId={activeCourseId}
      onSelectCourse={handleSelectCourse}
      onCreateNew={handleCreateNew}
      onDeleteCourse={handleDeleteCourse}
      onLogout={logout}
    />
  );
  
  const mainContent = activeCourse ? (
    <CourseDisplay
      key={activeCourse.id}
      course={activeCourse}
      chatHistory={activeCourseChatHistory}
      setChatHistory={setActiveCourseChatHistory}
      onUpdateStep={handleUpdateStep}
      onAskQuestion={handleAskQuestion}
      onUpdateNotes={handleUpdateNotes}
      onAssistWithNotes={handleAssistWithNotes}
      onGenerateQuiz={handleGenerateQuiz}
    />
  ) : (
    <div className="h-full flex items-center justify-center p-4 md:p-8">
      <TopicSelection
        onGenerateCourse={handleGenerateCourse}
        generationState={generationState}
      />
    </div>
  );

  return (
    <LearnLayout
      sidebar={sidebar}
      mainContent={mainContent}
    />
  );
}
