/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { and, desc, eq, gte } from "drizzle-orm";
import type { AppDatabase } from "../client.js";
import {
  agentTraces,
  type AgentTraceRow,
  type NewAgentTraceRow,
} from "../schema/agentTraces.js";

export class AgentTraceRepository {
  constructor(private readonly db: AppDatabase) {}

  async insert(row: NewAgentTraceRow): Promise<AgentTraceRow> {
    const [created] = await this.db.insert(agentTraces).values(row).returning();
    return created;
  }

  async insertMany(rows: NewAgentTraceRow[]): Promise<AgentTraceRow[]> {
    if (rows.length === 0) {
      return [];
    }
    return this.db.insert(agentTraces).values(rows).returning();
  }

  async findById(id: string): Promise<AgentTraceRow | null> {
    const [row] = await this.db
      .select()
      .from(agentTraces)
      .where(eq(agentTraces.id, id))
      .limit(1);
    return row ?? null;
  }

  async findBySessionId(sessionId: string): Promise<AgentTraceRow[]> {
    return this.db
      .select()
      .from(agentTraces)
      .where(eq(agentTraces.sessionId, sessionId))
      .orderBy(agentTraces.createdAt);
  }

  async findBySessionAndAgent(
    sessionId: string,
    agentName: string
  ): Promise<AgentTraceRow[]> {
    return this.db
      .select()
      .from(agentTraces)
      .where(
        and(
          eq(agentTraces.sessionId, sessionId),
          eq(agentTraces.agentName, agentName)
        )
      )
      .orderBy(agentTraces.createdAt);
  }

  async listRecent(limit = 50): Promise<AgentTraceRow[]> {
    return this.db
      .select()
      .from(agentTraces)
      .orderBy(desc(agentTraces.createdAt))
      .limit(limit);
  }

  async listSince(
    sinceIso: string,
    limit = 100
  ): Promise<AgentTraceRow[]> {
    return this.db
      .select()
      .from(agentTraces)
      .where(gte(agentTraces.createdAt, sinceIso))
      .orderBy(desc(agentTraces.createdAt))
      .limit(limit);
  }
}
