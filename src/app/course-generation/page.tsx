'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import {
  validateTopicAction,
  generateCourseTitleAction,
  generateCourseOutlineAction,
  generateStepContentAction,
  prepareCourseForSaving,
} from './actions';
import { useAuth } from '@/hooks/use-auth';
import Logo from '@/components/logo';
import { addCourse } from '@/lib/firestore';
import { CourseData, User } from '@/lib/types';
import { useRef } from 'react';
/* 🔹 2s delay helper */
const delay = (ms = 2000) =>
  new Promise(resolve => setTimeout(resolve, ms));

function CourseGenerationManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  const topic = searchParams.get('topic') || '';
  const masteryLevel = searchParams.get('masteryLevel') || 'Normal Path';
  const knowledgeLevel = searchParams.get('knowledgeLevel') || 'Beginner';
  const additionalComments = searchParams.get('additionalComments') || '';
  const hasStartedRef = useRef(false);


  const courseMode =
    (searchParams.get('courseMode') as 'Solo' | 'Collaborative') || 'Solo';

  const invitedFriends: User[] = JSON.parse(
    searchParams.get('invitedFriends') || '[]'
  );

  const generateCourse = useCallback(async () => {
    try {
      setError(null);

      if (authLoading) {
        setStatus('Initializing authentication...');
        return;
      }

      if (!user) {
        setError('You must be logged in to create a course.');
        setStatus('Authentication failed');
        return;
      }

      /* =====================================================
         COLLABORATIVE MODE (NO AI CALLS)
      ===================================================== */
      if (courseMode === 'Collaborative') {
        setProgress(25);
        setStatus('Preparing collaborative course...');
        await delay();

        const title = topic; // ✅ topic = title

        const newCourseData: CourseData = await prepareCourseForSaving({
          title,
          course: [],
          masteryLevel,
          userId: user.uid,
          userName:
            user.displayName || user.email?.split('@')[0] || 'Anonymous',
          courseMode,
          invitedFriends,
        });

        setProgress(80);
        await delay();

        const courseId = await addCourse(newCourseData);

        setProgress(100);
        setStatus('Collaborative course created!');
        sessionStorage.setItem('selectedCourseId', courseId);
        router.push('/learn');
        return;
      }

      /* =====================================================
         SOLO MODE (FULL AI PIPELINE)
      ===================================================== */

      /* ---------- VALIDATE ---------- */
      setProgress(10);
      setStatus('Validating topic...');
      await validateTopicAction({ topic });
      await delay();

      /* ---------- TITLE ---------- */
      setProgress(25);
      setStatus('Generating course title...');
      const titleData = await generateCourseTitleAction({ topic });
      const title = titleData?.title ?? topic;
      await delay();

      /* ---------- OUTLINE ---------- */
      setProgress(35);
      setStatus('Building course outline...');
      const outlineData = await generateCourseOutlineAction({
        topic: title,
        masteryLevel,
        knowledgeLevel,
        additionalComments,
      });
      await delay();

      const outline = outlineData?.outline ?? [];
      if (!outline.length) {
        throw new Error('The AI failed to generate a course outline.');
      }

      const outlineString = JSON.stringify(outline);
      const totalSteps = outline.length;
      const stepProgress = 50 / totalSteps;

      const generatedCourse: any[] = [];

      for (let i = 0; i < totalSteps; i++) {
        const step = outline[i];
        setProgress(40 + i * stepProgress);
        setStatus(
          `Generating content for "${step.shortTitle}" (${i + 1}/${totalSteps})`
        );

        const content = await generateStepContentAction({
          topic: title,
          outline: outlineString,
          stepTitle: step.title,
        });

        generatedCourse.push({ ...step, ...content });
        await delay();
      }

      /* ---------- SAVE ---------- */
      setProgress(95);
      setStatus('Saving your new course...');
      await delay();

      const newCourseData: CourseData = await prepareCourseForSaving({
        title,
        course: generatedCourse,
        masteryLevel,
        userId: user.uid,
        userName:
          user.displayName || user.email?.split('@')[0] || 'Anonymous',
        courseMode: 'Solo',
        invitedFriends: [],
      });

      const courseId = await addCourse(newCourseData);

      setProgress(100);
      setStatus('Course created successfully!');
      sessionStorage.setItem('selectedCourseId', courseId);
      router.push('/learn');

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred.');
      setProgress(0);
      setStatus('Failed to generate course');
    }
  }, [
    topic,
    masteryLevel,
    knowledgeLevel,
    additionalComments,
    courseMode,
    invitedFriends,
    router,
    user,
    authLoading,
  ]);

useEffect(() => {
  if (hasStartedRef.current) return;

  if (!authLoading && user) {
    hasStartedRef.current = true;
    generateCourse();
  }
}, [authLoading, user, generateCourse]);


  return (
    <div className="w-full h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <h1 className="font-headline text-3xl font-bold mb-4">
          Sit tight, we're building your course!
        </h1>

        <p className="text-muted-foreground mb-8">
          This may take a few minutes. You may leave this tab, do NOT close it.
        </p>

        <div className="space-y-4">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-2">
            {!error && progress < 100 && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>{status}</span>
          </p>
        </div>

        {error && (
          <div className="text-red-500 mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseGenerationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourseGenerationManager />
    </Suspense>
  );
}
