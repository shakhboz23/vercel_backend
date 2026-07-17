-- A schedule row is an immutable version. Its createdAt timestamp is the date
-- from which its weekday array takes effect.
ALTER TABLE "course_schedule"
  DROP CONSTRAINT IF EXISTS "course_schedule_attendance_day_check",
  DROP CONSTRAINT IF EXISTS "course_schedule_course_day_unique";

ALTER TABLE "course_schedule"
  ALTER COLUMN "attendance_day" TYPE VARCHAR(3)[]
  USING ARRAY["attendance_day"];

-- The previous schema had one row per weekday and no meaningful version
-- history. Collapse each existing course into its initial array version.
WITH initial_versions AS MATERIALIZED (
  SELECT
    "course_id",
    ARRAY_AGG("attendance_day"[1] ORDER BY "attendance_day"[1]) AS "attendance_day",
    MIN("createdAt") AS "createdAt",
    MAX("updatedAt") AS "updatedAt"
  FROM "course_schedule"
  GROUP BY "course_id"
), deleted_schedules AS (
  DELETE FROM "course_schedule"
  RETURNING "id"
)
INSERT INTO "course_schedule" (
  "course_id",
  "attendance_day",
  "createdAt",
  "updatedAt"
)
SELECT
  "course_id",
  "attendance_day",
  "createdAt",
  "updatedAt"
FROM "initial_versions";

ALTER TABLE "course_schedule"
  ADD CONSTRAINT "course_schedule_attendance_day_check"
  CHECK (
    cardinality("attendance_day") > 0
    AND "attendance_day" <@ ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']::VARCHAR(3)[]
  );
