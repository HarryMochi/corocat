
"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Loader2 } from 'lucide-react';
import MainLayout from '@/components/main-layout';
import Logo from '@/components/logo';

export default function VerifyEmailPage() {
  const { user, loading, logout, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, go to login
        router.push('/login');
      } else if (user.emailVerified) {
        // Already verified, go to app
        router.push('/learn');
      }
    }
  }, [user, loading, router]);
  
  const handleResendEmail = async () => {
    if (!user) return;
    setIsSending(true);
    try {
        await sendVerificationEmail();
        alert("Verification email sent! Check your inbox (and spam folder).");
    } catch (error) {
        console.error("Error resending verification email", error);
        alert("Failed to send verification email. Please try again.");
    } finally {
        setIsSending(false);
    }
  }
  
  const handleRefresh = () => {
    window.location.reload();
  };


  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
            <div className="mb-8">
                <Logo />
            </div>
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                    <CardDescription>
                        We've sent a verification link to <strong>{user.email}</strong>. Please check your inbox and click the link to finish setting up your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                       Once you've verified, refresh this page to continue.
                    </p>
                    <Button onClick={handleRefresh} className="w-full">
                       Refresh and Continue
                    </Button>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 pt-4">
                       Didn't receive an email?
                       <Button variant="link" onClick={handleResendEmail} disabled={isSending} className="p-0 h-auto">
                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Resend link
                       </Button>
                    </div>
                     <Button variant="outline" size="sm" onClick={logout} className="mt-4">
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    </MainLayout>
  );
}
