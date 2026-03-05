-- Host Blacklist Initial Schema
-- Tables: profiles, guests, reports, flags
-- Includes RLS policies and auto-profile-creation trigger

-- profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  company_name text,
  city text,
  country text,
  properties_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  notes text,
  reports_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_email ON guests(email) WHERE email IS NOT NULL;

-- reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  incident_type text NOT NULL CHECK (incident_type IN ('damage', 'theft', 'noise', 'fraud', 'no_show', 'other')),
  incident_date date,
  severity integer CHECK (severity >= 1 AND severity <= 5),
  description text NOT NULL,
  property_name text,
  platform text CHECK (platform IN ('airbnb', 'booking', 'direct', 'other')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_guest_reporter ON reports(guest_id, reporter_id);

-- flags table
CREATE TABLE IF NOT EXISTS flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports ON DELETE CASCADE,
  flagger_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_flags_report_flagger ON flags(report_id, flagger_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Guests RLS
CREATE POLICY "Authenticated can view guests" ON guests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert guests" ON guests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update guests" ON guests FOR UPDATE USING (auth.role() = 'authenticated');

-- Reports RLS
CREATE POLICY "Authenticated can view reports" ON reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can update own reports" ON reports FOR UPDATE USING (auth.uid() = reporter_id);
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE USING (auth.uid() = reporter_id);

-- Flags RLS
CREATE POLICY "Users can insert own flags" ON flags FOR INSERT WITH CHECK (auth.uid() = flagger_id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
