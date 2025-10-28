
"use client";

import { useState, useEffect } from 'react';
import type { Course } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, LogOut, MoreHorizontal, Globe, User as UserIcon, Mail, Users, UserPlus, Check, X, Bell, Loader2, Share2 } from "lucide-react";
import Logo from "./logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import type { User } from "firebase/auth";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, getNotifications, markAllNotificationsAsRead, addSharedCourse } from "@/lib/firestore";

interface HistorySidebarProps {
  user: User | null;
  courses: Course[];
  activeCourseId: string | null;
  onSelectCourse: (id: string) => void;
  onCreateNew: () => void;
  onDeleteCourse: (id: string) => void;
  onLogout: () => void;
  onShareCourse?: (course: Course) => void;
  onCourseAdded?: () => void;
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
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [friendEmail, setFriendEmail] = useState("");
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setHasMounted(true);
    if (user) {
      const unsubscribeFriends = getFriends(user.uid, setFriends);
      const unsubscribeRequests = getFriendRequests(user.uid, setFriendRequests);
      const unsubscribeNotifications = getNotifications(user.uid, (newNotifications) => {
          setNotifications(newNotifications);
          setUnreadNotifications(newNotifications.filter(n => !n.read).length);
      });

      return () => {
          unsubscribeFriends();
          unsubscribeRequests();
          unsubscribeNotifications();
      }
    }
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return names[0][0] + names[names.length - 1][0];
    return name[0];
  }

  const handleSendRequest = async () => {
    if (!friendEmail.trim() || !user) return;
    try {
      await sendFriendRequest(user.uid, friendEmail);
      toast({ title: "Success", description: `Friend request sent to ${friendEmail}.` });
      setFriendEmail("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleAcceptRequest = async (request: any) => {
    if (!user) return;
    try {
      await acceptFriendRequest(request.id);
      toast({ title: "Success", description: "Friend request accepted." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!user) return;
    try {
      await rejectFriendRequest(id);
      toast({ title: "Success", description: "Friend request rejected." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    try {
      await removeFriend(user.uid, friendId);
      toast({ title: "Success", description: "Friend removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadNotifications === 0 || isMarkingAsRead) return;
    setIsMarkingAsRead(true);
    try {
      await markAllNotificationsAsRead(user.uid);
      toast({ title: "Success", description: "Notifications marked as read." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not mark notifications as read." });
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleAddSharedCourse = async (notification: any) => {
    if (!user || !notification.data?.courseData) return;
    setIsAddingCourse(notification.id);
    try {
        await addSharedCourse(notification.data.courseData, user.uid, user.displayName || 'Anonymous');
        toast({ title: "Success", description: "Course added to your list!" });
        onCourseAdded?.();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsAddingCourse(null);
    }
  };

  return (
    <div className="bg-muted/50 h-full flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" /> Social
                {(friendRequests.length + unreadNotifications) > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {friendRequests.length + unreadNotifications}
                    </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Bell className="mr-2 h-4 w-4" /><span>Notifications</span>
                        {unreadNotifications > 0 && (
                            <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadNotifications}
                            </span>
                        )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-80 p-0">
                             <div className="flex items-center justify-between p-2 border-b">
                                <h4 className="font-medium text-sm">Notifications</h4>
                                {unreadNotifications > 0 && (
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllAsRead} disabled={isMarkingAsRead}>
                                        {isMarkingAsRead ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Marking...</> : 'Mark all as read'}
                                    </Button>
                                )}
                            </div>
                            <ScrollArea className="h-[200px]">
                                {notifications.length > 0 ? notifications.map(notif => (
                                     <div key={notif.id} className={`p-2 border-b last:border-b-0 ${!notif.read ? 'bg-blue-500/10' : ''}`}>
                                        <p className="text-sm text-muted-foreground leading-snug">{notif.message}</p>
                                        {notif.data?.type === 'course-share' && (
                                            <Button size="sm" className="mt-2 w-full" onClick={() => handleAddSharedCourse(notif)} disabled={isAddingCourse === notif.id}>
                                                {isAddingCourse === notif.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} 
                                                Add to my courses
                                            </Button>
                                        )}
                                        <p className="text-xs text-muted-foreground/70 pt-1">
                                            {hasMounted && formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                )) : <p className="text-xs text-muted-foreground p-4 text-center">You have no new notifications.</p>}
                            </ScrollArea>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <h4 className="font-medium text-sm px-2 py-1.5">Add Friend</h4>
                <div className="flex items-center gap-2 px-2 pb-2">
                    <Input placeholder="Enter email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} className="h-9" />
                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSendRequest} disabled={!friendEmail.trim()}><UserPlus className="h-4 w-4"/></Button>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger><Mail className="mr-2 h-4 w-4" /><span>Friend Requests ({friendRequests.length})</span></DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-56">
                            {friendRequests.length > 0 ? friendRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between px-2 py-1.5">
                                    <div className='flex items-center gap-2'>
                                        <Avatar className="h-7 w-7"><AvatarImage src={req.fromData.photoURL} /><AvatarFallback>{getInitials(req.fromData.displayName)}</AvatarFallback></Avatar>
                                        <span className="text-sm">{req.fromData.displayName}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleAcceptRequest(req)}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleRejectRequest(req.id)}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            )) : <p className="text-xs text-muted-foreground p-2">No pending requests.</p>}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                 <DropdownMenuSeparator />
                 <h4 className="font-medium text-sm px-2 py-1.5">Friends ({friends.length})</h4>
                 <ScrollArea className="h-[200px]">
                    {friends.length > 0 ? friends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between pr-2 pl-2 py-1.5 group">
                            <Link href={`/profile/${friend.id}`} className="flex items-center gap-2 group-hover:underline">
                                <Avatar className="h-7 w-7"><AvatarImage src={friend.photoURL} /><AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback></Avatar>
                                <span className="text-sm font-medium">{friend.displayName}</span>
                            </Link>
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100"><X className="h-4 w-4"/></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove {friend.displayName} from your friends list.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveFriend(friend.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )) : <p className="text-xs text-muted-foreground p-2">You have no friends yet.</p>}
                 </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={onCreateNew} className="w-full"><Plus className="mr-2 h-4 w-4" /><span>New Course</span></Button>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          {courses.map((course) => {
            const completedSteps = course.steps.filter(s => s.completed).length;
            const totalSteps = course.steps.length;
            return (
              <div key={course.id} className="group relative">
                <Button variant={activeCourseId === course.id ? "secondary" : "ghost"} onClick={() => onSelectCourse(course.id)} className="w-full justify-start text-left h-auto py-2 pl-3 pr-10">
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                     <span className="font-medium truncate">{course.topic}</span>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{hasMounted ? formatDistanceToNow(new Date(course.createdAt), { addSuffix: true }) : null}</span>
                      <span className="font-medium">{completedSteps}/{totalSteps}</span>
                    </div>
                  </div>
                </Button>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShareCourse && onShareCourse(course)}><Share2 className="h-4 w-4" /></Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the course on "{course.topic}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteCourse(course.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="mt-auto p-2">
        {user && (
            <>
                <Separator className="my-2" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start items-center p-2 h-auto text-left flex-wrap">
                            <div className="flex items-center gap-2 w-full">
                            <Avatar className="h-8 w-8"><AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} /><AvatarFallback>{getInitials(user.displayName)}</AvatarFallback></Avatar>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-medium truncate text-sm">{user.displayName || "User"}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                            </div>
                            <MoreHorizontal className="h-4 w-4 ml-auto" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                        <DropdownMenuItem asChild><Link href={`/profile/${user.uid}`}><UserIcon className="mr-2 h-4 w-4" /><span>My Profile</span></Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </>
        )}
      </div>
    </div>
  );
}
