/*======================================================================================================================
=                                              Static Data Changes                                                     =
======================================================================================================================*/

-- Upsert instead of blind insert
INSERT INTO public.system_settings (setting_key, setting_value, setting_type)
VALUES ('postCharacterLimit', '200', 'integer')
ON CONFLICT (setting_key) DO UPDATE
    SET setting_value = EXCLUDED.setting_value,
        setting_type  = EXCLUDED.setting_type;

/*======================================================================================================================
=                                              Row Level Security Changes                                              =
======================================================================================================================*/

-- dog-avatars RLS (re-create safely)
DROP POLICY IF EXISTS "Admins have full access 1obye21_0" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access 1obye21_1" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access 1obye21_2" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access 1obye21_3" ON storage.objects;

CREATE POLICY "Admins have full access 1obye21_0"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'dog-avatars' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access 1obye21_1"
    ON storage.objects FOR INSERT TO public
    WITH CHECK (bucket_id = 'dog-avatars' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access 1obye21_2"
    ON storage.objects FOR UPDATE TO public
    USING (bucket_id = 'dog-avatars' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access 1obye21_3"
    ON storage.objects FOR DELETE TO public
    USING (bucket_id = 'dog-avatars' AND public.is_admin(auth.uid()));

-- dog-updates: collapse to one FOR ALL policy (idempotent)
DROP POLICY IF EXISTS "updates owner insert" ON storage.objects;
DROP POLICY IF EXISTS "updates owner delete" ON storage.objects;

DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename  = 'objects'
              AND policyname = 'dog-updates owner+admin'
        ) THEN
            -- Update the existing policy in-place
            ALTER POLICY "dog-updates owner+admin" ON storage.objects
                USING (
                bucket_id = 'dog-updates'
                    AND (
                    public.is_admin(auth.uid())
                        OR split_part(name,'/',2) = auth.uid()::text   -- path owner {user-id}
                    )
                )
                WITH CHECK (
                bucket_id = 'dog-updates'
                    AND (
                    public.is_admin(auth.uid())
                        OR (
                        public.is_privileged_user(auth.uid())
                            AND split_part(name,'/',2) = auth.uid()::text
                        )
                    )
                );
        ELSE
            -- First install
            CREATE POLICY "dog-updates owner+admin"
                ON storage.objects
                FOR ALL
                USING (
                bucket_id = 'dog-updates'
                    AND (
                    public.is_admin(auth.uid())
                        OR split_part(name,'/',2) = auth.uid()::text
                    )
                )
                WITH CHECK (
                bucket_id = 'dog-updates'
                    AND (
                    public.is_admin(auth.uid())
                        OR (
                        public.is_privileged_user(auth.uid())
                            AND split_part(name,'/',2) = auth.uid()::text
                        )
                    )
                );
        END IF;
    END $$;

/*======================================================================================================================
=                                           Dogs + Dog History (array handlers)                                       =
======================================================================================================================*/

BEGIN;

-- A) Dogs: add array column, backfill from legacy scalar, drop legacy scalar

ALTER TABLE public.dogs
    ADD COLUMN IF NOT EXISTS dog_current_handlers UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

DROP POLICY IF EXISTS dogs_updater_read ON public.dogs;

CREATE POLICY dogs_updater_read ON public.dogs
    FOR SELECT
    USING (
    public.is_updater(auth.uid())
        AND auth.uid() = ANY(dog_current_handlers)
        AND dog_is_archived = false
    );

DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='dogs' AND column_name='dog_current_handler'
        ) THEN
            -- Backfill array from scalar
            EXECUTE $q$
      UPDATE public.dogs
      SET dog_current_handlers = CASE
        WHEN dog_current_handler IS NOT NULL THEN ARRAY[dog_current_handler]::UUID[]
        ELSE ARRAY[]::UUID[]
      END
      WHERE (dog_current_handlers IS NULL OR dog_current_handlers = ARRAY[]::UUID[])
    $q$;

            -- Drop the legacy scalar
            EXECUTE 'ALTER TABLE public.dogs DROP COLUMN IF EXISTS dog_current_handler';
        END IF;
    END $$;

-- B) Dog history: conditional renames, ensure array cols, backfill, drop legacy scalar cols

