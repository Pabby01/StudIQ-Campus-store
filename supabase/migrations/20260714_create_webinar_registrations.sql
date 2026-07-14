-- Create webinar_registrations table
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    wallet_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (register)
CREATE POLICY "Anyone can register for webinar"
    ON public.webinar_registrations
    FOR INSERT
    TO public, anon
    WITH CHECK (true);

-- Only authenticated users (admins) can view registrations
CREATE POLICY "Admins can view registrations"
    ON public.webinar_registrations
    FOR SELECT
    TO authenticated
    USING (true);
