/**
 * @file account_deletion.test.js
 * Unit test suite verifying Apple Guideline 5.1.1(v) - Account Deletion.
 * Apple requires apps that support account creation to also allow users to initiate
 * deletion of their account within the app, including all associated personal data.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

describe('Apple Guideline 5.1.1(v) - Account Deletion Architecture', () => {
    it('verifies AuthContext exposes deleteAccount function', () => {
        const authContextPath = path.join(ROOT_DIR, 'ctx/AuthContext.tsx');
        assert.ok(fs.existsSync(authContextPath), 'AuthContext.tsx must exist');
        
        const content = fs.readFileSync(authContextPath, 'utf8');
        assert.ok(content.includes('deleteAccount: () => Promise<{ error: any }>'), 'deleteAccount must be in AuthContextType');
        assert.ok(content.includes('const deleteAccount = async () =>'), 'deleteAccount implementation must exist');
    });

    it('verifies deleteAccount cleans up avatar storage before RPC', () => {
        const authContextPath = path.join(ROOT_DIR, 'ctx/AuthContext.tsx');
        const content = fs.readFileSync(authContextPath, 'utf8');
        
        assert.ok(content.includes("supabase.storage.from('avatars').list(user.id)"), 'Must list avatars for deletion');
        assert.ok(content.includes("supabase.storage.from('avatars').remove(paths)"), 'Must remove user avatar files');
    });

    it('verifies deleteAccount calls delete_own_account RPC', () => {
        const authContextPath = path.join(ROOT_DIR, 'ctx/AuthContext.tsx');
        const content = fs.readFileSync(authContextPath, 'utf8');
        
        assert.ok(content.includes("supabase.rpc('delete_own_account')"), 'Must call delete_own_account RPC');
    });

    it('verifies deleteAccount purges SecureStore credentials and auth state', () => {
        const authContextPath = path.join(ROOT_DIR, 'ctx/AuthContext.tsx');
        const content = fs.readFileSync(authContextPath, 'utf8');
        
        assert.ok(content.includes('SecureStore.deleteItemAsync(BIOMETRIC_KEY'), 'Must delete biometric key');
        assert.ok(content.includes('SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY'), 'Must delete refresh token key');
        assert.ok(content.includes('SecureStore.deleteItemAsync(LEGACY_CREDENTIALS_KEY)'), 'Must delete legacy credentials');
        assert.ok(content.includes('supabase.auth.signOut()'), 'Must sign out from Supabase');
        assert.ok(content.includes('setSession(null)'), 'Must reset session state to null');
        assert.ok(content.includes('setUser(null)'), 'Must reset user state to null');
    });

    it('verifies database migration defines delete_own_account RPC with SECURITY DEFINER', () => {
        const migrationPath = path.join(ROOT_DIR, 'supabase/migrations/045_user_self_deletion_rpc.sql');
        assert.ok(fs.existsSync(migrationPath), 'Migration 045 must exist');
        
        const content = fs.readFileSync(migrationPath, 'utf8');
        assert.ok(content.includes('CREATE OR REPLACE FUNCTION public.delete_own_account()'), 'Function signature must match');
        assert.ok(content.includes('SECURITY DEFINER'), 'Must use SECURITY DEFINER to permit self-deletion');
        assert.ok(content.includes('auth.uid()'), 'Must verify auth.uid()');
        assert.ok(content.includes('DELETE FROM auth.users WHERE id = v_user_id;'), 'Must purge user from auth.users');
        assert.ok(content.includes('GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;'), 'Must grant execute to authenticated');
    });

    it('verifies user-facing delete account UI in Settings/Profile screen', () => {
        const profileScreenPath = path.join(ROOT_DIR, 'app/(tabs)/index.tsx');
        assert.ok(fs.existsSync(profileScreenPath), 'Profile/Settings screen must exist');
        
        const content = fs.readFileSync(profileScreenPath, 'utf8');
        assert.ok(content.includes('deleteAccount'), 'Must invoke deleteAccount from hook');
        assert.ok(content.includes('deleteModalVisible'), 'Must present confirmation modal to prevent accidental deletion');
        assert.ok(content.includes('profile.dangerZone.deleteAccount'), 'Must have Danger Zone delete button');
    });

    it('verifies pending applicants can delete/withdraw account in onboarding screen', () => {
        const onboardingPath = path.join(ROOT_DIR, 'app/onboarding/index.tsx');
        assert.ok(fs.existsSync(onboardingPath), 'Onboarding screen must exist');
        
        const content = fs.readFileSync(onboardingPath, 'utf8');
        assert.ok(content.includes('deleteAccount'), 'Pending applicants must be able to cancel application');
        assert.ok(content.includes('deleteAccount()'), 'Must call deleteAccount on cancellation');
    });
});
