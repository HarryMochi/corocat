'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendFriendRequest } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddFriend({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user || !email) {
      setLoading(false);
      return;
    }

    try {
      // Check if the user exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      const receiver = querySnapshot.docs[0];

      console.log("This is user Uid",user.uid,"This Is Reciever id",receiver.id)
      await sendFriendRequest(user.uid, receiver.id);
      
      setLoading(false);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to send friend request');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg mb-8">
      <form onSubmit={handleSendRequest}>
        <div className="flex gap-4">
          <Input
            type="email"
            placeholder="Enter friend's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}