ALTER TABLE "bot" ADD COLUMN IF NOT EXISTS "step" VARCHAR(255);

CREATE TABLE IF NOT EXISTS "bot_child" (
  "id" SERIAL PRIMARY KEY,
  "parent_bot_id" BIGINT NOT NULL REFERENCES "bot"("bot_id") ON DELETE CASCADE,
  "student_id" INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "bot_child_parent_student_unique"
    UNIQUE ("parent_bot_id", "student_id")
);
