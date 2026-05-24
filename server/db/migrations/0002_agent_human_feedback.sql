CREATE TABLE "agent_human_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"agent_name" varchar(128) NOT NULL,
	"feedback_score" integer NOT NULL,
	"feedback_comment" text,
	"submitted_by" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_human_feedback_session_id_idx" ON "agent_human_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_human_feedback_agent_name_idx" ON "agent_human_feedback" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "agent_human_feedback_created_at_idx" ON "agent_human_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_human_feedback_session_agent_idx" ON "agent_human_feedback" USING btree ("session_id","agent_name");--> statement-breakpoint
CREATE INDEX "agent_human_feedback_submitted_by_idx" ON "agent_human_feedback" USING btree ("submitted_by");