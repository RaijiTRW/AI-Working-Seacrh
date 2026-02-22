-- Store rejected vacancies separately for AI chat history replay
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS rejected_vacancies jsonb DEFAULT null;

COMMENT ON COLUMN public.messages.rejected_vacancies
IS 'JSON array of rejected vacancy objects (AI lifestyle filter / validator output)';
