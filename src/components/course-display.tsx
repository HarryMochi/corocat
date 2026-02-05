"use client";

import { useState, useMemo } from 'react';
import type { Course, Step } from '../lib/types';
import { Progress } from '../components/ui/progress';
import { StepList } from './step-list';
import type { AskStepQuestionInput, AskStepQuestionOutput } from '../ai/flows/ask-step-question';
import type { AssistWithNotesOutput } from '../ai/flows/assist-with-notes';
import { StepWorkspace, type Message } from './step-workspace';
import type { GenerateStepQuizOutput } from '../ai/flows/generate-step-quiz';
import { Button } from './ui/button';
import { Share2, Users, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

interface CourseDisplayProps {
  course: Course;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  onUpdateStep: (courseId: string, stepNumber: number, newStepData: Partial<Step>) => void;
  onAskQuestion: (input: AskStepQuestionInput) => Promise<AskStepQuestionOutput>;
  onUpdateNotes: (courseId: string, notes: string) => void;
  onAssistWithNotes: (course: Course, notes: string, request: string) => Promise<AssistWithNotesOutput>;
  onGenerateQuiz: (course: Course, step: Step) => Promise<GenerateStepQuizOutput>;
  onQuizRestart: (courseId: string, stepNumber: number) => void;
  onCourseComplete: () => void;
  onShareCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

export default function CourseDisplay({
  course,
  chatHistory,
  setChatHistory,
  onUpdateStep,
  onAskQuestion,
  onUpdateNotes,
  onAssistWithNotes,
  onGenerateQuiz,
  onQuizRestart,
  onCourseComplete,
  onShareCourse,
  onDeleteCourse
}: CourseDisplayProps) {
  const [activeStep, setActiveStep] = useState<Step | null>(null);

  const isCollaborative = course.courseMode === "Collaborative";
  const router = useRouter();
  const completedSteps = useMemo(
    () => (course.steps || []).filter(step => step.completed).length,
    [course.steps]
  );

  const progressPercentage =
    (course.steps || []).length > 0
      ? (completedSteps / (course.steps || []).length) * 100
      : 0;

  const handleStepSelect = (step: Step) => {
    setActiveStep(step);
  };

  const handleWorkspaceClose = () => {
    setActiveStep(null);
  };

  return (
    <>
      <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <header className="p-4 md:p-6 pb-2 md:pb-2">
          <div className="flex justify-between items-start mb-2">
            <h1 className="font-headline text-3xl md:text-4xl font-bold">
              {course.topic}
            </h1>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShareCourse(course)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the course "{course.topic}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteCourse(course.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Progress ONLY for SOLO */}
          {!isCollaborative && (
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="w-full h-3" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {completedSteps} / {(course.steps || []).length} steps
              </span>
            </div>
          )}
        </header>

        {/* COLLABORATIVE MODE */}
        {isCollaborative ? (
          <div className="flex-1 flex items-center justify-center">
            <Button size="lg" className="flex items-center gap-2" onClick={() => router.push(`/whiteboard/${course.id}`)}>
              <Users className="h-5 w-5" />
              Realtime Whiteboard
            </Button>
          </div>
        ) : (
          /* SOLO MODE */
          <StepList
            steps={course.steps || []}
            onStepSelect={handleStepSelect}
            onUpdateStep={(stepNumber, data) =>
              onUpdateStep(course.id, stepNumber, data)
            }
            onCourseComplete={onCourseComplete}
          />
        )}
      </div>

      {/* Workspace */}
      {activeStep && !isCollaborative && (
        <StepWorkspace
          course={course}
          step={activeStep}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onClose={handleWorkspaceClose}
          onUpdateStep={(data) =>
            onUpdateStep(course.id, activeStep.stepNumber, data)
          }
          onAskQuestion={onAskQuestion}
          onUpdateNotes={(notes) => onUpdateNotes(course.id, notes)}
          onAssistWithNotes={onAssistWithNotes}
          onGenerateQuiz={onGenerateQuiz}
          onQuizRestart={() =>
            onQuizRestart(course.id, activeStep.stepNumber)
          }
        />
      )}
    </>
  );
}
