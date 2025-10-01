
'use client';

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useMultiStepForm} from "@/hooks/useMultiStepForm";
import {useState} from "react";
import {z} from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Loader2, X} from "lucide-react";
import {generateFullCourse, GenerateFullCourseOutput} from "@/ai/flows/generate-full-course";

const FormSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    knowledgeLevel: z.string(),
    masteryLevel: z.string(),
    additionalComments: z.string(),
});

export default function Home() {
    const [course, setCourse] = useState<GenerateFullCourseOutput['course'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [selectedSubStep, setSelectedSubStep] = useState<number | null>(null);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            topic: '',
            knowledgeLevel: 'Beginner',
            masteryLevel: 'Normal Path',
            additionalComments: '',
        },
    });

    const { step, next, back, isFirstStep, isLastStep } = useMultiStepForm([<Step1 key={1} />, <Step2 key={2} />, <Step3 key={3} />]);

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        setError(null);
        try {
            const result = await generateFullCourse(data);
            setCourse(result.course);
        } catch (e: any) {
            setError(`Error Generating Course\n[${e.name}] ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    function Step1() {
        return (
            <CardContent>
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>What do you want to learn about?</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Quantum Computing, Roman History, Baking bread..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        );
    }

    function Step2() {
        return (
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="knowledgeLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>How much do you know already?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your knowledge level" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="masteryLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>How deep do you want to go?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your desired mastery level" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Quick Overview">Quick Overview</SelectItem>
                                        <SelectItem value="Normal Path">Normal Path</SelectItem>
                                        <SelectItem value="Long Mastery">Long Mastery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        );
    }

    function Step3() {
        return (
            <CardContent>
                <FormField
                    control={form.control}
                    name="additionalComments"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Any special requests? (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., focus on practical examples, I'm a visual learner, explain it to me like I'm 10..." {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        );
    }

    const openStep = (step: number) => {
        setSelectedStep(step);
        setSelectedSubStep(0); // Start with the first sub-step
    };

    const currentStepDetails = course?.find(c => c.step === selectedStep);
    const currentSubStepDetails = currentStepDetails?.subSteps[selectedSubStep || 0];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
                <p className="text-gray-500 mt-4">Generating your course... this may take a moment.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-lg">
                <strong className="font-bold">Error Generating Course</strong>
                <pre className="block whitespace-pre-wrap mt-2">{error}</pre>
            </div>
        );
    }

    if (course) {
        if (selectedStep !== null && currentSubStepDetails) {
            // View for a selected step's sub-step
            return (
                <div className="w-full h-screen flex relative">
                    <Button className="absolute top-4 right-4 z-10" size="icon" variant="ghost" onClick={() => setSelectedStep(null)}>
                        <X className="h-6 w-6" />
                    </Button>
                    <div className="w-1/3 bg-gray-50 border-r overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold mb-4">{currentStepDetails?.title}</h2>
                        <p className="text-gray-600 mb-6">{currentStepDetails?.description}</p>
                        <div className="space-y-2">
                            {currentStepDetails?.subSteps.map((subStep, index) => (
                                <Button
                                    key={index}
                                    variant={selectedSubStep === index ? 'secondary' : 'ghost'}
                                    className="w-full justify-start"
                                    onClick={() => setSelectedSubStep(index)}
                                >
                                    {subStep.title}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="w-2/3 flex flex-col">
                        <div className="flex-grow overflow-y-auto p-8" dangerouslySetInnerHTML={{ __html: currentSubStepDetails.content }}></div>
                        <div className="bg-gray-100 p-8 border-t flex-shrink-0">
                            <h3 className="text-xl font-bold mb-4">Test Your Knowledge</h3>
                            {/* Exercise content will go here */}
                        </div>
                    </div>
                </div>
            );
        }

        // Main course overview
        return (
            <div className="container mx-auto p-8">
                <h1 className="text-4xl font-bold text-center mb-8">Your Custom Course</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.map(c => (
                        <Card key={c.step} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openStep(c.step)}>
                            <CardHeader>
                                <CardTitle>{c.shortTitle}: {c.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{c.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Your Custom Course</CardTitle>
                    <CardDescription>Fill out the form below to generate a personalized learning path.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        {step}
                        <div className="flex justify-between p-6">
                            {!isFirstStep && <Button type="button" onClick={back}>Back</Button>}
                            {!isLastStep ? (
                                <Button type="button" onClick={next}>Next</Button>
                            ) : (
                                <Button type="submit">Generate My Course</Button>
                            )}
                        </div>
                    </form>
                </Form>
          </Card>
      </div>
  );
}
