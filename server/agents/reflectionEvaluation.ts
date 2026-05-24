/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GoalPlanningAnalysis } from "../lib/goalPlanning.js";
import type { WhatIfSimulationResult } from "../lib/whatIfSimulation.js";
import type {
  AgentResult,
  ReflectionEvaluationInput,
  ReflectionIssue,
  ReflectionResult
} from "./types.js";

const CONFIDENCE_SPREAD_THRESHOLD = 30;
const SEVERE_GOAL_FUNDING_THRESHOLD = 40;
const PENALTY_CRITICAL = 5;
const PENALTY_WARNING = 3;
const PENALTY_INFO = 1;

const CRITICAL_CODES = new Set([
  "AGENT_CONFLICT",
  "SEVERE_FUNDING_GAP",
  "CONFIDENCE_INCONSISTENCY",
  "HIGH_RISK_RECOMMENDATION",
  "REQUIRES_ADVISOR_REVIEW"
]);

function textIncludesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function collectAdvisoryText(agentResults: AgentResult[]): string {
  const summaryAgent = agentResults.find((r) => r.agentName === "FinancialSummaryAgent");
  const ira = summaryAgent?.metadata?.iraResponse as
    | { summary?: string; recommendations?: string[]; explanation?: string }
    | undefined;
  const parts = [
    summaryAgent?.summary ?? "",
    ...(summaryAgent?.recommendations ?? []),
    ...(ira?.recommendations ?? []),
    ira?.summary ?? "",
    ira?.explanation ?? ""
  ];
  return parts.join(" ").toLowerCase();
}

function isGoalPlanningHealthy(goalResult: AgentResult | undefined): boolean {
  const analysis = goalResult?.metadata?.analysis as GoalPlanningAnalysis | undefined;
  if (!analysis) return false;
  const underFunded = analysis.goals.filter((g) => g.fundingGapPercent > 30);
  return analysis.surplusAfterGoals >= 0 && underFunded.length === 0;
}

function hasSevereWhatIfGap(whatIfResult: AgentResult | undefined): boolean {
  if (!whatIfResult || whatIfResult.status !== "completed") return false;
  const simulation = whatIfResult.metadata?.simulation as WhatIfSimulationResult | undefined;
  if (!simulation) return false;
  if (simulation.newSurplus < 15000) return true;
  return simulation.goalsImpact.some(
    (g) => g.after < SEVERE_GOAL_FUNDING_THRESHOLD && g.before - g.after >= 25
  );
}

function detectAgentConflict(
  goalResult: AgentResult | undefined,
  whatIfResult: AgentResult | undefined
): ReflectionIssue | null {
  if (whatIfResult?.status === "skipped") return null;
  const goalHealthy = isGoalPlanningHealthy(goalResult);
  const severeGap = hasSevereWhatIfGap(whatIfResult);
  if (goalHealthy && severeGap) {
    const simulation = whatIfResult?.metadata?.simulation as WhatIfSimulationResult | undefined;
    return {
      code: "AGENT_CONFLICT",
      severity: "critical",
      message:
        "Goal Planning reports healthy funding while What-If simulation shows a severe surplus or goal funding gap.",
      evidence: simulation
        ? `Surplus drops to ₹${simulation.newSurplus.toLocaleString("en-IN")}/mo; goal funding as low as ${Math.min(...simulation.goalsImpact.map((g) => g.after))}%.`
        : undefined,
      affectedAgents: ["GoalPlanningAgent", "WhatIfSimulationAgent"]
    };
  }
  return null;
}

function detectSevereFundingGap(whatIfResult: AgentResult | undefined): ReflectionIssue | null {
  if (!hasSevereWhatIfGap(whatIfResult)) return null;
  const simulation = whatIfResult?.metadata?.simulation as WhatIfSimulationResult | undefined;
  return {
    code: "SEVERE_FUNDING_GAP",
    severity: "critical",
    message:
      "What-If simulation indicates a severe post-EMI funding shortfall requiring planner intervention.",
    evidence: simulation
      ? `New surplus ₹${simulation.newSurplus.toLocaleString("en-IN")}/mo after EMI ₹${simulation.calculatedEmi.toLocaleString("en-IN")}/mo.`
      : undefined,
    affectedAgents: ["WhatIfSimulationAgent"]
  };
}

