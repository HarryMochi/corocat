"use client";

import { useState } from 'react';
import type { Course } from "@/lib/types";
import { Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { shareCourseWithFriends } from "@/lib/firestore";
import type { User } from 'firebase/auth';

interface ShareDialogProps {
    user: User | null;
    friends: any[];
    course: Course | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function ShareDialog({ user, friends, course, isOpen, onOpenChange }: ShareDialogProps) {
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [isSharing, setIsSharing] = useState(false);
    const { toast } = useToast();

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length > 1) return names[0][0] + names[names.length - 1][0];
        return name[0];
    }

    const handleShareCourse = async () => {
        if (!course || !user || selectedFriends.length === 0) return;
        setIsSharing(true);
        try {
            await shareCourseWithFriends(course, selectedFriends, { uid: user.uid, displayName: user.displayName });
            toast({ title: "Success", description: "Course shared successfully!" });
            onOpenChange(false);
            setSelectedFriends([]);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share "{course?.topic}"</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <h4 className="font-medium text-sm mb-2">Select friends to share with:</h4>
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                            {friends.map(friend => (
                                <div key={friend.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`friend-dialog-${friend.id}`}
                                        onCheckedChange={(checked) => {
                                            setSelectedFriends(prev => checked ? [...prev, friend.id] : prev.filter(id => id !== friend.id))
                                        }}
                                    />
                                    <label htmlFor={`friend-dialog-${friend.id}`} className="text-sm flex items-center gap-2 cursor-pointer">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={friend.photoURL} />
                                            <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                                        </Avatar>
                                        {friend.displayName}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleShareCourse} disabled={isSharing || selectedFriends.length === 0}>
                        {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                        Share
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}