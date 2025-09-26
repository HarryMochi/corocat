
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import { getCoursesForUser, deleteCourse, getAllMarketplaceCourses } from '@/lib/firestore';
import type { Course } from '@/lib/types';
import MarketplaceCategoryGrid, { marketplaceCategories } from '@/components/marketplace/marketplace-category-grid';

export default function MarketplacePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [marketplaceCourseCounts, setMarketplaceCourseCounts] = useState<Record<string, number>>({});

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

    const fetchData = useCallback(async () => {
        if (user) {
            const [userCourses, allMarketplaceCourses] = await Promise.all([
                getCoursesForUser(user.uid),
                getAllMarketplaceCourses()
            ]);
            setCourses(userCourses);
            
            const counts = allMarketplaceCourses.reduce((acc, course) => {
                if (course.category) {
                    acc[course.category] = (acc[course.category] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
            setMarketplaceCourseCounts(counts);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteCourse = async (courseId: string) => {
        const originalCourses = courses;
        setCourses(prev => prev.filter(c => c.id !== courseId));
        // No active course logic needed here
    
        try {
            await deleteCourse(courseId);
        } catch (error) {
            console.error("Error deleting course from DB:", error);
            // Revert UI on failure
            setCourses(originalCourses);
        }
    };

    if (loading || !isClient || !user || !user.emailVerified) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const sidebar = (
        <HistorySidebar
          user={user}
          courses={courses}
          activeCourseId={null} // No active course on this page
          onSelectCourse={(id) => router.push(`/learn`)}
          onCreateNew={() => router.push('/learn')}
          onDeleteCourse={handleDeleteCourse}
          onLogout={logout}
        />
    );

    const mainContent = (
        <div className="h-full p-4 md:p-8">
            <header className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl font-bold">Marketplace</h1>
                <p className="text-muted-foreground">Explore courses created by the community.</p>
            </header>
            <MarketplaceCategoryGrid categories={marketplaceCategories} courseCounts={marketplaceCourseCounts} />
        </div>
    );

    return (
        <LearnLayout
            sidebar={sidebar}
            mainContent={mainContent}
        />
    );
}
