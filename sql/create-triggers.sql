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
