ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "due_date" DATE;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "last_reminder_at" DATE;

CREATE INDEX IF NOT EXISTS "payments_due_date_idx" ON "payments" ("due_date");
