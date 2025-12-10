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
        const response = await fetch(`/api/users/get?id=${userId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch user ${userId}: HTTP ${response.status}`);
            return `User ${userId}`;
        }
        
        const data = await response.json();
        const user = data.user; // Extract user from response
        if (user && user.username) {
            userCache.set(userId, user);
            return user.username;
        }
        return `User ${userId}`;
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