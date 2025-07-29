-- ===============================  USERS TABLE  =============================== --
-- 1. Authenticated users can CRUD their own profile.
-- 2. Admins can CRUD all users.
ALTER TABLE public.users
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_manage_own_or_admin
    ON public.users
    FOR ALL
    USING (
    -- SELECT, UPDATE, DELETE condition
    auth.uid() = id
        OR EXISTS (SELECT 1
                   FROM public.users AS u
                   WHERE u.id = auth.uid()
                     AND u.permission_role = 'admin')
    )
    WITH CHECK (
    -- INSERT, UPDATE condition
    auth.uid() = id
        OR EXISTS (SELECT 1
                   FROM public.users AS u
                   WHERE u.id = auth.uid()
                     AND u.permission_role = 'admin')
    );
-- ===============================  END USERS TABLE  =============================== --


-- ===============================  DOGS TABLE  =============================== --
-- 1. Admins can CRUD all dogs.
ALTER TABLE public.dogs
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY dogs_admin_full_access ON public.dogs
    FOR ALL
    USING (
    EXISTS (SELECT 1
            FROM public.users
            WHERE public.users.id = auth.uid()
              AND public.users.permission_role = 'admin')
    )
    WITH CHECK (
    EXISTS (SELECT 1
            FROM public.users
            WHERE public.users.id = auth.uid()
              AND public.users.permission_role = 'admin')
    );
-- ===============================  END DOGS TABLE  =============================== --


-- ===============================  DOG_UPDATES TABLE  =============================== --
-- Updaters can CRUD their own updates.
-- Admins can CRUD all updates.
ALTER TABLE public.dog_updates
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY dog_updates_admin_or_owner_crud ON public.dog_updates
    FOR ALL
    USING (
    EXISTS (SELECT 1
            FROM public.users
            WHERE public.users.id = auth.uid()
              AND public.users.permission_role = 'admin')
        OR
    (
        EXISTS (SELECT 1
                FROM public.users
                WHERE public.users.id = auth.uid()
                  AND public.users.permission_role = 'updater')
            AND update_created_by = auth.uid()
        )
    )
    WITH CHECK (
    EXISTS (SELECT 1
            FROM public.users
            WHERE public.users.id = auth.uid()
              AND public.users.permission_role = 'admin')
        OR
    (
        EXISTS (SELECT 1
                FROM public.users
                WHERE public.users.id = auth.uid()
                  AND public.users.permission_role = 'updater')
            AND update_created_by = auth.uid()
        )
    );
-- ===============================  END DOG_UPDATES TABLE  =============================== --


-- ===============================  DOG_FOLLOWING TABLE  =============================== --
-- 1. Users can CRUD their own dog following records.
ALTER TABLE public.dog_following
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY dog_following_own_crud ON public.dog_following
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ===============================  END DOG_FOLLOWING TABLE  =============================== --

-- ===============================  DOG_HISTORY TABLE  =============================== --
ALTER TABLE public.dog_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY dog_history_admin_select ON public.dog_history
    FOR SELECT
    USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND permission_role = 'admin'
    )
    );

-- Policy 2: Admins can INSERT
CREATE POLICY dog_history_admin_insert ON public.dog_history
    FOR INSERT
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND permission_role = 'admin'
    )
    );
-- ===============================  END DOG_HISTORY TABLE  =============================== --