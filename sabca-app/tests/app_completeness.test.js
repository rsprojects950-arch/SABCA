/**
 * @file app_completeness.test.js
 * Unit test suite verifying Apple Guideline 2.1 - App Completeness.
 * Apple rejects apps that contain placeholder text (e.g. "Lorem ipsum"),
 * dead links, non-functional routes, mock domains, or temporary debug values.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'app');

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

describe('Apple Guideline 2.1 - App Completeness & Production Readiness', () => {
    const appFiles = getAllFiles(APP_DIR);

    it('verifies no placeholder lorem ipsum text exists in user-facing app screens', () => {
        const violations = [];
        for (const file of appFiles) {
            const content = fs.readFileSync(file, 'utf8');
            if (/lorem\s+ipsum/i.test(content)) {
                violations.push(path.relative(ROOT_DIR, file));
            }
        }
        assert.deepEqual(violations, [], `Found placeholder "Lorem ipsum" in: ${violations.join(', ')}`);
    });

    it('verifies no test domain (example.com) exists in production app code', () => {
        const violations = [];
        for (const file of appFiles) {
            const content = fs.readFileSync(file, 'utf8');
            if (/example\.com/i.test(content)) {
                violations.push(path.relative(ROOT_DIR, file));
            }
        }
        assert.deepEqual(violations, [], `Found mock domain "example.com" in: ${violations.join(', ')}`);
    });

    it('verifies no hardcoded localhost URLs exist in production app screens', () => {
        const violations = [];
        for (const file of appFiles) {
            const content = fs.readFileSync(file, 'utf8');
            if (/https?:\/\/localhost/i.test(content) || /https?:\/\/127\.0\.0\.1/i.test(content)) {
                violations.push(path.relative(ROOT_DIR, file));
            }
        }
        assert.deepEqual(violations, [], `Found hardcoded localhost in: ${violations.join(', ')}`);
    });

    it('verifies all core navigation tabs exist and have valid implementations', () => {
        const requiredTabs = [
            'app/(tabs)/_layout.tsx',
            'app/(tabs)/index.tsx',
            'app/(tabs)/events.tsx',
            'app/(tabs)/services.tsx',
            'app/(tabs)/sabca.tsx',
        ];

        for (const tabPath of requiredTabs) {
            const fullPath = path.join(ROOT_DIR, tabPath);
            assert.ok(fs.existsSync(fullPath), `Tab screen missing: ${tabPath}`);
            const stat = fs.statSync(fullPath);
            assert.ok(stat.size > 200, `Tab screen ${tabPath} is too small to be complete`);
        }
    });

    it('verifies member self-service portal screens exist', () => {
        const requiredMemberScreens = [
            'app/member/_layout.tsx',
            'app/member/qr-access.tsx',
            'app/member/renew.tsx',
            'app/member/history.tsx',
            'app/member/documents.tsx',
            'app/member/edit-profile.tsx',
        ];

        for (const screenPath of requiredMemberScreens) {
            const fullPath = path.join(ROOT_DIR, screenPath);
            assert.ok(fs.existsSync(fullPath), `Member screen missing: ${screenPath}`);
        }
    });

    it('verifies authentication and legal policy screens exist', () => {
        const requiredAuthScreens = [
            'app/(auth)/_layout.tsx',
            'app/(auth)/login.tsx',
            'app/(auth)/signup.tsx',
            'app/(auth)/reset-password.tsx',
            'app/(auth)/terms.tsx',
            'app/(auth)/privacy.tsx',
        ];

        for (const screenPath of requiredAuthScreens) {
            const fullPath = path.join(ROOT_DIR, screenPath);
            assert.ok(fs.existsSync(fullPath), `Auth screen missing: ${screenPath}`);
        }
    });

    it('verifies Privacy Policy screen contains required data disclosures', () => {
        const privacyScreen = path.join(APP_DIR, '(auth)/privacy.tsx');
        assert.ok(fs.existsSync(privacyScreen), 'Privacy screen must exist');
        
        const content = fs.readFileSync(privacyScreen, 'utf8');
        assert.ok(content.includes('Privacy Policy') || content.includes('privacy'), 'Must display privacy content');
        assert.ok(content.length > 500, 'Privacy screen must have substantive disclosure text');
    });

    it('verifies Terms of Service screen contains association membership terms', () => {
        const termsScreen = path.join(APP_DIR, '(auth)/terms.tsx');
        assert.ok(fs.existsSync(termsScreen), 'Terms screen must exist');
        
        const content = fs.readFileSync(termsScreen, 'utf8');
        assert.ok(content.includes('Terms') || content.includes('terms'), 'Must display terms content');
        assert.ok(content.length > 500, 'Terms screen must have substantive legal terms');
    });
});

