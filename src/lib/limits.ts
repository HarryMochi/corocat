import { User } from './types';

export const IMPLICIT_PLAN = 'free';

export const PLAN_LIMITS = {
    free: {
        coursesPerHour: 3,
        whiteboardsTotal: 3,
    },
    premium: {
        coursesPerHour: 10,
        whiteboardsTotal: 20,
    },
};

export type PlanType = keyof typeof PLAN_LIMITS;

export function getUserPlan(user: User): PlanType {
    return user.plan || IMPLICIT_PLAN;
}

export function getPlanLimits(plan: PlanType) {
    return PLAN_LIMITS[plan];
}

export function checkCourseLimit(user: User): { allowed: boolean; remaining: number; limit: number; nextReset?: Date } {
    const plan = getUserPlan(user);
    const limits = getPlanLimits(plan);

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Filter timestamps to only those within the last hour
    const recentCreations = (user.limits?.coursesCreatedTimestamps || [])
        .filter(ts => new Date(ts).getTime() > oneHourAgo);

    // We can also sort them to find when the oldest one "expires"
    const sortedCreations = recentCreations.map(ts => new Date(ts).getTime()).sort((a, b) => a - b);

    const used = sortedCreations.length;
    const remaining = Math.max(0, limits.coursesPerHour - used);

    let nextReset: Date | undefined = undefined;
    if (used >= limits.coursesPerHour && sortedCreations.length > 0) {
        // The user can create again when the *oldest* of the counted creations falls out of the 1-hour window.
        // i.e. oldest + 1 hour.
        nextReset = new Date(sortedCreations[0] + 60 * 60 * 1000);
    }

    return {
        allowed: used < limits.coursesPerHour,
        remaining,
        limit: limits.coursesPerHour,
        nextReset
    };
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
