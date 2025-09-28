
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BadgeInfo } from "@/lib/achievements";
import { Crown } from "lucide-react"; // Make sure Crown is available

interface AchievementBadgeProps {
    badge: BadgeInfo;
    value: number;
}

export function AchievementBadge({ badge, value }: AchievementBadgeProps) {
    const Icon = badge.icon;
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium cursor-default",
                        badge.className
                    )}>
                        <Icon className="h-3.5 w-3.5" />
                        <span>{badge.name}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{value} {badge.tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
