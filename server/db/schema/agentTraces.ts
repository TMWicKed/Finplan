/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const agentTraces = pgTable(
  "agent_traces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    agentName: varchar("agent_name", { length: 128 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    duration: integer("duration"),
    confidenceScore: real("confidence_score"),
    inputSummary: text("input_summary").notNull().default(""),
    outputSummary: text("output_summary").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_traces_session_id_idx").on(table.sessionId),
    index("agent_traces_agent_name_idx").on(table.agentName),
    index("agent_traces_created_at_idx").on(table.createdAt),
    index("agent_traces_session_agent_idx").on(table.sessionId, table.agentName),
    index("agent_traces_session_created_at_idx").on(table.sessionId, table.createdAt),
  ]
);

export type AgentTraceRow = typeof agentTraces.$inferSelect;
export type NewAgentTraceRow = typeof agentTraces.$inferInsert;
