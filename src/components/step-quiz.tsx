
"use client";

import { useState, useEffect } from "react";
import type { Quiz, QuizSet, MultipleChoiceQuestion } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, XCircle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";

interface StepQuizProps {
  quizSet: QuizSet | undefined;
  onQuizUpdate: (newQuizData: QuizSet) => void;
  onGenerateQuiz: () => Promise<void>;
  onQuizRestart: () => void;
}

export function StepQuiz({ quizSet, onQuizUpdate, onGenerateQuiz, onQuizRestart }: StepQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(quizSet?.score !== null && quizSet?.score !== undefined);
  const [localQuestions, setLocalQuestions] = useState<Quiz[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Deep copy to avoid direct mutation of props
    setLocalQuestions(quizSet ? JSON.parse(JSON.stringify(quizSet.questions)) : []);
    setShowResults(quizSet?.score !== null && quizSet?.score !== undefined);
    setCurrentQuestionIndex(0);
  }, [quizSet]);
  
  const handleGenerateClick = async () => {
      setIsGenerating(true);
      try {
          await onGenerateQuiz();
      } catch (e) {
          // Error is handled by parent, just stop loading state
      } finally {
          setIsGenerating(false);
      }
  }

  if (!quizSet) {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 min-h-[300px]">
            <h3 className="text-2xl font-bold font-headline">Mini Check</h3>
            <p className="text-muted-foreground">Test your knowledge of this step.</p>
            <Button onClick={handleGenerateClick} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Quiz
            </Button>
        </div>
    )
  }

  if (localQuestions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-6">
        There is no quiz for this step.
      </div>
    );
  }

  const activeQuestion = localQuestions[currentQuestionIndex] as MultipleChoiceQuestion; // We only have MCQs now
  const isQuestionAnswered = activeQuestion.userAnswer !== null;

  const handleAnswerSelect = (answer: string | number) => {
    if (isQuestionAnswered) return;

    const newQuestions = [...localQuestions];
    const currentQuestion = newQuestions[currentQuestionIndex] as MultipleChoiceQuestion;

    currentQuestion.userAnswer = answer;
    currentQuestion.isCorrect = currentQuestion.correctAnswerIndex === answer;
    
    setLocalQuestions(newQuestions);
  };
  
  const handleTryAgain = () => {
    onQuizRestart();
  }
  
  const handleFinish = () => {
    const correctAnswers = localQuestions.filter(q => q.isCorrect).length;
    const score = (correctAnswers / localQuestions.length) * 100;
    const updatedQuizSet = { ...quizSet, questions: localQuestions, score }; 
    onQuizUpdate(updatedQuizSet);
    setShowResults(true);
  };

  const progress = ((currentQuestionIndex + 1) / localQuestions.length) * 100;
  
  if (showResults) {
    const correctAnswers = localQuestions.filter(q => q.isCorrect).length;
    const totalQuestions = localQuestions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h3 className="text-2xl font-bold font-headline">Mini Check Complete!</h3>
            <p className="text-muted-foreground">You scored {score.toFixed(0)}% ({correctAnswers}/{totalQuestions})</p>
            <Button onClick={handleTryAgain}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
            </Button>
        </div>
    )
  }

  const renderMultipleChoice = (question: MultipleChoiceQuestion) => {
    const selectedAnswer = question.userAnswer as number | null;
    const isAnswered = selectedAnswer !== null;

    return (
        <>
            <p className="font-medium text-base">{question.question}</p>
            <RadioGroup
              value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
              onValueChange={(val) => handleAnswerSelect(Number(val))}
              disabled={isAnswered}
              key={currentQuestionIndex} 
            >
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = question.correctAnswerIndex === index;
                return (
                    <Label 
                        key={index} 
                        className={cn(
                            "flex items-center space-x-3 p-3 border rounded-md transition-all cursor-pointer",
                             "hover:bg-muted",
                            isAnswered && !isSelected && "opacity-50",
                            isAnswered && isCorrectOption && "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
                            isAnswered && !isCorrectOption && isSelected && "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
                        )}
                    >
                        <RadioGroupItem value={index.toString()} id={`q-option-${index}`} />
                        <span>{option}</span>
                         {isAnswered && isCorrectOption && <CheckCircle2 className="h-5 w-5 ml-auto text-green-600" />}
                        {isAnswered && !isCorrectOption && isSelected && <XCircle className="h-5 w-5 ml-auto text-red-600" />}
                    </Label>
                )
              })}
            </RadioGroup>
        </>
    )
  }

  const renderFeedback = (question: Quiz) => {
      let explanation;
      let isCorrect;
      
      if (question.type === 'multipleChoice') {
        explanation = question.explanation;
        isCorrect = question.isCorrect;
      }
      
      if (isCorrect === null) return null;

      return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-md w-full animate-fade-in-up", 
            isCorrect ? 'bg-green-100/50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-100/50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        )}>
            {isCorrect ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <XCircle className="h-5 w-5 mt-0.5" />}
            <div className="flex flex-col">
                <span className="font-semibold">{isCorrect ? 'Correct!' : 'Not quite.'}</span>
                <p className="text-sm">{explanation}</p>
            </div>
      </div>
      )
  }


  return (
    <Card className="shadow-none border-none bg-transparent">
        <CardHeader>
            <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg font-headline">Mini Check</CardTitle>
                <span className="text-sm text-muted-foreground font-medium">
                    {currentQuestionIndex + 1} / {localQuestions.length}
                </span>
            </div>
            <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-4 min-h-[300px]">
            {renderMultipleChoice(activeQuestion)}
            {activeQuestion.isCorrect !== null && renderFeedback(activeQuestion)}
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button 
                variant="outline"
                onClick={() => setCurrentQuestionIndex(i => i - 1)}
                disabled={currentQuestionIndex === 0}
            >
                <ChevronLeft className="mr-2" />
                Previous
            </Button>

            {currentQuestionIndex < localQuestions.length - 1 ? (
                <Button 
                    onClick={() => setCurrentQuestionIndex(i => i + 1)}
                    disabled={activeQuestion.isCorrect === null}
                >
                    Next
                    <ChevronRight className="ml-2" />
                </Button>
            ) : (
                <Button 
                    onClick={handleFinish}
                    disabled={activeQuestion.isCorrect === null}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                    Finish Quiz
                </Button>
            )}
        </CardFooter>
    </Card>
  );
}
