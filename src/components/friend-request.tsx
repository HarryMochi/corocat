'use client';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function FriendRequest({ request }: { request: any }) {
  const { user } = useAuth();

  const handleAccept = async () => {
    if (user) {
      // Add to friends list for both users
      await setDoc(doc(db, 'users', user.uid, 'friends', request.senderId), { email: request.senderEmail, addedAt: serverTimestamp() });
      await setDoc(doc(db, 'users', request.senderId, 'friends', user.uid), { email: user.email, addedAt: serverTimestamp() });

      // Delete the request
      await deleteDoc(doc(db, 'friendRequests', request.id));
    }
  };

  const handleDecline = async () => {
    await deleteDoc(doc(db, 'friendRequests', request.id));
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
      <p>{request.senderEmail} sent you a friend request.</p>
      <div className="flex gap-4">
        <Button onClick={handleAccept}>Accept</Button>
        <Button variant="outline" onClick={handleDecline}>Decline</Button>
      </div>
    </div>
  );
}
