ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "course_id" INTEGER REFERENCES "course" ("id");

UPDATE "attendance" a
SET "course_id" = l."course_id"
FROM "lesson" l
WHERE a."lesson_id" = l."id" AND a."course_id" IS NULL;

CREATE INDEX IF NOT EXISTS "attendance_course_id_idx" ON "attendance" ("course_id");
