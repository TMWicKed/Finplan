/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";

export interface LearningDashboardData {
  agentPerformance: Array<{
    agentName: string;
    successRate: number;
    averageConfidence: number;
    reliabilityScore: number;
    reviewRate: number;
    runs: number;
    failureCount: number;
    warningFrequency: number;
  }>;
  reflectionStatistics: {
    pass: number;
    passWithWarnings: number;
    fail: number;
    total: number;
    humanReviewRequired: number;
    averageAdjustedConfidence: number;
  };
  humanReviewStatistics: {
    totalExecutions: number;
    reviewRequiredCount: number;
    reviewRate: number;
    feedbackPositive: number;
    feedbackNegative: number;
    feedbackTotal: number;
  };
  feedbackTrends: Array<{ date: string; positive: number; negative: number }>;
  learningInsights: {
    mostCommonIssues: Array<{ label: string; count: number }>;
    mostFrequentWarnings: Array<{ label: string; count: number }>;
    mostFrequentCorrections: Array<{ label: string; count: number }>;
    mostSuccessfulPlaybooks: Array<{ label: string; count: number }>;
    mostCommonBehavioralRisks: Array<{ label: string; count: number }>;
    improvementOpportunities: string[];
  };
  governance: {
    verdictCounts: { PASS: number; PASS_WITH_WARNINGS: number; FAIL: number };
    mostCommonReflectionIssues: Array<{ label: string; count: number }>;
    mostCommonReviewTriggers: Array<{ label: string; count: number }>;
    mostCommonRiskCategories: Array<{ label: string; count: number }>;
  };
  improvementRecommendations?: Array<{
    issue: string;
    recommendation: string;
    frequency: number;
    source: string;
  }>;
  persistence?: { postgresConfigured: boolean; fallbackMode: boolean };
  promptCorrectionsActive: number;
  totalExecutions: number;
  generatedAt: string;
}

interface AgentLearningPanelProps {
  data: LearningDashboardData | null;
  loading: boolean;
  onRefresh: () => void;
}

const AGENT_LABELS: Record<string, string> = {
  MarketIntelligenceAgent: "Market Intel",
  GoalPlanningAgent: "Goal Planning",
  WhatIfSimulationAgent: "What-If",
  BehavioralFinanceAgent: "Behavioral",
  PlaybookGenerationAgent: "Playbook",
  FinancialSummaryAgent: "Summary",
  ReflectionAndEvaluationAgent: "Reflection"
};