-- Conditional renames (no IF EXISTS on RENAME in your PG)
DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='dog_history' AND column_name='old_is_active'
        ) THEN
            EXECUTE 'ALTER TABLE public.dog_history RENAME COLUMN old_is_active TO old_is_archived';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='dog_history' AND column_name='new_is_active'
        ) THEN
            EXECUTE 'ALTER TABLE public.dog_history RENAME COLUMN new_is_active TO new_is_archived';
        END IF;
    END $$;

-- Tighten nullability (safe if already NOT NULL)
ALTER TABLE public.dog_history
    ALTER COLUMN changed_at SET NOT NULL;

-- Ensure array columns exist
ALTER TABLE public.dog_history
    ADD COLUMN IF NOT EXISTS old_handlers UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    ADD COLUMN IF NOT EXISTS new_handlers UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

-- Backfill from legacy scalar columns if present
DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='dog_history' AND column_name='old_handler'
        ) THEN
            UPDATE public.dog_history
            SET old_handlers = CASE
                                   WHEN old_handler IS NOT NULL THEN ARRAY[old_handler]::UUID[]
                                   ELSE ARRAY[]::UUID[]
                END
            WHERE (old_handlers IS NULL OR old_handlers = ARRAY[]::UUID[]);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='dog_history' AND column_name='new_handler'
        ) THEN
            UPDATE public.dog_history
            SET new_handlers = CASE
                                   WHEN new_handler IS NOT NULL THEN ARRAY[new_handler]::UUID[]
                                   ELSE ARRAY[]::UUID[]
                END
            WHERE (new_handlers IS NULL OR new_handlers = ARRAY[]::UUID[]);
        END IF;
    END $$;

-- Drop legacy scalar columns if they still exist
ALTER TABLE public.dog_history
    DROP COLUMN IF EXISTS old_handler,
    DROP COLUMN IF EXISTS new_handler;

-- C) Trigger: drop/recreate to track array handlers

DROP TRIGGER IF EXISTS dog_changes_trigger ON public.dogs;
DROP FUNCTION IF EXISTS public.log_dog_changes();

CREATE OR REPLACE FUNCTION public.log_dog_changes()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS $func$
BEGIN
    -- Only log when a tracked column actually changes
    IF (
        NEW.dog_name             IS DISTINCT FROM OLD.dog_name OR
        NEW.dog_role             IS DISTINCT FROM OLD.dog_role OR
        NEW.dog_yob              IS DISTINCT FROM OLD.dog_yob OR
        NEW.dog_sex              IS DISTINCT FROM OLD.dog_sex OR
        NEW.dog_picture          IS DISTINCT FROM OLD.dog_picture OR
        NEW.dog_status           IS DISTINCT FROM OLD.dog_status OR
        NEW.dog_current_handlers IS DISTINCT FROM OLD.dog_current_handlers OR
        NEW.dog_general_notes    IS DISTINCT FROM OLD.dog_general_notes OR
        NEW.dog_is_archived      IS DISTINCT FROM OLD.dog_is_archived
        ) THEN
        INSERT INTO public.dog_history (
            dog_id,
            changed_by,
            changed_at,
            old_name,           new_name,
            old_role,           new_role,
            old_yob,            new_yob,
            old_sex,            new_sex,
            old_picture,        new_picture,
            old_status,         new_status,
            old_handlers,       new_handlers,
            old_general_notes,  new_general_notes,
            old_is_archived,    new_is_archived
        )
        VALUES (
                   OLD.dog_id,
                   NEW.dog_last_edited_by,
                   NOW(),
                   OLD.dog_name,             NEW.dog_name,
                   OLD.dog_role,             NEW.dog_role,
                   OLD.dog_yob,              NEW.dog_yob,
                   OLD.dog_sex,              NEW.dog_sex,
                   OLD.dog_picture,          NEW.dog_picture,
                   OLD.dog_status,           NEW.dog_status,
                   OLD.dog_current_handlers, NEW.dog_current_handlers,
                   OLD.dog_general_notes,    NEW.dog_general_notes,
                   OLD.dog_is_archived,      NEW.dog_is_archived
               );
    END IF;

    RETURN NEW;
END;
$func$;

CREATE TRIGGER dog_changes_trigger
    AFTER UPDATE ON public.dogs
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION public.log_dog_changes();

CREATE INDEX IF NOT EXISTS ix_dogs_handlers_gin
    ON public.dogs USING GIN (dog_current_handlers);

COMMIT;
