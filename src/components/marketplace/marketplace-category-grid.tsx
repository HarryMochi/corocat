
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Music, Palette, Scale, FlaskConical, Stethoscope, Landmark, Briefcase, Calculator, Leaf, Film, Utensils, Plane, Dumbbell, Gamepad, Cpu, BookOpen, Atom, DollarSign, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
}

export const marketplaceCategories: Category[] = [
    { id: 'technology', name: 'Technology', description: 'From programming languages to software development.', icon: Code },
    { id: 'science', name: 'Science', description: 'Explore the natural world, from physics to biology.', icon: Atom },
    { id: 'mathematics', name: 'Mathematics', description: 'Dive into numbers, logic, and abstract structures.', icon: Calculator },
    { id: 'business', name: 'Business', description: 'Learn about finance, marketing, and entrepreneurship.', icon: Briefcase },
    { id: 'health', name: 'Health & Fitness', description: 'Improve your well-being with courses on fitness and nutrition.', icon: Dumbbell },
    { id: 'arts-design', name: 'Arts & Design', description: 'Unleash your creativity in drawing, painting, and design.', icon: Palette },
    { id: 'music', name: 'Music', description: 'Master an instrument or learn about music theory.', icon: Music },
    { id: 'humanities', name: 'Humanities', description: 'Study history, literature, philosophy, and culture.', icon: Landmark },
    { id: 'law', name: 'Law', description: 'Understand legal principles and systems.', icon: Scale },
    { id: 'medicine', name: 'Medicine', description: 'Explore topics in medical science and healthcare.', icon: Stethoscope },
    { id: 'engineering', name: 'Engineering', description: 'Discover principles of civil, mechanical, and electrical engineering.', icon: Cpu },
    { id: 'languages', name: 'Languages', description: 'Learn a new language and explore different cultures.', icon: BookOpen },
    { id: 'personal-development', name: 'Personal Development', description: 'Grow yourself with courses on productivity and mindfulness.', icon: Brain },
    { id: 'cooking', name: 'Cooking', description: 'Master culinary skills and explore global cuisines.', icon: Utensils },
    { id: 'entertainment', name: 'Entertainment', description: 'Dive into the world of film, TV, and media.', icon: Film },
    { id: 'gaming', name: 'Gaming', description: 'Learn about game design, development, and strategy.', icon: Gamepad },
    { id: 'nature', name: 'Nature', description: 'Explore the beauty of the natural world.', icon: Leaf },
    { id: 'travel', name: 'Travel', description: 'Discover new destinations and travel tips.', icon: Plane },
    { id: 'finance', name: 'Finance', description: 'Manage your money and learn about investing.', icon: DollarSign },
    { id: 'chemistry', name: 'Chemistry', description: 'Explore the world of molecules and reactions.', icon: FlaskConical },
];

interface MarketplaceCategoryGridProps {
    categories: Category[];
    courseCounts: Record<string, number>;
}

export default function MarketplaceCategoryGrid({ categories, courseCounts }: MarketplaceCategoryGridProps) {
    return (
        <div className="space-y-4">
            {categories.map((category) => (
                <Link href={`/marketplace/${category.id}`} key={category.id} className="group block">
                    <Card className="hover:border-primary hover:shadow-lg transition-all duration-200">
                        <div className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <category.icon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="font-headline text-xl leading-tight break-words">{category.name}</CardTitle>
                                <CardDescription className="group-hover:text-foreground/80 transition-colors mt-1">
                                    {category.description}
                                </CardDescription>
                                <p className="text-xs text-muted-foreground font-bold mt-2">{courseCounts[category.id] || 0} courses</p>
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
