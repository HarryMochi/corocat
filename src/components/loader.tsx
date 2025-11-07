'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return (
    <Loader2 className={cn('animate-spin text-primary', className)} />
  );
}
