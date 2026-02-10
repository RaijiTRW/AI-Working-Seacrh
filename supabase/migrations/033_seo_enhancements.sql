-- SEO Enhancements for Google Jobs and Yandex.Vacansii
-- This migration adds fields required for proper SEO integration

-- Add new fields to employer_vacancies table
ALTER TABLE employer_vacancies
  ADD COLUMN IF NOT EXISTS company_url TEXT,
  ADD COLUMN IF NOT EXISTS company_logo TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS work_hours TEXT,
  ADD COLUMN IF NOT EXISTS valid_through TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add index for SEO queries (published + active + public)
CREATE INDEX IF NOT EXISTS idx_employer_vacancies_seo_filter
  ON employer_vacancies(status, is_active, is_public)
  WHERE status = 'published' AND is_active = true AND is_public = true;

-- Add comment for documentation
COMMENT ON COLUMN employer_vacancies.company_url IS 'Company website URL for SEO (Google Jobs)';
COMMENT ON COLUMN employer_vacancies.company_logo IS 'Company logo URL for SEO (Google Jobs)';
COMMENT ON COLUMN employer_vacancies.skills IS 'Array of skills for SEO (JSONB format)';
COMMENT ON COLUMN employer_vacancies.work_hours IS 'Work hours description (e.g., "9:00-18:00")';
COMMENT ON COLUMN employer_vacancies.valid_through IS 'Expiration date for job posting (Google Jobs requirement)';
COMMENT ON COLUMN employer_vacancies.is_public IS 'Whether vacancy should be visible in sitemap and public feeds';
