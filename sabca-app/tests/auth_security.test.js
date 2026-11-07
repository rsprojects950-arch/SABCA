const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const authContextPath = path.resolve(__dirname, '../ctx/AuthContext.tsx');

test('Auth & Biometric Security (OWASP MASVS & Apple Guideline 1.6)', async (t) => {
    assert(fs.existsSync(authContextPath), 'AuthContext.tsx must exist');
    const authCode = fs.readFileSync(authContextPath, 'utf8');

    await t.test('Verifies ZERO storage of plaintext passwords in SecureStore', () => {
        // Must NOT store credentials object containing pass/password
        assert(!authCode.includes('JSON.stringify(credentials)'), 'Forbidden plaintext password storage detected');
        assert(!authCode.includes('password: pass'), 'Direct password sign-in from storage detected in biometric handler');
    });

    await t.test('Verifies Supabase refresh token is used as biometric credential key', () => {
        assert(authCode.includes("const REFRESH_TOKEN_KEY = 'BIOMETRIC_REFRESH_TOKEN'"), 'Missing REFRESH_TOKEN_KEY constant');
        assert(authCode.includes('refresh_token: refreshToken'), 'signInWithBiometrics must use setSession with refresh_token');
    });

    await t.test('Verifies SecureStore uses WHEN_UNLOCKED_THIS_DEVICE_ONLY for Keychain accessibility', () => {
        assert(authCode.includes('keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY'), 'Must enforce device-unlocked Keychain protection');
    });

    await t.test('Verifies legacy plaintext USER_CREDENTIALS key is purged on initialization', () => {
        assert(authCode.includes("SecureStore.deleteItemAsync(LEGACY_CREDENTIALS_KEY)"), 'Legacy credential purge missing');
    });

    await t.test('Verifies Refresh Token Rotation handler updates stored token on session refresh', () => {
        assert(authCode.includes('supabase.auth.onAuthStateChange'), 'Missing onAuthStateChange listener');
        assert(authCode.includes('newSession?.refresh_token'), 'Missing token rotation sync on session update');
    });

    await t.test('Verifies non-destructive biometric error handling (preserves enrollment flag on token expiry)', () => {
        assert(!authCode.includes('await setBiometricEnabled(false);'), 'Destructive wipe of biometric enrollment detected on token error');
    });

    await t.test('Verifies sign out uses local scope when biometrics enabled to preserve refresh token', () => {
        const tabsIndexPath = path.resolve(__dirname, '../app/(tabs)/index.tsx');
        const tabsCode = fs.readFileSync(tabsIndexPath, 'utf8');
        assert(tabsCode.includes("scope: isBiometricEnabled ? 'local' : 'global'"), 'Missing conditional local scope sign out in profile screen');
    });
});

