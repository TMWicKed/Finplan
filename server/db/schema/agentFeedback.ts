/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const agentHumanFeedback = pgTable(
  "agent_human_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    agentName: varchar("agent_name", { length: 128 }).notNull(),
    feedbackScore: integer("feedback_score").notNull(),
    feedbackComment: text("feedback_comment"),
    submittedBy: varchar("submitted_by", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_human_feedback_session_id_idx").on(table.sessionId),
    index("agent_human_feedback_agent_name_idx").on(table.agentName),
    index("agent_human_feedback_created_at_idx").on(table.createdAt),
    index("agent_human_feedback_session_agent_idx").on(
      table.sessionId,
      table.agentName
    ),
    index("agent_human_feedback_submitted_by_idx").on(table.submittedBy),
  ]
);

export type AgentHumanFeedbackRow = typeof agentHumanFeedback.$inferSelect;
export type NewAgentHumanFeedbackRow = typeof agentHumanFeedback.$inferInsert;
