
'use client';

import Link from 'next/link';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { marketplaceCategories, type Category } from '@/lib/marketplace-categories';

interface MarketplaceCategoryGridProps {
    courseCounts: Record<string, number>;
}

export default function MarketplaceCategoryGrid({ courseCounts }: MarketplaceCategoryGridProps) {
    return (
        <div className="space-y-4">
            {marketplaceCategories.map((category) => (
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
