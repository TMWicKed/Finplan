ALTER TABLE "agent_evaluations" ADD COLUMN "confidence_level" varchar(32);--> statement-breakpoint
ALTER TABLE "agent_evaluations" ADD COLUMN "requires_human_review" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_evaluations" ADD COLUMN "confidence_reasoning" jsonb;--> statement-breakpoint
CREATE INDEX "agent_evaluations_confidence_level_idx" ON "agent_evaluations" USING btree ("confidence_level");--> statement-breakpoint
CREATE INDEX "agent_evaluations_requires_human_review_idx" ON "agent_evaluations" USING btree ("requires_human_review");