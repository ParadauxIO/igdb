/*======================================================================================================================
=                                              Dog History Fixes                                                      =
======================================================================================================================*/

ALTER TABLE public.dog_history
    RENAME COLUMN old_is_active TO old_is_archived;

ALTER TABLE public.dog_history
    RENAME COLUMN new_is_active TO new_is_archived;

-- (Optional) tighten nullability where appropriate
ALTER TABLE public.dog_history
    ALTER COLUMN changed_at SET NOT NULL;

-- 2) Drop & recreate trigger with corrected function
DROP TRIGGER IF EXISTS dog_changes_trigger ON public.dogs;
DROP FUNCTION IF EXISTS public.log_dog_changes();

CREATE OR REPLACE FUNCTION public.log_dog_changes()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS $func$
BEGIN
    -- Only log when a tracked column actually changes
    IF (
        NEW.dog_name            IS DISTINCT FROM OLD.dog_name OR
        NEW.dog_role            IS DISTINCT FROM OLD.dog_role OR
        NEW.dog_yob             IS DISTINCT FROM OLD.dog_yob OR
        NEW.dog_sex             IS DISTINCT FROM OLD.dog_sex OR
        NEW.dog_picture         IS DISTINCT FROM OLD.dog_picture OR
        NEW.dog_status          IS DISTINCT FROM OLD.dog_status OR
        NEW.dog_current_handler IS DISTINCT FROM OLD.dog_current_handler OR
        NEW.dog_general_notes   IS DISTINCT FROM OLD.dog_general_notes OR
        NEW.dog_is_archived     IS DISTINCT FROM OLD.dog_is_archived
        )
    THEN
        INSERT INTO public.dog_history (
            dog_id,
            changed_by,
            changed_at,
            old_name,          new_name,
            old_role,          new_role,
            old_yob,           new_yob,
            old_sex,           new_sex,
            old_picture,       new_picture,
            old_status,        new_status,
            old_handler,       new_handler,
            old_general_notes, new_general_notes,
            old_is_archived,   new_is_archived
        ) VALUES (
                     OLD.dog_id,
                     NEW.dog_last_edited_by,
                     NOW(),
                     OLD.dog_name,          NEW.dog_name,
                     OLD.dog_role,          NEW.dog_role,
                     OLD.dog_yob,           NEW.dog_yob,
                     OLD.dog_sex,           NEW.dog_sex,
                     OLD.dog_picture,       NEW.dog_picture,
                     OLD.dog_status,        NEW.dog_status,
                     OLD.dog_current_handler, NEW.dog_current_handler,
                     OLD.dog_general_notes, NEW.dog_general_notes,
                     OLD.dog_is_archived,   NEW.dog_is_archived
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

/*======================================================================================================================
=                                              Static Data Changes                                                     =
======================================================================================================================*/

-- Ingrid's configuration changes
INSERT INTO public.system_settings (setting_key, setting_value, setting_type)
VALUES ('postCharacterLimit', '200', 'integer');

/*======================================================================================================================
=                                              Row Level Security Changes                                              =
======================================================================================================================*/

-- dog-avatars RLS
-- Only admins can add images to the dog-avatars bucket

CREATE POLICY "Admins have full access 1obye21_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'dog-avatars' and public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access 1obye21_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'dog-avatars' and public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access 1obye21_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'dog-avatars' and public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access 1obye21_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'dog-avatars' and public.is_admin(auth.uid()));

-- dog-updates RLS
create policy "updates owner insert"
    on storage.objects for insert
    with check (
    bucket_id = 'dog-updates'
        and (
        public.is_admin(auth.uid())
            or (
            public.is_privileged_user(auth.uid())
                and split_part(name,'/',2) = auth.uid()::text  -- {user-id}
            )
        )
    );

create policy "updates owner delete"
    on storage.objects for delete
    using (
    bucket_id = 'dog-updates'
        and (
        public.is_admin(auth.uid())
            or split_part(name,'/',2) = auth.uid()::text
        )
    );