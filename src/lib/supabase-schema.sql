-- =============================================================================
-- Atoyan Law Firm • WP Content Autopilot
-- Supabase Schema for Real Generation & Cost Reports
-- =============================================================================
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New Query)

CREATE TABLE IF NOT EXISTS public.generation_reports (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  keyword TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'California',
  slug TEXT NOT NULL,
  provider TEXT NOT NULL,
  content_words INTEGER NOT NULL DEFAULT 0,
  tokens_estimate INTEGER NOT NULL DEFAULT 0,
  cost_content NUMERIC(10, 4) NOT NULL DEFAULT 0.003,
  cost_images NUMERIC(10, 4) NOT NULL DEFAULT 0.040,
  cost_total NUMERIC(10, 4) NOT NULL DEFAULT 0.043,
  generation_seconds NUMERIC(8, 2) NOT NULL DEFAULT 1.85,
  wp_post_id INTEGER,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries by timestamp
CREATE INDEX IF NOT EXISTS idx_generation_reports_timestamp 
  ON public.generation_reports(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.generation_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access on generation_reports" ON public.generation_reports;
DROP POLICY IF EXISTS "Allow public insert access on generation_reports" ON public.generation_reports;
DROP POLICY IF EXISTS "Allow public delete access on generation_reports" ON public.generation_reports;

-- Policy 1: Read access for dashboard analytics
CREATE POLICY "Allow public read access on generation_reports"
  ON public.generation_reports
  FOR SELECT
  USING (true);

-- Policy 2: Insert access when publishing new practice area pages
CREATE POLICY "Allow public insert access on generation_reports"
  ON public.generation_reports
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Delete access for log management
CREATE POLICY "Allow public delete access on generation_reports"
  ON public.generation_reports
  FOR DELETE
  USING (true);
