
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function EditProfilePage({ params }: { params: { userId: string } }) {
    const { user, loading } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (user.uid !== params.userId) {
                toast({ variant: "destructive", title: "Unauthorized", description: "You can only edit your own profile." });
                router.push('/');
            } else {
                setDisplayName(user.displayName || '');
            }
        }
    }, [user, loading, params.userId, router, toast]);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            await updateUserProfile(user.uid, { displayName });
            toast({ title: "Success", description: "Your profile has been updated." });
            router.push(`/profile/${user.uid}`);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !user) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Name"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
