const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { parseAuthDeepLink } = require('../utils/authDeepLink.ts');

const ROOT_DIR = path.resolve(__dirname, '..');

test('Password Reset Deep Linking & iOS SceneDelegate Handling', async (t) => {
    await t.test('parseAuthDeepLink parses implicit recovery URL with (auth) group', () => {
        const res = parseAuthDeepLink(
            'sabcaapp:///(auth)/reset-password#access_token=tok123&refresh_token=ref456&type=recovery'
        );
        assert.strictEqual(res.isAuthLink, true);
        assert.strictEqual(res.isResetPasswordRoute, true);
        assert.strictEqual(res.isRecovery, true);
        assert.strictEqual(res.accessToken, 'tok123');
        assert.strictEqual(res.refreshToken, 'ref456');
        assert.strictEqual(res.type, 'recovery');
        assert.strictEqual(res.error, null);
    });

    await t.test('parseAuthDeepLink parses implicit recovery URL without (auth) group', () => {
        const res = parseAuthDeepLink(
            'sabcaapp://reset-password#access_token=tok123&refresh_token=ref456&type=recovery'
        );
        assert.strictEqual(res.isAuthLink, true);
        assert.strictEqual(res.isResetPasswordRoute, true);
        assert.strictEqual(res.isRecovery, true);
        assert.strictEqual(res.accessToken, 'tok123');
        assert.strictEqual(res.refreshToken, 'ref456');
    });

    await t.test('parseAuthDeepLink parses Site URL fallback with recovery type', () => {
        const res = parseAuthDeepLink(
            'sabcaapp://#access_token=tok123&refresh_token=ref456&type=recovery'
        );
        assert.strictEqual(res.isAuthLink, true);
        assert.strictEqual(res.isResetPasswordRoute, false);
        assert.strictEqual(res.isRecovery, true);
        assert.strictEqual(res.accessToken, 'tok123');
        assert.strictEqual(res.refreshToken, 'ref456');
    });

    await t.test('parseAuthDeepLink parses PKCE code URL', () => {
        const res = parseAuthDeepLink('sabcaapp:///(auth)/reset-password?code=pkce-abc-123');
        assert.strictEqual(res.isAuthLink, true);
        assert.strictEqual(res.isResetPasswordRoute, true);
        assert.strictEqual(res.isRecovery, true);
        assert.strictEqual(res.code, 'pkce-abc-123');
    });

    await t.test('parseAuthDeepLink parses token_hash recovery URL', () => {
        const res = parseAuthDeepLink('sabcaapp:///(auth)/reset-password?token_hash=th-999&type=recovery');
        assert.strictEqual(res.isAuthLink, true);
        assert.strictEqual(res.isResetPasswordRoute, true);
        assert.strictEqual(res.isRecovery, true);
        assert.strictEqual(res.tokenHash, 'th-999');
        assert.strictEqual(res.type, 'recovery');
    });

    await t.test('parseAuthDeepLink parses expired link error URL', () => {
        const res = parseAuthDeepLink(
            'sabcaapp:///(auth)/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
        );
        assert.strictEqual(res.isAuthLink, true);
        assert.strictEqual(res.isResetPasswordRoute, true);
        assert.strictEqual(res.isRecovery, true);
        assert.strictEqual(res.error, 'access_denied');
        assert.strictEqual(res.errorCode, 'otp_expired');
        assert.strictEqual(res.errorDescription, 'Email link is invalid or has expired');
    });

    await t.test('parseAuthDeepLink ignores normal app launch URLs', () => {
        for (const normalUrl of ['sabcaapp://', 'exp://192.168.1.5:8081']) {
            const res = parseAuthDeepLink(normalUrl);
            assert.strictEqual(res.isAuthLink, false, `Expected isAuthLink=false for ${normalUrl}`);
            assert.strictEqual(res.isRecovery, false, `Expected isRecovery=false for ${normalUrl}`);
        }
    });

    await t.test('Verifies both iOS SceneDelegate files exist, match, and forward deep links', () => {
        const rootScenePath = path.join(ROOT_DIR, 'ios/SceneDelegate.swift');
        const nestedScenePath = path.join(ROOT_DIR, 'ios/SABCA/SceneDelegate.swift');
        assert.ok(fs.existsSync(rootScenePath), 'ios/SceneDelegate.swift must exist');
        assert.ok(fs.existsSync(nestedScenePath), 'ios/SABCA/SceneDelegate.swift must exist');

        const rootScene = fs.readFileSync(rootScenePath, 'utf8');
        const nestedScene = fs.readFileSync(nestedScenePath, 'utf8');
        assert.strictEqual(rootScene, nestedScene, 'Both SceneDelegate.swift copies must stay identical');
        assert.ok(rootScene.includes('openURLContexts'), 'Must handle warm/background custom scheme deep links');
        assert.ok(rootScene.includes('connectionOptions.urlContexts'), 'Must handle cold-launch custom scheme deep links');
        assert.ok(rootScene.includes('continue userActivity: NSUserActivity'), 'Must handle Universal Links');
        assert.ok(rootScene.includes('appDelegate.application'), 'Must forward incoming URLs to AppDelegate');
    });

    await t.test('Verifies app/_layout.tsx uses getLinkingURL, useLinkingURL, and recovery routing guard', () => {
        const layoutPath = path.join(ROOT_DIR, 'app/_layout.tsx');
        const layoutCode = fs.readFileSync(layoutPath, 'utf8');
        assert.ok(layoutCode.includes('Linking.getLinkingURL'), 'Must read Linking.getLinkingURL for iOS SceneDelegate cold starts');
        assert.ok(layoutCode.includes('Linking.useLinkingURL'), 'Must subscribe via Linking.useLinkingURL');
        assert.ok(layoutCode.includes('isPasswordRecovery'), 'InitialLayout routing must guard for isPasswordRecovery');
    });

    await t.test('Verifies ctx/AuthContext.tsx handles PASSWORD_RECOVERY and all Supabase link grant types', () => {
        const authPath = path.join(ROOT_DIR, 'ctx/AuthContext.tsx');
        const authCode = fs.readFileSync(authPath, 'utf8');
        assert.ok(authCode.includes('PASSWORD_RECOVERY'), 'Must handle PASSWORD_RECOVERY auth event');
        assert.ok(authCode.includes('exchangeCodeForSession'), 'Must support PKCE ?code exchange');
        assert.ok(authCode.includes('verifyOtp'), 'Must support OTP token_hash verification');
        assert.ok(authCode.includes('supabase.auth.setSession'), 'Must support implicit token setSession');
    });

    await t.test('Verifies app/(auth)/reset-password.tsx clears recovery state and signs out locally on success', () => {
        const resetPath = path.join(ROOT_DIR, 'app/(auth)/reset-password.tsx');
        const resetCode = fs.readFileSync(resetPath, 'utf8');
        assert.ok(resetCode.includes('clearPasswordRecovery'), 'Must clear password recovery state');
        assert.ok(resetCode.includes("signOut({ scope: 'local' })"), 'Must sign out locally after password update');
    });
});
