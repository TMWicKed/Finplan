/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentResult, ConfidenceEvaluationResult } from "./types.js";

const LOW_CONFIDENCE_THRESHOLD = 65;
const HUMAN_REVIEW_THRESHOLD = 75;

export class ConfidenceEvaluationService {
  evaluate(agentResults: AgentResult[]): ConfidenceEvaluationResult {
    const completed = agentResults.filter((r) => r.status === "completed");
    const notes: string[] = [];
    const weakAgents: string[] = [];

    if (completed.length === 0) {
      return {
        confidence: 0,
        requiresHumanReview: true,
        weakAgents: agentResults.map((r) => r.agentName),
        notes: ["No agents completed successfully."]
      };
    }

    let weightedSum = 0;
    let weightTotal = 0;

    for (const result of completed) {
      const weight = result.agentName === "FinancialSummaryAgent" ? 1.5 : 1;
      weightedSum += result.confidence * weight;
      weightTotal += weight;
      if (result.confidence < LOW_CONFIDENCE_THRESHOLD) {
        weakAgents.push(result.agentName);
        notes.push(`${result.agentName} reported low confidence (${result.confidence}).`);
      }
    }

    const failed = agentResults.filter((r) => r.status === "failed");
    for (const f of failed) {
      notes.push(`${f.agentName} failed but pipeline continued.`);
    }

    const confidence = Math.round(weightedSum / weightTotal);
    const requiresHumanReview =
      confidence < HUMAN_REVIEW_THRESHOLD ||
      weakAgents.length > 0 ||
      failed.some((f) => f.agentName === "FinancialSummaryAgent");

    return {
      confidence,
      requiresHumanReview,
      weakAgents,
      notes
    };
  }
}
