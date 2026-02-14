
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2, UsersIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { removeFriend } from "@/lib/firestore";
import { sendFriendRequest } from '@/app/sendFriendRequestClient';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import { Loader } from './loader';
import { ConfirmationDialog } from './confirmation-dialog';
import { getAuth } from 'firebase/auth';
import { getFriendRequests } from '@/app/getFriendRequestClient';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/firestore';
import { getFriends } from '@/app/getFriendClient';
import { getUserById } from '@/app/getUserByIdClient';
import { PremiumAvatar, PremiumUsername } from '@/components/user-style';
import { useOtherUserPremiumStatus } from '@/hooks/use-other-premium-status';
// Friend Request Interface
interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: string;

}

interface FriendRequestDetails {
  displayName: string;
  email: string;
  id: string;
  lastLogin: Date;
  photoURL: string;
  uid: string;
}
// Add Friend Form Schema
const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

// Combined Socials Modal Component
export function SocialsModal({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const auth = getAuth()
  const currentUser = auth.currentUser
  const { toast } = useToast();

  // Friend Requests State
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsDetails, setRequestsDetails] = useState<FriendRequestDetails[]>([])
  // Friends List State
  const [friends, setFriends] = useState<(User & { id: string })[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Add Friend State
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isAcceptingRequest, setAcceptingRequest] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState(false)
  const [isRemovingFriend, setIsRemovingFriend] = useState(false)
  const addFriendForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // Remove Friend Confirmation State
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);

  async function fetchSocialsData() {
    if (!user) return;

    setIsLoadingRequests(true);
    setIsLoadingFriends(true);

    try {
      const [requestsData, friendsData] = await Promise.all([
        await getFriendRequests(user.uid),
        await getFriends(user.uid)
      ]);

      setRequests(requestsData as FriendRequest[]);

      setFriends(friendsData as (User & { id: string })[]);
    } catch (error) {
      console.error("Error fetching social data:", error);
      toast({ title: 'Error', description: 'Could not load your social information.', variant: 'destructive' });
    } finally {
      setIsLoadingRequests(false);
      setIsLoadingFriends(false);
    }
  }
  useEffect(() => {
    async function loadUsers() {
      if (requests.length === 0) {
        setRequestsDetails([]); // optional: clear when no requests
        return;
      }

      try {
        const users = (await Promise.all(
          requests.map((req) => getUserById(req.from))
        )).filter((u): u is FriendRequestDetails => u !== null);

        setRequestsDetails(users);
      } catch (err) {
        console.error("Error loading request users:", err);
      }
    }

    loadUsers();
  }, [requests]);


  // Friend Request Actions
  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      setAcceptingRequest(true)
      await acceptFriendRequest(requestId);
      toast({ title: 'Success', description: 'Friend request accepted!' });
      fetchSocialsData(); // Refetch all data
    } catch (error: any) {
      console.log(error)
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAcceptingRequest(false)
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;
    try {
      setRejectingRequest(true)
      await rejectFriendRequest(requestId);
      setRequests(requests.filter(req => req.id !== requestId));
      toast({ title: 'Success', description: 'Friend request rejected.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setRejectingRequest(false)
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
      setIsRemovingFriend(true)
      await removeFriend(user.uid, friendToRemove);
      toast({ title: 'Success', description: 'Friend removed.' });
      fetchSocialsData(); // Refetch all data
    } catch (error: any) {
      toast({ title: 'Error', description: 'Could not remove friend.', variant: 'destructive' });
    } finally {
      setIsRemovingFriend(false)
    }
  };

  // Add Friend Action
  async function onAddFriendSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    setIsSendingRequest(true);
    try {
      const response = await sendFriendRequest(
        currentUser.uid,
        values.email,
        currentUser.displayName || "User",
        currentUser.photoURL || ""
      );
      toast({ title: response.success ? "Success" : "Error", description: response.message });
      fetchSocialsData()
      addFriendForm.reset();
    } catch (error: any) {
      console.log(error)
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
                      {requests.map((request, key) => (
                        <div key={request?.id} className="flex items-center justify-between">

                          <SocialUserChip
                            uid={requestsDetails[key]?.uid}
                            displayName={requestsDetails[key]?.displayName}
                            photoURL={requestsDetails[key]?.photoURL}
                          />
                          <div className="space-x-2">
                            <Button onClick={() => handleAccept(request?.id)} size="sm" variant={"secondary"} disabled={isAcceptingRequest}>{isAcceptingRequest ? <Loader2 className='w-4 h-4 animate-spin text-black' /> : "Accept"}</Button>
                            <Button onClick={() => handleReject(request?.id)} size="sm" variant="destructive" disabled={rejectingRequest}>{rejectingRequest ? <Loader2 className='w-4 h-4 animate-spin text-white' /> : "Reject"}</Button>
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

                      <div key={friend?.id} className="flex items-center justify-between">

                        <SocialUserChip
                          uid={friend?.id}
                          displayName={friend?.displayName}
                          photoURL={friend?.photoURL}
                        />
                        <Button onClick={() => confirmRemoveFriend(friend?.id)} size="icon" variant="ghost" disabled={isRemovingFriend}>
                          {isRemovingFriend ? <Loader2 className='w-4 h-4 text-black animate-spin' /> : <X className="h-4 w-4" />}
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

interface SocialUserChipProps {
  uid?: string;
  displayName?: string | null;
  photoURL?: string | null;
}

function SocialUserChip({ uid, displayName, photoURL }: SocialUserChipProps) {
  const safeName = displayName || 'User';
  const { isPremium, usernameStyleKey, avatarEffectKey } =
    useOtherUserPremiumStatus(uid || null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <div className="flex items-center space-x-4">
      <PremiumAvatar
        src={photoURL || undefined}
        alt={safeName}
        initials={getInitials(safeName)}
        effectKey={avatarEffectKey || undefined}
        isPremium={isPremium}
        size="sm"
      />
      <span className="text-sm font-medium">
        <PremiumUsername
          name={safeName}
          styleKey={usernameStyleKey || undefined}
          isPremium={isPremium}
          className="text-sm"
        />
      </span>
    </div>
  );
}
