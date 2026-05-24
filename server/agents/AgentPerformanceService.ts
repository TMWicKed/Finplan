/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentExecutionTrace, ReflectionIssue } from "./types.js";
import type { AgentPerformanceMetric } from "./learningTypes.js";

const PIPELINE_AGENTS = [
  "GoalPlanningAgent",
  "WhatIfSimulationAgent",
  "BehavioralFinanceAgent",
  "PlaybookGenerationAgent",
  "FinancialSummaryAgent",
  "ReflectionAndEvaluationAgent"
] as const;

function extractReflectionIssues(trace: AgentExecutionTrace): ReflectionIssue[] {
  const reflection = trace.reflectionEvaluation;
  if (reflection?.issues?.length) return reflection.issues;
  const reflectionAgent = trace.agentResults.find(
    (r) => r.agentName === "ReflectionAndEvaluationAgent"
  );
  const fromMeta = reflectionAgent?.metadata?.reflectionResult as
    | { issues?: ReflectionIssue[] }
    | undefined;
  return fromMeta?.issues ?? [];
}

export class AgentPerformanceService {
  compute(traces: AgentExecutionTrace[]): AgentPerformanceMetric[] {
    const byAgent = new Map<
      string,
      {
        runs: number;
        successes: number;
        confidenceSum: number;
        failures: number;
        warningHits: number;
        reviewHits: number;
      }
    >();

    for (const name of PIPELINE_AGENTS) {
      byAgent.set(name, {
        runs: 0,
        successes: 0,
        confidenceSum: 0,
        failures: 0,
        warningHits: 0,
        reviewHits: 0
      });
    }

    for (const trace of traces) {
      const issues = extractReflectionIssues(trace);
      const needsReview =
        trace.reflectionEvaluation?.requiresHumanReview ||
        trace.confidenceEvaluation?.requiresHumanReview;

      for (const result of trace.agentResults) {
        const bucket = byAgent.get(result.agentName);
        if (!bucket) continue;

        bucket.runs += 1;
        if (result.status === "completed" || result.status === "skipped") {
          bucket.successes += 1;
        }
        if (result.status === "failed") bucket.failures += 1;
        bucket.confidenceSum += result.confidence;

        const linkedIssues = issues.filter((i) =>
          i.affectedAgents?.includes(result.agentName)
        );
        bucket.warningHits += linkedIssues.filter(
          (i) => i.severity === "warning" || i.severity === "critical"
        ).length;
      }

      if (needsReview) {
        for (const name of PIPELINE_AGENTS) {
          byAgent.get(name)!.reviewHits += 1;
        }
      }
    }

    return PIPELINE_AGENTS.map((agentName) => {
      const bucket = byAgent.get(agentName)!;
      if (bucket.runs === 0) {
        return {
          agentName,
          successRate: 0,
          averageConfidence: 0,
          reliabilityScore: 0,
          reviewRate: 0,
          runs: 0,
          failureCount: 0,
          warningFrequency: 0
        };
      }
      const runs = bucket.runs;
      const successRate = Math.round((bucket.successes / runs) * 100);
      const averageConfidence = Math.round(bucket.confidenceSum / runs);
      const failurePenalty = Math.min(40, bucket.failures * 8);
      const warningPenalty = Math.min(25, bucket.warningHits * 3);
      const reviewPenalty = Math.min(20, Math.round((bucket.reviewHits / Math.max(traces.length, 1)) * 20));
      const reliabilityScore = Math.max(
        0,
        Math.min(100, averageConfidence - failurePenalty - warningPenalty - reviewPenalty)
      );
      const reviewRate = Math.round((bucket.reviewHits / Math.max(traces.length, 1)) * 100);

      return {
        agentName,
        successRate,
        averageConfidence,
        reliabilityScore,
        reviewRate,
        runs: bucket.runs,
        failureCount: bucket.failures,
        warningFrequency: bucket.warningHits
      };
    });
  }
}
