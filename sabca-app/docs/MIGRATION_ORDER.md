# Migration Execution Order - FINAL

**IMPORTANT**: Execute these migrations in the exact order specified below.

---

## Pre-Migration Checklist

- [ ] **Backup your database**
  ```bash
  pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Clear any existing functions**
  ```sql
  DROP FUNCTION IF EXISTS generate_membership_id() CASCADE;
  DROP FUNCTION IF EXISTS approve_membership(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) CASCADE;
  ```

---

## Migration Order

### Step 1: Core SABCA ID System
**File**: `fix_division_numbering.sql`  
**Purpose**: Sets up divisions table with codes, creates ID generation trigger

```sql
-- Run this file in Supabase SQL Editor
-- This creates:
-- - Divisions table with all 16 districts + Head Office
-- - District codes (TPT, KRN, HO, etc.)
-- - generate_membership_id() trigger function
-- - Automatic ID generation on profile updates
```

**Verification**:
```sql
-- Check divisions
SELECT id, name, code FROM divisions ORDER BY id;

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%membership_id%';
```

---

### Step 2: Admin Approval Function
**File**: `supabase/migrations/update_admin_ids.sql`  
**Purpose**: Creates approve_membership RPC for admin panel

```sql
-- Run this file in Supabase SQL Editor
-- This creates:
-- - approve_membership() RPC function
-- - Special ID handling for Admins (SABCA-ADM-XXX)
-- - Special ID handling for Moderators (SABCA-MOD-XXX)
-- - Regular member ID generation (SABCA-{Code}-{Type}-{Seq})
```

**Verification**:
```sql
-- Check function exists
SELECT proname, pronargs FROM pg_proc WHERE proname = 'approve_membership';

-- Should return: approve_membership | 6
```

---

### Step 3: Other Migrations (Optional)
These can be run in any order after Steps 1 & 2:

1. `supabase/migrations/create_government_orders.sql` - Government orders feature
2. `supabase/migrations/drop_community_feature.sql` - Remove community feature
3. `supabase/migrations/enable_phone_login.sql` - Phone authentication
4. `supabase/migrations/allow_mod_delete_events.sql` - Moderator permissions
5. `supabase/migrations/update_cleanup_logic.sql` - Cleanup logic

---

## Post-Migration Verification

### 1. Check Database State
```sql
-- Verify divisions have codes
SELECT id, name, code FROM divisions WHERE code IS NULL;
-- Should return 0 rows

-- Check for profiles without IDs (should only be pending users)
SELECT id, full_name, role, division, sabca_id 
FROM profiles 
WHERE sabca_id IS NULL 
AND is_paid_member = TRUE;
-- Should return 0 rows

-- Verify ID format
SELECT sabca_id, role, division, membership_type 
FROM profiles 
WHERE sabca_id IS NOT NULL 
LIMIT 10;
-- Should see formats like:
-- SABCA-ADM-001 (for admins)
-- SABCA-MOD-001 (for moderators)
-- SABCA-TPT-LM-1001 (for regular members)
```

### 2. Test ID Generation
```sql
-- Test the approve_membership function
SELECT approve_membership(
  'your-test-user-id'::UUID,
  'TPT',
  'Tirupati (SABCA-TPT)',
  'LM',
  'Life',
  NOW() + INTERVAL '10 years'
);

-- Should return: {"success": true, "sabca_id": "SABCA-TPT-LM-1001"}
```

### 3. Frontend Testing
- [ ] Open the app
- [ ] View profile page - ID should display correctly
- [ ] Generate QR code - should contain new ID
- [ ] Download ID card as PDF
- [ ] Admin: Approve a new user
- [ ] Verify new user gets correct ID format

---

## Rollback Plan

If something goes wrong:

```bash
# Restore from backup
psql your_database < backup_YYYYMMDD_HHMMSS.sql
```

---

## ⚠️ CRITICAL NOTES

1. **DO NOT** run `supabase/migrations/approve_membership.sql` - **THIS FILE HAS BEEN DELETED**
2. **DO NOT** run any files from `migrations_archive/obsolete/`
3. **ALWAYS** run `fix_division_numbering.sql` BEFORE `update_admin_ids.sql`
4. **VERIFY** each step before proceeding to the next

---

## Summary

✅ **Step 1**: `fix_division_numbering.sql` (Core system)  
✅ **Step 2**: `supabase/migrations/update_admin_ids.sql` (Admin RPC)  
✅ **Step 3**: Other optional migrations  
✅ **Verify**: Test ID generation and frontend display

**Total Time**: ~10-15 minutes
