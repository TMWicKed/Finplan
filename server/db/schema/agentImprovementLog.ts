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

/** Lifecycle for improvement patterns surfaced by reflection (evaluation logic TBD). */
export const improvementLogStatuses = [
  "open",
  "reviewing",
  "applied",
  "dismissed",
] as const;

export type ImprovementLogStatus = (typeof improvementLogStatuses)[number];

export const agentImprovementLog = pgTable(
  "agent_improvement_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patternDetected: varchar("pattern_detected", { length: 256 }).notNull(),
    frequency: integer("frequency").notNull().default(1),
    recommendation: text("recommendation").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_improvement_log_pattern_idx").on(table.patternDetected),
    index("agent_improvement_log_status_idx").on(table.status),
    index("agent_improvement_log_created_at_idx").on(table.createdAt),
    index("agent_improvement_log_pattern_status_idx").on(
      table.patternDetected,
      table.status
    ),
  ]
);

export type AgentImprovementLogRow = typeof agentImprovementLog.$inferSelect;
export type NewAgentImprovementLogRow = typeof agentImprovementLog.$inferInsert;
