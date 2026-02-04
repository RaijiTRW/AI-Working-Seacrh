-- Восстановление ошибочно отменённых платежей
-- Запустить вручную если нужно восстановить платежи

-- ===========================================
-- Восстановить все платежи отменённые с reason="auto_cancelled"
-- ===========================================
UPDATE payment_history
SET
  status = 'pending',
  updated_at = now(),
  metadata = COALESCE(metadata, '{}'::jsonb) - 'reason' - 'message'
WHERE status = 'failed'
  AND (metadata->>'reason') = 'auto_cancelled';

-- Показать сколько восстановлено
SELECT COUNT(*) as restored_count FROM payment_history
WHERE status = 'pending'
  AND updated_at > now() - INTERVAL '5 minutes';
