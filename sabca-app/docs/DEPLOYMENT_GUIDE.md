# SABCA ID Migration - Deployment Guide

## 🎯 Objective
Migrate from the old numeric ID format (`SABCA-yxxxx`) to the new multi-part format (`SABCA-{Code}-{Type}-{Seq}`).

## 📋 Pre-Deployment Checklist

### 1. Backup Your Database
```sql
-- Create a backup before running any migrations
pg_dump your_database > backup_before_sabca_migration_$(date +%Y%m%d).sql
```

### 2. Verify Current State
Run this query to check existing IDs:
```sql
SELECT sabca_id, membership_id, division, membership_type, role 
FROM profiles 
WHERE sabca_id IS NOT NULL 
LIMIT 10;
```

## 🚀 Deployment Steps

### Step 1: Clear Old Function Definition
```sql
-- Remove any existing version of the function
DROP FUNCTION IF EXISTS generate_membership_id() CASCADE;
```

### Step 2: Run the Migration
Execute the **ONLY** approved migration file:
```
/fix_division_numbering.sql
```

**Location**: `/Users/sriram/Downloads/sabca_build_final_backup/sabca-app/fix_division_numbering.sql`

### Step 3: Verify Results
```sql
-- Check that IDs are in the new format
SELECT 
    sabca_id, 
    division, 
    membership_type, 
    role 
FROM profiles 
WHERE sabca_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 20;
```

Expected formats:
- **Head Office Admin**: `SABCA-HO-LM-1001`
- **Tirupati Life Member**: `SABCA-TPT-LM-1001`
- **Krishna Annual Member**: `SABCA-KRN-AM-2001`
- **Guntur Global Member**: `SABCA-SGP-GM-101`

### Step 4: Test ID Generation
Create a test user and verify ID generation:
```sql
-- Insert test profile (replace with actual user ID)
UPDATE profiles 
SET division = 'Tirupati (SABCA-TPT)', 
    membership_type = 'Life' 
WHERE id = 'your-test-user-id';

-- Check the generated ID
SELECT sabca_id FROM profiles WHERE id = 'your-test-user-id';
-- Should show: SABCA-TPT-LM-1002 (or next available sequence)
```

## ✅ Post-Deployment Verification

### 1. Frontend Checks
- [ ] Open the app and view your profile ID card
- [ ] Verify the ID displays correctly (e.g., `SABCA-TPT-LM-1001`)
- [ ] Generate a QR code and verify it contains the new ID
- [ ] Download ID card as PDF and verify format
- [ ] Search for members by their new SABCA ID in admin panel

### 2. Database Checks
```sql
-- Count IDs by format
SELECT 
    CASE 
        WHEN sabca_id LIKE 'SABCA-%-%--%' THEN 'New Format'
        WHEN sabca_id LIKE 'SABCA-%' THEN 'Old Format'
        ELSE 'Invalid'
    END as format_type,
    COUNT(*) as count
FROM profiles
WHERE sabca_id IS NOT NULL
GROUP BY format_type;
```

Expected result: All IDs should be "New Format"

### 3. Sequence Validation
```sql
-- Verify sequences are within expected ranges
SELECT 
    division,
    membership_type,
    sabca_id,
    CAST(SUBSTRING(sabca_id FROM '[0-9]+$') AS INTEGER) as sequence_number
FROM profiles
WHERE sabca_id IS NOT NULL
ORDER BY division, membership_type, sequence_number;
```

Expected ranges:
- **GM (Global)**: 101-999
- **LM (Life)**: 1001-2000
- **AM (Annual)**: 2001-9999

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

1. **Restore from backup**:
```bash
psql your_database < backup_before_sabca_migration_YYYYMMDD.sql
```

2. **Contact support** with error logs

## ⚠️ Important Notes

- **DO NOT** run any SQL files from `migrations_archive/obsolete/`
- **DO NOT** manually modify `sabca_id` values - let the trigger handle it
- **Admins and Moderators** are automatically assigned to Head Office (`HO`)
- **Existing IDs** that don't match the new format will be regenerated

## 📞 Support

If you encounter issues:
1. Check the error logs in Supabase
2. Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'generate_membership_id';`
3. Review the audit report: `/AUDIT_REPORT.md`

---

**Last Updated**: 2026-02-17  
**Migration File**: `fix_division_numbering.sql`  
**Status**: Ready for deployment
