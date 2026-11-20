'use client';

import { useMemo, useState } from 'react';
import { Search, Database, AlertTriangle, Tag } from 'lucide-react';

export type MigrationCategory =
  | 'All'
  | 'Schema'
  | 'Auth & Security'
  | 'Membership & IDs'
  | 'Grievances & Notifications'
  | 'Data Governance & Deletion'
  | 'UGC Moderation'
  | 'Automation & Performance';

interface MigrationEntry {
  order: number;
  filename: string;
  category: Exclude<MigrationCategory, 'All'>;
  summary: string;
}

const MIGRATIONS: MigrationEntry[] = [
  { order: 1, filename: '001_create_government_orders.sql', category: 'Schema', summary: 'Creates the government_orders table for searchable state G.O. PDFs and circulars.' },
  { order: 2, filename: '002_drop_community_feature.sql', category: 'Schema', summary: 'Drops deprecated post_likes and community_posts tables with cascade cleanup.' },
  { order: 3, filename: '003_enable_phone_login.sql', category: 'Auth & Security', summary: 'Adds idx_profiles_phone index and legacy phone-to-email lookup RPC.' },
  { order: 4, filename: '004_fix_division_numbering.sql', category: 'Membership & IDs', summary: 'Establishes SABCA-{DistrictCode}-{MembershipType}-{Seq} ID format (GM 101+, LM 1001+, AM 2001+).' },
  { order: 5, filename: '005_update_admin_ids.sql', category: 'Membership & IDs', summary: 'Assigns sequential SABCA-ADM-XXX and SABCA-MOD-XXX identifiers to privileged accounts.' },
  { order: 6, filename: '006_add_grievance_notifications.sql', category: 'Grievances & Notifications', summary: 'Adds database triggers to emit notifications on grievance lifecycle events.' },
  { order: 7, filename: '007_update_grievance_ids_to_codes.sql', category: 'Grievances & Notifications', summary: 'Updates grievance display IDs to GRV-{DivisionCode}-{Year}-{Seq} (e.g., GRV-TPT-2026-0001).' },
  { order: 8, filename: '008_allow_mod_delete_events.sql', category: 'Auth & Security', summary: 'Updates events RLS policy so moderators can delete events alongside admins.' },
  { order: 9, filename: '009_update_cleanup_logic.sql', category: 'Automation & Performance', summary: 'Updates SECURITY DEFINER cleanup_expired_content() routine for scheduled maintenance.' },
  { order: 10, filename: '010_update_membership_payment_logic.sql', category: 'Membership & IDs', summary: 'Drops legacy corpus_contributions table and updates approve_membership payment handling.' },
  { order: 11, filename: '011_fix_notifications.sql', category: 'Grievances & Notifications', summary: 'Re-creates create_notification RPC and triggers to resolve overloaded signature mismatches.' },
  { order: 12, filename: '012_patch_notification_overload.sql', category: 'Grievances & Notifications', summary: 'Patches 4- vs 5-argument create_notification resolution across database triggers.' },
  { order: 13, filename: '013_fix_membership_id_parsing.sql', category: 'Membership & IDs', summary: 'Fixes integer sequence parsing errors inside approve_membership().' },
  { order: 14, filename: '014_integrate_transactions.sql', category: 'Membership & IDs', summary: 'Links approve_membership() to insert verified records into the transactions ledger.' },
  { order: 15, filename: '015_fix_grievance_rls.sql', category: 'Auth & Security', summary: 'Grants admin and moderator RLS visibility for grievance timelines and attachments.' },
  { order: 16, filename: '017_fix_login_bug.sql', category: 'Auth & Security', summary: 'Removes recursive profiles RLS policy ("Admins can view all profiles") that blocked logins.' },
  { order: 17, filename: '018_safe_admin_visibility.sql', category: 'Auth & Security', summary: 'Introduces SECURITY DEFINER role helper functions to eliminate RLS recursion on profiles.' },
  { order: 18, filename: '019_diagnostic_rpc.sql', category: 'Data Governance & Deletion', summary: 'Adds get_tables_diagnostic() helper used by delete-user Edge Function diagnostics.' },
  { order: 19, filename: '020_master_user_deletion.sql', category: 'Data Governance & Deletion', summary: 'Creates atomic cascade deletion RPC honoring foreign key dependency ordering.' },
  { order: 20, filename: '021_allow_moderators_to_approve.sql', category: 'Membership & IDs', summary: 'Expands approve_membership() authorization check to permit moderator approvals.' },
  { order: 21, filename: '022_moderator_role_management.sql', category: 'Auth & Security', summary: 'Defines/updates set_user_role() and permits moderator role transitions.' },
  { order: 22, filename: '023_fix_moderator_id_generation.sql', category: 'Membership & IDs', summary: 'Updates set_user_role() to auto-issue SABCA-MOD-XXX / SABCA-ADM-XXX badges.' },
  { order: 23, filename: '024_moderator_division_rls.sql', category: 'Auth & Security', summary: 'Restricts moderator profile visibility by assigned division using recursion-safe helpers.' },
  { order: 24, filename: '025_revoke_membership_rpc.sql', category: 'Membership & IDs', summary: 'Adds revoke_membership() RPC for admins and moderators to revoke paid status.' },
  { order: 25, filename: '026_moderator_content_permissions.sql', category: 'Auth & Security', summary: 'Grants moderators INSERT/UPDATE/DELETE policies on Events, News, Gallery, and Government Orders.' },
  { order: 26, filename: '027_ensure_storage_read_access.sql', category: 'Auth & Security', summary: 'Configures public read policies for content storage buckets.' },
  { order: 27, filename: '028_create_polls_table.sql', category: 'Schema', summary: 'Creates poll_questions and poll_votes tables for member polling.' },
  { order: 28, filename: '029_alter_polls_table_add_division.sql', category: 'Schema', summary: 'Adds target_division column to poll_questions for district-scoped polls.' },
  { order: 29, filename: '030_enable_realtime_for_polls.sql', category: 'Automation & Performance', summary: 'Adds public.poll_votes to supabase_realtime publication for live vote tallies.' },
  { order: 30, filename: '031_add_poll_notifications.sql', category: 'Grievances & Notifications', summary: 'Adds handle_new_poll_notification() trigger to notify targeted members.' },
  { order: 31, filename: '032_add_poll_delete_policy.sql', category: 'Auth & Security', summary: 'Adds missing DELETE RLS policy on poll_questions for admins and moderators.' },
  { order: 32, filename: '033_add_personal_info_fields.sql', category: 'Schema', summary: 'Adds personal profile columns such as dob and aadhaar_number.' },
  { order: 33, filename: '034_fix_polls_realtime_and_identity.sql', category: 'Automation & Performance', summary: 'Adds poll_questions to Realtime publication and configures REPLICA IDENTITY FULL.' },
  { order: 34, filename: '035_drop_gallery.sql', category: 'Schema', summary: 'Drops deprecated gallery_albums table with CASCADE.' },
  { order: 35, filename: '036_create_directory_contacts.sql', category: 'Schema', summary: 'Creates directory_contacts table for official division/executive listings.' },
  { order: 36, filename: '037_fix_directory_rls_patch.sql', category: 'Auth & Security', summary: 'Rebuilds insert/update/delete policies on directory_contacts for admins and moderators.' },
  { order: 37, filename: '038_fix_poll_notifications.sql', category: 'Grievances & Notifications', summary: 'Aligns handle_new_poll_notification() trigger columns with production notifications schema.' },
  { order: 38, filename: '039_remove_moderator_special_id.sql', category: 'Membership & IDs', summary: 'Stops issuing special SABCA-MOD-XXX IDs so moderators keep standard division SABCA IDs.' },
  { order: 39, filename: '040_revert_existing_moderator_ids.sql', category: 'Membership & IDs', summary: 'Backfills existing SABCA-MOD-XXX records back to standard generate_sabca_id() IDs.' },
  { order: 40, filename: '041_add_address_to_directory_contacts.sql', category: 'Schema', summary: 'Adds address column to directory_contacts.' },
  { order: 41, filename: '042_allow_moderator_custom_divisions.sql', category: 'Membership & IDs', summary: 'Preserves custom division assignment for admins and moderators inside generate_membership_id().' },
  { order: 42, filename: '043_update_division_codes.sql', category: 'Membership & IDs', summary: 'Synchronizes updated division codes and names across divisions, profiles, and directory_contacts.' },
  { order: 43, filename: '044_update_user_deletion_rpc.sql', category: 'Data Governance & Deletion', summary: 'Extends delete_user_data_cascade(p_user_id) to clean up poll_votes, poll_questions, and directory links.' },
  { order: 44, filename: '045_refine_division_codes.sql', category: 'Membership & IDs', summary: 'Refines Guntur & regional division codes across existing member records.' },
  { order: 45, filename: '045_user_self_deletion_rpc.sql', category: 'Data Governance & Deletion', summary: 'Adds delete_own_account() SECURITY DEFINER RPC enabling Apple Guideline 5.1.1(v) in-app deletion.' },
  { order: 46, filename: '046_split_father_spouse_name.sql', category: 'Schema', summary: 'Splits relational identity into explicit father_name and spouse_name columns on profiles.' },
  { order: 47, filename: '046_ugc_user_reports_and_blocks.sql', category: 'UGC Moderation', summary: 'Creates user_reports and blocked_users tables with RLS for Apple Guideline 1.2 UGC compliance.' },
  { order: 48, filename: '047_add_contractor_class.sql', category: 'Schema', summary: 'Adds contractor_class column to profiles (Class-I through Class-V contractor tiers).' },
  { order: 49, filename: '048_fix_division_names.sql', category: 'Membership & IDs', summary: 'Corrects division naming (e.g., Guntur Nagarapalaka Samata SABCA-GMCA) and codes.' },
  { order: 50, filename: '049_server_automation.sql', category: 'Automation & Performance', summary: 'Schedules pg_cron jobs: daily 3:00 AM IST cleanup and 6-hour IST grievance escalation.' },
  { order: 51, filename: '050_performance_indices.sql', category: 'Automation & Performance', summary: 'Creates B-tree indexes across profiles, grievances, notifications, events, polls, and transactions.' },
  { order: 52, filename: '051_verify_login_by_phone.sql', category: 'Auth & Security', summary: 'Adds verify_login_by_phone(p_phone, p_password) using pgcrypto crypt() to block enumeration.' },
];

