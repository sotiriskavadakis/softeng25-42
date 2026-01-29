-- =============================================
-- EV CHARGING DATABASE SCHEMA
-- =============================================

-- Charger Status Type
CREATE TYPE public.charger_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'FAULTED', 'OFFLINE');

-- =============================================
-- GEOGRAPHY & INFRASTRUCTURE
-- =============================================

-- Regions
CREATE TABLE public.regions (
    name TEXT PRIMARY KEY
);

-- Counties
CREATE TABLE public.counties (
    name TEXT PRIMARY KEY,
    region_name TEXT REFERENCES public.regions(name) ON DELETE SET NULL
);

-- Charger Types
CREATE TABLE public.charger_types (
    type_id BIGSERIAL PRIMARY KEY,
    name TEXT,
    max_supported_power NUMERIC,
    icon_url TEXT
);

-- Locations (EV Charging Stations)
CREATE TABLE public.locations (
    location_id BIGSERIAL PRIMARY KEY,
    county_name TEXT REFERENCES public.counties(name) ON DELETE SET NULL,
    name TEXT,
    address TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_fast_charger BOOLEAN DEFAULT false,
    under_repair BOOLEAN DEFAULT false,
    coming_soon BOOLEAN DEFAULT false,
    access BIGINT DEFAULT 1,
    score NUMERIC DEFAULT 0,
    icon TEXT,
    icon_type TEXT,
    map_card_logo_url TEXT,
    url TEXT,
    station_count BIGINT DEFAULT 0,
    available_station_count BIGINT,
    in_use_station_count BIGINT,
    charger_types TEXT[]
);

-- Stations (Physical charging points at a location)
CREATE TABLE public.stations (
    station_id BIGSERIAL PRIMARY KEY,
    location_id BIGINT REFERENCES public.locations(location_id) ON DELETE CASCADE,
    physical_id TEXT,
    network_id BIGINT
);

-- Chargers (Individual outlets/connectors)
CREATE TABLE public.chargers (
    charger_id BIGSERIAL PRIMARY KEY,
    station_id BIGINT REFERENCES public.stations(station_id) ON DELETE CASCADE,
    type_id BIGINT REFERENCES public.charger_types(type_id) ON DELETE SET NULL,
    status charger_status DEFAULT 'OFFLINE',
    max_power_kw NUMERIC
);

-- =============================================
-- USER & PAYMENT
-- =============================================

-- Payment Methods
CREATE TABLE public.payment_methods (
    method_name TEXT PRIMARY KEY
);

-- User Profiles (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved Cards
CREATE TABLE public.saved_cards (
    card_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    method_name TEXT REFERENCES public.payment_methods(method_name) ON DELETE SET NULL,
    last_4_digits TEXT,
    token TEXT
);

-- =============================================
-- TRANSACTIONS
-- =============================================

-- Reservations
CREATE TABLE public.reservations (
    reservation_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    charger_id BIGINT REFERENCES public.chargers(charger_id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes BIGINT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Charging Sessions
CREATE TABLE public.charging_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    charger_id BIGINT REFERENCES public.chargers(charger_id) ON DELETE SET NULL,
    card_id BIGINT REFERENCES public.saved_cards(card_id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    total_kwh NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_locations_coords ON public.locations(latitude, longitude);
CREATE INDEX idx_locations_active ON public.locations(is_active);
CREATE INDEX idx_chargers_status ON public.chargers(status);
CREATE INDEX idx_chargers_station ON public.chargers(station_id);
CREATE INDEX idx_stations_location ON public.stations(location_id);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_charger ON public.reservations(charger_id);
CREATE INDEX idx_sessions_user ON public.charging_sessions(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charger_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS for infrastructure (anyone can view charger locations)
CREATE POLICY "Public read access for regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public read access for counties" ON public.counties FOR SELECT USING (true);
CREATE POLICY "Public read access for charger_types" ON public.charger_types FOR SELECT USING (true);
CREATE POLICY "Public read access for locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public read access for stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Public read access for chargers" ON public.chargers FOR SELECT USING (true);
CREATE POLICY "Public read access for payment_methods" ON public.payment_methods FOR SELECT USING (true);

-- PROFILES: Users can read/update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SAVED CARDS: Users manage their own cards
CREATE POLICY "Users can view their own cards" ON public.saved_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cards" ON public.saved_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards" ON public.saved_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards" ON public.saved_cards FOR DELETE USING (auth.uid() = user_id);

-- RESERVATIONS: Users manage their own reservations
CREATE POLICY "Users can view their own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reservations" ON public.reservations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reservations" ON public.reservations FOR DELETE USING (auth.uid() = user_id);

-- CHARGING SESSIONS: Users manage their own sessions
CREATE POLICY "Users can view their own sessions" ON public.charging_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.charging_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.charging_sessions FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DEFAULT PAYMENT METHODS
-- =============================================

INSERT INTO public.payment_methods (method_name) VALUES 
    ('credit_card'),
    ('debit_card'),
    ('paypal'),
    ('apple_pay'),
    ('google_pay');