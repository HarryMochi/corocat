
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { useAuth } from './use-auth';
import { makeSerializable } from '@/lib/serialization';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const q = query(notificationsRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newNotifications = querySnapshot.docs.map(doc =>
          makeSerializable<Notification>({ id: doc.id, ...doc.data() })
        );
        setNotifications(newNotifications);
        setIsLoading(false);
      }, (err) => {
          console.error("Error fetching notifications:", err);
          setError("Failed to fetch notifications.");
          setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
        setNotifications([]);
        setIsLoading(false);
    }
  }, [user]);

  return { notifications, isLoading, error };
}