function detectMissingPlaybookAction(
  behavioralResult: AgentResult | undefined,
  playbookResult: AgentResult | undefined,
  goalResult: AgentResult | undefined
): ReflectionIssue | null {
  const analysis = goalResult?.metadata?.analysis as GoalPlanningAnalysis | undefined;
  const retirementNeglect = analysis?.goals.some(
    (g) => g.type === "retirement" && (g.currentFunding < 50 || g.fundingGapPercent > 40)
  );

  const tendency = behavioralResult?.metadata?.tendency as { classification?: string } | undefined;
  const behavioralRetirementSignal =
    tendency?.classification === "concentration_risk" ||
    textIncludesAny(behavioralResult?.summary ?? "", ["retirement", "neglect", "under-funded"]);

  if (!retirementNeglect && !behavioralRetirementSignal) return null;

  const playbookText = [playbookResult?.summary ?? "", ...(playbookResult?.recommendations ?? [])]
    .join(" ")
    .toLowerCase();

  const hasRetirementAction = textIncludesAny(playbookText, [
    "retirement",
    "nps",
    "ppf",
    "corpus",
    "pension",
    "epf"
  ]);

  if (hasRetirementAction) return null;

  return {
    code: "MISSING_PLAYBOOK_ACTION",
    severity: "warning",
    message:
      "Retirement or concentration-risk signals detected but Playbook Agent produced no retirement-aligned action.",
    evidence: retirementNeglect
      ? "Retirement goal funding below 50% or gap exceeds 40%."
      : "Behavioral signals suggest portfolio or retirement neglect.",
    affectedAgents: ["BehavioralFinanceAgent", "PlaybookGenerationAgent", "GoalPlanningAgent"]
  };
}

function detectMissingContext(message: string, advisoryText: string): ReflectionIssue[] {
  const issues: ReflectionIssue[] = [];
  const msgLower = message.toLowerCase();
  const isBroadQuery =
    !textIncludesAny(msgLower, ["interest", "sfb", "fd rate"]) ||
    textIncludesAny(msgLower, ["plan", "goal", "advice", "portfolio", "home", "flat", "retire"]);

  if (!isBroadQuery) return issues;

  if (
    !textIncludesAny(advisoryText, ["80c", "80 c", "elss", "24b", "24 b", "tax", "deduction", "ltcg"]) &&
    textIncludesAny(msgLower, ["tax", "save", "80c", "elss", "invest", "plan", "goal"])
  ) {
    issues.push({
      code: "MISSING_CONTEXT",
      severity: "info",
      message: "Advisory output omits explicit tax optimization context (Section 80C / 24B).",
      evidence: "No tax-related keywords in final recommendations.",
      affectedAgents: ["FinancialSummaryAgent"]
    });
  }

  if (
    !textIncludesAny(advisoryText, ["emergency", "contingency", "6 month", "six month", "liquid"]) &&
    textIncludesAny(msgLower, ["goal", "surplus", "home", "flat", "buy", "plan"])
  ) {
    issues.push({
      code: "MISSING_CONTEXT",
      severity: "warning",
      message: "Advisory output does not reference emergency fund or liquidity buffer review.",
      evidence: "No emergency/contingency fund mention in synthesized advice.",
      affectedAgents: ["FinancialSummaryAgent"]
    });
  }

  if (
    !textIncludesAny(advisoryText, ["insurance", "term cover", "health cover", "lic", "life cover"]) &&
    textIncludesAny(msgLower, ["retire", "family", "child", "education", "home", "goal"])
  ) {
    issues.push({
      code: "MISSING_CONTEXT",
      severity: "info",
      message: "Advisory output does not mention insurance adequacy (term/health cover).",
      evidence: "No insurance-related keywords in final recommendations.",
      affectedAgents: ["FinancialSummaryAgent"]
    });
  }

  return issues;
}

