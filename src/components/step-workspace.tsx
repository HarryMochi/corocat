
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Course, Step, QuizSet } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { X, Bot, Notebook, BookOpen, Loader2, Send, User, CheckCircle, Puzzle } from "lucide-react";
import { StepContent } from "./step-content";
import { StepExtras } from "./step-extras";
import { StepQuiz } from "./step-quiz";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import type { AskStepQuestionInput, AskStepQuestionOutput } from "@/ai/flows/ask-step-question";
import type { AssistWithNotesOutput } from "@/ai/flows/assist-with-notes";
import NotesDisplay from "./notes-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "./ui/separator";
import type { GenerateStepQuizOutput } from "@/ai/flows/generate-step-quiz";

interface AiChatProps {
    course: Course;
    step: Step;
    history: Message[];
    setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
    onAskQuestion: (input: AskStepQuestionInput) => Promise<AskStepQuestionOutput>;
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

function AiChat({ course, step, history, setHistory, onAskQuestion }: AiChatProps) {
    const [inputValue, setInputValue] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (history.length === 0) {
            setHistory([
                { id: 'initial', role: 'bot', content: `Hi! I'm your AI assistant. Ask me anything about "${step.title}" or the course in general.` }
            ]);
        }
    }, [step.title, history.length, setHistory]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [history]);

    const handleAsk = async () => {
        if (!inputValue.trim() || isAsking) return;

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: inputValue,
        };
        
        const newMessages: Message[] = [...history, userMessage];
        setHistory(newMessages);
        setInputValue("");
        setIsAsking(true);

        try {
            const stepContentString = step.contentBlocks?.map(b => `Type: ${b.type}\nContent: ${b.content}`).join('\n---\n') || '';

            const result = await onAskQuestion({
                topic: course.topic,
                courseOutline: course.outline,
                stepTitle: step.title,
                stepContent: stepContentString,
                question: inputValue,
                history: newMessages.map(m => ({ role: m.role, content: m.content })),
            });
            const botMessage: Message = {
                id: `msg_${Date.now()}_bot`,
                role: 'bot',
                content: result.answer,
            };
            setHistory(prev => [...prev, botMessage]);
        } finally {
            setIsAsking(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAsk();
        }
    };

    return (
        <div className="h-full flex flex-col bg-muted/50">
            
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="space-y-4 p-4">
                    {history.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : ''
                        }`}
                    >
                        {message.role === 'bot' && (
                        <div className="bg-primary rounded-full p-2">
                            <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                        )}
                        <div
                        className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            message.role === 'user'
                            ? 'bg-background'
                            : 'bg-muted-foreground/20 text-foreground'
                        }`}
                        >
                        {message.content}
                        </div>
                        {message.role === 'user' && (
                        <div className="bg-accent rounded-full p-2">
                            <User className="h-5 w-5 text-accent-foreground" />
                        </div>
                        )}
                    </div>
                    ))}
                    {isAsking && (
                        <div className="flex items-start gap-3">
                            <div className="bg-primary rounded-full p-2">
                                <Bot className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="bg-muted rounded-lg p-3 flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                    <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                    disabled={isAsking}
                    />
                    <Button onClick={handleAsk} disabled={!inputValue.trim() || isAsking} size="icon">
                    <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

interface StepWorkspaceProps {
    course: Course;
    step: Step;
    chatHistory: Message[];
    setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
    onClose: () => void;
    onUpdateStep: (data: Partial<Step>) => void;
    onAskQuestion: (input: AskStepQuestionInput) => Promise<AskStepQuestionOutput>;
    onUpdateNotes: (notes: string) => void;
    onAssistWithNotes: (course: Course, notes: string, request: string) => Promise<AssistWithNotesOutput>;
    onGenerateQuiz: (course: Course, step: Step) => Promise<GenerateStepQuizOutput>;
    onQuizRestart: () => void;
}


export function StepWorkspace({ 
    course, 
    step: initialStep, 
    chatHistory, 
    setChatHistory, 
    onClose, 
    onUpdateStep, 
    onAskQuestion, 
    onUpdateNotes, 
    onAssistWithNotes,
    onGenerateQuiz,
    onQuizRestart
}: StepWorkspaceProps) {
  
    const [step, setStep] = useState(initialStep);

    useEffect(() => {
        // When the course data changes (e.g., after a quiz is generated or restarted),
        // find the updated version of the current step from the course prop
        // and update the local state.
        const updatedStep = course.steps.find(s => s.stepNumber === initialStep.stepNumber);
        if (updatedStep) {
            setStep(updatedStep);
        }
    }, [course, initialStep.stepNumber]);
    
    const handleCheckedChange = (checked: boolean) => {
        const newStepState = { ...step, completed: checked };
        setStep(newStepState);
        onUpdateStep({ completed: checked });
    };

    const handleQuizUpdate = (newQuizData: QuizSet) => {
        onUpdateStep({ quiz: newQuizData });
    };

    const handleGenerateQuiz = useCallback(async () => {
        await onGenerateQuiz(course, step);
    }, [course, step, onGenerateQuiz]);
    
    const handleFinishStep = () => {
        if (!step.completed) {
            handleCheckedChange(true);
        }
        onClose();
    }


    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent hideClose className="max-w-full w-full h-full p-0 gap-0 flex flex-col data-[state=open]:animate-none data-[state=closed]:animate-none !rounded-none">
                <DialogHeader className="p-4 border-b flex-row items-center justify-between shrink-0 space-y-0">
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close Workspace">
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <DialogDescription>Step {step.stepNumber}</DialogDescription>
                        <DialogTitle>{step.title}</DialogTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="workspace-completed"
                            checked={step.completed}
                            onCheckedChange={handleCheckedChange}
                        />
                        <Label htmlFor="workspace-completed">Mark as complete</Label>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 min-h-0">
                     <Tabs defaultValue="content" className="flex flex-col min-h-0 h-full">
                        <div className="px-4 border-b flex items-center justify-center bg-muted/50">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="content"><BookOpen className="mr-2 h-4 w-4"/>Content</TabsTrigger>
                                <TabsTrigger value="notes"><Notebook className="mr-2 h-4 w-4"/>Notes</TabsTrigger>
                                <TabsTrigger value="quiz"><Puzzle className="mr-2 h-4 w-4"/>Mini Check</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="content" className="flex-1 min-h-0">
                            <ScrollArea className="h-full">
                                <div className="p-6 md:p-8 space-y-8">
                                    <StepContent contentBlocks={step.contentBlocks} />
                                    <div className="px-6">
                                        <StepExtras step={step} onAskAiClick={() => {}} />
                                    </div>
                                    <Separator />
                                    <div className="flex justify-center py-4">
                                        <Button size="lg" onClick={handleFinishStep}>
                                            <CheckCircle className="mr-2 h-5 w-5" />
                                            Finish Step
                                        </Button>
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="notes" className="flex-1 min-h-0">
                            <NotesDisplay 
                                course={course}
                                notes={course.notes}
                                onUpdateNotes={onUpdateNotes}
                                onAssistWithNotes={onAssistWithNotes}
                            />
                        </TabsContent>

                        <TabsContent value="quiz" className="flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <div className="p-6 md:p-8">
                                    <StepQuiz 
                                        quizSet={step.quiz} 
                                        onQuizUpdate={handleQuizUpdate}
                                        onGenerateQuiz={handleGenerateQuiz}
                                        onQuizRestart={onQuizRestart}
                                        key={step.stepNumber} 
                                    />
                                    </div>
                                </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="absolute bottom-4 left-4 z-10">
                            <Bot className="mr-2 h-4 w-4" /> Ask AI
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> AI Assistant</DialogTitle>
                        </DialogHeader>
                        <AiChat 
                            course={course} 
                            step={step} 
                            history={chatHistory}
                            setHistory={setChatHistory}
                            onAskQuestion={onAskQuestion} 
                        />
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
