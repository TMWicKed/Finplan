CREATE TABLE "agent_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"agent_name" varchar(128) NOT NULL,
	"status" varchar(32) NOT NULL,
	"duration" integer,
	"confidence_score" real,
	"input_summary" text DEFAULT '' NOT NULL,
	"output_summary" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"agent_name" varchar(128) NOT NULL,
	"evaluation_score" real,
	"feedback_score" real,
	"issues_detected" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_improvement_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern_detected" varchar(256) NOT NULL,
	"frequency" integer DEFAULT 1 NOT NULL,
	"recommendation" text NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_traces_session_id_idx" ON "agent_traces" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_traces_agent_name_idx" ON "agent_traces" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "agent_traces_created_at_idx" ON "agent_traces" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_traces_session_agent_idx" ON "agent_traces" USING btree ("session_id","agent_name");--> statement-breakpoint
CREATE INDEX "agent_traces_session_created_at_idx" ON "agent_traces" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_evaluations_session_id_idx" ON "agent_evaluations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_evaluations_agent_name_idx" ON "agent_evaluations" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "agent_evaluations_created_at_idx" ON "agent_evaluations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_evaluations_session_agent_idx" ON "agent_evaluations" USING btree ("session_id","agent_name");--> statement-breakpoint
CREATE INDEX "agent_improvement_log_pattern_idx" ON "agent_improvement_log" USING btree ("pattern_detected");--> statement-breakpoint
CREATE INDEX "agent_improvement_log_status_idx" ON "agent_improvement_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_improvement_log_created_at_idx" ON "agent_improvement_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_improvement_log_pattern_status_idx" ON "agent_improvement_log" USING btree ("pattern_detected","status");