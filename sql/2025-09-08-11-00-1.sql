/*======================================================================================================================
=                                              Create Tables                                                          =
======================================================================================================================*/

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users
(
    id                 UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    name               TEXT                     NOT NULL DEFAULT '',
    permission_role    VARCHAR(64)              NOT NULL DEFAULT 'viewer' CHECK ( permission_role in ('viewer', 'updater', 'admin')),
    functional_role    VARCHAR(64) CHECK ( functional_role in
                                           ('staff', 'volunteer', 'puppy raiser', 'trainer', 'temporary boarder',
                                            'client', 'adoptive family', 'sponsor')),
    phone              VARCHAR(32)              NOT NULL DEFAULT '',
    is_archived        BOOLEAN                  NOT NULL DEFAULT false,
    has_accepted_terms BOOLEAN                  NOT NULL DEFAULT false,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Dogs table
CREATE TABLE public.dogs
(
    dog_id              UUID                     DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_name            TEXT                                                  NOT NULL,
    dog_role            TEXT                                                  NOT NULL CHECK (dog_role in ('Guide Dog', 'Assistance Dog', 'Community Ambassador Dog')),
    dog_yob             INTEGER                                               NOT NULL, -- year of birth
    dog_sex             TEXT CHECK (dog_sex IN ('Male', 'Female')) NOT NULL,
    dog_picture         TEXT,                                                           -- Supabase storage URL
    dog_status          TEXT,                                                           -- e.g., 'available', 'adopted', 'fostered', 'in_training'
    dog_current_handler UUID REFERENCES public.users (id),
    dog_general_notes   TEXT,
    dog_is_archived     BOOLEAN                  DEFAULT false,
    dog_created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()                NOT NULL,
    dog_updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()                NOT NULL,
    dog_created_by      UUID                                                  NOT NULL REFERENCES public.users (id),
    dog_last_edited_by  UUID                                                  NOT NULL REFERENCES public.users (id)
);

-- Updates/Feed table
CREATE TABLE public.dog_updates
(
    update_id            UUID                     DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_id               UUID REFERENCES public.dogs (dog_id) ON DELETE CASCADE NOT NULL,
    update_title         TEXT                                                   NOT NULL,
    update_description   TEXT                                                   NOT NULL,
    update_media_urls    TEXT[], -- Array of Supabase storage URLs
    update_date_approved TIMESTAMP WITH TIME ZONE,
    update_created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_created_by    UUID REFERENCES public.users (id)                      NOT NULL,
    update_approved_by   UUID REFERENCES public.users (id)
);

-- A mapping between users and the dogs they follow
CREATE TABLE public.dog_following
(
    user_id    UUID REFERENCES public.users (id) ON DELETE CASCADE    NOT NULL,
    dog_id     UUID REFERENCES public.dogs (dog_id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, dog_id)
);


CREATE TABLE public.dog_history
(
    history_id        UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    dog_id            UUID REFERENCES public.dogs (dog_id) ON DELETE SET NULL,
    changed_by        UUID NOT NULL REFERENCES public.users (id),
    changed_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_name          TEXT,
    new_name          TEXT,
    old_role          TEXT,
    new_role          TEXT,
    old_yob           INTEGER,
    new_yob           INTEGER,
    old_sex           TEXT,
    new_sex           TEXT,
    old_picture       TEXT,
    new_picture       TEXT,
    old_status        TEXT,
    new_status        TEXT,
    old_handler       UUID REFERENCES public.users (id),
    new_handler       UUID REFERENCES public.users (id),
    old_general_notes TEXT,
    new_general_notes TEXT,
    old_is_active     BOOLEAN,
    new_is_active     BOOLEAN
);

CREATE TABLE public.system_settings
(
    setting_key   TEXT PRIMARY KEY,
    setting_value TEXT        NOT NULL,
    setting_type  TEXT        NOT NULL CHECK (setting_type IN ('string', 'integer', 'boolean', 'json')),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Validate value based on type
    CONSTRAINT system_settings_value_type_chk CHECK (
        CASE
            WHEN setting_type = 'string' THEN TRUE
            WHEN setting_type = 'integer' THEN setting_value ~ '^\d+$'
            WHEN setting_type = 'boolean' THEN lower(setting_value) IN ('true', 'false')
            WHEN setting_type = 'json' THEN jsonb_typeof(setting_value::jsonb) IS NOT NULL
            ELSE FALSE
            END
        )
);


/*======================================================================================================================
=                                             Row-Level Security Policies                                              =
======================================================================================================================*/


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
ALTER TABLE public.users
    ENABLE ROW LEVEL SECURITY;
-- 1. Authenticated users can CRUD their own profile.
-- 2. Admins can CRUD all users.
CREATE POLICY users_select_own_or_admin
    ON public.users
    FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- INSERT: only admins can create users
CREATE POLICY users_admin_insert
    ON public.users
    FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- UPDATE: only admins can update any user
CREATE POLICY users_admin_update
    ON public.users
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- DELETE: only admins can delete users
CREATE POLICY users_admin_delete
    ON public.users
    FOR DELETE
    USING (public.is_admin(auth.uid()));
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


/*======================================================================================================================
=                                                   Triggers                                                           =
======================================================================================================================*/

CREATE OR REPLACE FUNCTION log_dog_changes()
    RETURNS TRIGGER AS
$function$
BEGIN
    -- Only log if something relevant changed
    IF (
        NEW.dog_name IS DISTINCT FROM OLD.dog_name OR
        NEW.dog_role IS DISTINCT FROM OLD.dog_role OR
        NEW.dog_yob IS DISTINCT FROM OLD.dog_yob OR
        NEW.dog_sex IS DISTINCT FROM OLD.dog_sex OR
        NEW.dog_picture IS DISTINCT FROM OLD.dog_picture OR
        NEW.dog_status IS DISTINCT FROM OLD.dog_status OR
        NEW.dog_current_handler IS DISTINCT FROM OLD.dog_current_handler OR
        NEW.dog_general_notes IS DISTINCT FROM OLD.dog_general_notes OR
        NEW.dog_is_active IS DISTINCT FROM OLD.dog_is_active
        ) THEN
        INSERT INTO public.dog_history (
            dog_id,
            changed_by,
            changed_at,
            old_handler,
            new_handler,
            old_general_notes,
            new_general_notes,
            old_is_active,
            new_is_active,
            old_status,
            new_status
        ) VALUES (
                     OLD.dog_id,
                     NEW.dog_last_edited_by,
                     NOW(),
                     OLD.dog_current_handler,
                     NEW.dog_current_handler,
                     OLD.dog_general_notes,
                     NEW.dog_general_notes,
                     OLD.dog_is_active,
                     NEW.dog_is_active,
                     OLD.dog_status,
                     NEW.dog_status
                 );
    END IF;

    RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER dog_changes_trigger
    AFTER UPDATE
    ON public.dogs
    FOR EACH ROW
EXECUTE FUNCTION log_dog_changes();


/*======================================================================================================================
=                                             Default System Settings                                                  =
======================================================================================================================*/


INSERT INTO public.system_settings (setting_key, setting_value, setting_type)
VALUES ('video', 'false', 'boolean'),
       ('terms', $$
USE OF THE IGDB DOG STATUS APP

TERMS AND CONDITIONS FOR USE:

The IGDB Dog Status App uses Supabase as the database platform.

Approved users may only utilize the IGDB Dog Status App in compliance with the following:

1. Pictures and texts posted to the app must focus exclusively on the current status of the dog, and present that status in a positive light.

2. Posts must not include any identifying information regarding the person posting, nor any other person (including person names, faces, or photos of home addresses).

3. Users must not include any of the following in posts:

a. Photos or text regarding dogs who are injured, ill, or recovering from medical procedures

b. Photos or text of dogs wearing a Halti

c. Photos or text of dogs exhibiting 'rule breaking behavior' such as sitting on furniture, digging in gardens, stealing shoes, inappropriate chewing, etc.

d. Photos or texts of dogs eating inappropriate food

e. Photos or text showing the body of dogs who have gained excessive weight (photos of the dog's face would be acceptable)

4. Users with posting privileges agree to post pictures and text only of the dog in their care, and to do so at least once per month.

5. User Login data must not be shared with other people.
$$, 'string');