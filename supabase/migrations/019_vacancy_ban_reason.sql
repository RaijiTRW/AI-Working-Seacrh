-- Add vacancy ban reason column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vacancy_ban_reason TEXT;

-- Comment
COMMENT ON COLUMN profiles.vacancy_ban_reason IS 'Reason why user was banned from creating vacancies';
