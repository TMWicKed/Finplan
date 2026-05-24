/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import { buildAgentBriefing, generateIraAdvisoryResponse } from "../lib/iraAdvisory.js";
import { detectBehavioralTendency } from "../lib/behavioralFinance.js";

export class FinancialSummaryAgent extends BaseAgent {
  readonly name = "FinancialSummaryAgent";

  async run(context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();
    try {
      const behavioral =
        context.priorAgentResults.BehavioralFinanceAgent?.metadata?.tendency as
          | ReturnType<typeof detectBehavioralTendency>
          | undefined;

      const tendency =
        behavioral ??
        detectBehavioralTendency(context.message);

      const agentBriefing = buildAgentBriefing(context.priorAgentResults);

      const { payload, tokensIn, tokensOut } = await generateIraAdvisoryResponse({
        message: context.message,
        chatHistory: context.chatHistory,
        profile: context.profile,
        goals: context.goals,
        whatIfState: context.whatIfState,
        playbooks: context.playbooks,
        systemPromptCorrections: context.systemPromptCorrections,
        behavioralTendency: tendency,
        agentBriefing
      });

      const confidence = Math.round((payload.confidence ?? 0.9) * 100);

      return this.buildResult({
        status: "completed",
        confidence: Math.min(100, confidence),
        summary: payload.summary,
        recommendations: payload.recommendations,
        nextAction: payload.requires_human_approval
          ? "Route to human planner for approval"
          : "Deliver response to client",
        executionTime: Date.now() - start,
        metadata: {
          iraResponse: payload,
          tokensIn,
          tokensOut,
          compressionApplied: tokensIn > 625
        }
      });
    } catch (err: unknown) {
      return this.buildResult({
        status: "failed",
        confidence: 0,
        summary: "Financial summary generation failed.",
        recommendations: ["Retry query or use offline advisory templates."],
        nextAction: "Escalate to planner",
        executionTime: Date.now() - start,
        metadata: { error: err instanceof Error ? err.message : String(err) }
      });
    }
  }
}
