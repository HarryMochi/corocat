
"use client";

import type { MarketplaceCourse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, BookOpen, Heart, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface MarketplaceCourseCardProps {
    course: MarketplaceCourse;
    currentUserId: string;
    onLikeToggle: (courseId: string, userId: string) => void;
    onAddCourse: (course: MarketplaceCourse) => Promise<void>;
}

export function MarketplaceCourseCard({ course, currentUserId, onLikeToggle, onAddCourse }: MarketplaceCourseCardProps) {

    const { toast } = useToast();
    const isLiked = course.likedBy?.includes(currentUserId);
    const [isAdding, setIsAdding] = React.useState(false);

    const handleAdd = async () => {
        setIsAdding(true);
        try {
            await onAddCourse(course);
            toast({
                title: "Course Added!",
                description: `"${course.topic}" has been added to your courses.`,
            })
        } catch (error) {
            console.error("Error adding course:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not add this course. You may already have it.',
            });
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <Card className="flex flex-col md:flex-row w-full">
            <div className="flex-1 p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <Link href={`/profile/${course.userId}`} className="hover:underline">
                        <span>{course.userName || "Community Creator"}</span>
                    </Link>
                </div>
                <h3 className="font-headline text-xl font-bold">{course.topic}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.outline ? JSON.parse(course.outline).map((o: any) => o.description).join(' ') : 'No outline available.'}
                </p>
            </div>
            <div className="flex flex-col justify-center items-center gap-2 p-6 bg-muted/50 border-t md:border-t-0 md:border-l w-full md:w-48">
                <Button onClick={handleAdd} className="w-full" disabled={isAdding}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isAdding ? "Adding..." : "Add"}
                </Button>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => onLikeToggle(course.marketplaceId, currentUserId)}>
                    <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-red-500 text-red-500")} />
                    Like ({course.likes || 0})
                </Button>
            </div>
        </Card>
    )
}
