-- Enable RLS before defining policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_following ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_history ENABLE ROW LEVEL SECURITY;

-- === USERS TABLE POLICIES ===

-- Users can read their own profile only
CREATE POLICY "Users can read their own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile only
CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Admins can delete users
CREATE POLICY "Admins can delete users"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.permission_role = 'admin'
    )
    );

-- === DOGS TABLE POLICIES ===

-- Allow users with role 'admin' to insert dogs
CREATE POLICY "Admins can insert dogs"
    ON public.dogs
    FOR INSERT
    TO authenticated
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.permission_role = 'admin'
    )
    );

-- Allow users with role 'admin' to update dogs
CREATE POLICY "Admins can update dogs"
    ON public.dogs
    FOR UPDATE
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.permission_role = 'admin'
    )
    );

-- Allow only admins to delete dogs
CREATE POLICY "Admins can delete dogs"
    ON public.dogs
    FOR DELETE
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.permission_role = 'admin'
    )
    );

-- === DOG_UPDATES TABLE POLICIES ===

-- Authenticated users can read public updates or ones they created
CREATE POLICY "Read public or own dog updates"
    ON public.dog_updates
    FOR SELECT
    TO authenticated
    USING (
    update_is_public = true
        OR update_created_by = auth.uid()
    );

-- Allow users with role 'updater' to insert updates about dogs they handle
CREATE POLICY "Updaters can insert updates on dogs they handle"
    ON public.dog_updates
    FOR INSERT
    TO authenticated
    WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.users u
                 JOIN public.dogs d ON d.dog_id = dog_id
        WHERE u.id = auth.uid()
          AND u.permission_role = 'updater'
          AND d.dog_current_handler = auth.uid()
    )
    );

-- === DOG_FOLLOWING TABLE POLICIES (if needed) ===

-- Users can follow dogs (insert)
CREATE POLICY "Users can follow dogs"
    ON public.dog_following
    FOR INSERT
    TO authenticated
    WITH CHECK (
    user_id = auth.uid()
    );

-- Users can view their followed dogs
CREATE POLICY "Users can view their followed dogs"
    ON public.dog_following
    FOR SELECT
    TO authenticated
    USING (
    user_id = auth.uid()
    );

-- Users can unfollow dogs
CREATE POLICY "Users can unfollow dogs"
    ON public.dog_following
    FOR DELETE
    TO authenticated
    USING (
    user_id = auth.uid()
    );

-- === DOG_HISTORY TABLE POLICIES (optional – likely admin-only) ===

-- Admins can insert history records (e.g. audit log)
CREATE POLICY "Admins can insert dog history"
    ON public.dog_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.permission_role = 'admin'
    )
    );

-- Admins can view dog history
CREATE POLICY "Admins can view dog history"
    ON public.dog_history
    FOR SELECT
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.permission_role = 'admin'
    )
    );
