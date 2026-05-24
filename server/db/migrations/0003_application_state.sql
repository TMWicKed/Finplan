CREATE TABLE IF NOT EXISTS "application_state" (
	"state_key" varchar(64) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_state_updated_at_idx" ON "application_state" USING btree ("updated_at");
