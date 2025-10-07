'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfileData, getCoursesForUser, deleteCourse } from '@/lib/firestore';
import { Loader2, ArrowLeft, Share2 } from 'lucide-react';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import type { Course } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserProfile {
    displayName: string;
    creationTime: string;
    activeCourses: number;
    coursesCompleted: number;
    coursesPublished: number;
}

const ProfileCounter = ({ label, value }: { label: string, value: number }) => (
    <div className="flex flex-col items-center text-center p-4 bg-muted rounded-lg">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
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
    const [isCopied, setIsCopied] = useState(false);


    const fetchProfileData = useCallback(async () => {
        if (!userId) return;
        setPageLoading(true);
        try {
            const userData = await getUserProfileData(userId);
            setProfile(userData);
        } catch (error) {
            console.error("Error fetching profile data:", error);
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
        if (loading) {
            return; // Wait for auth loading to finish
        }
        if (user) {
            fetchProfileData();
            fetchSidebarCourses();
        } else {
            setPageLoading(false); // Not logged in, so stop loading
        }
    }, [user, loading, fetchProfileData, fetchSidebarCourses]);

    const handleDeleteCourse = async (courseId: string) => {
        const originalCourses = sidebarCourses;
        setSidebarCourses(prev => prev.filter(c => c.id !== courseId));
        try {
            await deleteCourse(courseId);
            if (profile) {
                fetchProfileData();
            }
        } catch (error) {
            console.error("Error deleting course from DB:", error);
            setSidebarCourses(originalCourses);
        }
    };

    const handleShare = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length > 1) {
            return names[0][0] + names[names.length - 1][0];
        }
        return name[0];
    };
    
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

    if (loading || pageLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!user) {
        const loginPrompt = (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg font-semibold">Log in first to access another user's profile</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Log In</Link>
                </Button>
            </div>
        );

         return (
            <LearnLayout
                sidebar={sidebar}
                mainContent={loginPrompt}
            />
        );
    }
    
    if (!profile) {
         return (
            <LearnLayout
                sidebar={sidebar}
                mainContent={<div className="flex items-center justify-center h-full">User not found or has no public activity.</div>}
            />
        );
    }

    const { activeCourses, coursesCompleted, coursesPublished } = profile;

    const mainContent = (
        <div className="h-full p-4 md:p-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/marketplace">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} disabled={isCopied}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {isCopied ? 'Copied!' : 'Share'}
                </Button>
            </header>
            <div className="flex flex-col items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarFallback className="text-3xl">{getInitials(profile.displayName)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline">{profile.displayName}</h1>
                    <p className="text-muted-foreground">Member since {format(new Date(profile.creationTime), 'dd.MM.yyyy')}</p>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-lg font-headline text-center">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 p-6 pt-0">
                       <ProfileCounter label="Active Courses" value={activeCourses} />
                       <ProfileCounter label="Courses Completed" value={coursesCompleted} />
                       <ProfileCounter label="Courses Published" value={coursesPublished} />
                    </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground text-center max-w-sm">Note: Only statistics from publicly shared courses are displayed on this profile.</p>
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
