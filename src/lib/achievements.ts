
import { Book, CheckCircle, Calendar, Crown, Globe, LucideIcon } from "lucide-react";

export interface BadgeInfo {
    name: string;
    icon: LucideIcon;
    tooltip: string;
    className: string;
}

const badgeTiers = {
    tier1: "bg-amber-700/80 text-amber-100 dark:bg-amber-900/60 dark:text-amber-200", // Brown-ish
    tier2: "bg-slate-300 text-slate-800 dark:bg-slate-600/80 dark:text-slate-200", // Silver
    tier3: "bg-yellow-400 text-yellow-900 dark:bg-yellow-600/80 dark:text-yellow-100", // Yellow
    tier4: "bg-red-500 text-red-100 ring-2 ring-red-500/50 animate-pulse dark:bg-red-600/80 dark:text-red-100", // Glowing Red
    tier5: "bg-orange-500 text-orange-100 dark:bg-orange-600/80 dark:text-orange-100", // Yellow/Orange
    tier6: "bg-green-500 text-green-100 dark:bg-green-600/80 dark:text-green-100", // Green
    tier7: "bg-blue-500 text-blue-100 dark:bg-blue-600/80 dark:text-blue-100", // Blue
    tier8: "bg-purple-500 text-purple-100 dark:bg-purple-600/80 dark:text-purple-100", // Purple
    tier9: "bg-amber-400 text-amber-900 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/30", // Shiny Gold
};

const defaultIcons = {
    created: Book,
    completed: CheckCircle,
    active: Calendar,
    published: Globe,
};

function getTieredBadge(type: 'created' | 'completed' | 'active' | 'published', value: number): BadgeInfo {
    let tier = 1;
    let name = "Newbie";
    const thresholds = {
        created: [1, 5, 10, 25, 50, 75, 100, 150, 200],
        completed: [1, 3, 7, 15, 25, 40, 60, 80, 100],
        active: [1, 7, 30, 90, 180, 270, 365, 500, 730],
        published: [1, 3, 5, 10, 20, 30, 50, 75, 100],
    };
    const names = {
        created: ["Creator", "Builder", "Maker", "Producer", "Artisan", "Engineer", "Architect", "Visionary", "Master Creator"],
        completed: ["Finisher", "Graduate", "Scholar", "Expert", "Master", "Sage", "Guru", "Legend", "Master of All"],
        active: ["Member", "Visitor", "Explorer", "Regular", "Veteran", "Habitué", "Patron", "Luminary", "Timeless"],
        published: ["Sharer", "Contributor", "Publisher", "Curator", "Tastemaker", "Influencer", "Prodigy", "Beacon", "Community Pillar"],
    };

    const currentThresholds = thresholds[type];
    for (let i = 0; i < currentThresholds.length; i++) {
        if (value >= currentThresholds[i]) {
            tier = i + 1;
            name = names[type][i];
        }
    }
    
    // Final tier gets a crown
    const icon = tier === 9 ? Crown : defaultIcons[type];
    const className = badgeTiers[`tier${tier}` as keyof typeof badgeTiers];
    const tooltip = type === 'created' ? 'Courses Created' : type === 'completed' ? 'Courses Completed' : type === 'active' ? 'Days Active' : 'Courses Published';

    return { name, icon, tooltip, className };
}


export function getBadgeForCoursesCreated(count: number): BadgeInfo {
    return getTieredBadge('created', count);
}

export function getBadgeForCoursesCompleted(count: number): BadgeInfo {
    return getTieredBadge('completed', count);
}

export function getBadgeForDaysActive(days: number): BadgeInfo {
    return getTieredBadge('active', days);
}

export function getBadgeForCoursesPublished(count: number): BadgeInfo {
    return getTieredBadge('published', count);
}
