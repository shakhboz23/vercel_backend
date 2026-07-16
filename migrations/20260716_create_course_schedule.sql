CREATE TABLE IF NOT EXISTS "course_schedule" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL REFERENCES "course"("id") ON DELETE CASCADE,
  "attendance_day" VARCHAR(3) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "course_schedule_attendance_day_check"
    CHECK ("attendance_day" IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  CONSTRAINT "course_schedule_course_day_unique"
    UNIQUE ("course_id", "attendance_day")
);
