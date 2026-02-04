-- Автоматическая отмена pending платежей через 1 час
-- Миграция: 022

-- ===========================================
-- 1. Добавляем поле updated_at если его нет
-- ===========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_history'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payment_history
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Создаём индекс для быстрого поиска старых pending платежей
CREATE INDEX IF NOT EXISTS idx_payments_status_created
ON payment_history(status, created_at)
WHERE status = 'pending';

-- ===========================================
-- 2. Функция для автоматической отмены pending платежей
-- ===========================================
CREATE OR REPLACE FUNCTION cancel_expired_pending_payments()
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  -- Отменяем платежи в статусе pending старше 1 часа
  UPDATE payment_history
  SET
    status = 'failed',
    updated_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"reason": "auto_cancelled", "message": "Payment expired after 1 hour"}'::jsonb
  WHERE status = 'pending'
    AND created_at < now() - INTERVAL '1 hour';

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;

  -- Логируем количество отменённых платежей
  IF cancelled_count > 0 THEN
    RAISE NOTICE 'Cancelled % pending payments older than 1 hour', cancelled_count;
  END IF;

  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 3. Функция для восстановления ошибочно отменённых платежей
-- ===========================================
CREATE OR REPLACE FUNCTION restore_cancelled_payment(payment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_history
  SET
    status = 'pending',
    updated_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) - 'reason' - 'message'
  WHERE id = payment_id
    AND status = 'failed'
    AND (metadata->>'reason') = 'auto_cancelled';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 4. Одноразовая отмена текущих просроченных платежей
-- ВРЕМЕННО ОТКЛЮЧЕНО - будет запускаться через cron
-- ===========================================
-- SELECT cancel_expired_pending_payments() AS initially_cancelled;
