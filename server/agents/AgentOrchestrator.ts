/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import { AgentRegistry } from "./AgentRegistry.js";
import { ConfidenceEvaluationService } from "./ConfidenceEvaluationService.js";
import { storeExecutionTrace } from "./executionTraceStore.js";
import { GoalPlanningAgent } from "./GoalPlanningAgent.js";
import { WhatIfSimulationAgent } from "./WhatIfSimulationAgent.js";
import { BehavioralFinanceAgent } from "./BehavioralFinanceAgent.js";
import { PlaybookGenerationAgent } from "./PlaybookGenerationAgent.js";
import { FinancialSummaryAgent } from "./FinancialSummaryAgent.js";
import { ReflectionAndEvaluationAgent } from "./ReflectionAndEvaluationAgent.js";
import type {
  AgentExecutionContext,
  AgentExecutionTrace,
  AgentResult,
  ConfidenceEvaluationResult,
  IraAdvisoryPayload,
  OrchestratorOutput,
  ReflectionResult,
  TimelineEntry
} from "./types.js";
import type { ClientProfile, FinancialGoal } from "../../src/types.js";
import type { PlaybookRecord } from "../lib/playbooks.js";

const PIPELINE_ORDER = [
  "GoalPlanningAgent",
  "WhatIfSimulationAgent",
  "BehavioralFinanceAgent",
  "PlaybookGenerationAgent",
  "FinancialSummaryAgent",
  "ReflectionAndEvaluationAgent"
] as const;

const REFLECTION_AGENT_NAME = "ReflectionAndEvaluationAgent";

