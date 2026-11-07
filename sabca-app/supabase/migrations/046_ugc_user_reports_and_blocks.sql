-- Migration 046: User-Generated Content Moderation (Apple Guideline 1.2)

-- 1. User Reports Table
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id TEXT NOT NULL,
    reported_name TEXT,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create reports"
    ON public.user_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports"
    ON public.user_reports FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 2. Blocked Users Table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their blocked list"
    ON public.blocked_users FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_lookup ON public.blocked_users (user_id, blocked_user_id);
