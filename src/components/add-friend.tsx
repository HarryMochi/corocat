'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddFriend({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !email) return;

    // Check if the user exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setError('User not found.');
      return;
    }

    const receiver = querySnapshot.docs[0];

    // Send the friend request
    await addDoc(collection(db, 'friendRequests'), {
      senderId: user.uid,
      senderEmail: user.email,
      receiverId: receiver.id,
      receiverEmail: email,
      status: 'pending',
    });

    onClose();
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
          />
          <Button type="submit">Send Request</Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}
