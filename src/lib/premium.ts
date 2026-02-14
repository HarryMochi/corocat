// Premium plan utilities
export function isPremiumUser(user: any): boolean {
    // For now, return true for all users
    // TODO: Implement actual premium check based on user.plan or subscription status
    return user?.plan === 'premium' || user?.isPremium === true;
}

export function showPremiumUpgradePrompt() {
    return {
        title: "Premium Feature",
        message: "This feature is only available for Premium users. Upgrade to unlock collaboration features!",
        upgradeUrl: "/pricing"
    };
}
