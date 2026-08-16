-- Lets an offline course split its weekly schedule across multiple named
-- subgroups (e.g. "1-guruh": Mon/Wed/Fri, "2-guruh": Tue/Thu/Sat) while
-- lessons and tests stay attached to the course only, so content is
-- authored once and shared by every subgroup.
CREATE TABLE IF NOT EXISTS "course_subgroup" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL REFERENCES "course"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "course_subgroup_course_id_idx" ON "course_subgroup" ("course_id");

-- NULL subgroup_id keeps meaning "the whole course" so existing single-schedule
-- courses and subscriptions are unaffected.
ALTER TABLE "course_schedule"
  ADD COLUMN IF NOT EXISTS "subgroup_id" INTEGER REFERENCES "course_subgroup"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "course_schedule_subgroup_id_idx" ON "course_schedule" ("subgroup_id");

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "subgroup_id" INTEGER REFERENCES "course_subgroup"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "subscriptions_subgroup_id_idx" ON "subscriptions" ("subgroup_id");