function InsightList({
  title,
  items,
  empty,
  dark = false
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
  empty: string;
  dark?: boolean;
}) {
  const rowClass = dark
    ? "bg-slate-800/40 border-slate-700/60 text-slate-300"
    : "bg-slate-50 border-gray-100 text-slate-600";
  return (
    <div className="space-y-1.5">
      <span className={`text-[9px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-gray-400"}`}>
        {title}
      </span>
      {items.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic">{empty}</p>
      ) : (
        items.slice(0, 5).map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between text-[10px] rounded px-2 py-1 border ${rowClass}`}
          >
            <span className="truncate pr-2">{item.label.replace(/_/g, " ")}</span>
            <span className="font-mono font-bold text-[#2cab52] shrink-0">{item.count}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function AgentLearningPanel({ data, loading, onRefresh }: AgentLearningPanelProps) {
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2cab52] mb-2" />
        <span className="text-xs font-semibold">Loading learning analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 space-y-3">
        <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs text-slate-500">Run Ira queries to populate the learning dashboard.</p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[10px] font-bold text-[#2cab52] hover:underline cursor-pointer"
        >
          Refresh analytics
        </button>
      </div>
    );
  }

  const { governance, reflectionStatistics, humanReviewStatistics } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#2cab52]" />
            Agent Operations Center
          </h3>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
            {data.totalExecutions} executions · {data.promptCorrectionsActive} active corrections
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-white cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Governance */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2 bg-slate-950">
          <ShieldCheck className="w-4 h-4 text-[#2cab52]" />
          <span className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider">
            AI Governance
          </span>
        </div>
        <div className="p-3 grid grid-cols-3 gap-2">
          {(
            [
              ["PASS", governance.verdictCounts.PASS, "bg-emerald-500/20 text-emerald-300"],
              ["WARN", governance.verdictCounts.PASS_WITH_WARNINGS, "bg-amber-500/20 text-amber-300"],
              ["FAIL", governance.verdictCounts.FAIL, "bg-red-500/20 text-red-300"]
            ] as const
          ).map(([label, count, cls]) => (
            <div key={label} className={`rounded-lg p-2 text-center border border-slate-700 ${cls}`}>
              <span className="text-[8px] font-bold uppercase block opacity-80">{label}</span>
              <span className="text-lg font-extrabold font-mono">{count}</span>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3 grid grid-cols-1 gap-3">
          <InsightList
            dark
            title="Reflection Issues"
            items={governance.mostCommonReflectionIssues}
            empty="No reflection issues logged yet"
          />
          <InsightList
            dark
            title="Review Triggers"
            items={governance.mostCommonReviewTriggers}
            empty="No HITL triggers recorded"
          />
          <InsightList
            dark
            title="Risk Categories"
            items={governance.mostCommonRiskCategories}
            empty="No risk categories detected"
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 border border-gray-150 shadow-sm">
          <span className="text-[8px] text-gray-400 font-bold uppercase">Avg Reflection Confidence</span>
          <p className="text-xl font-extrabold font-mono text-slate-900">
            {reflectionStatistics.averageAdjustedConfidence}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-150 shadow-sm">
          <span className="text-[8px] text-gray-400 font-bold uppercase">HITL Rate</span>
          <p className="text-xl font-extrabold font-mono text-amber-600">
            {humanReviewStatistics.reviewRate}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-150 shadow-sm">
          <span className="text-[8px] text-gray-400 font-bold uppercase flex items-center gap-1">
            <Users className="w-3 h-3" /> Feedback +
          </span>
          <p className="text-lg font-extrabold text-emerald-600">{humanReviewStatistics.feedbackPositive}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-150 shadow-sm">
          <span className="text-[8px] text-gray-400 font-bold uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Feedback −
          </span>
          <p className="text-lg font-extrabold text-red-600">{humanReviewStatistics.feedbackNegative}</p>
        </div>
      </div>

      {/* Agent performance */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#2cab52]" />
          <span className="text-[10px] font-extrabold text-slate-800 uppercase">Agent Performance</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
          {data.agentPerformance.map((agent) => (
            <div key={agent.agentName} className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-700">
                  {AGENT_LABELS[agent.agentName] ?? agent.agentName}
                </span>
                <span className="text-[9px] font-mono text-[#2cab52]">{agent.reliabilityScore}% reliable</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2cab52] rounded-full transition-all"
                  style={{ width: `${agent.reliabilityScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[8px] font-mono text-slate-400">
                <span>Success {agent.successRate}%</span>
                <span>Conf {agent.averageConfidence}%</span>
                <span>Runs {agent.runs}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback trends */}
      {data.feedbackTrends.length > 0 && (
        <div className="bg-white rounded-xl p-3 border border-gray-150 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-800 uppercase flex items-center gap-1 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#2cab52]" />
            Feedback Trends
          </span>
          <div className="space-y-1">
            {data.feedbackTrends.map((point) => (
              <div key={point.date} className="flex items-center gap-2 text-[9px]">
                <span className="text-slate-400 font-mono w-16 shrink-0">{point.date}</span>
                <div className="flex-1 flex h-2 rounded overflow-hidden bg-slate-100">
                  <div
                    className="bg-emerald-400"
                    style={{
                      width: `${(point.positive / Math.max(point.positive + point.negative, 1)) * 100}%`
                    }}
                  />
                  <div
                    className="bg-red-400"
                    style={{
                      width: `${(point.negative / Math.max(point.positive + point.negative, 1)) * 100}%`
                    }}
                  />
                </div>
                <span className="text-slate-500 font-mono">+{point.positive}/−{point.negative}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning insights */}
      <div className="bg-white rounded-xl p-3 border border-gray-150 shadow-sm space-y-3">
        <span className="text-[10px] font-extrabold text-slate-800 uppercase">Learning Insights</span>
        <InsightList
          title="Top Issues"
          items={data.learningInsights.mostCommonIssues}
          empty="No issues yet"
        />
        <InsightList
          title="Top Playbooks"
          items={data.learningInsights.mostSuccessfulPlaybooks}
          empty="No playbook matches yet"
        />
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Improvement Opportunities
          </span>
          <ul className="space-y-1">
            {data.learningInsights.improvementOpportunities.map((opp, i) => (
              <li key={i} className="text-[10px] text-slate-600 leading-snug flex gap-1">
                <span className="text-[#2cab52]">→</span>
                {opp}
              </li>
            ))}
            {(data.improvementRecommendations ?? []).map((rec) => (
              <li key={rec.issue} className="text-[10px] text-slate-600 leading-snug flex gap-1">
                <span className="text-amber-500">★</span>
                <span>
                  <strong>{rec.issue}</strong> ({rec.frequency}×): {rec.recommendation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[8px] text-slate-400 font-mono text-center">
        {data.persistence?.postgresConfigured
          ? "PostgreSQL persistence enabled"
          : "In-memory fallback (set DATABASE_URL for Postgres)"}
        {" · "}Generate → Reflect → Feedback → Learn
      </p>
    </div>
  );
}