function detectConfidenceInconsistency(agentResults: AgentResult[]): ReflectionIssue | null {
  const completed = agentResults.filter((r) => r.status === "completed");
  if (completed.length < 2) return null;

  const confidences = completed.map((r) => r.confidence);
  const maxConf = Math.max(...confidences);
  const minConf = Math.min(...confidences);
  const spread = maxConf - minConf;

  if (spread <= CONFIDENCE_SPREAD_THRESHOLD) return null;

  const lowAgent = completed.find((r) => r.confidence === minConf);
  const highAgent = completed.find((r) => r.confidence === maxConf);

  return {
    code: "CONFIDENCE_INCONSISTENCY",
    severity: "critical",
    message: `Agent confidence spread of ${spread}% exceeds ${CONFIDENCE_SPREAD_THRESHOLD}% threshold.`,
    evidence: `${highAgent?.agentName} (${maxConf}%) vs ${lowAgent?.agentName} (${minConf}%).`,
    affectedAgents: completed.map((r) => r.agentName)
  };
}

function detectAdvisorReviewFlags(
  behavioralResult: AgentResult | undefined,
  summaryResult: AgentResult | undefined,
  advisoryText: string
): ReflectionIssue[] {
  const issues: ReflectionIssue[] = [];
  const tendency = behavioralResult?.metadata?.tendency as
    | { classification?: string; score?: number }
    | undefined;
  const ira = summaryResult?.metadata?.iraResponse as
    | { requires_human_approval?: boolean; confidence?: number }
    | undefined;

  if (ira?.requires_human_approval) {
    issues.push({
      code: "REQUIRES_ADVISOR_REVIEW",
      severity: "critical",
      message: "Financial Summary Agent flagged this response for human advisor approval.",
      evidence: "iraResponse.requires_human_approval is true.",
      affectedAgents: ["FinancialSummaryAgent"]
    });
  }

  const highRiskBehavior =
    tendency?.classification === "fomo_chasing" ||
    tendency?.classification === "concentration_risk" ||
    tendency?.classification === "panic_selling";

  if (highRiskBehavior) {
    const hasCaution = textIncludesAny(advisoryText, [
      "caution",
      "risk",
      "rebalance",
      "diversif",
      "de-risk",
      "planner",
      "advisor",
      "approval"
    ]);
    if (!hasCaution || (summaryResult?.confidence ?? 0) >= 85) {
      issues.push({
        code: "HIGH_RISK_RECOMMENDATION",
        severity: "critical",
        message: `High-risk behavioral pattern (${tendency?.classification}) with insufficient de-risking language in final advice.`,
        evidence: `Behavior score ${tendency?.score ?? "n/a"}; summary confidence ${summaryResult?.confidence ?? "n/a"}%.`,
        affectedAgents: ["BehavioralFinanceAgent", "FinancialSummaryAgent"]
      });
    }
  }

  if ((ira?.confidence ?? 0) >= 0.95 && highRiskBehavior) {
    issues.push({
      code: "REQUIRES_ADVISOR_REVIEW",
      severity: "critical",
      message: "Aggressive confidence on a high-risk behavioral query requires advisor validation.",
      evidence: `Model confidence ${Math.round((ira?.confidence ?? 0) * 100)}% with ${tendency?.classification} bias detected.`,
      affectedAgents: ["BehavioralFinanceAgent", "FinancialSummaryAgent"]
    });
  }

  return issues;
}

function penaltyForIssue(issue: ReflectionIssue): number {
  if (issue.severity === "critical") return PENALTY_CRITICAL;
  if (issue.severity === "warning") return PENALTY_WARNING;
  return PENALTY_INFO;
}

function deriveVerdict(issues: ReflectionIssue[], adjustedConfidence: number): ReflectionResult["reflectionVerdict"] {
  const hasCritical = issues.some((i) => i.severity === "critical");
  if (hasCritical || adjustedConfidence < 65) return "FAIL";
  if (issues.length > 0 || adjustedConfidence < 75) return "PASS_WITH_WARNINGS";
  return "PASS";
}

