export interface ParsedAuthDeepLink {
    isAuthLink: boolean;
    isResetPasswordRoute: boolean;
    isRecovery: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    code: string | null;
    tokenHash: string | null;
    type: string | null;
    error: string | null;
    errorCode: string | null;
    errorDescription: string | null;
}

/**
 * Parses Supabase auth deep links (implicit hash fragments, PKCE ?code, OTP ?token_hash, and error callbacks).
 */
export function parseAuthDeepLink(url: string): ParsedAuthDeepLink {
    if (!url || typeof url !== 'string') {
        return {
            isAuthLink: false,
            isResetPasswordRoute: false,
            isRecovery: false,
            accessToken: null,
            refreshToken: null,
            code: null,
            tokenHash: null,
            type: null,
            error: null,
            errorCode: null,
            errorDescription: null,
        };
    }

    const hashIndex = url.indexOf('#');
    const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
    const hashString = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';

    const queryIndex = beforeHash.indexOf('?');
    const pathPart = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
    const queryString = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';

    const queryParams = new URLSearchParams(queryString);
    const hashParams = new URLSearchParams(hashString);

    const getParam = (key: string): string | null => {
        return hashParams.get(key) || queryParams.get(key) || null;
    };

    const accessToken = getParam('access_token');
    const refreshToken = getParam('refresh_token');
    const code = getParam('code');
    const tokenHash = getParam('token_hash');
    const type = getParam('type');
    const error = getParam('error');
    const errorCode = getParam('error_code');
    const errorDescription = getParam('error_description');

    const isResetPasswordRoute = pathPart.toLowerCase().includes('reset-password');
    const isRecovery = type === 'recovery' || isResetPasswordRoute;
    const isAuthLink = Boolean(
        accessToken ||
        code ||
        tokenHash ||
        (isResetPasswordRoute && (error || errorCode || errorDescription)) ||
        (error && type === 'recovery') ||
        errorCode === 'otp_expired'
    );

    return {
        isAuthLink,
        isResetPasswordRoute,
        isRecovery,
        accessToken,
        refreshToken,
        code,
        tokenHash,
        type,
        error,
        errorCode,
        errorDescription,
    };
}
