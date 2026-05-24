ALTER TABLE "user_accounts" ADD COLUMN IF NOT EXISTS "onboarded_by_advisor" varchar(256);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_accounts_onboarded_by_idx" ON "user_accounts" USING btree ("onboarded_by_advisor");
--> statement-breakpoint
ALTER TABLE "client_profiles" ADD COLUMN IF NOT EXISTS "financial_goals" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
UPDATE "client_profiles" SET "financial_goals" = '[]'::jsonb WHERE "financial_goals" IS NULL;
--> statement-breakpoint
ALTER TABLE "client_profiles" ALTER COLUMN "financial_goals" SET NOT NULL;
