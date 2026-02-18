/**
 * Cookie-based storage utility for auth tokens.
 * Replaces localStorage for token persistence.
 *
 * All auth cookies use:
 *  - path=/
 *  - SameSite=Lax
 *  - Secure (in production)
 *  - 7-day expiry (configurable)
 */

const DEFAULT_EXPIRY_DAYS = 7;
const IS_SECURE = window.location.protocol === 'https:';

// ============================================
// LOW-LEVEL COOKIE HELPERS
// ============================================

export function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    if (!match) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

export function setCookie(name: string, value: string, days: number = DEFAULT_EXPIRY_DAYS): void {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const secure = IS_SECURE ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

export function removeCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ============================================
// AUTH TOKEN HELPERS (drop-in localStorage replacements)
// ============================================

const KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER: 'auth_user',
    USER_ID: 'auth_user_id',
} as const;

/** Get stored access token */
export function getAccessToken(): string | null {
    return getCookie(KEYS.ACCESS_TOKEN);
}

/** Store access token */
export function setAccessToken(token: string): void {
    setCookie(KEYS.ACCESS_TOKEN, token);
}

/** Get stored refresh token */
export function getRefreshToken(): string | null {
    return getCookie(KEYS.REFRESH_TOKEN);
}

/** Store refresh token */
export function setRefreshToken(token: string): void {
    setCookie(KEYS.REFRESH_TOKEN, token);
}

/** Get stored user JSON */
export function getStoredUser(): string | null {
    return getCookie(KEYS.USER);
}

/** Store user as JSON string */
export function setStoredUser(userJson: string): void {
    setCookie(KEYS.USER, userJson);
}

/** Get stored user ID */
export function getUserId(): string | null {
    return getCookie(KEYS.USER_ID);
}

/** Store user ID */
export function setUserId(id: string): void {
    setCookie(KEYS.USER_ID, id);
}

/** Clear all auth cookies and any other cookies */
export function clearAuthStorage(): void {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        removeCookie(name);
    }
}
