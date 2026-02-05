// @ts-nocheck
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '../components/ui/button';
import Logo from '../components/logo';
import { BookOpenCheck, Zap, Bot, Star, Mail, Users, Sparkles, Rocket, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import MainLayout from '../components/main-layout';
import { Decorations } from '../components/decorations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { cn } from '../lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// 🔥 YOUR STRIPE PAYMENT LINK
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_aFa3cv1QP5t07zbdkh4Ja01';

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🔥 FIX: Upgrade button handler
  const onUpgrade = () => {
    console.log('🎯 Upgrade clicked');
    console.log('👤 User:', user?.email || 'Not logged in');
    
    if (!user) {
      console.log('🔐 No user - redirecting to SIGNUP');
      sessionStorage.setItem('pendingUpgrade', 'true');
      sessionStorage.setItem('selectedPlan', isYearly ? 'yearly' : 'monthly');
      router.push('/signup'); // ✅ FIXED: Changed from /login to /signup
      return;
    }

    console.log('✅ User authenticated - redirecting to Stripe');
    redirectToStripe();
  };

  // 🔥 Stripe redirect function
  const redirectToStripe = () => {
    if (!user) return;

    console.log('💳 Building Stripe URL...');
    console.log('User ID:', user.uid);
    console.log('Email:', user.email);

    try {
      const url = new URL(STRIPE_PAYMENT_LINK);
      
      // 🔥 CRITICAL: Add user ID and email
      url.searchParams.set('client_reference_id', user.uid);
      if (user.email) {
        url.searchParams.set('prefilled_email', user.email);
      }
      
      // 🔥 CRITICAL: Add success URL to redirect back to /learn
      url.searchParams.set('success_url', `${window.location.origin}/learn?success=true`);
      url.searchParams.set('cancel_url', `${window.location.origin}/?canceled=true`);

      console.log('🚀 Final Stripe URL:', url.toString());
      
      setLoadingCheckout(true);
      
      // Redirect to Stripe
      setTimeout(() => {
        window.location.href = url.toString();
      }, 300);
    } catch (error) {
      console.error('❌ Error building Stripe URL:', error);
      alert('Failed to start checkout. Please try again.');
      setLoadingCheckout(false);
    }
  };

  // 🔥 FIX: Handle post-signup redirect to Stripe
  useEffect(() => {
    console.log('🔍 Checking for pending upgrade...');
    console.log('User:', user?.email || 'No user');
    console.log('Pending upgrade:', sessionStorage.getItem('pendingUpgrade'));

    if (!user) {
      console.log('⏸️ No user yet');
      return;
    }

    const hasPendingUpgrade = sessionStorage.getItem('pendingUpgrade') === 'true';
    
    if (hasPendingUpgrade) {
      console.log('🎉 User logged in with pending upgrade!');
      
      // Clear flags
      sessionStorage.removeItem('pendingUpgrade');
      sessionStorage.removeItem('selectedPlan');
      
      console.log('🚀 Redirecting to Stripe...');
      
      // Redirect after short delay
      setTimeout(() => {
        redirectToStripe();
      }, 1000);
    }
  }, [user]);

  const testimonials = [
    {
      name: 'Sarah L.',
      role: 'Lifelong Learner',
      avatar: 'SL',
      quote: "I've always wanted to understand quantum physics, but never knew where to start. Corocat created a path that was challenging but not overwhelming. The AI assistant was surprisingly helpful for complex questions!",
    },
    {
      name: 'Michael B.',
      role: 'Bootcamp Grad',
      avatar: 'MB',
      quote: "This is the perfect tool for bridging the gap between theory and practice. I used it to create a deep‑dive course on 'Advanced CSS Grid' and it filled in so many knowledge holes I didn't even know I had.",
    },
    {
      name: 'Anita P.',
      role: 'Hobbyist Developer',
      avatar: 'AP',
      quote: "As someone who codes for fun, I love that I can just type in 'Learn Rust for WebAssembly' and get a structured, weekend‑sized project plan. It keeps my learning focused and I actually finish what I start.",
    },
    {
      name: 'David R.',
      role: 'Product Manager',
      avatar: 'DR',
      quote: "I need to get up to speed on new technologies fast. Corocat lets me generate a 'Quick Overview' on topics like AI vector databases. It's like having a personal tutor to give me the executive summary.",
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Pick a Topic',
      description: "Tell us what you're curious about. From coding to cooking, anything is possible.",
      icon: <BookOpenCheck className="w-8 h-8" />,
      color: 'bg-yellow-400',
    },
    {
      title: 'Generate Your Path',
      description: 'Our AI instantly creates a comprehensive, step‑by‑step course tailored to your chosen depth.',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-red-500',
    },
    {
      title: 'Learn & Master',
      description: 'Follow the steps, track your progress, and ask our AI assistant for help whenever you get stuck.',
      icon: <Bot className="w-8 h-8" />,
      color: 'bg-purple-600',
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-background">
        <Decorations scrollY={scrollY} />
        
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between animate-fade-in-down relative z-10">
          <Logo />
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon"><Mail className="h-5 w-5" /></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><Users className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Add Friend</DropdownMenuItem>
                    <DropdownMenuItem>My Friends</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild className="rounded-full"><Link href="/learn">Go to App</Link></Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="rounded-full border-orange-500 border"><Link href="/login">Log In</Link></Button>
                <Button asChild className="rounded-full"><Link href="/signup">Sign Up</Link></Button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40 flex flex-col items-center text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI‑Powered Learning Platform</span>
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Master Any Subject<br />
              <span className="text-primary">With Excitement</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Corocat uses AI to create perfectly personalized learning courses on any topic. Go from beginner to expert with a structured, easy‑to‑follow plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full group">
                <Link href="#pricing" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar'
                  ].map((avatar, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background overflow-hidden shadow-sm">
                      <img src={avatar} alt={`User ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="font-medium">1000+ learners</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
                <span className="ml-1 font-medium">4.8 rating</span>
              </div>
            </div>
          </section>

          {/* Screenshot Section */}
          <section className="relative z-10 py-16 sm:py-24 overflow-hidden">
            <div className="container mx-auto px-4">
              <div className="relative group mx-auto max-w-5xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative rounded-2xl shadow-2xl border-4 border-white/10 overflow-hidden transform perspective-1000 hover:rotate-x-2 transition-transform duration-700">
                  <Image
                    src="/Landing-screenshot.png"
                    width={1200}
                    height={780}
                    alt="Corocat Dashboard"
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Inside Corocat Section */}
          <section className="bg-background py-24 relative z-10 border-y border-white/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Inside Corocat</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Experience a beautifully designed learning environment built for focus and progress.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: "Course Dashboard", desc: "Track your learning journey" },
                  { title: "AI Study Assistant", desc: "Get instant help and explanations" },
                  { title: "Course Marketplace", desc: "Share and discover new paths" }
                ].map((feature, i) => (
                  <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-primary/20 to-accent/20 shadow-xl hover:-translate-y-2 transition-all duration-500">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-300">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-20 bg-muted overflow-hidden relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-24">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-12">
                {howItWorksSteps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className={cn('w-24 h-24 rounded-full flex items-center justify-center border-4 border-muted shadow-lg text-white', step.color)}>
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold mt-4 mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Loved by Learners Worldwide</h2>
              <Carousel opts={{ align: 'center', loop: true }} className="w-full max-w-4xl mx-auto">
                <CarouselContent>
                  {testimonials.map((t, i) => (
                    <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                      <Card className="h-full">
                        <CardContent className="p-6 flex flex-col justify-between h-full">
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, idx) => (
                              <Star key={idx} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <blockquote className="text-foreground/80 flex-grow">{t.quote}</blockquote>
                          <div className="flex items-center gap-3 mt-6 pt-6 border-t w-full">
                            <Avatar className="h-10 w-10"><AvatarFallback>{t.avatar}</AvatarFallback></Avatar>
                            <div>
                              <p className="font-semibold">{t.name}</p>
                              <p className="text-sm text-muted-foreground">{t.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-24 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">Corocat Pricing</h2>
                <div className="h-1.5 w-24 bg-primary/10 mx-auto rounded-full mb-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary w-1/2 rounded-full animate-[shimmer_2s_infinite]" style={{
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    backgroundSize: '200% 100%'
                  }} />
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
                  Start your learning journey for free or upgrade to unlock more power.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                {/* Free Plan */}
                <Card className="border-border/50 bg-gradient-to-br from-background to-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      Foundation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-3xl font-bold mb-2">Free</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-5xl font-black">$0</span>
                      <span className="text-muted-foreground text-sm">/forever</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      The perfect baseline for curious minds starting their learning journey.
                    </p>

                    <div className="space-y-3 mb-8">
                      {[
                        "3 course creations per hour",
                        "3 total whiteboards (lifetime)",
                        "AI Study Assistant access",
                        "Standard profile styling",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500/80 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground/70">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button asChild variant="outline" className="w-full py-6 rounded-2xl font-bold">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Premium Plan */}
                <Card className="border-2 border-primary/30 bg-white shadow-[0_30px_60px_-15px_rgba(var(--primary),0.1)] transition-all duration-300 hover:shadow-[0_40px_80px_-15px_rgba(var(--primary),0.2)] hover:-translate-y-2">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />

                  <div className="absolute top-6 right-6">
                    <div className="inline-flex items-center gap-1.5 py-1 px-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>

                  <CardHeader className="pb-3 pt-10">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Professional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-3xl font-bold mb-2">Premium</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-5xl font-black">$12</span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Unlock the full potential of Corocat with enhanced power and exclusive style.
                    </p>

                    <div className="space-y-3 mb-8">
                      {[
                        "10 course creations per hour",
                        "20 total whiteboards",
                        "Enhanced Profile page",
                        "Faster course generation",
                        "Better and more aimed output",
                        "Gradient Username",
                        "Visually enhanced profile",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full p-0.5">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          </div>
                          <span className="text-sm font-bold text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={onUpgrade}
                      disabled={loadingCheckout}
                      className="w-full py-6 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loadingCheckout ? 'Redirecting...' : 'Upgrade to Premium'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <p className="text-center mt-12 text-sm text-muted-foreground font-medium">
                No hidden fees. Cancel anytime. All prices in USD.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-footer-background text-foreground py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <Logo />
                <p className="mt-4 text-muted-foreground max-w-xs">
                  Your curious AI guide to mastering any subject. Pounce on any topic with personalized learning paths.
                </p>
                <div className="mt-6">
                  <h4 className="font-semibold font-headline mb-4">Join Our Community</h4>
                  <Link href="https://discord.gg/wVX4fkWaaA" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors duration-200">
                    <DiscordIcon className="h-5 w-5" />
                    Join Discord
                  </Link>
                </div>
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