const CATEGORIES: MigrationCategory[] = [
  'All',
  'Schema',
  'Auth & Security',
  'Membership & IDs',
  'Grievances & Notifications',
  'Data Governance & Deletion',
  'UGC Moderation',
  'Automation & Performance',
];

export function MigrationExplorer() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MigrationCategory>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MIGRATIONS.filter((item) => {
      const catMatch = category === 'All' || item.category === category;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        item.filename.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-xs">
      <div className="space-y-3 border-b border-fd-border bg-fd-muted/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-fd-foreground" />
            <span className="text-sm font-semibold">
              SQL Migration Explorer ({filtered.length} / {MIGRATIONS.length} files)
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-fd-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by filename or topic..."
              aria-label="Filter SQL migrations"
              className="w-full rounded-lg border border-fd-border bg-fd-background py-1.5 pl-8 pr-3 text-xs text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:ring-2 focus:ring-fd-ring/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                category === cat
                  ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                  : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-fd-border bg-fd-background/80 px-3 py-2 text-[11px] text-fd-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <span>
            Note on numbering: prefix <code>016</code> is absent on disk, while prefixes{' '}
            <code>045</code> and <code>046</code> each contain two separate{' '}
            <code>.sql</code> files — run all 52 files in lexicographical order.
          </span>
        </div>
      </div>

      <div className="sabca-scroller max-h-[440px] overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-fd-border bg-fd-muted text-[11px] uppercase tracking-wider text-fd-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">#</th>
              <th className="px-4 py-2.5 font-semibold">File</th>
              <th className="px-4 py-2.5 font-semibold">Category</th>
              <th className="px-4 py-2.5 font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fd-border">
            {filtered.map((item) => (
              <tr key={item.filename} className="transition-colors hover:bg-fd-muted/35">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-fd-muted-foreground">
                  {String(item.order).padStart(2, '0')}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono font-medium text-fd-foreground">
                  {item.filename}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-muted/70 px-2 py-0.5 text-[11px] font-medium text-fd-foreground">
                    <Tag className="size-2.5 text-fd-muted-foreground" />
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-2.5 leading-relaxed text-fd-muted-foreground">
                  {item.summary}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-fd-muted-foreground">
                  No migrations matched &ldquo;{query}&rdquo;.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
