/**
 * @file ugc_moderation.test.js
 * Unit test suite verifying Apple App Store Review Guideline 1.2 - User-Generated Content (UGC) Safety.
 * Apple requires apps displaying user-generated content or member directories to provide:
 * 1. A method for filtering objectionable material (e.g. member blocking).
 * 2. A mechanism for users to report objectionable content and timely (24-hr) response.
 * 3. The ability to block abusive users.
 * 4. Published Terms of Service / EULA with zero tolerance for objectionable content.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

describe('Apple Guideline 1.2 - User-Generated Content & Moderation Safety', () => {
    it('verifies ModerationContext exists and exports moderation tools', () => {
        const modPath = path.join(ROOT_DIR, 'ctx/ModerationContext.tsx');
        assert.ok(fs.existsSync(modPath), 'ModerationContext.tsx must exist');

        const content = fs.readFileSync(modPath, 'utf8');
        assert.ok(content.includes('export const REPORT_REASONS ='), 'Must export standard report categories');
        assert.ok(content.includes('export const useModeration ='), 'Must export useModeration hook');
        assert.ok(content.includes('export const ModerationProvider'), 'Must export ModerationProvider');
        assert.ok(content.includes('blockedUserIds: string[]'), 'Must track blockedUserIds');
        assert.ok(content.includes('isBlocked:'), 'Must expose isBlocked check');
        assert.ok(content.includes('blockUser:'), 'Must expose blockUser');
        assert.ok(content.includes('unblockUser:'), 'Must expose unblockUser');
        assert.ok(content.includes('reportUser:'), 'Must expose reportUser');
        assert.ok(content.includes('showModerationOptions:'), 'Must expose showModerationOptions action sheet');
    });

    it('verifies 5 standardized UGC report reasons and 24-hour review commitment', () => {
        const modPath = path.join(ROOT_DIR, 'ctx/ModerationContext.tsx');
        const content = fs.readFileSync(modPath, 'utf8');

        assert.ok(content.includes('Inappropriate Profile Photo or Bio'), 'Must have profile photo/bio reason');
        assert.ok(content.includes('Harassment, Hate Speech, or Abusive Behavior'), 'Must have harassment reason');
        assert.ok(content.includes('Impersonation, Fake Profile, or Fraud'), 'Must have impersonation reason');
        assert.ok(content.includes('Spam or Commercial Solicitation'), 'Must have spam reason');
        assert.ok(content.includes('Other Objectionable Content'), 'Must have other objectionable content reason');

        // Apple 24-hour turnaround commitment
        assert.ok(content.includes('reviews all reported content within 24 hours'), 'Must display 24-hour moderation SLA commitment');
    });

    it('verifies ModerationProvider is mounted at app root layout', () => {
        const layoutPath = path.join(ROOT_DIR, 'app/_layout.tsx');
        const content = fs.readFileSync(layoutPath, 'utf8');

        assert.ok(content.includes('ModerationProvider'), 'ModerationProvider must be imported');
        assert.ok(content.includes('<ModerationProvider>'), 'ModerationProvider must wrap the root layout');
    });

    it('verifies Database migration 046 creates user_reports and blocked_users tables with RLS', () => {
        const migrationPath = path.join(ROOT_DIR, 'supabase/migrations/046_ugc_user_reports_and_blocks.sql');
        assert.ok(fs.existsSync(migrationPath), 'Migration 046 must exist');

        const sql = fs.readFileSync(migrationPath, 'utf8');
        assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.user_reports'), 'Must create user_reports table');
        assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.blocked_users'), 'Must create blocked_users table');
        assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'), 'Must enable RLS');
        assert.ok(sql.includes('CREATE POLICY "Authenticated users can create reports"'), 'Must have insert policy for reports');
        assert.ok(sql.includes('CREATE POLICY "Users can manage their blocked list"'), 'Must have self-management policy for blocks');
    });

    it('verifies Committee/Members view (sabca.tsx) implements press-and-hold moderation gesture and filtering', () => {
        const sabcaPath = path.join(ROOT_DIR, 'app/(tabs)/sabca.tsx');
        const content = fs.readFileSync(sabcaPath, 'utf8');

        assert.ok(content.includes('useModeration()'), 'Must consume useModeration in sabca.tsx');
        assert.ok(content.includes('delayLongPress={400}'), 'Must specify delayLongPress for tactile feel');
        assert.ok(content.includes('showModerationOptions('), 'Must invoke showModerationOptions on long press');
        assert.ok(content.includes('💡 Press and hold any member card to report or block'), 'Must include discoverability hint banner');
        assert.ok(content.includes('!isBlocked('), 'Must filter out blocked members from committee and member lists');
    });

    it('verifies Division Directory view (directory/[division].tsx) implements press-and-hold moderation gesture and filtering', () => {
        const dirPath = path.join(ROOT_DIR, 'app/directory/[division].tsx');
        const content = fs.readFileSync(dirPath, 'utf8');

        assert.ok(content.includes('useModeration()'), 'Must consume useModeration in directory/[division].tsx');
        assert.ok(content.includes('delayLongPress={400}'), 'Must specify delayLongPress for tactile feel');
        assert.ok(content.includes('showModerationOptions('), 'Must invoke showModerationOptions on long press');
        assert.ok(content.includes('💡 Press and hold any member card to report or block'), 'Must include discoverability hint banner');
        assert.ok(content.includes('!isBlocked('), 'Must filter out blocked members from contacts list');
    });

    it('verifies Settings screen (index.tsx) contains Blocked Members manager and unblock functionality', () => {
        const profilePath = path.join(ROOT_DIR, 'app/(tabs)/index.tsx');
        const content = fs.readFileSync(profilePath, 'utf8');

        assert.ok(content.includes('useModeration()'), 'Must consume useModeration in index.tsx');
        assert.ok(content.includes('Blocked Members'), 'Must have Blocked Members section');
        assert.ok(content.includes('unblockUser('), 'Must allow unblocking blocked members');
        assert.ok(content.includes('UserX'), 'Must display UserX icon for blocked members');
    });

    it('verifies Terms of Service (terms.tsx) contains explicit zero-tolerance policy against objectionable content', () => {
        const termsPath = path.join(ROOT_DIR, 'app/(auth)/terms.tsx');
        const content = fs.readFileSync(termsPath, 'utf8');

        assert.ok(content.includes('Zero-Tolerance Policy for Objectionable Content and Abusive Behavior'), 'Must have zero tolerance header');
        assert.ok(content.includes('within 24 hours'), 'Must declare 24 hour SLA');
        assert.ok(content.includes('immediate termination of association access'), 'Must declare immediate removal/termination penalty');
    });
});
