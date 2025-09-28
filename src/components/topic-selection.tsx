
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Lightbulb, Link as LinkIcon, Brain, Wind, Zap, Mountain, Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Logo from "./logo";
import type { GenerationState } from "@/app/learn/page";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import type { GenerateFullCourseInput } from "@/ai/flows/generate-full-course";
import { Label } from "./ui/label";
import { Users, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters.",
  }),
});

type TopicFormValues = z.infer<typeof formSchema>;

interface TopicSelectionProps {
  onGenerateCourse: (input: GenerateFullCourseInput) => Promise<void>;
  generationState: GenerationState;
}

const loadingSteps = [
    { icon: BookOpen, text: "Structuring your course outline..." },
    { icon: Lightbulb, text: "Generating detailed step-by-step content..." },
    { icon: LinkIcon, text: "Finding relevant external resources..." },
    { icon: Brain, text: "Creating fun quizzes and facts..." },
];

function LoadingCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % loadingSteps.length);
        }, 2500); // Change item every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 pt-8 animate-fade-in-up text-center">
            <h3 className="font-semibold text-lg text-muted-foreground">Building your personalized course...</h3>
            <div className="h-24 w-full max-w-sm overflow-hidden relative">
                {loadingSteps.map((step, index) => {
                    return (
                        <div
                            key={index}
                            className={cn(
                                "absolute w-full transition-all duration-500 ease-in-out flex items-center justify-center gap-3",
                                {
                                    "opacity-100 translate-y-0": index === currentIndex,
                                    "opacity-0 -translate-y-full": index === (currentIndex - 1 + loadingSteps.length) % loadingSteps.length,
                                    "opacity-0 translate-y-full": index !== currentIndex && index !== (currentIndex - 1 + loadingSteps.length) % loadingSteps.length,
                                }
                            )}
                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                            <step.icon className="h-6 w-6 text-primary" />
                            <span className="text-muted-foreground font-medium">{step.text}</span>
                        </div>
                    );
                })}
            </div>
             <p className="text-sm text-muted-foreground/80">This may take a minute.</p>
        </div>
    );
}

