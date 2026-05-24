/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import { buildAgentBriefing, generateIraAdvisoryResponse } from "../lib/iraAdvisory.js";
import { detectBehavioralTendency } from "../lib/behavioralFinance.js";
import { maskFields } from "../lib/securityMasking.js";

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

      const maskResult = maskFields([
        payload.summary,
        payload.explanation,
        ...payload.recommendations
      ]);
      const maskedPayload = {
        ...payload,
        summary: maskResult.masked[0] ?? payload.summary,
        explanation: maskResult.masked[1] ?? payload.explanation,
        recommendations: maskResult.masked.slice(2)
      };

      const confidence = Math.round((maskedPayload.confidence ?? 0.9) * 100);

      return this.buildResult({
        status: "completed",
        confidence: Math.min(100, confidence),
        summary: maskedPayload.summary,
        recommendations: maskedPayload.recommendations,
        nextAction: maskedPayload.requires_human_approval
          ? "Route to human planner for approval"
          : "Deliver response to client",
        executionTime: Date.now() - start,
        metadata: {
          iraResponse: maskedPayload,
          tokensIn,
          tokensOut,
          compressionApplied: tokensIn > 625,
          securityMasking: {
            totalMasks: maskResult.totalMasks,
            typesMasked: maskResult.typesMasked
          }
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
