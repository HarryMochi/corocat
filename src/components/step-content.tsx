
'use client';

import React, { useState, useMemo } from 'react';
import type { Step, SubStep } from '@/lib/types';
import { Loader2, X, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface StepContentProps {
    step?: Step;
}

function ExerciseDisplay({ subStep }: { subStep: SubStep }) {
    const [multipleChoiceAnswer, setMultipleChoiceAnswer] = useState<string | undefined>(undefined);
    const [trueOrFalseAnswer, setTrueOrFalseAnswer] = useState<string | undefined>(undefined);
    const [showWarning, setShowWarning] = useState(false);

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (multipleChoiceAnswer === undefined || trueOrFalseAnswer === undefined) {
            setShowWarning(true);
            return;
        }
        setShowWarning(false);
        setIsSubmitted(true);
    };

    const isMcCorrect = useMemo(() => {
        if (!isSubmitted) return false;
        return multipleChoiceAnswer === subStep.exercise.multipleChoice.options[subStep.exercise.multipleChoice.correctAnswerIndex];
    }, [isSubmitted, multipleChoiceAnswer, subStep.exercise.multipleChoice]);

    const isTfCorrect = useMemo(() => {
        if (!isSubmitted) return false;
        return trueOrFalseAnswer === subStep.exercise.trueOrFalse.correctAnswer.toString();
    }, [isSubmitted, trueOrFalseAnswer, subStep.exercise.trueOrFalse]);


    return (
        <div className="p-8 md:p-12 space-y-8">
            <h3 className="text-2xl font-bold mb-8">Exercise</h3>
            {showWarning && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Please answer all questions before submitting.
                    </AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader><h4 className="font-semibold text-lg">1. Multiple Choice</h4></CardHeader>
                <CardContent className="space-y-4">
                    <p>{subStep.exercise.multipleChoice.question}</p>
                    <RadioGroup value={multipleChoiceAnswer} onValueChange={setMultipleChoiceAnswer} disabled={isSubmitted}>
                        {subStep.exercise.multipleChoice.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`mc-option-${index}`} />
                                <Label htmlFor={`mc-option-${index}`}>{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                {isSubmitted && (
                    <CardFooter>
                        {isMcCorrect ? (
                            <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Correct!</p>
                        ) : (
                            <p className="text-sm text-red-600 flex items-center gap-2"><XCircle className="h-4 w-4" /> Incorrect. The correct answer was: {subStep.exercise.multipleChoice.options[subStep.exercise.multipleChoice.correctAnswerIndex]}</p>
                        )}
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader><h4 className="font-semibold text-lg">2. True or False</h4></CardHeader>
                <CardContent className="space-y-4">
                    <p>{subStep.exercise.trueOrFalse.question}</p>
                    <RadioGroup value={trueOrFalseAnswer} onValueChange={setTrueOrFalseAnswer} disabled={isSubmitted}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="true" id="tf-true" /><Label htmlFor="tf-true">True</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="false" id="tf-false" /><Label htmlFor="tf-false">False</Label></div>
                    </RadioGroup>
                </CardContent>
                {isSubmitted && (
                    <CardFooter>
                        {isTfCorrect ? (
                            <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Correct!</p>
                        ) : (
                            <p className="text-sm text-red-600 flex items-center gap-2"><XCircle className="h-4 w-4" /> Incorrect. The correct answer was: {subStep.exercise.trueOrFalse.correctAnswer.toString()}</p>
                        )}
                    </CardFooter>
                )}
            </Card>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isSubmitted} size="lg">
                    {isSubmitted ? 'Submitted' : 'Submit Answers'}
                </Button>
            </div>
        </div>
    );
}

export function StepContent({ step }: StepContentProps) {
    const [activeSubStepIndex, setActiveSubStepIndex] = useState<number | null>(null);

    if (!step) {
        return (
            <div className="flex items-center justify-center space-x-2 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (!step.subSteps || step.subSteps.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                This step has no content. Regenerate the course to see content.
            </div>
        );
    }
    
    const handleNext = () => {
        if (activeSubStepIndex !== null && activeSubStepIndex < step.subSteps.length - 1) {
            setActiveSubStepIndex(prev => prev! + 1);
        }
    };

    const handlePrevious = () => {
        if (activeSubStepIndex !== null && activeSubStepIndex > 0) {
            setActiveSubStepIndex(prev => prev! - 1);
        }
    };

    const activeSubStep = activeSubStepIndex !== null ? step.subSteps[activeSubStepIndex] : null;

    return (
        <div className="w-full">
            {step.subSteps.map((subStep, index) => (
                <div key={index} className="flex gap-x-6">
                    {/* Timeline Column */}
                    <div className="flex flex-col items-center">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-primary/50" />
                        </div>
                        {index < step.subSteps.length - 1 && (
                            <div className="w-px flex-grow border-l-2 border-dashed border-border" />
                        )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 pt-0 pb-10">
                         <button 
                            onClick={() => setActiveSubStepIndex(index)}
                            className="w-full text-left p-6 rounded-xl border bg-background hover:bg-muted/50 transition-colors flex items-center justify-between gap-4 shadow-sm -mt-1"
                        >
                            <div>
                                <h3 className="font-semibold text-lg">{subStep.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">Section {index + 1} of {step.subSteps.length}</p>
                            </div>
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            ))}

            <Dialog open={activeSubStepIndex !== null} onOpenChange={(isOpen) => !isOpen && setActiveSubStepIndex(null)}>
                {activeSubStep && (
                    <DialogContent hideClose className="max-w-full w-full h-screen flex flex-col p-0 gap-0 data-[state=open]:animate-none data-[state=closed]:animate-none !rounded-none">
                        <div className="p-4 border-b flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-xl font-semibold">{activeSubStep.title}</h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setActiveSubStepIndex(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex-1 grid md:grid-cols-2 min-h-0">
                           <div className="bg-background overflow-y-auto min-w-0 hide-scrollbar">
                                <div
                                    className="prose prose-lg dark:prose-invert max-w-none p-12 md:p-16"
                                    dangerouslySetInnerHTML={{ __html: activeSubStep.content }}
                                />
                            </div>
                            <div className="bg-muted/30 border-l overflow-y-auto min-w-0 hide-scrollbar">
                                <ExerciseDisplay subStep={activeSubStep} />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-between items-center">
                            <Button variant="outline" onClick={handlePrevious} disabled={activeSubStepIndex === 0}>
                                Previous
                            </Button>
                            {activeSubStepIndex === step.subSteps.length - 1 ? (
                                <Button onClick={() => setActiveSubStepIndex(null)} size="lg">
                                    Return to Step
                                </Button>
                            ) : (
                                <Button onClick={handleNext}>
                                    Next
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
