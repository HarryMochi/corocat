'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { getCoursesForUser, updateUserProfile } from '@/lib/firestore';
import { sendFriendRequest } from '@/app/sendFriendRequestClient';
import { Loader2, ArrowLeft, Github, Twitter, Linkedin, BookOpen, Edit, Youtube, Globe, UserPlus, Check, Upload, Crown } from 'lucide-react';
import LearnLayout from '@/components/learn-layout';
import HistorySidebar from '@/components/history-sidebar';
import type { Course, User } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/uploadToCloudinary';
import { AlertDialogHeader, AlertDialogFooter, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogTitle, AlertDialogContent } from '@/components/ui/alert-dialog';

async function getUserProfileData(userId: string): Promise<any> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  }
  throw new Error("User not found");
}

interface UserProfile {
  displayName: string;
  creationTime: string;
  photoURL?: string;
  aboutMe?: string;
  isPremium?: boolean;
  plan?: 'free' | 'premium';
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Name
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isNameEditing, setIsNameEditing] = useState(false);

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
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmSavePfp = () => {
    setShowConfirm(false);
    handleSavePfp(); // Your original save function
  };

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setPageLoading(true);
    try {
      const userData = await getUserProfileData(userId);
      setProfile(userData);
      setNewDisplayName(userData.displayName || '');
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



  const handleSaveDisplayName = async () => {
    if (!user || !newDisplayName) return;

    try {
      // 1. Update Firestore
      await updateUserProfile(user.uid, { displayName: newDisplayName });

      // 2. Update Firebase Auth Profile
      await updateProfile(user, { displayName: newDisplayName });

      toast({
        title: "Success",
        description: "Display name updated!",
      });

      // 3. Refresh UI
      await fetchProfileData();
      setIsNameEditing(false);

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };


  const handleSaveAboutMe = async () => {
    if (!user) return;

    try {
      await updateUserProfile(user.uid, { aboutMe });
      await fetchProfileData();
      setAboutMeOpen(false);
      toast({ title: "Success", description: "About Me updated!" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to update About Me.", variant: "destructive" });
    }
  };

  const handleSaveSocials = async () => {
    if (!user) return;

    const errors: { [key in keyof typeof socials]: string } = { github: '', linkedin: '', twitter: '', youtube: '', website: '' };
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

    try {
      await updateUserProfile(user.uid, { socials });
      await fetchProfileData();
      setSocialsOpen(false);
      toast({ title: "Success", description: "Social links updated!" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to update social links.", variant: "destructive" });
    }
  };

  const handleSavePfp = async () => {
    if (!user || !pfpPreview) return;

    setIsSavingPfp(true);

    try {
      // 1️⃣ Fetch Firestore user document
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const userData = snap.data();
      let photoUploadCount = userData?.photoUploadCount || 0;
      let lastPhotoUpload = userData?.lastPhotoUpload
        ? new Date(userData.lastPhotoUpload)
        : null;

      const now = new Date();
      const sameMonth =
        lastPhotoUpload &&
        lastPhotoUpload.getMonth() === now.getMonth() &&
        lastPhotoUpload.getFullYear() === now.getFullYear();

      // 2️⃣ Enforce monthly upload limit
      if (sameMonth && photoUploadCount >= 3) {
        toast({
          title: "Upload limit reached",
          description: "You can upload only 3 profile pictures per month.",
          variant: "destructive",
        });
        setIsSavingPfp(false);
        return;
      }

      // 3️⃣ Convert base64 to Blob
      const base64 = pfpPreview.split(",")[1];
      const blob = new Blob(
        [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
        { type: "image/jpeg" }
      );

      const filePath = `pfps/${user.uid}.jpg`;

      // 4️⃣ Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("corocat")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw uploadError;
      }

      // 5️⃣ Get public URL + cache buster
      const { data: urlData } = supabase.storage
        .from("corocat")
        .getPublicUrl(filePath);

      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 6️⃣ Update Firestore
      await updateDoc(userRef, {
        photoURL: imageUrl,
        photoUploadCount: sameMonth ? photoUploadCount + 1 : 1,
        lastPhotoUpload: now.toISOString(),
      });

      // 7️⃣ Update Firebase Auth profile
      await updateProfile(user, { photoURL: imageUrl });

      // 8️⃣ Refresh frontend
      await fetchProfileData();

      toast({
        title: "Success",
        description: "Profile picture updated!",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPfp(false);
    }
  };


  const handleSaveFavoriteCourses = async () => {
    if (!user) return;

    try {
      await updateUserProfile(user.uid, { favoriteCourses: selectedCourses });
      await fetchProfileData();
      setCoursesOpen(false);
      toast({ title: "Success", description: "Favorite courses updated!" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to update favorite courses.", variant: "destructive" });
    }
  };
  const handlePfpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) return;

    // Image Size Check (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Profile picture must be less than 2MB.",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    // File Type Check
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPfpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setProfilePicture(file);

      toast({
        title: "Preview Loaded",
        description: "Your new profile picture preview is ready.",
      });

    } catch (err: any) {
      console.error("Image load error:", err);
      toast({
        title: "Error",
        description: "Failed to load image preview.",
        variant: "destructive",
      });
    }
  };
  const getInitials = (name: string | null | undefined) => {
    if (!name || typeof name !== "string") return "U";

    const parts = name.trim().split(" ").filter(Boolean);

    // Single word → return first letter
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    // Multiple words → first + last initials
    const first = parts[0][0].toUpperCase();
    const last = parts[parts.length - 1][0].toUpperCase();

    return first + last;
  };
  const handleCourseSelection = (courseTopic: string) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.includes(courseTopic);

      if (isSelected) {
        return prev.filter((topic) => topic !== courseTopic);
      }


      if (prev.length >= 3) {
        toast({
          title: "Limit Reached",
          description: "You can select up to 3 favorite course topics.",
          variant: "destructive",
        });
        return prev;
      }


      return [...prev, courseTopic];
    });
  };

  const handleAddFriend = async () => {
    if (!user || !profile) return;

    try {
      await sendFriendRequest(user.uid, profile.displayName as string, user.displayName || "User", user.photoURL || "");
      setAreAlreadyFriends(true);
      toast({ title: "Success", description: "Friend request sent!" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to send friend request.", variant: "destructive" });
    }
  };

  const hasSocials = profile?.socials && Object.values(profile.socials).some(s => s);

  const sidebar = (
    <HistorySidebar
      user={user}
      courses={sidebarCourses}
      activeCourseId={null}
      onSelectCourse={() => router.push(`/learn`)}
      onCreateNew={() => router.push('/learn')}
      onDeleteCourse={() => { }}
      onLogout={logout}
      onCourseAdded={async () => { await fetchSidebarCourses(); }}
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
                <Avatar className={`h-32 w-32 border-4 ${profile.isPremium || profile.plan === 'premium' ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-primary/20'} ${isOwner ? 'cursor-pointer' : ''}`}>
                  <AvatarImage src={profile.photoURL} alt={profile.displayName} className="object-cover" />
                  <AvatarFallback style={{ backgroundColor: '#f5f5dc' }} className="text-5xl text-black">{getInitials(profile.displayName)}</AvatarFallback>
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
                <Input type="file" accept="image/*" onChange={handlePfpFileChange} className="mb-4" />
                <Button onClick={() => { setShowConfirm(true) }} disabled={!profilePicture || isSavingPfp}>
                  {isSavingPfp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
                </Button>
              </DialogContent>
            )}
          </Dialog>
        </div>
        <div className="text-center md:text-left flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className={`text-4xl font-bold font-headline ${profile.isPremium || profile.plan === 'premium' ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent' : 'text-primary'}`}>{profile.displayName}</h1>
              {(profile.isPremium || profile.plan === 'premium') && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <Crown className="w-3 h-3" />
                  PREMIUM
                </div>
              )}
              {isOwner && (
                <Dialog open={isNameEditing} onOpenChange={setIsNameEditing}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setNewDisplayName(profile.displayName)}><Edit className="h-5 w-5" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Display Name</DialogTitle></DialogHeader>
                    <Input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
                    <Button onClick={handleSaveDisplayName}>Save</Button>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {!isOwner && (
              <Button onClick={handleAddFriend} disabled={areAlreadyFriends} size="sm" className="rounded-md">
                {areAlreadyFriends ? <><Check className="mr-2 h-4 w-4" /> Friends</> : <><UserPlus className="mr-2 h-4 w-4" /> Add Friend</>}
              </Button>
            )}
          </div>
          {profile.creationTime && <p className="text-muted-foreground mt-1">Member since {format(new Date(profile.creationTime), 'MMMM yyyy')}</p>}
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
                  <Textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={5} maxLength={ABOUT_ME_LIMIT} />
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
                    {['github', 'linkedin', 'twitter', 'youtube', 'website'].map(key => (
                      <div key={key}>
                        <Input placeholder={`${key} URL`} value={socials[key as keyof typeof socials]} onChange={(e) => setSocials({ ...socials, [key]: e.target.value })} />
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
                        <CardContent>{(course.steps || [])[0]?.content && <p className="text-sm text-muted-foreground line-clamp-3">{(course.steps || [])[0]?.content?.substring(0, 100)}</p>}</CardContent>
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
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Image Upload</AlertDialogTitle>
            <AlertDialogDescription>
              You can only change your profile picture <b>three times per month</b>.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSavePfp}>
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );

  return <LearnLayout sidebar={sidebar} mainContent={mainContent} />;
}
