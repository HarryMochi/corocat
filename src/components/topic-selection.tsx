
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { BookOpen, Lightbulb, Link as LinkIcon, Brain, Wind, Zap, Mountain, Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Logo from "./logo";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters.",
  }).max(50, { message: "Topic must be 50 characters or less."}),
});

type TopicFormValues = z.infer<typeof formSchema>;

export default function TopicSelection() {
  const router = useRouter();
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

  const onSubmit = (values: TopicFormValues) => {
    setQuestionStep(1);
  };
  
  const handleStartGeneration = () => {
    const topic = form.getValues("topic");
    if(!topic) return;

    const params = new URLSearchParams();
    params.set('topic', topic);
    params.set('knowledgeLevel', knowledgeLevel);
    params.set('masteryLevel', masteryLevel);
    params.set('additionalComments', additionalComments);

    router.push(`/course-generation?${params.toString()}`);
  }

  const renderQuestionnaire = () => {
    switch(questionStep) {
        case 1:
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
                    <Button onClick={() => setQuestionStep(2)}>Next</Button>
                </div>
            );
        case 2:
            return (
                 <div className="text-center space-y-6 animate-fade-in-up">
                    <h3 className="font-semibold text-lg">How deep do you want to go?</h3>
                     <RadioGroup 
                        value={masteryLevel}
                        onValueChange={setMasteryLevel} 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
                    </RadioGroup>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setQuestionStep(1)}>Back</Button>
                        <Button onClick={() => setQuestionStep(3)}>Next</Button>
                    </div>
                </div>
            );
        case 3:
             return (
                 <div className="space-y-6 animate-fade-in-up text-center">
                    <h3 className="font-semibold text-lg">Any special requests? (Optional)</h3>
                     <Textarea 
                        placeholder="e.g., focus on practical examples, I'm a visual learner, explain it to me like I'm 10..."
                        value={additionalComments}
                        onChange={(e) => setAdditionalComments(e.target.value)}
                        className="min-h-[100px]"
                        maxLength={300}
                     />
                     <p className="text-xs text-muted-foreground text-right">{additionalComments.length} / 300</p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setQuestionStep(2)}>Back</Button>
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
                                    maxLength={50}
                                />
                            </FormControl>
                            <div className="flex justify-between items-center px-1 pt-1">
                                <FormMessage />
                                <p className="text-xs text-muted-foreground">
                                    {field.value.length} / 50
                                </p>
                            </div>
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
