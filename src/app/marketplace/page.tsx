
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import { getCoursesForUser, deleteCourse, getAllMarketplaceCourses, addCourseToMarketplace } from '@/lib/firestore';
import type { Course } from '@/lib/types';
import MarketplaceCategoryGrid from '@/components/marketplace/marketplace-category-grid';
import { marketplaceCategories } from '@/lib/marketplace-categories';
import { CourseUploadDialog } from '@/components/marketplace/course-upload-dialog';
import { useToast } from '@/hooks/use-toast';
import { validateMarketplaceUploadAction } from '@/app/actions';

export default function MarketplacePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [marketplaceCourseCounts, setMarketplaceCourseCounts] = useState<Record<string, number>>({});
    const { toast } = useToast();

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
        try {
            await deleteCourse(courseId);
        } catch (error) {
            console.error("Error deleting course from DB:", error);
            setCourses(originalCourses);
        }
    };
    
    const handleSelectCourse = (id: string) => {
        sessionStorage.setItem('selectedCourseId', id);
        router.push('/learn');
    };

    const handleUploadCourse = async (course: Course) => {
        if (!user) return false;

        const validationResult = await validateMarketplaceUploadAction({
            courseTopic: course.topic,
            courseOutline: course.outline,
        });

        if (!validationResult.isAppropriate || !validationResult.category) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: validationResult.reason || "Our AI couldn't determine a suitable category for this course.",
            });
            return false;
        }

        try {
            const courseToUpload = { ...course, userName: user.displayName || course.userName };
            await addCourseToMarketplace(courseToUpload, validationResult.category);
            toast({
                title: "Upload Successful!",
                description: `"${course.topic}" has been added to the marketplace under the "${validationResult.category}" category.`,
            });
            fetchData();
            return true;
        } catch (error) {
            console.error("Error uploading course:", error);
            toast({
                variant: "destructive",
                title: "Upload Error",
                description: "Could not upload the course. Please try again."
            });
            return false;
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
          activeCourseId={null}
          onSelectCourse={handleSelectCourse}
          onCreateNew={() => router.push('/learn')}
          onDeleteCourse={handleDeleteCourse}
          onLogout={logout}
        />
    );

    const mainContent = (
        <div className="h-full p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Marketplace</h1>
                    <p className="text-muted-foreground">Explore courses created by the community.</p>
                </div>
                <CourseUploadDialog userCourses={courses} onUpload={handleUploadCourse} />
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
