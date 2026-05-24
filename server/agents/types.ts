/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ClientProfile, FinancialGoal } from "../../src/types.js";
import type { PlaybookRecord } from "../lib/playbooks.js";

export type AgentExecutionStatus = "pending" | "started" | "completed" | "failed" | "skipped";

export interface AgentResult {
  agentName: string;
  status: AgentExecutionStatus;
  confidence: number;
  summary: string;
  recommendations: string[];
  nextAction: string;
  executionTime: number;
  metadata: Record<string, unknown>;
}

export interface AgentExecutionContext {
  executionId: string;
  userEmail: string;
  message: string;
  chatHistory: { sender: string; text: string }[];
  whatIfState?: Record<string, unknown> | null;
  profile: ClientProfile;
  goals: FinancialGoal[];
  playbooks: PlaybookRecord[];
  systemPromptCorrections: string[];
  priorAgentResults: Record<string, AgentResult>;
  /** Populated by orchestrator for ReflectionAndEvaluationAgent only. */
  confidenceEvaluation?: ConfidenceEvaluationResult;
  /** Snapshot of pipeline timeline before reflection step. */
  timeline?: TimelineEntry[];
  /** All upstream agent results before reflection. */
  allAgentResults?: AgentResult[];
}

export interface TimelineEntry {
  timestamp: string;
  timeLabel: string;
  agentName: string;
  event: "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED";
  status: AgentExecutionStatus;
  confidence?: number;
  executionTimeMs?: number;
  message?: string;
}

export interface AgentExecutionTrace {
  executionId: string;
  startedAt: string;
  completedAt?: string;
  timeline: TimelineEntry[];
  agentResults: AgentResult[];
  overallConfidence: number;
  finalSummary: string;
  confidenceEvaluation?: ConfidenceEvaluationResult;
  reflectionEvaluation?: ReflectionResult;
}

export interface OrchestratorOutput {
  executionId: string;
  timeline: TimelineEntry[];
  agentResults: AgentResult[];
  overallConfidence: number;
  finalSummary: string;
  iraResponse?: IraAdvisoryPayload;
  confidenceEvaluation: ConfidenceEvaluationResult;
  reflectionEvaluation?: ReflectionResult;
}

export interface IraAdvisoryPayload {
  intent: string;
  confidence: number;
  summary: string;
  recommendations: string[];
  impact?: { goal_id: string; before: number; after: number };
  requires_human_approval: boolean;
  explanation: string;
  aiProvider: string;
  behavioralClassification?: string;
  behavioralNudge?: string;
}

export interface ConfidenceEvaluationResult {
  confidence: number;
  requiresHumanReview: boolean;
  weakAgents: string[];
  notes: string[];
}

export type ReflectionVerdict = "PASS" | "PASS_WITH_WARNINGS" | "FAIL";

export type ReflectionIssueSeverity = "critical" | "warning" | "info";

export interface ReflectionIssue {
  code: string;
  severity: ReflectionIssueSeverity;
  message: string;
  evidence?: string;
  affectedAgents?: string[];
}

export interface ReflectionResult {
  reflectionVerdict: ReflectionVerdict;
  adjustedConfidence: number;
  baselineConfidence: number;
  confidenceAdjustment: number;
  issues: ReflectionIssue[];
  recommendations: string[];
  requiresHumanReview: boolean;
  reasoning: string[];
}

export interface ReflectionEvaluationInput {
  allAgentResults: AgentResult[];
  confidenceEvaluation: ConfidenceEvaluationResult;
  message: string;
  profile: ClientProfile;
  goals: FinancialGoal[];
}