function formatTimeLabel(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

export class AgentOrchestrator {
  private readonly registry: AgentRegistry;
  private readonly confidenceService: ConfidenceEvaluationService;

  constructor() {
    this.registry = new AgentRegistry();
    this.confidenceService = new ConfidenceEvaluationService();
    this.registry.register(new GoalPlanningAgent());
    this.registry.register(new WhatIfSimulationAgent());
    this.registry.register(new BehavioralFinanceAgent());
    this.registry.register(new PlaybookGenerationAgent());
    this.registry.register(new FinancialSummaryAgent());
    this.registry.register(new ReflectionAndEvaluationAgent());
  }

  getPipelineOrder(): readonly string[] {
    return PIPELINE_ORDER;
  }

  async execute(params: {
    userEmail: string;
    message: string;
    chatHistory: { sender: string; text: string }[];
    whatIfState?: Record<string, unknown> | null;
    profile: ClientProfile;
    goals: FinancialGoal[];
    playbooks: PlaybookRecord[];
    systemPromptCorrections: string[];
  }): Promise<OrchestratorOutput> {
    const executionId = `exec_${crypto.randomBytes(6).toString("hex")}`;
    const startedAt = new Date();
    const timeline: TimelineEntry[] = [];
    const agentResults: AgentResult[] = [];
    const priorAgentResults: Record<string, AgentResult> = {};

    const baseContext: AgentExecutionContext = {
      executionId,
      userEmail: params.userEmail,
      message: params.message,
      chatHistory: params.chatHistory,
      whatIfState: params.whatIfState,
      profile: params.profile,
      goals: params.goals,
      playbooks: params.playbooks,
      systemPromptCorrections: params.systemPromptCorrections,
      priorAgentResults
    };

    const agents = this.registry.getOrdered([...PIPELINE_ORDER]);
    let confidenceEvaluation: ConfidenceEvaluationResult | undefined;

    for (const agent of agents) {
      const stepStart = new Date();
      timeline.push({
        timestamp: stepStart.toISOString(),
        timeLabel: formatTimeLabel(stepStart),
        agentName: agent.name,
        event: "STARTED",
        status: "started"
      });

      let context: AgentExecutionContext = {
        ...baseContext,
        priorAgentResults: { ...priorAgentResults }
      };

      if (agent.name === REFLECTION_AGENT_NAME) {
        confidenceEvaluation = this.confidenceService.evaluate(agentResults);
        context = {
          ...context,
          confidenceEvaluation,
          timeline: [...timeline],
          allAgentResults: [...agentResults]
        };
      }

      let result: AgentResult;
      try {
        result = await agent.run(context);
      } catch (err: unknown) {
        if (agent.name === REFLECTION_AGENT_NAME) {
          result = {
            agentName: agent.name,
            status: "completed",
            confidence: confidenceEvaluation?.confidence ?? 0,
            summary: "Reflection agent failed safely — pipeline continued.",
            recommendations: ["Manual planner review recommended."],
            nextAction: "Continue delivery with baseline confidence",
            executionTime: Date.now() - stepStart.getTime(),
            metadata: {
              reflectionError: err instanceof Error ? err.message : String(err),
              requiresHumanReview: true
            }
          };
        } else {
          result = {
            agentName: agent.name,
            status: "failed",
            confidence: 0,
            summary: `${agent.name} threw an unexpected error.`,
            recommendations: [],
            nextAction: "Continue pipeline",
            executionTime: Date.now() - stepStart.getTime(),
            metadata: { error: err instanceof Error ? err.message : String(err) }
          };
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[AgentOrchestrator] ${agent.name} ${result.status} in ${result.executionTime}ms`
        );
      }

      priorAgentResults[agent.name] = result;
      agentResults.push(result);

      const stepEnd = new Date();
      timeline.push({
        timestamp: stepEnd.toISOString(),
        timeLabel: formatTimeLabel(stepEnd),
        agentName: agent.name,
        event: result.status === "failed" ? "FAILED" : result.status === "skipped" ? "SKIPPED" : "COMPLETED",
        status: result.status,
        confidence: result.confidence,
        executionTimeMs: result.executionTime,
        message: result.summary.slice(0, 120)
      });
    }

    if (!confidenceEvaluation) {
      confidenceEvaluation = this.confidenceService.evaluate(
        agentResults.filter((r) => r.agentName !== REFLECTION_AGENT_NAME)
      );
    }

    const reflectionAgent = agentResults.find((r) => r.agentName === REFLECTION_AGENT_NAME);
    const reflectionEvaluation = reflectionAgent?.metadata?.reflectionResult as
      | ReflectionResult
      | undefined;

    const overallConfidence =
      reflectionEvaluation?.adjustedConfidence ?? confidenceEvaluation.confidence;

    const mergedConfidenceEvaluation: ConfidenceEvaluationResult = {
      ...confidenceEvaluation,
      confidence: overallConfidence,
      requiresHumanReview:
        confidenceEvaluation.requiresHumanReview ||
        Boolean(reflectionEvaluation?.requiresHumanReview),
      notes: [
        ...confidenceEvaluation.notes,
        ...(reflectionEvaluation
          ? [`Reflection verdict: ${reflectionEvaluation.reflectionVerdict} (${reflectionEvaluation.issues.length} issue(s)).`]
          : [])
      ]
    };

    const summaryAgent = agentResults.find((r) => r.agentName === "FinancialSummaryAgent");
    const iraResponse = summaryAgent?.metadata?.iraResponse as IraAdvisoryPayload | undefined;

    const finalSummary =
      iraResponse?.summary ??
      agentResults
        .filter((r) => r.status === "completed")
        .map((r) => r.summary)
        .join(" ");

    const trace: AgentExecutionTrace = {
      executionId,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      timeline,
      agentResults,
      overallConfidence,
      finalSummary,
      confidenceEvaluation: mergedConfidenceEvaluation,
      reflectionEvaluation
    };
    storeExecutionTrace(trace);

    return {
      executionId,
      timeline,
      agentResults,
      overallConfidence,
      finalSummary,
      iraResponse,
      confidenceEvaluation: mergedConfidenceEvaluation,
      reflectionEvaluation
    };
  }
}

let sharedOrchestrator: AgentOrchestrator | null = null;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!sharedOrchestrator) {
    sharedOrchestrator = new AgentOrchestrator();
  }
  return sharedOrchestrator;
}
