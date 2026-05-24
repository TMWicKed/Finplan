/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ClientProfile, FinancialGoal } from "../../src/types.js";

export interface GoalSipSimulationInput {
  monthlySIP: number;
  annualRate: number;
  years: number;
}

export interface GoalSipSimulationResult {
  futureValue: number;
  totalInvestment: number;
  wealthGained: number;
  formula: string;
}

/** SIP FV (same formula as POST /api/v1/goals/simulate). */
export function runGoalSipSimulation(input: GoalSipSimulationInput): GoalSipSimulationResult {
  const PMT = Number(input.monthlySIP);
  const annualReturnRate = Number(input.annualRate) / 100;
  const r = annualReturnRate / 12;
  const n = Number(input.years) * 12;

  let fv = 0;
  if (r > 0) {
    fv = PMT * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  } else {
    fv = PMT * n;
  }

  const totalInvestment = PMT * n;
  const gains = fv - totalInvestment;

  return {
    futureValue: Math.round(fv),
    totalInvestment: Math.round(totalInvestment),
    wealthGained: Math.round(gains),
    formula: "PMT × ((1 + r)^n - 1) / r"
  };
}

export interface GoalPlanningInsight {
  goalId: string;
  name: string;
  type: string;
  currentFunding: number;
  monthlyRequiredSIP: number;
  targetAmount: number;
  inflationAdjustedTarget: number;
  projectedCorpusAt12Pct: number;
  fundingGapPercent: number;
}

export interface GoalPlanningAnalysis {
  profile: Pick<ClientProfile, "name" | "investableSurplus" | "income" | "expenses">;
  totalMonthlyRequiredSip: number;
  surplusAfterGoals: number;
  goals: GoalPlanningInsight[];
}

/** Analyzes goals against profile surplus using existing seed metrics and SIP projection. */
export function analyzeGoalPlanning(
  profile: ClientProfile,
  goals: FinancialGoal[]
): GoalPlanningAnalysis {
  const insights: GoalPlanningInsight[] = goals.map((g) => {
    const projection = runGoalSipSimulation({
      monthlySIP: g.monthlyRequiredSIP,
      annualRate: 12,
      years: g.targetYears
    });
    const fundingGapPercent = Math.max(
      0,
      Math.min(100, Math.round(100 - g.currentFunding))
    );
    return {
      goalId: g.id,
      name: g.name,
      type: g.type,
      currentFunding: g.currentFunding,
      monthlyRequiredSIP: g.monthlyRequiredSIP,
      targetAmount: g.targetAmount,
      inflationAdjustedTarget: g.inflationAdjustedTarget,
      projectedCorpusAt12Pct: projection.futureValue,
      fundingGapPercent
    };
  });

  const totalMonthlyRequiredSip = insights.reduce((s, g) => s + g.monthlyRequiredSIP, 0);

  return {
    profile: {
      name: profile.name,
      investableSurplus: profile.investableSurplus,
      income: profile.income,
      expenses: profile.expenses
    },
    totalMonthlyRequiredSip,
    surplusAfterGoals: profile.investableSurplus - totalMonthlyRequiredSip,
    goals: insights
  };
}
