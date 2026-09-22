-- Initial migration for Canteen Feedback System
-- Refer to schema.sql for complete definition
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'read_only_admin' CHECK (role IN ('super_admin', 'hr_admin', 'canteen_admin', 'read_only_admin')),
    plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    meal_type VARCHAR(30) NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snacks')),
    shift VARCHAR(30) NOT NULL CHECK (shift IN ('Morning', 'General', 'Evening', 'Night')),
    food_taste INT NOT NULL CHECK (food_taste BETWEEN 1 AND 5),
    food_quality INT NOT NULL CHECK (food_quality BETWEEN 1 AND 5),
    food_quantity INT NOT NULL CHECK (food_quantity BETWEEN 1 AND 5),
    cleanliness INT NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
    staff_behaviour INT NOT NULL CHECK (staff_behaviour BETWEEN 1 AND 5),
    service_speed INT NOT NULL CHECK (service_speed BETWEEN 1 AND 5),
    hygiene INT NOT NULL CHECK (hygiene BETWEEN 1 AND 5),
    overall_rating NUMERIC(3,2) NOT NULL,
    remark TEXT,
    employee_name VARCHAR(100),
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    device_info VARCHAR(255),
    browser VARCHAR(100),
    submitted_from VARCHAR(50) DEFAULT 'Kiosk',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL DEFAULT 'PG Electroplast Ltd',
    company_logo_url TEXT,
    enable_english BOOLEAN DEFAULT true,
    enable_hindi BOOLEAN DEFAULT true,
    meal_types JSONB DEFAULT '["Breakfast", "Lunch", "Dinner", "Snacks"]'::jsonb,
    shifts JSONB DEFAULT '["Morning", "General", "Evening", "Night"]'::jsonb,
    theme_mode VARCHAR(20) DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active plants" ON public.plants FOR SELECT USING (true);
CREATE POLICY "Public read active departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Anyone can submit canteen feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated admins can view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
