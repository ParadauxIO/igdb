-- Users table (extends Supabase auth.users)
CREATE TABLE public.users
(
    id                  UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    permission_role     VARCHAR(64) NOT NULL     DEFAULT 'viewer' CHECK ( users.permission_role in ('viewer', 'updater', 'admin')),
    functional_role     VARCHAR(64) CHECK ( functional_role in
                                            ('staff', 'volunteer', 'puppy raiser', 'trainer', 'temporary boarder',
                                             'client', 'adoptive family')),
    phone               VARCHAR(32),
    is_active           BOOLEAN                  DEFAULT true,
    can_approve_updates BOOLEAN                  DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dogs table
CREATE TABLE public.dogs
(
    dog_id              UUID                     DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_name            TEXT                                   NOT NULL,
    dog_role            TEXT                                   NOT NULL CHECK (dog_role in ('Guide Dog', 'Assistance Dog', 'Community Ambassador Dog')),
    dog_yob             INTEGER NOT NULL, -- year of birth
    dog_sex             TEXT CHECK (dog_sex IN ('male', 'female', 'unknown')) NOT NULL,
    dog_picture         TEXT,    -- Supabase storage URL
    dog_status          TEXT,    -- e.g., 'available', 'adopted', 'fostered', 'in_training'
    dog_current_handler UUID REFERENCES public.users (id),
    dog_general_notes   TEXT,
    dog_is_active       BOOLEAN                  DEFAULT true,
    dog_created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    dog_updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    dog_created_by      UUID                                   NOT NULL REFERENCES public.users (id),
    dog_last_edited_by  UUID                                   NOT NULL REFERENCES public.users (id)
);

CREATE VIEW public.public_dogs_view WITH (security_invoker = on) AS
SELECT dog_name,
       dog_role,
       dog_yob,
       dog_sex,
       dog_picture,
       dog_status
FROM dogs
WHERE dog_is_active = true;

-- Updates/Feed table
CREATE TABLE public.dog_updates
(
    update_id            UUID                     DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_id               UUID REFERENCES public.dogs (dog_id) ON DELETE CASCADE NOT NULL,
    update_title         TEXT                                                   NOT NULL,
    update_description   TEXT                                                   NOT NULL,
    update_media_urls    TEXT[], -- Array of Supabase storage URLs
    update_is_public     BOOLEAN                  DEFAULT false,
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
    history_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id               UUID NOT NULL REFERENCES public.dogs (dog_id),
    changed_by           UUID NOT NULL REFERENCES public.users (id),
    changed_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_name             TEXT,
    new_name             TEXT,
    old_role             TEXT,
    new_role             TEXT,
    old_yob              INTEGER,
    new_yob              INTEGER,
    old_sex              TEXT,
    new_sex              TEXT,
    old_picture          TEXT,
    new_picture          TEXT,
    old_status           TEXT,
    new_status           TEXT,
    old_handler          UUID REFERENCES public.users (id),
    new_handler          UUID REFERENCES public.users (id),
    old_general_notes    TEXT,
    new_general_notes    TEXT,
    old_is_active        BOOLEAN,
    new_is_active        BOOLEAN
);