function buildRecommendations(issues: ReflectionIssue[]): string[] {
  const recs: string[] = [];
  for (const issue of issues) {
    switch (issue.code) {
      case "AGENT_CONFLICT":
        recs.push("Reconcile Goal Planning baseline with What-If EMI scenario before client delivery.");
        break;
      case "SEVERE_FUNDING_GAP":
        recs.push("Escalate to human planner — post-EMI surplus insufficient for goal SIP commitments.");
        break;
      case "MISSING_PLAYBOOK_ACTION":
        recs.push("Inject retirement or de-risking playbook rules before regenerating summary.");
        break;
      case "MISSING_CONTEXT":
        recs.push("Augment final advisory with missing context pillar (tax, emergency fund, or insurance).");
        break;
      case "CONFIDENCE_INCONSISTENCY":
        recs.push("Review low-confidence agent outputs before trusting aggregate pipeline score.");
        break;
      case "HIGH_RISK_RECOMMENDATION":
        recs.push("Add explicit risk disclaimers and de-risking steps for behavioral bias detected.");
        break;
      case "REQUIRES_ADVISOR_REVIEW":
        recs.push("Route to certified financial planner for approval before client sees recommendations.");
        break;
      default:
        recs.push(`Address reflection issue: ${issue.code}.`);
    }
  }
  return [...new Set(recs)];
}

/** Deterministic reflection and quality gate over upstream agent outputs. */
export function runReflectionEvaluation(input: ReflectionEvaluationInput): ReflectionResult {
  const { allAgentResults, confidenceEvaluation, message } = input;
  const reasoning: string[] = [];
  const issues: ReflectionIssue[] = [];

  const goalResult = allAgentResults.find((r) => r.agentName === "GoalPlanningAgent");
  const whatIfResult = allAgentResults.find((r) => r.agentName === "WhatIfSimulationAgent");
  const behavioralResult = allAgentResults.find((r) => r.agentName === "BehavioralFinanceAgent");
  const playbookResult = allAgentResults.find((r) => r.agentName === "PlaybookGenerationAgent");
  const summaryResult = allAgentResults.find((r) => r.agentName === "FinancialSummaryAgent");

  reasoning.push(
    `Baseline pipeline confidence from ConfidenceEvaluationService: ${confidenceEvaluation.confidence}%.`
  );

  const conflict = detectAgentConflict(goalResult, whatIfResult);
  if (conflict) issues.push(conflict);

  const severeGapIssue = detectSevereFundingGap(whatIfResult);
  if (severeGapIssue && !conflict) issues.push(severeGapIssue);

  const playbookGap = detectMissingPlaybookAction(behavioralResult, playbookResult, goalResult);
  if (playbookGap) issues.push(playbookGap);

  const advisoryText = collectAdvisoryText(allAgentResults);
  issues.push(...detectMissingContext(message, advisoryText));

  const confidenceIssue = detectConfidenceInconsistency(
    allAgentResults.filter((r) => r.agentName !== "ReflectionAndEvaluationAgent")
  );
  if (confidenceIssue) issues.push(confidenceIssue);

  issues.push(...detectAdvisorReviewFlags(behavioralResult, summaryResult, advisoryText));

  const baselineConfidence = confidenceEvaluation.confidence;
  let totalPenalty = 0;
  for (const issue of issues) {
    const penalty = penaltyForIssue(issue);
    totalPenalty += penalty;
    reasoning.push(
      `[${issue.severity.toUpperCase()}] ${issue.code}: −${penalty} pts — ${issue.message}`
    );
  }

  const adjustedConfidence = Math.max(0, Math.min(100, baselineConfidence - totalPenalty));
  reasoning.push(
    `Confidence adjustment: ${baselineConfidence} − ${totalPenalty} (issues: ${issues.length}) = ${adjustedConfidence}.`
  );

  const reflectionVerdict = deriveVerdict(issues, adjustedConfidence);
  reasoning.push(`Final reflection verdict: ${reflectionVerdict}.`);

  const requiresHumanReview =
    confidenceEvaluation.requiresHumanReview ||
    issues.some((i) => CRITICAL_CODES.has(i.code)) ||
    reflectionVerdict === "FAIL";

  if (requiresHumanReview) {
    reasoning.push("Human review gate: OPEN — critical issue or sub-threshold confidence.");
  } else {
    reasoning.push("Human review gate: CLOSED — automated quality gate passed.");
  }

  return {
    reflectionVerdict,
    adjustedConfidence,
    baselineConfidence,
    confidenceAdjustment: -totalPenalty,
    issues,
    recommendations: buildRecommendations(issues),
    requiresHumanReview,
    reasoning
  };
}
