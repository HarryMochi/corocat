import { User } from './types';

export const IMPLICIT_PLAN = 'free';

export const PLAN_LIMITS = {
    free: {
        coursesPerWeek: 5,
        whiteboardsTotal: 3,
        coursesPerHour: 5, // unused for free; kept for compatibility
    },
    premium: {
        coursesPerHour: 10,
        whiteboardsTotal: 20,
        coursesPerWeek: 10, // unused for premium
    },
};

export type PlanType = keyof typeof PLAN_LIMITS;

export function getUserPlan(user: User): PlanType {
    // Check both plan field and isPremium for backwards compatibility
    if (user.plan === 'premium' || (user as any).isPremium === true) {
        return 'premium';
    }
    return user.plan || IMPLICIT_PLAN;
}

export function getPlanLimits(plan: PlanType) {
    return PLAN_LIMITS[plan];
}

export function checkCourseLimit(user: User): { allowed: boolean; remaining: number; limit: number; nextReset?: Date; windowLabel?: string } {
    const plan = getUserPlan(user);
    const limits = getPlanLimits(plan);
    const now = Date.now();
    const timestamps = user.limits?.coursesCreatedTimestamps || [];

    if (plan === 'free') {
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recentCreations = timestamps.filter(ts => new Date(ts).getTime() > oneWeekAgo);
        const sortedCreations = recentCreations.map(ts => new Date(ts).getTime()).sort((a, b) => a - b);
        const used = sortedCreations.length;
        const limit = limits.coursesPerWeek;
        const remaining = Math.max(0, limit - used);
        let nextReset: Date | undefined;
        if (used >= limit && sortedCreations.length > 0) {
            nextReset = new Date(sortedCreations[0] + 7 * 24 * 60 * 60 * 1000);
        }
        return { allowed: used < limit, remaining, limit, nextReset, windowLabel: 'week' };
    }

    const oneHourAgo = now - 60 * 60 * 1000;
    const recentCreations = timestamps.filter(ts => new Date(ts).getTime() > oneHourAgo);
    const sortedCreations = recentCreations.map(ts => new Date(ts).getTime()).sort((a, b) => a - b);
    const used = sortedCreations.length;
    const limit = limits.coursesPerHour;
    const remaining = Math.max(0, limit - used);
    let nextReset: Date | undefined;
    if (used >= limit && sortedCreations.length > 0) {
        nextReset = new Date(sortedCreations[0] + 60 * 60 * 1000);
    }
    return { allowed: used < limit, remaining, limit, nextReset, windowLabel: 'hour' };
}

export function checkWhiteboardLimit(user: User, currentWhiteboardCount: number): { allowed: boolean; remaining: number; limit: number } {
    const plan = getUserPlan(user);
    const limits = getPlanLimits(plan);

    // Note: currentWhiteboardCount should be passed from the caller (e.g. calculated from real data or user metadata)
    // If user.limits.whiteboardsCreatedTotal is reliable, we can use that too.
    // For now, we'll assume the caller passes the authoritative count or we use the user metadata.

    const used = currentWhiteboardCount;
    const remaining = Math.max(0, limits.whiteboardsTotal - used);

    return {
        allowed: used < limits.whiteboardsTotal,
        remaining,
        limit: limits.whiteboardsTotal
    };
}
