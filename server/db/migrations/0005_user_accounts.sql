CREATE TABLE IF NOT EXISTS "user_accounts" (
	"email" varchar(256) PRIMARY KEY NOT NULL,
	"password_hash" varchar(256) NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"role" varchar(32) DEFAULT 'CLIENT' NOT NULL,
	"display_name" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_accounts_client_id_idx" ON "user_accounts" USING btree ("client_id");
