
'use client';

import { useEffect } from 'react';
import { showErrorToast, errorEmitter } from '@/lib/errors';

// This is a client-side only component that listens for global errors
// and displays them as toasts.
export function FirebaseErrorListener() {
  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      showErrorToast(error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
