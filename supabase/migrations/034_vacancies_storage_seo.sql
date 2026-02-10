-- Add is_public field to vacancies_storage for SEO consistency
-- This allows filtering network vacancies in sitemap and feeds

ALTER TABLE vacancies_storage
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add index for efficient SEO queries
CREATE INDEX IF NOT EXISTS idx_vacancies_storage_seo_filter
  ON vacancies_storage(is_active, is_public, source)
  WHERE is_active = true AND is_public = true;

-- Add comment for documentation
COMMENT ON COLUMN vacancies_storage.is_public IS 'Whether vacancy should be visible in sitemap and public feeds (default true for network vacancies)';
