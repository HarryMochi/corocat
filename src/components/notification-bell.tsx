'use client';

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { acceptSharedCourse } from '@/app/actions';
import { useNotifications } from '@/hooks/use-notifications';
import type { Notification } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader } from './loader';
import { clearAllNotifications } from '@/lib/clearNotification';
import { deleteNotification } from '@/lib/deleteNotification';
interface NotificationBellProps {
    onCourseAccepted: (newCourseId: string) => Promise<void>;
}

export function NotificationBell({ onCourseAccepted }: NotificationBellProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { notifications, isLoading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [isActing, setIsActing] = useState<string | null>(null);

    // 🔥 SORTED Notifications (newest first)
    const sortedNotifications = [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleAcceptCourse = async (notification: Notification) => {
        if (!user) return;
        setIsActing(notification.id);
        try {
            const result = await acceptSharedCourse(user.uid, notification.id);
            if (!result.success) throw new Error(result.message);

            toast({
                title: "Course Added!",
                description: `'${notification.relatedEntityName}' has been added to your courses.`,
            });

            await onCourseAccepted("");
            setIsOpen(false);

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsActing(null);
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        if (!user) return;
        try {
            await deleteNotification(user.uid, notificationId);
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not dismiss notification.",
                variant: "destructive",
            });
        }
    };

    const clearAll = async () => {
        if (!user) return;
        try {
            for (const n of sortedNotifications) {
                await clearAllNotifications(user.uid);
            }
        } catch {
            toast({
                title: "Error",
                description: "Could not clear notifications.",
                variant: "destructive",
            });
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        return names.length > 1
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : name[0].toUpperCase();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {unreadCount > 0 ? (
                        <>
                            <BellRing className="h-6 w-6 text-yellow-500" />
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                        </>
                    ) : (
                        <Bell className="h-6 w-6" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 md:w-96" align="end">
                <div className="p-4 flex items-center justify-between">
                    <h4 className="font-medium leading-none">Notifications</h4>

                    {sortedNotifications.length > 0 && (
                        <Button size="sm" variant="outline" onClick={clearAll}>
                            Clear All
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader />
                    </div>
                ) : sortedNotifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                        You have no new notifications.
                    </p>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {sortedNotifications.map(n => (
                            <div
                                key={n.id}
                                className="p-3 border-b last:border-b-0 hover:bg-muted/50"
                            >
                                <div className="flex items-start space-x-3">
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage
                                            src={n.fromUserAvatar || undefined}
                                            alt={n.fromUserName}
                                        />
                                        <AvatarFallback>
                                            {getInitials(n.fromUserName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 text-sm">
                                        <p>
                                            <span className="font-semibold">
                                                {n.fromUserName}
                                            </span>

                                            {n.type === 'friend_request' &&
                                                ` sent you a friend request. ${n.message}`}

                                            {n.type === 'friend_request_accepted' &&
                                                ' accepted your friend request.'}
                                            {n.type === 'friend_request_rejected' &&
                                                ' rejected your friend request.'}
                                            {n.type === 'friend_removed' &&
                                                ' removed you from friends.'}

                                            {n.type === 'course_shared' &&
                                                ` shared the course "${n.relatedEntityName}" with you.`}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {n.type === 'friend_request' && (
                                    <div className="mt-2 flex justify-end space-x-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteNotification(n.id)}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                )}

                                {n.type === 'course_shared' && (
                                    <div className="mt-2 flex justify-end space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={isActing === n.id}
                                            onClick={() => handleDeleteNotification(n.id)}
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={isActing === n.id}
                                            onClick={() => handleAcceptCourse(n)}
                                        >
                                            {isActing === n.id ? (
                                                <Loader className="h-4 w-4" />
                                            ) : (
                                                'Accept'
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {n.type === 'friend_request_accepted' && (
                                    <div className="mt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteNotification(n.id)}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                )}

                                {n.type === 'friend_request_rejected' && (
                                    <div className="mt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteNotification(n.id)}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                )}

                                {n.type === 'friend_removed' && (
                                    <div className="mt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteNotification(n.id)}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}