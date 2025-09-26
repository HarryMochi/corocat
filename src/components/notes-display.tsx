
"use client";

import { useState, useRef, useEffect, useTransition } from 'react';
import type { Course } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import type { AssistWithNotesOutput } from '@/ai/flows/assist-with-notes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from './ui/input';
import { Label } from './ui/label';

interface NotesDisplayProps {
  course: Course;
  notes: string;
  onUpdateNotes: (newNotes: string) => void;
  onAssistWithNotes: (course: Course, notes: string, request: string) => Promise<AssistWithNotesOutput>;
}

export default function NotesDisplay({ course, notes: initialNotes, onUpdateNotes, onAssistWithNotes }: NotesDisplayProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, startSavingTransition] = useTransition();
  const [aiRequest, setAiRequest] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  useEffect(() => {
    if (notes === initialNotes) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      startSavingTransition(() => {
        onUpdateNotes(notes);
      });
    }, 1000); // Save after 1 second of inactivity

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notes, initialNotes, onUpdateNotes]);

  const handleAskAi = async () => {
    if (!aiRequest.trim()) return;
    setIsAsking(true);
    setAiSuggestion('');
    try {
      const result = await onAssistWithNotes(course, notes, aiRequest);
      setAiSuggestion(result.suggestion);
    } finally {
      setIsAsking(false);
    }
  };

  const handleInsertSuggestion = () => {
    setNotes(prev => `${prev}\n\n---\n*AI Suggestion based on request "${aiRequest}":*\n${aiSuggestion}`);
    handleDialogClose();
  }
  
  const handleDialogClose = () => {
    setAiRequest('');
    setAiSuggestion('');
    setIsDialogOpen(false);
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-headline text-2xl">My Notes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Bot className="mr-2 h-4 w-4" /> Ask AI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
            if (isAsking) e.preventDefault();
          }}>
            <DialogHeader>
              <DialogTitle>AI Note Assistant</DialogTitle>
              <DialogDescription>
                Ask the AI to help with your notes. You can ask it to summarize, find key points, or suggest ideas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="request" className="text-right">
                  Request
                </Label>
                <Input
                  id="request"
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., 'Summarize these notes'"
                  disabled={isAsking}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAskAi(); }}
                />
              </div>
              {aiSuggestion && (
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <h4 className="font-semibold">Suggestion</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiSuggestion}</p>
                    </div>
                  </div>
              )}
               {isAsking && (
                <div className="flex items-center justify-center p-4 bg-muted rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
            <DialogFooter>
                <Button onClick={handleAskAi} disabled={!aiRequest.trim() || isAsking}>
                    {isAsking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Get Suggestion
                </Button>
              {aiSuggestion && (
                  <Button onClick={handleInsertSuggestion} variant="secondary">Insert into Notes</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 relative">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Start taking notes here..."
          className="h-full w-full resize-none"
        />
        {isSaving && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}
