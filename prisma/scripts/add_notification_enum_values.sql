DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'NotificationType' AND e.enumlabel = 'PRICE_CHANGE_REQUEST'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'PRICE_CHANGE_REQUEST';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'NotificationType' AND e.enumlabel = 'SUGGESTION_SUBMISSION'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'SUGGESTION_SUBMISSION';
  END IF;
END
$$;
