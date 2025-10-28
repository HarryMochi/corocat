
'use client';
import { toast } from '@/hooks/use-toast';
import { FirestorePermissionError } from './server-errors';

export function handleClientError(error: any) {
  let title = "An unexpected error occurred.";
  let description = error.message || "Please try again later.";

  if (error instanceof FirestorePermissionError) {
    title = "Permission Denied";
    description = `You don't have permission to ${error.operation} the resource at ${error.refPath}.`;
  } else if (error.code && error.code.startsWith('auth/')) {
    title = "Authentication Error";
    description = error.message;
  }

  console.error(title, description, error);

  toast({
    variant: "destructive",
    title: title,
    description: description,
  });
}
