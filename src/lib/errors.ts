
'use client';
import { toast } from '@/hooks/use-toast';

// A simple event emitter
type Listener = (data: any) => void;
const events: { [key: string]: Listener[] } = {};

export const errorEmitter = {
  on(event: string, listener: Listener) {
    if (!events[event]) {
      events[event] = [];
    }
    events[event].push(listener);
    return () => {
      events[event] = events[event].filter(l => l !== listener);
    };
  },
  emit(event: string, data: any) {
    if (events[event]) {
      events[event].forEach(listener => listener(data));
    }
  }
};

// Custom error for detailed Firestore permission issues
export class FirestorePermissionError extends Error {
  refPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  resourceData?: any;

  constructor(
    message: string,
    refPath: string,
    operation: 'get' | 'list' | 'create' | 'update' | 'delete',
    resourceData?: any
  ) {
    super(message);
    this.name = 'FirestorePermissionError';
    this.refPath = refPath;
    this.operation = operation;
    this.resourceData = resourceData;
  }
}

// Function to display a toast notification for errors
export function showErrorToast(error: any) {
  let title = "An unexpected error occurred.";
  let description = error.message || "Please try again later.";

  if (error instanceof FirestorePermissionError) {
    title = "Permission Denied";
    description = `You don't have permission to ${error.operation} the resource at ${error.refPath}.`;
  } else if (error.code && error.code.startsWith('auth/')) {
    title = "Authentication Error";
    description = error.message;
  }

  toast({
    variant: "destructive",
    title: title,
    description: description,
  });
}
