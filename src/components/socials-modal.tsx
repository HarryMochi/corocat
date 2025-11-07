
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { UsersIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest, sendFriendRequest, getFriends, removeFriend } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import { Loader } from './loader';
import { ConfirmationDialog } from './confirmation-dialog';

// Friend Request Interface
interface FriendRequest {
  id: string;
  senderId: string;
  senderDisplayName: string;
  senderAvatar: string;
}

// Add Friend Form Schema
const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

// Combined Socials Modal Component
export function SocialsModal({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Friend Requests State
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Friends List State
  const [friends, setFriends] = useState<(User & { id: string })[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Add Friend State
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const addFriendForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // Remove Friend Confirmation State
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
  };

  async function fetchSocialsData() {
    if (!user) return;

    setIsLoadingRequests(true);
    setIsLoadingFriends(true);

    try {
        const [requestsData, friendsData] = await Promise.all([
            getFriendRequests(user.uid),
            getFriends(user.uid)
        ]);
        setRequests(requestsData);
        setFriends(friendsData as (User & { id: string })[]);
    } catch (error) {
        console.error("Error fetching social data:", error);
        toast({ title: 'Error', description: 'Could not load your social information.', variant: 'destructive' });
    } finally {
        setIsLoadingRequests(false);
        setIsLoadingFriends(false);
    }
  }

  // Friend Request Actions
  const handleAccept = async (senderId: string) => {
    if (!user) return;
    try {
      await acceptFriendRequest(senderId, user.uid);
      toast({ title: 'Success', description: 'Friend request accepted!' });
      fetchSocialsData(); // Refetch all data
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleReject = async (senderId: string) => {
    if (!user) return;
    try {
      await rejectFriendRequest(senderId, user.uid);
      setRequests(requests.filter(req => req.senderId !== senderId));
      toast({ title: 'Success', description: 'Friend request rejected.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  
  // Remove Friend Action
  const confirmRemoveFriend = (friendId: string) => {
    setFriendToRemove(friendId);
    setIsConfirmingRemove(true);
  };

  const handleRemoveFriend = async () => {
      if (!user || !friendToRemove) return;
      try {
          await removeFriend(user.uid, friendToRemove);
          toast({ title: 'Success', description: 'Friend removed.' });
          fetchSocialsData(); // Refetch all data
      } catch (error: any) {
          toast({ title: 'Error', description: 'Could not remove friend.', variant: 'destructive' });
      }
  };

  // Add Friend Action
  async function onAddFriendSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to send a friend request.', variant: 'destructive' });
      return;
    }

    setIsSendingRequest(true);
    try {
      const sender = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
      };
      await sendFriendRequest(sender as User, values.email);
      toast({ title: 'Success', description: 'Friend request sent!' });
      addFriendForm.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSendingRequest(false);
    }
  }

  return (
    <>
      <Dialog onOpenChange={(isOpen) => {
        if (isOpen) {
          fetchSocialsData();
        }
      }}>
        <DialogTrigger asChild>
          {children ?? (
            <Button variant="ghost" size="icon">
              <UsersIcon className="h-6 w-6" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Socials</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Add Friend Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Add a Friend</CardTitle>
                  <CardDescription>Enter a user's email to send them a friend request.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addFriendForm.handleSubmit(onAddFriendSubmit)} className="space-y-4">
                    <Input
                      placeholder="Enter your friend's email"
                      {...addFriendForm.register('email')}
                    />
                    {addFriendForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{addFriendForm.formState.errors.email.message}</p>
                    )}
                    <Button type="submit" disabled={isSendingRequest}>
                      {isSendingRequest ? <Loader className="h-4 w-4" /> : 'Send Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Friend Requests Section */}
              <Card>
                <CardHeader>
                    <CardTitle>Friend Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader />
                    </div>
                  ) : requests.length === 0 ? (
                    <p className='text-muted-foreground'>You have no new friend requests.</p>
                  ) : (
                    <div className="space-y-4">
                      {requests.map(request => (
                        <div key={request.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={request.senderAvatar} alt={request.senderDisplayName || 'User Avatar'} />
                              <AvatarFallback>{getInitials(request.senderDisplayName)}</AvatarFallback>
                            </Avatar>
                            <span>{request.senderDisplayName || 'Unnamed User'}</span>
                          </div>
                          <div className="space-x-2">
                            <Button onClick={() => handleAccept(request.senderId)} size="sm" variant={"secondary"}>Accept</Button>
                            <Button onClick={() => handleReject(request.senderId)} size="sm" variant="destructive">Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - My Friends */}
            <Card>
              <CardHeader>
                  <CardTitle>My Friends</CardTitle>
              </CardHeader>
              <CardContent>
                  {isLoadingFriends ? (
                      <div className="flex justify-center items-center h-24">
                          <Loader />
                      </div>
                  ) : friends.length === 0 ? (
                      <p className='text-muted-foreground'>You haven't added any friends yet.</p>
                  ) : (
                      <div className="space-y-4">
                          {friends.map(friend => (
                              <div key={friend.id} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                      <Avatar>
                                          <AvatarImage src={friend.avatar} alt={friend.displayName || 'User Avatar'} />
                                          <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                                      </Avatar>
                                      <span>{friend.displayName || 'Unnamed User'}</span>
                                  </div>
                                  <Button onClick={() => confirmRemoveFriend(friend.id)} size="icon" variant="ghost">
                                      <X className="h-4 w-4"/>
                                  </Button>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={isConfirmingRemove}
        onOpenChange={setIsConfirmingRemove}
        onConfirm={handleRemoveFriend}
        title="Are you sure?"
        description="This will permanently remove this user from your friends list."
      />
    </>
  );
}
