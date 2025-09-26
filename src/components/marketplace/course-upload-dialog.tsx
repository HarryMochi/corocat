
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Loader2 } from "lucide-react";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CourseUploadDialogProps {
  userCourses: Course[];
  category: string;
  onUpload: (course: Course) => Promise<boolean>;
}

export function CourseUploadDialog({ userCourses, category, onUpload }: CourseUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadClick = async () => {
    if (!selectedCourse) return;
    setIsUploading(true);
    const success = await onUpload(selectedCourse);
    setIsUploading(false);
    if (success) {
      setIsOpen(false);
      setSelectedCourse(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload a Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload to '{category}'</DialogTitle>
          <DialogDescription>
            Select one of your existing courses to share with the community.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-64 border rounded-md p-2">
            <div className="space-y-2">
            {userCourses.length > 0 ? userCourses.map(course => (
                <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={cn(
                        "w-full text-left p-3 rounded-md transition-colors",
                        "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
                        selectedCourse?.id === course.id && "bg-muted ring-2 ring-primary"
                    )}
                    disabled={course.isPublic}
                >
                    <p className="font-medium">{course.topic}</p>
                    <p className="text-sm text-muted-foreground">
                        {course.steps.length} steps
                        {course.isPublic && " (Already in marketplace)"}
                    </p>
                </button>
            )) : (
                <div className="text-center text-muted-foreground p-8">
                    You haven't created any courses yet.
                </div>
            )}
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUploadClick} disabled={!selectedCourse || isUploading || selectedCourse.isPublic}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Validating..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
