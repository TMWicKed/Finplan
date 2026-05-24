/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { and, desc, eq, lte, sql } from "drizzle-orm";
import type { AppDatabase } from "../client.js";
import {
  agentHumanFeedback,
  type AgentHumanFeedbackRow,
  type NewAgentHumanFeedbackRow,
} from "../schema/agentFeedback.js";

export class FeedbackRepository {
  constructor(private readonly db: AppDatabase) {}

  async insert(row: NewAgentHumanFeedbackRow): Promise<AgentHumanFeedbackRow> {
    const [created] = await this.db
      .insert(agentHumanFeedback)
      .values(row)
      .returning();
    return created;
  }

  async findById(id: string): Promise<AgentHumanFeedbackRow | null> {
    const [row] = await this.db
      .select()
      .from(agentHumanFeedback)
      .where(eq(agentHumanFeedback.id, id))
      .limit(1);
    return row ?? null;
  }

  async findBySessionId(sessionId: string): Promise<AgentHumanFeedbackRow[]> {
    return this.db
      .select()
      .from(agentHumanFeedback)
      .where(eq(agentHumanFeedback.sessionId, sessionId))
      .orderBy(desc(agentHumanFeedback.createdAt));
  }

  async findByAgentName(agentName: string, limit = 100): Promise<AgentHumanFeedbackRow[]> {
    return this.db
      .select()
      .from(agentHumanFeedback)
      .where(eq(agentHumanFeedback.agentName, agentName))
      .orderBy(desc(agentHumanFeedback.createdAt))
      .limit(limit);
  }

  async findBySessionAndAgent(
    sessionId: string,
    agentName: string
  ): Promise<AgentHumanFeedbackRow[]> {
    return this.db
      .select()
      .from(agentHumanFeedback)
      .where(
        and(
          eq(agentHumanFeedback.sessionId, sessionId),
          eq(agentHumanFeedback.agentName, agentName)
        )
      )
      .orderBy(desc(agentHumanFeedback.createdAt));
  }

  async getAverageScoreByAgent(
    agentName: string
  ): Promise<{ average: number | null; count: number }> {
    const stats = await this.getAggregateStats(agentName, 2);
    return {
      average: stats.averageScore,
      count: stats.totalCount,
    };
  }

  async getAggregateStats(
    agentName: string,
    lowScoreThreshold = 2
  ): Promise<{
    totalCount: number;
    lowScoreCount: number;
    averageScore: number | null;
  }> {
    const [totals] = await this.db
      .select({
        totalCount: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${agentHumanFeedback.feedbackScore})`,
      })
      .from(agentHumanFeedback)
      .where(eq(agentHumanFeedback.agentName, agentName));

    const [lowRow] = await this.db
      .select({
        lowScoreCount: sql<number>`count(*)::int`,
      })
      .from(agentHumanFeedback)
      .where(
        and(
          eq(agentHumanFeedback.agentName, agentName),
          lte(agentHumanFeedback.feedbackScore, lowScoreThreshold)
        )
      );

    const totalCount = Number(totals?.totalCount ?? 0);
    const lowScoreCount = Number(lowRow?.lowScoreCount ?? 0);
    const avgRaw = totals?.averageScore;

    return {
      totalCount,
      lowScoreCount,
      averageScore:
        avgRaw !== null && avgRaw !== undefined
          ? Math.round(Number(avgRaw) * 100) / 100
          : null,
    };
  }
}
