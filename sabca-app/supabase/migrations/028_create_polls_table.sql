-- 1. Create poll_questions Table
CREATE TABLE public.poll_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'life_members', 'board_members', 'specific_division'))
);

-- 2. Create poll_options Table
CREATE TABLE public.poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.poll_questions(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- 3. Create poll_votes Table
CREATE TABLE public.poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.poll_questions(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- THE CRITICAL SECURITY RULE: One vote per person, per poll.
    UNIQUE(poll_id, user_id) 
);

-- 4. Set up Row Level Security (RLS)
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- 5. Policies for poll_questions
CREATE POLICY "Anyone can view active polls" ON public.poll_questions
    FOR SELECT USING (true);

CREATE POLICY "Only admins and moderators can insert polls" ON public.poll_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator')
        )
    );

CREATE POLICY "Only admins and moderators can update polls" ON public.poll_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator')
        )
    );

-- 6. Policies for poll_options
CREATE POLICY "Anyone can view poll options" ON public.poll_options
    FOR SELECT USING (true);

CREATE POLICY "Only admins and moderators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'moderator')
        )
    );

-- 7. Policies for poll_votes
CREATE POLICY "Anyone can view vote counts" ON public.poll_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);