export interface DecodedToken {
    sub: string;
    role: number;
    tableId?: number;
    exp: number;
    iat: number;
}

/**
 * Utility to decode JWT claims without external dependencies like jwt-decode.
 * This is useful for reconstructing user state when the backend only returns tokens.
 */
export const decodeToken = (token: string): DecodedToken | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('[jwtUtils] Failed to decode token:', error);
        return null;
    }
};