export default function TopicSelection({ onGenerateCourse, generationState }: TopicSelectionProps) {
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  });

  const [questionStep, setQuestionStep] = useState(0);
  const [knowledgeLevel, setKnowledgeLevel] = useState('Beginner');
  const [masteryLevel, setMasteryLevel] = useState('Normal Path');
  const [additionalComments, setAdditionalComments] = useState('');
  const [learningMode, setLearningMode] = useState<'solo' | 'collaborative'>('solo');
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const isGenerating = generationState.status === 'generating';

  if (isGenerating) {
    return (
      <div className="w-full max-w-lg">
       <div className="flex justify-center mb-8">
         <Logo />
       </div>
        <Card className="shadow-2xl shadow-primary/10 min-h-[380px] flex flex-col justify-center">
          <CardContent>
            <LoadingCarousel />
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = (values: TopicFormValues) => {
    setQuestionStep(1);
  };
  
  const handleStartGeneration = () => {
    const topic = form.getValues("topic");
    if(!topic) return;

    onGenerateCourse({
        topic,
        knowledgeLevel,
        masteryLevel,
        learningMode,
        collaboratorCount: collaboratorEmails.length + 1, // +1 for the creator
        additionalComments
    });
  }

  const addCollaboratorEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes('@') && !collaboratorEmails.includes(email)) {
      setCollaboratorEmails([...collaboratorEmails, email]);
      setEmailInput('');
    }
  };

  const removeCollaboratorEmail = (emailToRemove: string) => {
    setCollaboratorEmails(collaboratorEmails.filter(email => email !== emailToRemove));
  };
  const renderQuestionnaire = () => {
    switch(questionStep) {
        case 1:
            return (
                <div className="text-center space-y-6 animate-fade-in-up">
                    <h3 className="font-semibold text-lg">How do you want to learn?</h3>
                    <RadioGroup 
                        value={learningMode}
                        onValueChange={(value: 'solo' | 'collaborative') => setLearningMode(value)} 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <Label htmlFor="solo" className={cn("border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 text-center", learningMode === 'solo' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="solo" id="solo" className="sr-only"/>
                            <User className="h-8 w-8 text-primary/80" />
                            <span className="font-bold">Solo Learner</span>
                            <span className="text-xs text-muted-foreground">Learn at your own pace</span>
                        </Label>
                        <Label htmlFor="collaborative" className={cn("border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 text-center", learningMode === 'collaborative' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="collaborative" id="collaborative" className="sr-only"/>
                            <Users className="h-8 w-8 text-primary/80" />
                            <span className="font-bold">Collaborative</span>
                            <span className="text-xs text-muted-foreground">Learn with others</span>
                        </Label>
                    </RadioGroup>
                    
                    {learningMode === 'collaborative' && (
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="text-left">
                                <Label htmlFor="collaborator-email" className="text-sm font-medium">Invite Collaborators</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="collaborator-email"
                                        type="email"
                                        placeholder="colleague@example.com"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCollaboratorEmail();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={addCollaboratorEmail} size="sm">
                                        Add
                                    </Button>
                                </div>
                            </div>
                            
                            {collaboratorEmails.length > 0 && (
                                <div className="text-left">
                                    <Label className="text-sm font-medium">Collaborators ({collaboratorEmails.length})</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {collaboratorEmails.map((email) => (
                                            <Badge key={email} variant="secondary" className="flex items-center gap-1">
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => removeCollaboratorEmail(email)}
                                                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <Button onClick={() => setQuestionStep(2)}>Next</Button>
                </div>
            );
        case 2:
            return (
                <div className="text-center space-y-6 animate-fade-in-up">
                    <h3 className="font-semibold text-lg">How well do you know this topic?</h3>
                    <RadioGroup 
                        value={knowledgeLevel}
                        onValueChange={setKnowledgeLevel} 
                        className="items-center justify-center flex gap-4"
                    >
                        <Label htmlFor="beginner" className={cn("border rounded-md p-4 cursor-pointer w-28", knowledgeLevel === 'Beginner' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="Beginner" id="beginner" className="sr-only"/>
                            <div className="flex flex-col items-center gap-2">
                                <SignalLow className="h-8 w-8 text-primary/80" />
                                <span className="font-medium">Beginner</span>
                            </div>
                        </Label>
                        <Label htmlFor="intermediate" className={cn("border rounded-md p-4 cursor-pointer w-28", knowledgeLevel === 'Intermediate' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="Intermediate" id="intermediate" className="sr-only"/>
                             <div className="flex flex-col items-center gap-2">
                                <SignalMedium className="h-8 w-8 text-primary/80" />
                                <span className="font-medium">Intermediate</span>
                            </div>
                        </Label>
                        <Label htmlFor="advanced" className={cn("border rounded-md p-4 cursor-pointer w-28", knowledgeLevel === 'Advanced' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="Advanced" id="advanced" className="sr-only"/>
                             <div className="flex flex-col items-center gap-2">
                                <SignalHigh className="h-8 w-8 text-primary/80" />
                                <span className="font-medium">Advanced</span>
                            </div>
                        </Label>
                    </RadioGroup>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setQuestionStep(1)}>Back</Button>
                        <Button onClick={() => setQuestionStep(3)}>Next</Button>
                    </div>
                </div>
            );
        case 3:
            return (
                 <div className="text-center space-y-6 animate-fade-in-up">
                    <h3 className="font-semibold text-lg">How deep do you want to go?</h3>
                     <RadioGroup 
                        value={masteryLevel}
                        onValueChange={setMasteryLevel} 
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <Label htmlFor="quick" className={cn("border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 text-center", masteryLevel === 'Quick Overview' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="Quick Overview" id="quick" className="sr-only"/>
                            <Wind className="h-8 w-8 text-primary/80" />
                            <span className="font-bold">Quick Overview</span>
                            <span className="text-xs text-muted-foreground">5-7 Steps</span>
                        </Label>
                        <Label htmlFor="normal" className={cn("border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 text-center", masteryLevel === 'Normal Path' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="Normal Path" id="normal" className="sr-only"/>
                            <Zap className="h-8 w-8 text-primary/80" />
                            <span className="font-bold">Normal Path</span>
                            <span className="text-xs text-muted-foreground">12-15 Steps</span>
                        </Label>
                        <Label htmlFor="long" className={cn("border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 text-center", masteryLevel === 'Long Mastery' && "border-primary ring-2 ring-primary bg-primary/5")}>
                            <RadioGroupItem value="Long Mastery" id="long" className="sr-only"/>
                            <Mountain className="h-8 w-8 text-primary/80" />
                            <span className="font-bold">Long Mastery</span>
                            <span className="text-xs text-muted-foreground">20+ Steps</span>
                        </Label>
                    </RadioGroup>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setQuestionStep(2)}>Back</Button>
                        <Button onClick={() => setQuestionStep(4)}>Next</Button>
                    </div>
                </div>
            );
        case 4:
             return (
                 <div className="space-y-6 animate-fade-in-up text-center">
                    <h3 className="font-semibold text-lg">Any special requests? (Optional)</h3>
                     <Textarea 
                        placeholder="e.g., focus on practical examples, I'm a visual learner, explain it to me like I'm 10..."
                        value={additionalComments}
                        onChange={(e) => setAdditionalComments(e.target.value)}
                        className="min-h-[100px]"
                     />
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setQuestionStep(3)}>Back</Button>
                        <Button onClick={handleStartGeneration} className="bg-accent text-accent-foreground hover:bg-accent/90">Generate My Course</Button>
                    </div>
                </div>
            );
        default: // case 0
            return (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="sr-only">Topic</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="e.g., React, Python, Music Theory" 
                                    {...field} 
                                    className="text-center text-lg h-12"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full">
                            Start
                        </Button>
                    </form>
                </Form>
            );
    }
  }

  return (
    <div className="w-full max-w-lg">
       <div className="flex justify-center mb-8">
         <Logo />
       </div>
      <Card className="shadow-2xl shadow-primary/10 min-h-[380px] flex flex-col justify-center">
        <CardHeader className="text-center">
            {questionStep === 0 && (
                <>
                    <CardTitle className="font-headline text-3xl">What do you want to master today?</CardTitle>
                    <CardDescription>Enter any topic and our AI will create a personalized course for you.</CardDescription>
                </>
            )}
        </CardHeader>
        <CardContent>
          {renderQuestionnaire()}
        </CardContent>
      </Card>
    </div>
  );
}
