
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Course, Step, QuizSet } from '../../lib/types';
import { getCoursesForUser, updateCourse, deleteCourse as deleteCourseFromDb, getFriends } from '../../lib/firestore';
import { askQuestionAction, assistWithNotesAction, generateQuizAction } from '../actions';
import { useToast } from "../../hooks/use-toast";
import HistorySidebar from '../../components/history-sidebar';
import TopicSelection from '../../components/topic-selection';
import CourseDisplay from '../../components/course-display';
import { useAuth } from '../../hooks/use-auth';
import { Loader2 } from 'lucide-react';
import type { AskStepQuestionOutput, AskStepQuestionInput } from '../../ai/flows/ask-step-question';
import type { AssistWithNotesOutput } from '../../ai/flows/assist-with-notes';
import LearnLayout from '../../components/learn-layout';
import type { Message } from '../../components/step-workspace';
import type { GenerateStepQuizOutput } from '../../ai/flows/generate-step-quiz';
import { ShareDialog } from '../../components/share-dialog';
import { PremiumDashboard } from '../../components/premium-dashboard';
import { usePremiumStatus } from '../../hooks/use-premium-status';

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeCourseChatHistory, setActiveCourseChatHistory] = useState<Message[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPremium } = usePremiumStatus();

  useEffect(() => {
    setIsClient(true);
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!user.emailVerified) {
        router.push('/verify-email');
      }
    }
  }, [user, loading, router]);

  // 🔥 Handle successful Stripe payment redirect
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast({
        title: '🎉 Welcome to Premium!',
        description: 'Your subscription is now active. Enjoy enhanced features!',
      });
      // Clean up URL
      router.replace('/learn');
    }
  }, [searchParams, toast, router]);

  const fetchCourses = useCallback(async () => {
    if (user && user.emailVerified) {
      const userCourses = await getCoursesForUser(user.uid);
      setCourses(userCourses);
      return userCourses;
    }
    return [];
  }, [user]);

  useEffect(() => {
    if (user) {
      const unsubscribeFriends = getFriends(user.uid, setFriends);
      return () => unsubscribeFriends();
    }
  }, [user]);

  useEffect(() => {
    fetchCourses().then((fetchedCourses) => {
      const storedCourseId = sessionStorage.getItem('selectedCourseId');
      if (storedCourseId && fetchedCourses.some(c => c.id === storedCourseId)) {
        setActiveCourseId(storedCourseId);
        sessionStorage.removeItem('selectedCourseId'); // Clean up after use
      }
    });
  }, [fetchCourses]);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  const handleUpdateStep = async (courseId: string, stepNumber: number, newStepData: Partial<Step>) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate || !courseToUpdate.steps) return;

    const updatedSteps = courseToUpdate.steps.map(step => step.stepNumber === stepNumber ? { ...step, ...newStepData } : step);
    const updatedCourse = { ...courseToUpdate, steps: updatedSteps };

    setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? updatedCourse : c));

    try {
      await updateCourse(courseId, { steps: updatedSteps });
    } catch (error) {
      console.error("Error updating step in DB:", error);
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to save changes." });
      setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? courseToUpdate : c));
    }
  };

  const handleQuizRestart = (courseId: string, stepNumber: number) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate || !courseToUpdate.steps) return;

    const updatedSteps = courseToUpdate.steps.map(step => {
      if (step.stepNumber === stepNumber && step.quiz) {
        const resetQuestions = step.quiz.questions.map(q => ({ ...q, userAnswer: null, isCorrect: null }));
        const newQuizSet: QuizSet = { ...step.quiz, score: null, questions: resetQuestions };
        return { ...step, quiz: newQuizSet };
      }
      return step;
    });

    const updatedCourse = { ...courseToUpdate, steps: updatedSteps };
    setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? updatedCourse : c));
  }

  const handleGenerateQuiz = async (course: Course, step: Step): Promise<GenerateStepQuizOutput> => {
    try {
      const stepContentString = (step.subSteps || []).map(s => `### ${s.title}\n${s.content}`).join('\n\n');
      const result = await generateQuizAction({ topic: course.topic, courseOutline: course.outline || '', stepTitle: step.title, stepContent: stepContentString });
      if (result.quiz) {
        const newQuizSet: QuizSet = { questions: result.quiz.map(q => ({ ...q, userAnswer: null, isCorrect: null })), score: null };
        handleUpdateStep(course.id, step.stepNumber, { quiz: newQuizSet });
      }
      return result;
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Generating Quiz", description: "Could not generate a quiz for this step. Please try again." });
      throw error;
    }
  };

  const handleUpdateNotes = async (courseId: string, newNotes: string) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate) return;
    const updatedCourse = { ...courseToUpdate, notes: newNotes };
    setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? updatedCourse : c));
    try {
      await updateCourse(courseId, { notes: newNotes });
    } catch (error) {
      console.error("Error updating notes in DB:", error);
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to save notes." });
      setCourses(prevCourses => prevCourses.map(c => c.id === courseId ? courseToUpdate : c));
    }
  };

  const handleAskQuestion = async (input: AskStepQuestionInput): Promise<AskStepQuestionOutput> => {
    try {
      const activeCourseForQuestion = courses.find(c => c.topic === input.topic);
      const activeStepForQuestion = activeCourseForQuestion?.steps?.find(s => s.title === input.stepTitle);
      const contentString = (activeStepForQuestion?.subSteps || []).map(s => `### ${s.title}\n${s.content}`).join('\n\n');
      return await askQuestionAction({ ...input, stepContent: contentString });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Getting Answer", description: "Could not get an answer for this question. Please try again." });
      return { answer: "Sorry, I couldn't process your question. Please try again." };
    }
  };

  const handleAssistWithNotes = async (course: Course, notes: string, request: string): Promise<AssistWithNotesOutput> => {
    try {
      return await assistWithNotesAction({ topic: course.topic, notes: notes, request: request });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Assisting with Notes", description: "Could not get an answer from the AI. Please try again." });
      return { suggestion: "Sorry, I couldn't process your request. Please try again." };
    }
  }

  const handleCreateNew = () => {
    setActiveCourseId(null);
    setActiveCourseChatHistory([]);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const originalCourses = courses;
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      setActiveCourseChatHistory([]);
    }
    try {
      await deleteCourseFromDb(courseId);
    } catch (error) {
      console.error("Error deleting course from DB:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete course from database." });
      setCourses(originalCourses);
    }
  };

  const handleSelectCourse = (id: string) => {
    if (id !== activeCourseId) {
      setActiveCourseId(id);
      setActiveCourseChatHistory([]);
    }
  }

  const handleShareCourse = (course: Course) => {
    setSelectedCourse(course);
    setShareDialogOpen(true);
  }

  if (loading || !isClient || !user || !user.emailVerified) {
    return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const sidebar = (
    <HistorySidebar
      user={user}
      courses={courses}
      activeCourseId={activeCourseId}
      onSelectCourse={handleSelectCourse}
      onCreateNew={handleCreateNew}
      onDeleteCourse={handleDeleteCourse}
      onLogout={logout}
      onShareCourse={handleShareCourse}
      onCourseAdded={fetchCourses}
    />
  );

  const mainContent = activeCourse ? (
    <CourseDisplay
      key={activeCourse.id}
      course={activeCourse}
      chatHistory={activeCourseChatHistory}
      setChatHistory={setActiveCourseChatHistory}
      onUpdateStep={handleUpdateStep}
      onAskQuestion={handleAskQuestion}
      onUpdateNotes={handleUpdateNotes}
      onAssistWithNotes={handleAssistWithNotes}
      onGenerateQuiz={handleGenerateQuiz}
      onQuizRestart={handleQuizRestart}
      onCourseComplete={() => { setActiveCourseId(null); fetchCourses(); }}
      onShareCourse={handleShareCourse}
      onDeleteCourse={handleDeleteCourse}
    />
  ) : (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8">
      {/* Premium Dashboard - shown above topic selection for premium users */}
      {isPremium && (
        <div className="w-full max-w-4xl mb-6">
          <PremiumDashboard />
        </div>
      )}
      <TopicSelection
        soloCoursesCount={courses.filter(c => c.courseMode === 'Solo').length}
        collaborativeCoursesCount={courses.filter(c => c.courseMode === 'Collaborative').length}
      />
    </div>
  );

  return (
    <>
      <LearnLayout
        sidebar={sidebar}
        mainContent={mainContent} onCourseAccepted={function (newCourseId: string): Promise<void> {
          throw new Error('Function not implemented.');
        }} />
      <ShareDialog
        user={user}
        friends={friends}
        course={selectedCourse}
        isOpen={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
}
