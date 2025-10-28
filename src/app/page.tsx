'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { BookOpenCheck, Zap, Bot, ArrowRight, Star, Mail, Users, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/main-layout';
import { Decorations } from '@/components/decorations';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

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
      quote: "This is the perfect tool for bridging the gap between theory and practice. I used it to create a deep-dive course on 'Advanced CSS Grid' and it filled in so many knowledge holes I didn't even know I had.",
    },
    {
      name: 'Anita P.',
      role: 'Hobbyist Developer',
      avatar: 'AP',
      quote: "As someone who codes for fun, I love that I can just type in 'Learn Rust for WebAssembly' and get a structured, weekend-sized project plan. It keeps my learning focused and I actually finish what I start.",
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
      title: "Pick a Topic",
      description: "Tell us what you're curious about. From coding to cooking, anything is possible.",
      icon: <BookOpenCheck className="w-8 h-8" />,
      color: "bg-yellow-400",
    },
    {
      title: "Generate Your Path",
      description: "Our AI instantly creates a comprehensive, step-by-step course tailored to your chosen depth.",
      icon: <Zap className="w-8 h-8" />,
      color: "bg-red-500",
    },
    {
      title: "Learn & Master",
      description: "Follow the steps, track your progress, and ask our AI assistant for help whenever you get stuck.",
      icon: <Bot className="w-8 h-8" />,
      color: "bg-purple-600",
    },
  ];

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
                  <>
                    <Button variant="ghost" size="icon">
                      <Mail className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Users className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Add Friend</DropdownMenuItem>
                        <DropdownMenuItem>My Friends</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button asChild>
                      <Link href="/learn">Go to App</Link>
                    </Button>
                  </>
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
            {/* Hero Section - Enhanced Version */}
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40 flex flex-col items-center text-center relative z-10">
              <div className="animate-fade-in-up max-w-5xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
                </div>
                
                <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Master Any Subject<br />
                  <span className="text-primary">With Excitement</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                  Corocat uses AI to create purr-fectly personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 group animate-subtle-pulse text-lg px-8 py-6">
                    <Link href="/learn">
                      Start Exploring for Free
                      <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                    <Link href="#how-it-works">
                      See How It Works
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">U</span>
                        </div>
                      ))}
                    </div>
                    <span>1000+ learners</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1">5.0 rating</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Screenshot Section */}
            <section className="relative z-10 py-16 sm:py-24">
              <div className="screenshot-container">
                  <div className={cn(
                      "screenshot-image",
                      "relative rounded-xl shadow-2xl overflow-hidden w-[90%] max-w-3xl mx-auto"
                  )}>
                      <Image
                          src="/Landing-screenshot.png"
                          width={1200}
                          height={780}
                          alt="Screenshot of the Corocat application interface"
                          className="w-full h-auto border-2"
                          data-ai-hint="dashboard analytics"
                          priority
                      />
                  </div>
              </div>
            </section>

            {/* Inside Corocat Section */}
            <section className="bg-background py-20 relative z-10">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Inside Corocat</h2>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                  Experience a beautifully designed learning environment built for focus and progress
                </p>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="group aspect-video">
                    <div className="relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
                      <video src="/videos/dashboard.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                        <div className="p-6 text-white">
                          <h3 className="font-bold text-lg mb-1">Course Dashboard</h3>
                          <p className="text-sm text-white/90">Track your learning journey</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group aspect-video">
                    <div className="relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
                      <video src="/videos/assistant.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                        <div className="p-6 text-white">
                          <h3 className="font-bold text-lg mb-1">AI Study Assistant</h3>
                          <p className="text-sm text-white/90">Get instant help and explanations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group aspect-video">
                    <div className="relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
                      <video src="/videos/marketplace.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                        <div className="p-6 text-white">
                          <h3 className="font-bold text-lg mb-1">Course Marketplace</h3>
                          <p className="text-sm text-white/90">Share and discover new paths</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 relative z-10 bg-muted overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-24">How It Works</h2>
                    
                    {/* Desktop Timeline */}
                    <div className="hidden md:block relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 rounded-full -translate-y-1/2"></div>
                        <div className="relative flex justify-between">
                            {howItWorksSteps.map((step, index) => (
                                <div key={index} className="flex-1 relative">
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "w-24 h-24 rounded-full text-white flex items-center justify-center border-4 border-muted shadow-lg z-10",
                                            step.color
                                        )}>
                                            {step.icon}
                                        </div>
                                        
                                        <div className={cn(
                                            "w-1 h-16",
                                            step.color
                                        )}></div>
                                        
                                        <div className="text-center max-w-xs">
                                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                            <p className="text-muted-foreground">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Timeline */}
                    <div className="md:hidden space-y-12">
                        {howItWorksSteps.map((step, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full text-white flex-shrink-0 flex items-center justify-center",
                                    step.color
                                )}>
                                    {step.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Testimonials Section */}
            <section className="py-20 relative z-10">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Loved by Learners Worldwide</h2>
                <Carousel 
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full max-w-4xl mx-auto"
                >
                  <CarouselContent>
                    {testimonials.map((testimonial, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card className="h-full">
                            <CardContent className="p-6 flex flex-col items-start justify-between h-full">
                              <div className="flex items-center gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                ))}
                              </div>
                              <blockquote className="text-foreground/80 flex-grow">
                                "{testimonial.quote}"
                              </blockquote>
                              <div className="flex items-center gap-3 mt-6 pt-6 border-t w-full">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{testimonial.name}</p>
                                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </section>

        </main>

        {/* Footer */}
        <footer className="bg-footer-background text-foreground relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Logo />
                        <p className="mt-4 text-muted-foreground max-w-xs">
                            Your curious AI guide to mastering any subject. Pounce on any topic with personalized learning paths.
                        </p>
                        <div className="mt-6">
                            <h4 className="font-semibold font-headline mb-4">Join Our Community</h4>
                            <Link 
                                href="https://discord.gg/wVX4fkWaaA"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors duration-200"
                            >
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