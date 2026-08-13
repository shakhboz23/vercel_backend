ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "student_id" VARCHAR(4);

ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_student_id_unique";
ALTER TABLE "user" ADD CONSTRAINT "user_student_id_unique" UNIQUE ("student_id");
