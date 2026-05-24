/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentExecutionTrace } from "./types.js";
import type { LearningDataSources } from "./LearningDashboardService.js";

export interface ImprovementRecommendation {
  issue: string;
  recommendation: string;
  frequency: number;
  source: "reflection" | "feedback" | "confidence";
}

const POOR_RATING_THRESHOLD = 2;
const MIN_FEEDBACK_SAMPLES = 3;

export class ImprovementRecommendationService {
  analyze(
    traces: AgentExecutionTrace[],
    sources: LearningDataSources
  ): ImprovementRecommendation[] {
    const patterns: ImprovementRecommendation[] = [];
    const seen = new Set<string>();

    const push = (item: ImprovementRecommendation) => {
      const key = item.issue.slice(0, 120);
      if (seen.has(key)) return;
      seen.add(key);
      patterns.push(item);
    };

    const failCount = traces.filter(
      (t) => t.reflectionEvaluation?.reflectionVerdict === "FAIL"
    ).length;
    if (failCount >= 2) {
      push({
        issue: "Repeated reflection FAIL verdicts",
        recommendation:
          "Run planner review on What-If and Goal Planning outputs before releasing Ira summaries.",
        frequency: failCount,
        source: "reflection"
      });
    }

    const lowConfidenceRuns = traces.filter((t) => t.overallConfidence < 55).length;
    if (lowConfidenceRuns >= 2) {
      push({
        issue: "Low pipeline confidence runs",
        recommendation:
          "Require additional client investment context and co-sign-off before publishing advisory output.",
        frequency: lowConfidenceRuns,
        source: "confidence"
      });
    }

    const negativeLogs = sources.reviewLogs.filter((r) => !r.isPositive);
    const byPattern = new Map<string, number>();
    for (const log of negativeLogs) {
      const key = log.failurePattern ?? "Unclassified";
      byPattern.set(key, (byPattern.get(key) ?? 0) + 1);
    }
    for (const [pattern, count] of byPattern) {
      if (count >= 2) {
        push({
          issue: `Frequent negative feedback: ${pattern}`,
          recommendation:
            logRecommendationForPattern(pattern) ??
            "Add prompt correction and re-run golden-path Ira queries.",
          frequency: count,
          source: "feedback"
        });
      }
    }

    if (
      sources.reviewLogs.length >= MIN_FEEDBACK_SAMPLES &&
      negativeLogs.length / sources.reviewLogs.length > 0.4
    ) {
      push({
        issue: "High negative feedback ratio on Ira responses",
        recommendation:
          "Enable human-in-the-loop approval for all tax and home-loan what-if queries until scores improve.",
        frequency: negativeLogs.length,
        source: "feedback"
      });
    }

    void POOR_RATING_THRESHOLD;

    return patterns.slice(0, 12);
  }
}

function logRecommendationForPattern(pattern: string): string | undefined {
  switch (pattern) {
    case "Regulatory Omission":
      return "Enforce Section 80C/24B caps and cite verified tax sections in every Ira tax answer.";
    case "Calculation Drift":
      return "Realign calculator outputs with compounded bank return assumptions from MarketIntelligenceAgent.";
    case "Context Drift":
      return "Hard-bind client surplus and goal figures from profile state into the Gemini briefing.";
    case "Lack of Specifics":
      return "Require numeric targets, lock-in periods, and funding percentages in recommendations.";
    default:
      return undefined;
  }
}

let shared: ImprovementRecommendationService | null = null;

export function getImprovementRecommendationService(): ImprovementRecommendationService {
  if (!shared) {
    shared = new ImprovementRecommendationService();
  }
  return shared;
}
