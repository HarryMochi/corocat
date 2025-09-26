
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { BookOpenCheck, Zap, Bot, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/main-layout';
import TypingEffect from '@/components/typing-effect';
import { Decorations } from '@/components/decorations';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-background">
        <Decorations scrollY={scrollY} />
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between animate-fade-in-down relative z-10">
          <Logo />
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <Button asChild>
                    <Link href="/learn">Go to App</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </header>

        <main className="flex-1">
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col items-center text-center relative z-10">
              <div className="animate-fade-in-up">
                <div className="min-h-[144px] md:min-h-[192px] flex items-center justify-center">
                    <h1 className="font-headline text-4xl md:text-6xl font-bold">
  Learn Any Subject with<br />
  <span className="text-amber-600">Excitement</span>
</h1>
                </div>
                <div className="mb-8">
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
                    Corocat uses AI to create purr-fectly personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.
                    </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 group animate-subtle-pulse">
                    <Link href="/learn">
                      Start Exploring for Free
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <section id="features" className="bg-muted py-20 relative z-10">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                    <div className="p-4 bg-primary rounded-full mb-4">
                      <BookOpenCheck className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">1. Pick a Topic</h3>
                    <p className="text-muted-foreground">
                      Tell us what you're curious about. From coding to cooking, anything is possible.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                    <div className="p-4 bg-primary rounded-full mb-4">
                      <Zap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">2. Generate Your Path</h3>
                    <p className="text-muted-foreground">
                      Our AI instantly creates a comprehensive, step-by-step course tailored to your chosen depth.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                    <div className="p-4 bg-primary rounded-full mb-4">
                      <Bot className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">3. Learn & Master</h3>
                    <p className="text-muted-foreground">
                      Follow the steps, track your progress, and ask our AI assistant for help whenever you get stuck.
                    </p>
                  </div>
                </div>
              </div>
            </section>
        </main>

        <footer className="bg-footer-background text-foreground relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Logo />
                        <p className="mt-4 text-muted-foreground max-w-xs">
                            Your curious AI guide to mastering any subject. Pounce on any topic with personalized learning paths.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold font-headline">Navigation</h4>
                        <ul className="mt-4 space-y-2">
                            <li><Link href="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                            <li><Link href="/learn" className="text-muted-foreground hover:text-primary">Get Started</Link></li>
                            <li><Link href="/login" className="text-muted-foreground hover:text-primary">Log In</Link></li>
                            <li><Link href="/signup" className="text-muted-foreground hover:text-primary">Sign Up</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold font-headline">Legal</h4>
                        <ul className="mt-4 space-y-2">
                            <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Corocat. All rights reserved.</p>
                </div>
            </div>
        </footer>
      </div>
    </MainLayout>
  );
}
