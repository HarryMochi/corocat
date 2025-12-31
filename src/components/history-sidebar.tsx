"use client";

import { useState, useEffect } from 'react';
import type { Course, User } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Trash2,
  LogOut,
  MoreHorizontal,
  Users,
  Share2,
} from "lucide-react";
import Logo from "./logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { SocialsModal } from './socials-modal';
import { NotificationBell } from './notification-bell';

interface HistorySidebarProps {
  user: User | null;
  courses: Course[];
  activeCourseId: string | null;
  onSelectCourse: (id: string) => void;
  onCreateNew: () => void;
  onDeleteCourse: (id: string) => void;
  onLogout: () => void;
  onShareCourse?: (course: Course) => void;
  onCourseAdded: () => Promise<any>;
}

export default function HistorySidebar({
  user,
  courses,
  activeCourseId,
  onSelectCourse,
  onCreateNew,
  onDeleteCourse,
  onLogout,
  onShareCourse,
  onCourseAdded,
}: HistorySidebarProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : name[0];
  };

  return (
    <div className="bg-muted/50 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <NotificationBell onCourseAccepted={onCourseAdded} />
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <SocialsModal>
          <Button variant="outline" className="w-full">
            <Users className="mr-2 h-4 w-4" /> Socials
          </Button>
        </SocialsModal>

        <Button onClick={onCreateNew} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {/* Course List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          {courses.map(course => {
            const isCollaborative = course.courseMode === 'Collaborative';

            const completedSteps =
              !isCollaborative && course.steps
                ? course.steps.filter(s => s.completed).length
                : 0;

            const totalSteps =
              !isCollaborative && course.steps
                ? course.steps.length
                : 0;

            return (
              <div key={course.id} className="group relative">
                <Button
                  variant={activeCourseId === course.id ? "secondary" : "ghost"}
                  onClick={() => onSelectCourse(course.id)}
                  className="w-full justify-start text-left h-auto py-2 pl-3 pr-10"
                >
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    {/* Title */}
                    <span className="font-medium truncate">
                      {course.topic}
                    </span>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {hasMounted
                          ? formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })
                          : null}
                      </span>

                      {/* Progress only for SOLO */}
                      {!isCollaborative && (
                        <span className="font-medium">
                          {completedSteps}/{totalSteps}
                        </span>
                      )}
                    </div>
                  </div>
                </Button>

                {/* Actions */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {onShareCourse && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onShareCourse(course)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the course "{course.topic}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteCourse(course.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Menu */}
      <div className="mt-auto p-2">
        {user && (
          <>
            <Separator className="my-2" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <MoreHorizontal className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.uid}`}>
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}
