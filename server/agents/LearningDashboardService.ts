/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { listRecentTraces } from "./executionTraceStore.js";
import { AgentPerformanceService } from "./AgentPerformanceService.js";
import { LearningInsightsService } from "./LearningInsightsService.js";
import { getImprovementRecommendationService } from "./ImprovementRecommendationService.js";
import { isDatabaseConfigured } from "../db/client.js";
import type { LearningDashboardPayload } from "./learningTypes.js";

export interface LearningDataSources {
  reviewLogs: Array<{
    isPositive: boolean;
    failurePattern?: string;
    recommendation?: string;
    timestamp: string;
    reflectionVerdict?: string;
    executionId?: string;
  }>;
  behavioralAlerts: Array<{ classification: string; timestamp: string }>;
  playbooks: Array<{ id: string; title: string; status: string; scenarioType: string }>;
  systemPromptCorrections: string[];
}

export class LearningDashboardService {
  private readonly performanceService = new AgentPerformanceService();
  private readonly insightsService = new LearningInsightsService();

  buildDashboard(sources: LearningDataSources): LearningDashboardPayload {
    const traces = listRecentTraces(100);

    const agentPerformance = this.performanceService.compute(traces);
    const reflectionStatistics = this.insightsService.computeReflectionStatistics(traces);
    const humanReviewStatistics = this.insightsService.computeHumanReviewStatistics(
      traces,
      sources.reviewLogs
    );
    const feedbackTrends = this.insightsService.computeFeedbackTrends(sources.reviewLogs);
    const learningInsights = this.insightsService.computeInsights(
      traces,
      sources.reviewLogs,
      sources.behavioralAlerts,
      sources.playbooks,
      sources.systemPromptCorrections
    );
    const governance = this.insightsService.computeGovernance(traces, sources.reviewLogs);
    const improvementRecommendations = getImprovementRecommendationService().analyze(
      traces,
      sources
    );

    return {
      agentPerformance,
      reflectionStatistics,
      humanReviewStatistics,
      feedbackTrends,
      learningInsights,
      governance,
      improvementRecommendations,
      promptCorrectionsActive: sources.systemPromptCorrections.length,
      totalExecutions: traces.length,
      persistence: {
        postgresConfigured: isDatabaseConfigured(),
        fallbackMode: !isDatabaseConfigured()
      },
      generatedAt: new Date().toISOString()
    };
  }
}

let sharedLearningDashboard: LearningDashboardService | null = null;

export function getLearningDashboardService(): LearningDashboardService {
  if (!sharedLearningDashboard) {
    sharedLearningDashboard = new LearningDashboardService();
  }
  return sharedLearningDashboard;
}
