"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getInvitationsForUser, respondToInvitation } from '@/lib/firestore';
import type { CourseInvitation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function CourseInvitations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;
    try {
      const userInvitations = await getInvitationsForUser(user.uid);
      setInvitations(userInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId: string, response: 'accepted' | 'declined') => {
    setRespondingTo(invitationId);
    try {
      await respondToInvitation(invitationId, response);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      toast({
        title: response === 'accepted' ? "Invitation Accepted!" : "Invitation Declined",
        description: response === 'accepted' 
          ? "You've been added to the collaborative course." 
          : "The invitation has been declined.",
      });
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not respond to invitation. Please try again.",
      });
    } finally {
      setRespondingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Course Invitations</h3>
        <p className="text-muted-foreground">You don't have any pending course invitations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Course Invitations</h2>
        <Badge variant="secondary">{invitations.length}</Badge>
      </div>
      
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{invitation.courseTopic}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>From: {invitation.senderName}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                  </div>
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Collaborative Course
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {invitation.senderName} has invited you to collaborate on a course about "{invitation.courseTopic}". 
              You'll be able to learn together, share notes, and work through the material as a team.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleResponse(invitation.id, 'accepted')}
                disabled={respondingTo === invitation.id}
                className="flex-1"
              >
                {respondingTo === invitation.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Accepting...
                  </div>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResponse(invitation.id, 'declined')}
                disabled={respondingTo === invitation.id}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}