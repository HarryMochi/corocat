'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfileData, getCoursesForUser, updateUserProfile, sendFriendRequest } from '@/lib/firestore';
import { Loader2, ArrowLeft, Github, Twitter, Linkedin, BookOpen, Edit, Youtube, Globe, UserPlus, Check, Upload } from 'lucide-react';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import type { Course } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserProfile {
    displayName: string;
    creationTime: string;
    photoURL?: string;
    aboutMe?: string;
    socials?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
        youtube?: string;
        website?: string;
    };
    favoriteCourses?: string[];
    friends?: string[];
}

const ABOUT_ME_LIMIT = 300;

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [areAlreadyFriends, setAreAlreadyFriends] = useState(false);

    // About Me
    const [aboutMe, setAboutMe] = useState("");
    const [isAboutMeOpen, setAboutMeOpen] = useState(false);

    // Socials
    const [socials, setSocials] = useState({ github: '', twitter: '', linkedin: '', youtube: '', website: '' });
    const [socialsErrors, setSocialsErrors] = useState({ github: '', linkedin: '', twitter: '', youtube: '', website: '' });
    const [isSocialsOpen, setSocialsOpen] = useState(false);

    // Favorite courses
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [isCoursesOpen, setCoursesOpen] = useState(false);

    // Profile picture upload
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [pfpPreview, setPfpPreview] = useState<string | null>(null);
    const [isPfpOpen, setIsPfpOpen] = useState(false);
    const [isSavingPfp, setIsSavingPfp] = useState(false);

    const fetchProfileData = useCallback(async () => {
        if (!userId) return;
        setPageLoading(true);
        try {
            const userData = await getUserProfileData(userId);
            setProfile(userData);
            setAboutMe(userData.aboutMe || '');
            setSocials(userData.socials || { github: '', twitter: '', linkedin: '', youtube: '', website: '' });
            setSelectedCourses(userData.favoriteCourses || []);
            if (user && userData.friends?.includes(user.uid)) {
                setAreAlreadyFriends(true);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setPageLoading(false);
        }
    }, [userId, user]);

    const fetchSidebarCourses = useCallback(async () => {
        if (user && isOwner) {
            const userCourses = await getCoursesForUser(user.uid);
            setSidebarCourses(userCourses);
        }
    }, [user, isOwner]);

    useEffect(() => {
        if (user) setIsOwner(user.uid === userId);
    }, [user, userId]);

    useEffect(() => {
        fetchProfileData();
        if (isOwner) fetchSidebarCourses();
    }, [isOwner, fetchProfileData, fetchSidebarCourses]);

    const handleSaveAboutMe = async () => {
        if (!user) return;
        await updateUserProfile(user.uid, { aboutMe });
        await fetchProfileData();
        setAboutMeOpen(false);
    };

    const handleSaveSocials = async () => {
        if (!user) return;
        const errors = { github: '', linkedin: '', twitter: '', youtube: '', website: '' };
        let hasError = false;

        (Object.keys(socials) as Array<keyof typeof socials>).forEach(key => {
            const url = socials[key];
            if (url && !url.startsWith('https://')) {
                errors[key] = "URL must start with https://";
                hasError = true;
            }
        });

        setSocialsErrors(errors);
        if (hasError) return;

        await updateUserProfile(user.uid, { socials });
        await fetchProfileData();
        setSocialsOpen(false);
    };

    const handlePfpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit for Base64
                alert('File size must be less than 2MB');
                e.target.value = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPfpPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        
        setProfilePicture(file);
    };

    const handleSavePfp = async () => {
        if (!user || !pfpPreview) return;
    
        setIsSavingPfp(true);
        try {
            const photoURL = pfpPreview; // Base64 string
    
            // 1. Update Firestore
            await updateUserProfile(user.uid, { photoURL });
    
            // 2. Refetch profile data
            await fetchProfileData();
            
            // 3. Close dialog and reset
            setIsPfpOpen(false);
            setProfilePicture(null);
            setPfpPreview(null);

        } catch (err) {
            console.error("Error saving PFP:", err);
            alert('Failed to update profile picture. Please try again.');
        } finally {
            setIsSavingPfp(false);
        }
    };

    const handleSaveFavoriteCourses = async () => {
        if (!user) return;
        await updateUserProfile(user.uid, { favoriteCourses: selectedCourses });
        await fetchProfileData();
        setCoursesOpen(false);
    };

    const handleCourseSelection = (courseTopic: string) => {
        const isSelected = selectedCourses.includes(courseTopic);
        if (isSelected) {
            setSelectedCourses(current => current.filter(topic => topic !== courseTopic));
        } else if (selectedCourses.length < 3) {
            setSelectedCourses(current => [...current, courseTopic]);
        }
    };

    const handleAddFriend = async () => {
        if (!user || !profile) return;
        await sendFriendRequest(user.uid, userId);
        setAreAlreadyFriends(true);
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        return names.length > 1 ? names[0][0] + names[names.length - 1][0] : name[0];
    };

    const hasSocials = profile?.socials && Object.values(profile.socials).some(s => s);

    const sidebar = (
        <HistorySidebar
            user={user}
            courses={sidebarCourses}
            activeCourseId={null}
            onSelectCourse={() => router.push(`/learn`)}
            onCreateNew={() => router.push('/learn')}
            onDeleteCourse={() => {}}
            onLogout={logout}
        />
    );

    if (loading || pageLoading) {
        return <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>;
    }

    if (!user) {
        const loginPrompt = <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg font-semibold">Log in first to access another user's profile</p>
            <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
        </div>;
        return <LearnLayout sidebar={sidebar} mainContent={loginPrompt} />;
    }

    if (!profile) {
        return <LearnLayout sidebar={sidebar} mainContent={<div className="flex items-center justify-center h-full">User not found.</div>} />;
    }

    const mainContent = (
        <div className="h-full p-4 md:p-8 max-w-4xl mx-auto text-foreground">
            {/* HEADER */}
            <header className="flex justify-between items-center mb-8">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Back to Marketplace</Link>
                </Button>
            </header>

            {/* PROFILE PICTURE */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                <div className="relative">
                    <Dialog open={isPfpOpen} onOpenChange={setIsPfpOpen}>
                        <DialogTrigger asChild disabled={!isOwner}>
                            <div className="relative group">
                                <Avatar className={`h-32 w-32 border-4 border-primary/20 ${isOwner ? 'cursor-pointer' : ''}`}>
                                    <AvatarImage src={profile.photoURL} alt={profile.displayName} className="object-cover" />
                                    <AvatarFallback className="text-5xl">{getInitials(profile.displayName)}</AvatarFallback>
                                </Avatar>
                                {isOwner && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-8 w-8 text-white" />
                                    </div>
                                )}
                            </div>
                        </DialogTrigger>
                        {isOwner && (
                            <DialogContent>
                                <DialogHeader><DialogTitle>Change Profile Picture</DialogTitle></DialogHeader>
                                <div className="flex justify-center mb-4">
                                    <div className="relative h-64 w-64 bg-muted-foreground/20 rounded-full overflow-hidden flex items-center justify-center">
                                        {pfpPreview ? (
                                            <img src={pfpPreview} alt="Profile preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-muted-foreground">Image preview</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-destructive font-bold text-center mb-4">NOTE: Inappropriate profile pictures will result in a permanent ban from this website.</p>
                                <Input type="file" accept="image/*" onChange={handlePfpFileChange} className="mb-4"/>
                                <Button onClick={handleSavePfp} disabled={!profilePicture || isSavingPfp}>
                                    {isSavingPfp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
                                </Button>
                            </DialogContent>
                        )}
                    </Dialog>
                </div>
                <div className="text-center md:text-left flex-grow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold font-headline text-primary">{profile.displayName}</h1>
                            <p className="text-muted-foreground mt-1">Member since {format(new Date(profile.creationTime), 'MMMM yyyy')}</p>
                        </div>
                        {!isOwner && (
                            <Button onClick={handleAddFriend} disabled={areAlreadyFriends} size="sm" className="rounded-md">
                                {areAlreadyFriends ? <><Check className="mr-2 h-4 w-4"/> Friends</> : <><UserPlus className="mr-2 h-4 w-4"/> Add Friend</>}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ABOUT ME, SOCIALS, FAVORITE COURSES */}
            <div className="space-y-12">
                {/* About Me */}
                <Card className="bg-card/50 border-border/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-headline text-2xl text-primary">About Me</CardTitle>
                        {isOwner && (
                            <Dialog open={isAboutMeOpen} onOpenChange={setAboutMeOpen}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon"><Edit className="h-5 w-5" /></Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Edit About Me</DialogTitle></DialogHeader>
                                    <Textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={5} maxLength={ABOUT_ME_LIMIT}/>
                                    <div className="text-right text-sm text-muted-foreground">{aboutMe.length} / {ABOUT_ME_LIMIT}</div>
                                    <Button onClick={handleSaveAboutMe}>Save</Button>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent><p className="text-muted-foreground text-lg">{profile.aboutMe || 'This user doesn\'t have an about me.'}</p></CardContent>
                </Card>

                {/* Socials */}
                <Card className="bg-card/50 border-border/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-headline text-2xl text-primary">My Socials</CardTitle>
                        {isOwner && (
                            <Dialog open={isSocialsOpen} onOpenChange={setSocialsOpen}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon"><Edit className="h-5 w-5" /></Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Edit Social Links</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        {['github','linkedin','twitter','youtube','website'].map(key => (
                                            <div key={key}>
                                                <Input placeholder={`${key} URL`} value={socials[key as keyof typeof socials]} onChange={(e) => setSocials({...socials,[key]:e.target.value})}/>
                                                {socialsErrors[key as keyof typeof socialsErrors] && <p className="text-red-500 text-sm mt-1">{socialsErrors[key as keyof typeof socialsErrors]}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={handleSaveSocials}>Save</Button>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        {hasSocials ? (
                            <TooltipProvider delayDuration={200}>
                                {profile.socials?.github && <Tooltip><TooltipTrigger asChild><a href={profile.socials.github} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Github className="h-6 w-6" /></Button></a></TooltipTrigger><TooltipContent><p>{profile.socials.github}</p></TooltipContent></Tooltip>}
                                {profile.socials?.linkedin && <Tooltip><TooltipTrigger asChild><a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Linkedin className="h-6 w-6" /></Button></a></TooltipTrigger><TooltipContent><p>{profile.socials.linkedin}</p></TooltipContent></Tooltip>}
                                {profile.socials?.twitter && <Tooltip><TooltipTrigger asChild><a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Twitter className="h-6 w-6" /></Button></a></TooltipTrigger><TooltipContent><p>{profile.socials.twitter}</p></TooltipContent></Tooltip>}
                                {profile.socials?.youtube && <Tooltip><TooltipTrigger asChild><a href={profile.socials.youtube} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Youtube className="h-6 w-6" /></Button></a></TooltipTrigger><TooltipContent><p>{profile.socials.youtube}</p></TooltipContent></Tooltip>}
                                {profile.socials?.website && <Tooltip><TooltipTrigger asChild><a href={profile.socials.website} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Globe className="h-6 w-6" /></Button></a></TooltipTrigger><TooltipContent><p>{profile.socials.website}</p></TooltipContent></Tooltip>}
                            </TooltipProvider>
                        ) : (
                            <p className="text-muted-foreground">This user doesn't have any socials.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Favorite Courses */}
                <Card className="bg-card/50 border-border/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-headline text-2xl text-primary">My Favorite Courses</CardTitle>
                        {isOwner && (
                            <Dialog open={isCoursesOpen} onOpenChange={setCoursesOpen}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon"><Edit className="h-5 w-5" /></Button></DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader><DialogTitle>Select up to 3 Favorite Courses</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-[60vh] overflow-y-auto">
                                        {sidebarCourses.map(course => (
                                            <Card key={course.id} className={`cursor-pointer transition-all ${selectedCourses.includes(course.topic) ? 'border-primary shadow-lg' : 'border-border'}`} onClick={() => handleCourseSelection(course.topic)}>
                                                <CardHeader><CardTitle className="text-lg">{course.topic}</CardTitle></CardHeader>
                                                <CardContent>{course.steps[0]?.content && <p className="text-sm text-muted-foreground line-clamp-3">{course.steps[0].content.substring(0, 100)}</p>}</CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <Button onClick={handleSaveFavoriteCourses}>Save</Button>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profile.favoriteCourses?.length ? (
                            profile.favoriteCourses.map((course, index) => (
                                <div key={index} className="bg-muted/50 p-6 rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                                    <BookOpen className="h-8 w-8 text-primary" />
                                    <h3 className="font-semibold text-lg">{course}</h3>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground col-span-full">This user doesn't have any favorite courses.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return <LearnLayout sidebar={sidebar} mainContent={mainContent} />;
}
