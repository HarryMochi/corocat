
"use client";

import type { Step } from "@/lib/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Check, Book, Code, Brain, Target, Star, Puzzle, FlaskConical } from "lucide-react";
import { PathChest, PathCastle } from "./path-icons";

interface StepListProps {
  steps: Step[];
  onStepSelect: (step: Step) => void;
  onUpdateStep: (stepNumber: number, data: Partial<Step>) => void; // Keep for potential future use, though unused in this new design
}

const stepIcons = [Book, Code, Brain, Target, Puzzle, FlaskConical, Star];

const getStepIcon = (index: number) => {
    return stepIcons[index % stepIcons.length];
}

const SpecialNode = ({ icon }: { icon: React.ReactNode }) => (
    <div className="relative flex justify-center items-center my-4">
        {/* Central node */}
        <div className="w-16 h-16 flex items-center justify-center">
            {icon}
        </div>
    </div>
);


export function StepList({ steps, onStepSelect }: StepListProps) {
  return (
    <div className="h-full p-4 md:p-8 pt-6 flex-1 min-h-0 overflow-y-auto">
        <div className="relative w-full max-w-sm mx-auto">
            {/* The Path */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-border -translate-x-1/2" style={{
                 backgroundImage: `linear-gradient(to bottom, hsl(var(--border)) 40%, transparent 0%)`,
                 backgroundSize: `1px 15px`,
                 backgroundRepeat: `repeat-y`
            }} />
            
            {/* Start Node */}
             <div className="relative flex justify-center items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center border-4 border-background shadow-md">
                    <Star className="w-8 h-8" />
                </div>
            </div>

            <div className="space-y-4">
                {steps.map((step, index) => {
                    const Icon = getStepIcon(index);
                    const isCompleted = step.completed;
                    const alignment = index % 2 === 0 ? 'left' : 'right';

                    const specialNodeIndex = 7; // Place a special node after this many steps
                    const shouldShowSpecialNode = (index + 1) % specialNodeIndex === 0 && index < steps.length -1;

                    return (
                        <div key={step.stepNumber}>
                            <div className={cn(
                                "relative flex items-center w-1/2 group",
                                alignment === 'left' ? 'mr-auto' : 'ml-auto flex-row-reverse'
                            )}>
                                {/* Step Button */}
                                <div className={cn("flex flex-col items-center gap-1",  alignment === 'left' ? 'mr-4' : 'ml-4')}>
                                    <Button
                                        onClick={() => onStepSelect(step)}
                                        className={cn(
                                            "w-20 h-20 rounded-full flex-col gap-1 shadow-lg transition-transform duration-300 hover:scale-110 border-4",
                                            isCompleted ? 'bg-green-500 hover:bg-green-600 text-white border-background' : 'bg-card hover:bg-muted border-border text-foreground',
                                        )}
                                    >
                                        <Icon className="w-7 h-7" />
                                    </Button>
                                    <p className="text-xs text-center font-semibold text-foreground max-w-[100px] leading-tight">
                                        {step.shortTitle || step.title}
                                    </p>
                                </div>
                                
                                {/* Connector Dot on the Path */}
                                <div className={cn(
                                    "absolute top-10 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-background",
                                    isCompleted ? 'bg-green-500' : 'bg-border',
                                    alignment === 'left' ? 'right-0 -translate-x-1/2' : 'left-0 translate-x-1/2'
                                )}/>
                            </div>

                            {shouldShowSpecialNode && index % (specialNodeIndex * 2) !== 0 && <SpecialNode icon={<PathChest />} />}
                            {shouldShowSpecialNode && index % (specialNodeIndex * 2) === 0 && <SpecialNode icon={<PathCastle />} />}
                        </div>
                    )
                })}
            </div>

             {/* End Node */}
             <div className="relative flex justify-center items-center mt-4">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-4 border-background shadow-md",
                    steps.every(s => s.completed) ? "bg-amber-400 text-amber-900" : "bg-muted text-muted-foreground"
                )}>
                    <Check className="w-8 h-8" />
                </div>
            </div>
        </div>
    </div>
  );
}
