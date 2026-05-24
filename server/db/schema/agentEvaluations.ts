/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  boolean,
  index,
  jsonb,
  pgTable,
  real,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
export const agentEvaluations = pgTable(
  "agent_evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    agentName: varchar("agent_name", { length: 128 }).notNull(),
    evaluationScore: real("evaluation_score"),
    feedbackScore: real("feedback_score"),
    issuesDetected: jsonb("issues_detected").$type<string[]>().notNull().default([]),
    recommendations: jsonb("recommendations").$type<string[]>().notNull().default([]),
    confidenceLevel: varchar("confidence_level", { length: 32 }),
    requiresHumanReview: boolean("requires_human_review").notNull().default(false),
    confidenceReasoning: jsonb("confidence_reasoning").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_evaluations_session_id_idx").on(table.sessionId),
    index("agent_evaluations_agent_name_idx").on(table.agentName),
    index("agent_evaluations_created_at_idx").on(table.createdAt),
    index("agent_evaluations_session_agent_idx").on(table.sessionId, table.agentName),
    index("agent_evaluations_confidence_level_idx").on(table.confidenceLevel),
    index("agent_evaluations_requires_human_review_idx").on(table.requiresHumanReview),
  ]
);

export type AgentEvaluationRow = typeof agentEvaluations.$inferSelect;
export type NewAgentEvaluationRow = typeof agentEvaluations.$inferInsert;
