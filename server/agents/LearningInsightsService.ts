/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentExecutionTrace, ReflectionResult } from "./types.js";
import type {
  FeedbackTrendPoint,
  GovernanceSummary,
  HumanReviewStatistics,
  LearningInsightItem,
  LearningInsights,
  ReflectionStatistics
} from "./learningTypes.js";

interface ReviewLogLike {
  isPositive: boolean;
  failurePattern?: string;
  recommendation?: string;
  timestamp: string;
  reflectionVerdict?: string;
  executionId?: string;
}

interface BehavioralAlertLike {
  classification: string;
  timestamp: string;
}

interface PlaybookLike {
  id: string;
  title: string;
  status: string;
  scenarioType: string;
}

function getReflection(trace: AgentExecutionTrace): ReflectionResult | undefined {
  if (trace.reflectionEvaluation) return trace.reflectionEvaluation;
  const agent = trace.agentResults.find((r) => r.agentName === "ReflectionAndEvaluationAgent");
  return agent?.metadata?.reflectionResult as ReflectionResult | undefined;
}

function countByKey(items: string[]): LearningInsightItem[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export class LearningInsightsService {
  computeReflectionStatistics(traces: AgentExecutionTrace[]): ReflectionStatistics {
    let pass = 0;
    let passWithWarnings = 0;
    let fail = 0;
    let humanReviewRequired = 0;
    let confidenceSum = 0;
    let counted = 0;

    for (const trace of traces) {
      const reflection = getReflection(trace);
      if (!reflection) continue;
      counted += 1;
      confidenceSum += reflection.adjustedConfidence;
      if (reflection.reflectionVerdict === "PASS") pass += 1;
      else if (reflection.reflectionVerdict === "PASS_WITH_WARNINGS") passWithWarnings += 1;
      else fail += 1;
      if (reflection.requiresHumanReview) humanReviewRequired += 1;
    }

    return {
      pass,
      passWithWarnings,
      fail,
      total: counted,
      humanReviewRequired,
      averageAdjustedConfidence: counted > 0 ? Math.round(confidenceSum / counted) : 0
    };
  }

  computeHumanReviewStatistics(
    traces: AgentExecutionTrace[],
    reviewLogs: ReviewLogLike[]
  ): HumanReviewStatistics {
    const reviewRequiredCount = traces.filter((t) => {
      const reflection = getReflection(t);
      return (
        reflection?.requiresHumanReview || t.confidenceEvaluation?.requiresHumanReview
      );
    }).length;

    const feedbackPositive = reviewLogs.filter((r) => r.isPositive).length;
    const feedbackNegative = reviewLogs.filter((r) => !r.isPositive).length;

    return {
      totalExecutions: traces.length,
      reviewRequiredCount,
      reviewRate:
        traces.length > 0 ? Math.round((reviewRequiredCount / traces.length) * 100) : 0,
      feedbackPositive,
      feedbackNegative,
      feedbackTotal: reviewLogs.length
    };
  }

  computeFeedbackTrends(reviewLogs: ReviewLogLike[]): FeedbackTrendPoint[] {
    const byDay = new Map<string, { positive: number; negative: number }>();
    for (const log of reviewLogs) {
      const date = log.timestamp.slice(0, 10);
      const entry = byDay.get(date) ?? { positive: 0, negative: 0 };
      if (log.isPositive) entry.positive += 1;
      else entry.negative += 1;
      byDay.set(date, entry);
    }
    return [...byDay.entries()]
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }

  computeInsights(
    traces: AgentExecutionTrace[],
    reviewLogs: ReviewLogLike[],
    behavioralAlerts: BehavioralAlertLike[],
    playbooks: PlaybookLike[],
    systemPromptCorrections: string[]
  ): LearningInsights {
    const issueCodes: string[] = [];
    const warningCodes: string[] = [];
    const reviewTriggers: string[] = [];

    for (const trace of traces) {
      const reflection = getReflection(trace);
      if (!reflection) continue;
      for (const issue of reflection.issues) {
        issueCodes.push(issue.code);
        if (issue.severity === "warning") warningCodes.push(issue.code);
        if (issue.severity === "critical") reviewTriggers.push(issue.code);
      }
      if (reflection.requiresHumanReview) {
        reviewTriggers.push(`VERDICT_${reflection.reflectionVerdict}`);
      }
    }

    const correctionLabels = [
      ...systemPromptCorrections.map((c) => c.slice(0, 60)),
      ...reviewLogs
        .filter((r) => !r.isPositive && r.recommendation)
        .map((r) => r.recommendation!.slice(0, 60))
    ];

    const playbookHits = new Map<string, number>();
    for (const trace of traces) {
      const playbookAgent = trace.agentResults.find(
        (r) => r.agentName === "PlaybookGenerationAgent"
      );
      const ids = playbookAgent?.metadata?.matchedPlaybookIds as string[] | undefined;
      if (!ids?.length) continue;
      for (const id of ids) {
        const title = playbooks.find((p) => p.id === id)?.title ?? id;
        playbookHits.set(title, (playbookHits.get(title) ?? 0) + 1);
      }
    }

    const behavioralRisks = behavioralAlerts
      .filter((a) => a.classification !== "rational")
      .map((a) => a.classification.replace(/_/g, " "));

    const mostCommonIssues = countByKey(issueCodes);
    const opportunities: string[] = [];

    if (mostCommonIssues[0]?.label === "MISSING_CONTEXT") {
      opportunities.push("Enrich Financial Summary prompts with tax, emergency fund, and insurance pillars.");
    }
    if (mostCommonIssues.some((i) => i.label === "CONFIDENCE_INCONSISTENCY")) {
      opportunities.push("Align per-agent confidence heuristics to reduce spread above 30%.");
    }
    if (mostCommonIssues.some((i) => i.label === "AGENT_CONFLICT")) {
      opportunities.push("Reconcile Goal Planning baseline with What-If EMI before client delivery.");
    }
    if (reviewLogs.filter((r) => !r.isPositive).length > reviewLogs.filter((r) => r.isPositive).length) {
      opportunities.push("Increase human-in-the-loop sampling on high-risk behavioral queries.");
    }
    if (opportunities.length === 0) {
      opportunities.push("Continue capturing thumbs feedback to expand learning corpus.");
    }

    return {
      mostCommonIssues,
      mostFrequentWarnings: countByKey(warningCodes),
      mostFrequentCorrections: countByKey(correctionLabels),
      mostSuccessfulPlaybooks: [...playbookHits.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      mostCommonBehavioralRisks: countByKey(behavioralRisks),
      improvementOpportunities: opportunities
    };
  }

  computeGovernance(
    traces: AgentExecutionTrace[],
    reviewLogs: ReviewLogLike[]
  ): GovernanceSummary {
    const reflectionStats = this.computeReflectionStatistics(traces);
    const issueCodes: string[] = [];
    const reviewTriggers: string[] = [];
    const riskCategories: string[] = [];

    for (const trace of traces) {
      const reflection = getReflection(trace);
      if (!reflection) continue;
      for (const issue of reflection.issues) {
        issueCodes.push(issue.code);
        if (issue.severity === "critical") {
          reviewTriggers.push(issue.code);
          riskCategories.push("Critical Compliance");
        } else if (issue.severity === "warning") {
          riskCategories.push("Advisory Quality");
        } else {
          riskCategories.push("Context Completeness");
        }
      }
      const behavioral = trace.agentResults.find(
        (r) => r.agentName === "BehavioralFinanceAgent"
      );
      const tendency = behavioral?.metadata?.tendency as { classification?: string } | undefined;
      if (tendency && tendency.classification !== "rational") {
        riskCategories.push(tendency.classification.replace(/_/g, " "));
      }
    }

    for (const log of reviewLogs.filter((r) => !r.isPositive)) {
      if (log.failurePattern) reviewTriggers.push(log.failurePattern);
    }

    return {
      verdictCounts: {
        PASS: reflectionStats.pass,
        PASS_WITH_WARNINGS: reflectionStats.passWithWarnings,
        FAIL: reflectionStats.fail
      },
      mostCommonReflectionIssues: countByKey(issueCodes),
      mostCommonReviewTriggers: countByKey(reviewTriggers),
      mostCommonRiskCategories: countByKey(riskCategories)
    };
  }
}
