/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentExecutionTrace } from "../agents/types.js";
import { getAgentPersistenceRepositories } from "./repositories/index.js";

function mapAgentStatus(status: string): string {
  if (status === "completed") return "success";
  if (status === "failed") return "failed";
  if (status === "skipped") return "skipped";
  return status;
}

/**
 * Non-blocking dual-write: one agent_traces row per agent + reflection evaluation row.
 */
export function persistExecutionTraceToDatabase(trace: AgentExecutionTrace): void {
  const repos = getAgentPersistenceRepositories();
  if (!repos) {
    return;
  }

  const sessionId = trace.executionId;

  const traceRows = trace.agentResults.map((result) => ({
    sessionId,
    agentName: result.agentName,
    status: mapAgentStatus(result.status),
    duration: result.executionTime,
    confidenceScore: result.confidence,
    inputSummary: trace.finalSummary.slice(0, 200),
    outputSummary: result.summary.slice(0, 500)
  }));

  void repos.traces
    .insertMany(traceRows)
    .catch((err: unknown) => {
      console.warn(
        "[db] agent_traces persist failed:",
        err instanceof Error ? err.message : String(err)
      );
    });

  const reflection = trace.reflectionEvaluation;
  if (!reflection) {
    return;
  }

  void repos.evaluations
    .insert({
      sessionId,
      agentName: "ReflectionAndEvaluationAgent",
      evaluationScore: reflection.adjustedConfidence / 100,
      feedbackScore: null,
      issuesDetected: reflection.issues.map((i) => i.code),
      recommendations: reflection.recommendations,
      confidenceLevel:
        reflection.adjustedConfidence >= 75
          ? "HIGH_CONFIDENCE"
          : reflection.adjustedConfidence >= 55
            ? "MEDIUM_CONFIDENCE"
            : "LOW_CONFIDENCE",
      requiresHumanReview: reflection.requiresHumanReview,
      confidenceReasoning: {
        verdict: reflection.reflectionVerdict,
        baselineConfidence: reflection.baselineConfidence,
        adjustedConfidence: reflection.adjustedConfidence,
        reasoning: reflection.reasoning
      }
    })
    .catch((err: unknown) => {
      console.warn(
        "[db] agent_evaluations persist failed:",
        err instanceof Error ? err.message : String(err)
      );
    });
}

export function persistHumanFeedbackToDatabase(params: {
  sessionId: string;
  agentName: string;
  feedbackScore: number;
  feedbackComment?: string;
  submittedBy?: string;
}): void {
  const repos = getAgentPersistenceRepositories();
  if (!repos) {
    return;
  }

  void repos.feedback
    .insert({
      sessionId: params.sessionId,
      agentName: params.agentName,
      feedbackScore: params.feedbackScore,
      feedbackComment: params.feedbackComment ?? null,
      submittedBy: params.submittedBy ?? null
    })
    .catch((err: unknown) => {
      console.warn(
        "[db] agent_human_feedback persist failed:",
        err instanceof Error ? err.message : String(err)
      );
    });
}
