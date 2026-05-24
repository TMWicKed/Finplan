/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AgentPerformanceMetric {
  agentName: string;
  successRate: number;
  averageConfidence: number;
  reliabilityScore: number;
  reviewRate: number;
  runs: number;
  failureCount: number;
  warningFrequency: number;
}

export interface LearningInsightItem {
  label: string;
  count: number;
  detail?: string;
}

export interface LearningInsights {
  mostCommonIssues: LearningInsightItem[];
  mostFrequentWarnings: LearningInsightItem[];
  mostFrequentCorrections: LearningInsightItem[];
  mostSuccessfulPlaybooks: LearningInsightItem[];
  mostCommonBehavioralRisks: LearningInsightItem[];
  improvementOpportunities: string[];
}

export interface ReflectionStatistics {
  pass: number;
  passWithWarnings: number;
  fail: number;
  total: number;
  humanReviewRequired: number;
  averageAdjustedConfidence: number;
}

export interface HumanReviewStatistics {
  totalExecutions: number;
  reviewRequiredCount: number;
  reviewRate: number;
  feedbackPositive: number;
  feedbackNegative: number;
  feedbackTotal: number;
}

export interface FeedbackTrendPoint {
  date: string;
  positive: number;
  negative: number;
}

export interface GovernanceSummary {
  verdictCounts: { PASS: number; PASS_WITH_WARNINGS: number; FAIL: number };
  mostCommonReflectionIssues: LearningInsightItem[];
  mostCommonReviewTriggers: LearningInsightItem[];
  mostCommonRiskCategories: LearningInsightItem[];
}

export interface ImprovementRecommendationItem {
  issue: string;
  recommendation: string;
  frequency: number;
  source: "reflection" | "feedback" | "confidence";
}

export interface LearningDashboardPayload {
  agentPerformance: AgentPerformanceMetric[];
  reflectionStatistics: ReflectionStatistics;
  humanReviewStatistics: HumanReviewStatistics;
  feedbackTrends: FeedbackTrendPoint[];
  learningInsights: LearningInsights;
  governance: GovernanceSummary;
  improvementRecommendations: ImprovementRecommendationItem[];
  promptCorrectionsActive: number;
  totalExecutions: number;
  persistence: {
    postgresConfigured: boolean;
    fallbackMode: boolean;
  };
  generatedAt: string;
}
