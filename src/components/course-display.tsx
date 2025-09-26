
"use client";

import { useState, useMemo } from 'react';
import type { Course, Step } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { StepList } from './step-list';
import type { AskStepQuestionInput, AskStepQuestionOutput } from '@/ai/flows/ask-step-question';
import type { AssistWithNotesOutput } from '@/ai/flows/assist-with-notes';
import { StepWorkspace, type Message } from './step-workspace';


interface CourseDisplayProps {
  course: Course;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  onUpdateStep: (courseId: string, stepNumber: number, newStepData: Partial<Step>) => void;
  onAskQuestion: (input: AskStepQuestionInput) => Promise<AskStepQuestionOutput>;
  onUpdateNotes: (courseId: string, notes: string) => void;
  onAssistWithNotes: (course: Course, notes: string, request: string) => Promise<AssistWithNotesOutput>;
  onEvaluateQuestion: (input: any) => Promise<any>; // Changed to any for now
}

export default function CourseDisplay({ 
    course, 
    chatHistory, 
    setChatHistory, 
    onUpdateStep, 
    onAskQuestion, 
    onUpdateNotes, 
    onAssistWithNotes, 
    onEvaluateQuestion 
}: CourseDisplayProps) {
  const [activeStep, setActiveStep] = useState<Step | null>(null);

  const completedSteps = useMemo(() => course.steps.filter(step => step.completed).length, [course.steps]);
  const progressPercentage = (completedSteps / course.steps.length) * 100;

  const handleStepSelect = (step: Step) => {
    setActiveStep(step);
  };

  const handleWorkspaceClose = () => {
    setActiveStep(null);
  };

  return (
    <>
      <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
        <header className="p-4 md:p-6 pb-2 md:pb-2">
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">{course.topic}</h1>
          <div className="flex items-center gap-4">
            <Progress value={progressPercentage} className="w-full h-3" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {completedSteps} / {course.steps.length} steps
            </span>
          </div>
        </header>

        <StepList 
          steps={course.steps}
          onStepSelect={handleStepSelect}
          onUpdateStep={(stepNumber, data) => onUpdateStep(course.id, stepNumber, data)}
        />
        
      </div>
      {activeStep && (
        <StepWorkspace
          course={course}
          step={activeStep}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onClose={handleWorkspaceClose}
          onUpdateStep={(data) => onUpdateStep(course.id, activeStep.stepNumber, data)}
          onAskQuestion={onAskQuestion}
          onUpdateNotes={(notes) => onUpdateNotes(course.id, notes)}
          onAssistWithNotes={onAssistWithNotes}
          onEvaluateQuestion={onEvaluateQuestion}
        />
      )}
    </>
  );
}
