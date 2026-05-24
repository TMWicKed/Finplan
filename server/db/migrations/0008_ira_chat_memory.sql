CREATE TABLE IF NOT EXISTS "ira_chat_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"title" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ira_chat_sessions_client_id_idx" ON "ira_chat_sessions" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ira_chat_sessions_client_status_idx" ON "ira_chat_sessions" USING btree ("client_id","status","updated_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ira_chat_messages" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"sender" varchar(16) NOT NULL,
	"text" text NOT NULL,
	"structured_payload" jsonb,
	"orchestration_session_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ira_chat_messages_session_id_idx" ON "ira_chat_messages" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ira_chat_messages_client_id_idx" ON "ira_chat_messages" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ira_chat_messages_session_created_idx" ON "ira_chat_messages" USING btree ("session_id","created_at");
