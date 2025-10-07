
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import { getCoursesForUser, getMarketplaceCourses, deleteCourse, toggleLikeOnMarketplaceCourse, addCourseFromMarketplace } from '@/lib/firestore';
import type { Course, MarketplaceCourse } from '@/lib/types';
import { marketplaceCategories } from '@/lib/marketplace-categories';
import { Button } from '@/components/ui/button';
import { MarketplaceCourseCard } from '@/components/marketplace/marketplace-course-card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function MarketplaceCategoryPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const category = typeof params.category === 'string' ? decodeURIComponent(params.category) : '';

    const [userCourses, setUserCourses] = useState<Course[]>([]);
    const [marketplaceCourses, setMarketplaceCourses] = useState<MarketplaceCourse[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const categoryInfo = marketplaceCategories.find(c => c.id === category);

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
        if (!user || !category) return;
        setPageLoading(true);
        try {
            const [userCoursesData, marketplaceCoursesData] = await Promise.all([
                getCoursesForUser(user.uid),
                getMarketplaceCourses(category),
            ]);
            setUserCourses(userCoursesData);
            setMarketplaceCourses(marketplaceCoursesData);
        } catch (error) {
            console.error("Error fetching page data:", error);
            toast({
                variant: 'destructive',
                title: "Error loading page",
                description: "Could not fetch marketplace data. Please try again."
            })
        } finally {
            setPageLoading(false);
        }
    }, [user, category, toast]);

    useEffect(() => {
        if(user) {
            fetchData();
        }
    }, [user, fetchData]);

    const filteredAndSortedCourses = useMemo(() => {
        const filtered = marketplaceCourses.filter(course => {
            const query = searchQuery.toLowerCase();
            const topicMatch = course.topic.toLowerCase().includes(query);
            const userMatch = course.userName?.toLowerCase().includes(query) ?? false;
            const description = JSON.parse(course.outline).map((o: any) => o.description).join(' ');
            const descriptionMatch = description.toLowerCase().includes(query);
            return topicMatch || userMatch || descriptionMatch;
        });

        return filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }, [marketplaceCourses, searchQuery]);


    const handleDeleteCourse = async (courseId: string) => {
        const originalCourses = userCourses;
        setUserCourses(prev => prev.filter(c => c.id !== courseId));
        try {
            await deleteCourse(courseId);
        } catch (error) {
            console.error("Error deleting course from DB:", error);
            setUserCourses(originalCourses);
        }
    };
    
    const handleLikeToggle = async (courseId: string, userId: string) => {
        const originalCourses = [...marketplaceCourses];
        setMarketplaceCourses(prevCourses => 
            prevCourses.map(course => {
                if (course.marketplaceId === courseId) {
                    const isLiked = course.likedBy?.includes(userId);
                    const newLikes = (course.likes || 0) + (isLiked ? -1 : 1);
                    const newLikedBy = isLiked 
                        ? course.likedBy?.filter(id => id !== userId)
                        : [...(course.likedBy || []), userId];
                    return { ...course, likes: newLikes, likedBy: newLikedBy };
                }
                return course;
            })
        );
        
        try {
            await toggleLikeOnMarketplaceCourse(courseId, userId);
        } catch (error) {
            console.error("Error toggling like:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not update like status."});
            setMarketplaceCourses(originalCourses);
        }
    };

    const handleAddCourseFromMarketplace = async (course: MarketplaceCourse) => {
        if (!user) {
            throw new Error("User not authenticated");
        }
        await addCourseFromMarketplace(course, user.uid, user.displayName || "You");
        await fetchData();
    };

    const handleSelectCourse = (id: string) => {
        sessionStorage.setItem('selectedCourseId', id);
        router.push('/learn');
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
          courses={userCourses}
          activeCourseId={null}
          onSelectCourse={handleSelectCourse}
          onCreateNew={() => router.push('/learn')}
          onDeleteCourse={handleDeleteCourse}
          onLogout={logout}
        />
    );

    const mainContent = (
        <div className="h-full p-4 md:p-8">
            <header className="mb-8">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/marketplace">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                </Button>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="font-headline text-3xl md:text-4xl font-bold capitalize">{categoryInfo?.name || category}</h1>
                        <p className="text-muted-foreground max-w-xl">{categoryInfo?.description}</p>
                    </div>
                    <div className='relative flex-1 md:flex-none w-full sm:w-auto'>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search courses..."
                            className="pl-10 w-full md:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {pageLoading ? (
                 <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAndSortedCourses.length > 0 ? (
                        filteredAndSortedCourses.map(course => (
                            <MarketplaceCourseCard 
                                key={course.marketplaceId} 
                                course={course}
                                currentUserId={user.uid}
                                onLikeToggle={handleLikeToggle}
                                onAddCourse={handleAddCourseFromMarketplace}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground py-16">
                            <p>No courses found for this category{searchQuery && ' matching your search'}.</p>
                            {searchQuery ? (
                                <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
                            ) : (
                                <p>Why not be the first to upload one?</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <LearnLayout
            sidebar={sidebar}
            mainContent={mainContent}
        />
    );
}
