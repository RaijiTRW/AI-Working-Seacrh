-- Add missing job states for new jobs
INSERT INTO scheduler_job_state (job_id, is_paused) VALUES
  ('mass_parsing_job', false),
  ('moderation_job', false),
  ('volume_stats_job', false)
ON CONFLICT (job_id) DO NOTHING;
