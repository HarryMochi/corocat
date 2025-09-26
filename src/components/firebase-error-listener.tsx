
'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/lib/errors';

// This is a client-side only component that listens for global errors
// and displays them as toasts.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error: FirestorePermissionError) => {
        const readableError = `
        **Firestore Permission Denied**
        
        **Operation**: \`${error.operation}\`
        **Path**: \`${error.refPath}\`
        
        **Details**: This usually means the Firestore security rules do not allow this action. 
        
        To fix this, you need to update your \`firestore.rules\` file.
        
        **Resource Data Sent**:
        \`\`\`json
        ${JSON.stringify(error.resourceData, null, 2)}
        \`\`\`
        `;

        toast({
            variant: "destructive",
            title: "Firestore Security Error",
            description: <pre className="whitespace-pre-wrap font-mono text-xs">{readableError}</pre>,
            duration: 20000, // Keep toast open longer
        });
    });

    return () => {
      unsubscribe();
    };
  }, [toast]);

  return null;
}
