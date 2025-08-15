CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
    RETURNS BOOLEAN
    LANGUAGE sql
    SECURITY DEFINER
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.users
               WHERE id = user_uuid
                 AND permission_role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_updater(user_uuid UUID)
    RETURNS BOOLEAN
    LANGUAGE sql
    SECURITY DEFINER
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.users
               WHERE id = user_uuid
                 AND permission_role = 'updater');
$$;

CREATE OR REPLACE FUNCTION public.is_privileged_user(user_uuid UUID)
    RETURNS BOOLEAN
    LANGUAGE sql
    SECURITY DEFINER
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.users
               WHERE id = user_uuid
                 AND permission_role in ('updater', 'admin'));
$$;


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
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
    -- INSERT, UPDATE condition
    auth.uid() = id
        OR public.is_admin(auth.uid())
    );
-- ===============================  END USERS TABLE  =============================== --


-- ===============================  DOGS TABLE  =============================== --
-- 1. Admins can CRUD all dogs.
-- 2. Updaters can READ dogs they are assigned to.
ALTER TABLE public.dogs
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY dogs_admin_full_access ON public.dogs
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY dogs_updater_read ON public.dogs
    FOR SELECT
    USING (
        public.is_updater(auth.uid())
        AND dog_current_handler = auth.uid()
        AND dog_is_archived = false
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
    public.is_admin(auth.uid())
        OR
    (public.is_updater(auth.uid()) AND update_created_by = auth.uid())
    )
    WITH CHECK (
    public.is_admin(auth.uid())
        OR
    (public.is_updater(auth.uid()) AND update_created_by = auth.uid())
    );

CREATE POLICY dog_updates_public ON public.dog_updates
    FOR
    SELECT TO authenticated
    USING (update_date_approved IS NOT NULL);

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
ALTER TABLE public.dog_history
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY dog_history_admin_select ON public.dog_history
    FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Policy 2: Admins can INSERT
CREATE POLICY dog_history_admin_insert ON public.dog_history
    FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));
-- ===============================  END DOG_HISTORY TABLE  =============================== --

-- ===============================  SYSTEM_SETTINGS TABLE  =============================== --
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read system settings"
    ON public.system_settings
    FOR SELECT
    USING (
    auth.role() = 'authenticated'
    );

CREATE POLICY "Allow admins to update system settings"
    ON public.system_settings
    FOR UPDATE
    USING (
    is_admin(auth.uid())
    );