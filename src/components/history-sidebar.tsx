"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Course, User } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Trash2,
  LogOut,
  MoreHorizontal,
  Users,
  Share2,
  Zap,
  Lock,
} from "lucide-react";
import Logo from "./logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PremiumDashboard } from "@/components/premium-dashboard";
import { checkCourseLimit, checkWhiteboardLimit, getPlanLimits, getUserPlan } from "@/lib/limits";
import Link from "next/link";
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

import { Separator } from "./ui/separator";
import { SocialsModal } from './socials-modal';
import { NotificationBell } from './notification-bell';
import { usePremiumStatus } from '../hooks/use-premium-status';

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
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [resubscribeDialogOpen, setResubscribeDialogOpen] = useState(false);
  const { isPremium, subscriptionDetails } = usePremiumStatus();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const effectiveUser: User | null =
    user && isPremium ? ({ ...user, plan: 'premium' } as User) : user;

  const currentPlan = effectiveUser ? getUserPlan(effectiveUser) : 'free';
  const autoRenews = isPremium && !subscriptionDetails?.cancelAtPeriodEnd;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const sortedCourses = useMemo(() => {
    // Sort by createdAt desc calling .slice() to avoid mutating props
    const sorted = [...courses].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // If there is an active course, move it to the top
    if (activeCourseId) {
      const activeIndex = sorted.findIndex(c => c.id === activeCourseId);
      if (activeIndex > -1) {
        const [activeCourse] = sorted.splice(activeIndex, 1);
        sorted.unshift(activeCourse);
      }
    }

    return sorted;
  }, [courses, activeCourseId]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : name[0];
  };

  const handleCancelAutoRenew = async () => {
    if (!user || !isPremium) return;
    try {
      setCancelLoading(true);
      await fetch('/api/stripe/toggle-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, autoRenew: false }),
      });
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Failed to cancel auto-renewal:', err);
    } finally {
      setCancelLoading(false);
    }
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
        <div className="space-y-4">
          <SocialsModal>
            <Button variant="outline" className="w-full">
              <Users className="mr-2 h-4 w-4" /> Socials
            </Button>
          </SocialsModal>

          {effectiveUser && (
            <div className="bg-card rounded-md p-3 border space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-yellow-500" /> Plan Usage</span>
                {!isPremium ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <Link
                      href="/#pricing"
                      className="text-primary hover:underline capitalize"
                    >
                      {currentPlan}{' '}
                      <span className="text-[10px] ml-1">Upgrade</span>
                    </Link>
                    <span className="text-[10px] text-muted-foreground">5 courses/week, 3 whiteboards lifetime</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="capitalize text-muted-foreground">
                      Premium
                    </span>
                    {autoRenews ? (
                      <>
                        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] text-amber-600 border-amber-500/50 hover:bg-amber-500/10"
                              disabled={cancelLoading}
                            >
                              {cancelLoading ? 'Canceling...' : 'Cancel Auto Renewal'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel auto-renewal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Your subscription will stay active until the end of your current billing period. You will not be charged again. You can resubscribe anytime before it ends.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Auto-Renewal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCancelAutoRenew();
                                }}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                {cancelLoading ? 'Canceling...' : 'Cancel Auto Renewal'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <>
                        <AlertDialog open={resubscribeDialogOpen} onOpenChange={setResubscribeDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-[11px]"
                            >
                              Resubscribe
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Resubscribe</AlertDialogTitle>
                              <AlertDialogDescription>
                                You can resubscribe at the end of your membership.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogAction onClick={() => setResubscribeDialogOpen(false)}>OK</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Course Limit */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>Courses ({checkCourseLimit(effectiveUser).windowLabel === 'week' ? '1w' : '1h'})</span>
                  <span className={checkCourseLimit(effectiveUser).allowed ? "text-muted-foreground" : "text-destructive font-bold"}>
                    {checkCourseLimit(effectiveUser).limit - checkCourseLimit(effectiveUser).remaining} / {checkCourseLimit(effectiveUser).limit}
                  </span>
                </div>
                {/* Progress Bar could go here */}
              </div>
<div className="space-y-1">
  <div className="flex justify-between">
    <span>Whiteboards {!isPremium && <span className="text-[10px] text-muted-foreground">(lifetime)</span>}</span>
    <span
      className={checkWhiteboardLimit(
        effectiveUser,
        effectiveUser.limits?.whiteboardsCreatedTotal || 0
      ).allowed
        ? "text-muted-foreground"
        : "text-destructive font-bold"}
    >
      {effectiveUser.limits?.whiteboardsCreatedTotal || 0} /{" "}
      {getPlanLimits(currentPlan).whiteboardsTotal}
    </span>
  </div>

  {isPremium && (
    <button
      onClick={() => setPlanDialogOpen(true)}
      className="text-[11px] text-primary hover:underline self-start"
    >
      Plan details
    </button>
  )}
</div>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span> {/* Span wrapper needed for disabled button tooltip trigger */}
                  <Button
                    onClick={onCreateNew}
                    className="w-full"
                    disabled={user ? (!checkCourseLimit(user).allowed && !checkWhiteboardLimit(user, user.limits?.whiteboardsCreatedTotal || 0).allowed) : false}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Course
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Check your plan limits!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Course List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          {sortedCourses.map(course => {
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
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center transition-opacity">
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
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Premium Plan Details</DialogTitle>
    </DialogHeader>

    <PremiumDashboard />

    <DialogFooter>
      <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}
