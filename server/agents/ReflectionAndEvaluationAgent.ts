/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import { runReflectionEvaluation } from "./reflectionEvaluation.js";
import type { AgentExecutionContext, AgentResult, ReflectionResult } from "./types.js";

export class ReflectionAndEvaluationAgent extends BaseAgent {
  readonly name = "ReflectionAndEvaluationAgent";

  async run(context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();

    const allAgentResults =
      context.allAgentResults ??
      Object.values(context.priorAgentResults).filter(
        (r) => r.agentName !== "ReflectionAndEvaluationAgent"
      );

    const confidenceEvaluation = context.confidenceEvaluation;
    if (!confidenceEvaluation) {
      return this.buildFallbackResult(start, "Confidence evaluation unavailable; reflection skipped.");
    }

    try {
      const reflectionResult = runReflectionEvaluation({
        allAgentResults,
        confidenceEvaluation,
        message: context.message,
        profile: context.profile,
        goals: context.goals
      });

      const criticalCount = reflectionResult.issues.filter((i) => i.severity === "critical").length;
      const warningCount = reflectionResult.issues.filter((i) => i.severity === "warning").length;

      return this.buildResult({
        status: "completed",
        confidence: reflectionResult.adjustedConfidence,
        summary: `Reflection verdict: ${reflectionResult.reflectionVerdict} — ${reflectionResult.issues.length} issue(s) (${criticalCount} critical, ${warningCount} warning). Confidence adjusted ${reflectionResult.baselineConfidence}→${reflectionResult.adjustedConfidence}.`,
        recommendations: reflectionResult.recommendations,
        nextAction: reflectionResult.requiresHumanReview
          ? "Hold delivery — route to human planner for compliance review"
          : "Quality gate passed — release advisory to client",
        executionTime: Date.now() - start,
        metadata: {
          reflectionResult,
          reflectionVerdict: reflectionResult.reflectionVerdict,
          adjustedConfidence: reflectionResult.adjustedConfidence,
          requiresHumanReview: reflectionResult.requiresHumanReview,
          issueCount: reflectionResult.issues.length
        }
      });
    } catch (err: unknown) {
      return this.buildFallbackResult(
        start,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  private buildFallbackResult(start: number, reason: string): AgentResult {
    const fallbackReflection: ReflectionResult = {
      reflectionVerdict: "PASS_WITH_WARNINGS",
      adjustedConfidence: 0,
      baselineConfidence: 0,
      confidenceAdjustment: 0,
      issues: [
        {
          code: "REFLECTION_ENGINE_ERROR",
          severity: "warning",
          message: "Reflection engine encountered an error; pipeline continued without quality gate.",
          evidence: reason
        }
      ],
      recommendations: ["Manual planner review recommended when reflection engine fails."],
      requiresHumanReview: true,
      reasoning: [`Reflection failed safely: ${reason}`]
    };

    return this.buildResult({
      status: "completed",
      confidence: 0,
      summary: "Reflection agent failed safely — advisory delivered without automated quality gate.",
      recommendations: fallbackReflection.recommendations,
      nextAction: "Manual compliance review recommended",
      executionTime: Date.now() - start,
      metadata: {
        reflectionResult: fallbackReflection,
        reflectionVerdict: fallbackReflection.reflectionVerdict,
        reflectionError: reason,
        requiresHumanReview: true
      }
    });
  }
}