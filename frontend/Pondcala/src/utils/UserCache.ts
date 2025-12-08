// Simple in-memory cache for user data
const userCache = new Map<number, { id: number; username: string;}>();

export async function getUsername(userId: number): Promise<string> {
    // Check cache first
    const cached = userCache.get(userId);
    if (cached) {
        return cached.username;
    }
    
    // Fetch from API if not cached
    try {
        const response = await fetch(`/api/users/${userId}`);
        const user = await response.json();
        userCache.set(userId, user);
        return user.username || `User ${userId}`;
    } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
        return `User ${userId}`;
    }
}

export function cacheUser(user: { id: number; username: string;}): void {
    userCache.set(user.id, user);
}

export function clearUserCache(): void {
    userCache.clear();
}