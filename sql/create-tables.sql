-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role VARCHAR(64) NOT NULL DEFAULT 'viewer',
    phone VARCHAR(32),
    is_active BOOLEAN DEFAULT true,
    can_approve_updates BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dogs table
CREATE TABLE public.dogs (
    dog_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_microchip_number TEXT UNIQUE,
    dog_name TEXT NOT NULL,
    dog_breed TEXT NOT NULL,
    dog_role TEXT NOT NULL, -- Guide/assistance/etc
    dog_dob DATE, -- date of birth
    dog_sex TEXT CHECK (dog_sex IN ('male', 'female')),
    dog_color_markings TEXT, -- visual to distinguish dogs
    dog_picture TEXT, -- Supabase storage URL
    dog_status TEXT, -- e.g., 'available', 'adopted', 'fostered', 'in_training'
    dog_weight_kg DECIMAL(5,2),
    dog_current_owner UUID REFERENCES public.users(id),
    dog_initial_owner UUID REFERENCES public.users(id),
    dog_general_notes TEXT,
    dog_medical_notes TEXT,
    dog_is_active BOOLEAN DEFAULT true,
    dog_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dog_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dog_created_by UUID REFERENCES public.users(id),
    dog_last_edited_by UUID REFERENCES public.users(id)
);

-- Updates/Feed table
CREATE TABLE public.dog_updates (
    update_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dog_id UUID REFERENCES public.dogs(dog_id) ON DELETE CASCADE NOT NULL,
    update_title TEXT NOT NULL,
    update_description TEXT NOT NULL,
    update_type TEXT NOT NULL,
    update_media_urls TEXT[], -- Array of Supabase storage URLs
    update_location TEXT,
    update_tags TEXT[], -- Searchable tags
    update_is_public BOOLEAN DEFAULT false,
    update_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_date_approved TIMESTAMP WITH TIME ZONE,
    update_created_by UUID REFERENCES public.users(id) NOT NULL,
    update_approved_by UUID REFERENCES public.users(id)
);

-- A mapping between users and the dogs they follow
CREATE TABLE public.dog_following (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    dog_id UUID REFERENCES public.dogs(dog_id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, dog_id)
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_following ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to SELECT all dogs
-- Should they be allowed to?
CREATE POLICY "Authenticated users can read all dogs"
  ON public.dogs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to SELECT all dog updates
-- Should they be allowed to?
CREATE POLICY "Authenticated users can read all dog updates"
  ON public.dog_updates
  FOR SELECT
  TO authenticated
  USING (true); -- could update to (update_is_public = true for example);

CREATE POLICY "Users can read their own profile"
  ON "public"."users"
  TO authenticated
  USING (
    auth.uid() = id
   );

CREATE POLICY "Users can see their own following list"
    ON "public"."dog_following"
    TO authenticated
    USING (
    auth.uid() = user_id
    );

CREATE POLICY "Users can update their own profile"
  ON "public"."users"
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
  );

-- TEMPORARY POLICIES WHICH WILL NEED TO BE REPLACED WHEN ROLE TYPES EXIST
CREATE POLICY "Users can update all dogs"
  ON "public"."dogs"
  FOR UPDATE
  TO authenticated
  USING (
    true
  );

CREATE POLICY "Users can insert dogs"
    ON "public"."dogs"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        true
    );

CREATE POLICY "Users can delete dogs"
    ON "public"."dogs"
    FOR DELETE
    TO authenticated
    USING (
        true
    );
