
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getUserData, getCoursesForUser, deleteCourse } from '@/lib/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import type { Course } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBadgeForCoursesCreated, getBadgeForCoursesCompleted, getBadgeForCoursesPublished } from '@/lib/achievements';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserProfile {
    displayName: string;
    creationTime: string;
    courses: Course[];
}

const ProfileBadge = ({ badge, value }: { badge: ReturnType<typeof getBadgeForCoursesCreated>, value: number }) => (
    <div className="flex flex-col items-center text-center">
        <div className={`p-3 rounded-full ${badge.className}`}>
            <badge.icon className="h-6 w-6" />
        </div>
        <p className="font-semibold mt-2 text-sm">{badge.name}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
    </div>
);


export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    const fetchProfileData = useCallback(async () => {
        if (!userId) return;
        setPageLoading(true);
        try {
            const userData = await getUserData(userId);
            setProfile(userData);
        } catch (error) {
            console.error("Error fetching profile data:", error);
            // Optionally, redirect to a 404 page or show an error
        } finally {
            setPageLoading(false);
        }
    }, [userId]);

    const fetchSidebarCourses = useCallback(async () => {
        if (user) {
            const userCourses = await getCoursesForUser(user.uid);
            setSidebarCourses(userCourses);
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else {
            fetchProfileData();
            fetchSidebarCourses();
        }
    }, [user, loading, router, fetchProfileData, fetchSidebarCourses]);

    const handleDeleteCourse = async (courseId: string) => {
        const originalCourses = sidebarCourses;
        setSidebarCourses(prev => prev.filter(c => c.id !== courseId));
        try {
            await deleteCourse(courseId);
             // If the deleted course was part of the viewed profile, refetch profile data
            if(profile?.courses.some(c => c.id === courseId)) {
                fetchProfileData();
            }
        } catch (error) {
            console.error("Error deleting course from DB:", error);
            setSidebarCourses(originalCourses);
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length > 1) {
            return names[0][0] + names[names.length - 1][0];
        }
        return name[0];
    };

    if (loading || pageLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const sidebar = (
        <HistorySidebar
          user={user}
          courses={sidebarCourses}
          activeCourseId={null}
          onSelectCourse={() => router.push(`/learn`)}
          onCreateNew={() => router.push('/learn')}
          onDeleteCourse={handleDeleteCourse}
          onLogout={logout}
        />
    );
    
    if (!profile) {
         return (
            <LearnLayout
                sidebar={sidebar}
                mainContent={<div className="flex items-center justify-center h-full">User not found.</div>}
            />
        );
    }

    const coursesCreated = profile.courses.length;
    const coursesCompleted = profile.courses.filter(c => c.steps.length > 0 && c.steps.every(s => s.completed)).length;
    const coursesPublished = profile.courses.filter(c => c.isPublic).length;

    const createdBadge = getBadgeForCoursesCreated(coursesCreated);
    const completedBadge = getBadgeForCoursesCompleted(coursesCompleted);
    const publishedBadge = getBadgeForCoursesPublished(coursesPublished);


    const mainContent = (
        <div className="h-full p-4 md:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                 <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/marketplace">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                </Button>
            </header>
            <div className="flex flex-col items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                    {/* In a real app, user.photoURL would be here */}
                    <AvatarFallback className="text-3xl">{getInitials(profile.displayName)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline">{profile.displayName}</h1>
                    <p className="text-muted-foreground">Member since {format(new Date(profile.creationTime), 'dd.MM.yyyy')}</p>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-lg font-headline text-center">Achievements</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 p-6 pt-0">
                       <ProfileBadge badge={createdBadge} value={coursesCreated} />
                       <ProfileBadge badge={completedBadge} value={coursesCompleted} />
                       <ProfileBadge badge={publishedBadge} value={coursesPublished} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );

     return (
        <LearnLayout
            sidebar={sidebar}
            mainContent={mainContent}
        />
    );
}

