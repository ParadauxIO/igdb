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