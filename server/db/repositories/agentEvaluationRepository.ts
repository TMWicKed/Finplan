/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { and, desc, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "../client.js";
import {
  agentEvaluations,
  type AgentEvaluationRow,
  type NewAgentEvaluationRow,
} from "../schema/agentEvaluations.js";

export class AgentEvaluationRepository {
  constructor(private readonly db: AppDatabase) {}

  async insert(row: NewAgentEvaluationRow): Promise<AgentEvaluationRow> {
    const [created] = await this.db
      .insert(agentEvaluations)
      .values(row)
      .returning();
    return created;
  }

  async findById(id: string): Promise<AgentEvaluationRow | null> {
    const [row] = await this.db
      .select()
      .from(agentEvaluations)
      .where(eq(agentEvaluations.id, id))
      .limit(1);
    return row ?? null;
  }

  async findBySessionId(sessionId: string): Promise<AgentEvaluationRow[]> {
    return this.db
      .select()
      .from(agentEvaluations)
      .where(eq(agentEvaluations.sessionId, sessionId))
      .orderBy(agentEvaluations.createdAt);
  }

  async findBySessionAndAgent(
    sessionId: string,
    agentName: string
  ): Promise<AgentEvaluationRow | null> {
    const [row] = await this.db
      .select()
      .from(agentEvaluations)
      .where(
        and(
          eq(agentEvaluations.sessionId, sessionId),
          eq(agentEvaluations.agentName, agentName)
        )
      )
      .orderBy(desc(agentEvaluations.createdAt))
      .limit(1);
    return row ?? null;
  }

  async listRecent(limit = 50): Promise<AgentEvaluationRow[]> {
    return this.db
      .select()
      .from(agentEvaluations)
      .orderBy(desc(agentEvaluations.createdAt))
      .limit(limit);
  }

  async listRequiringHumanReview(limit = 30): Promise<AgentEvaluationRow[]> {
    return this.db
      .select()
      .from(agentEvaluations)
      .where(eq(agentEvaluations.requiresHumanReview, true))
      .orderBy(desc(agentEvaluations.createdAt))
      .limit(limit);
  }

  async countAll(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentEvaluations);
    return Number(row?.count ?? 0);
  }

  async listByAgent(agentName: string, limit = 100): Promise<AgentEvaluationRow[]> {
    return this.db
      .select()
      .from(agentEvaluations)
      .where(eq(agentEvaluations.agentName, agentName))
      .orderBy(desc(agentEvaluations.createdAt))
      .limit(limit);
  }
}
