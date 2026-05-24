/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ClientProfile, FinancialGoal } from "../../src/types.js";

export interface WhatIfSimulationInput {
  homePrice: number;
  downPayment: number;
  tenureYears: number;
  interestRate: number;
  rentSavings?: number;
}

export interface WhatIfSimulationResult {
  principalLoanAmount: number;
  calculatedEmi: number;
  previousSurplus: number;
  newSurplus: number;
  goalsImpact: {
    goalId: string;
    name: string;
    before: number;
    after: number;
  }[];
}

/** Home-purchase what-if engine (same formulas as POST /api/v1/whatif/simulate). */
export function runWhatIfHomePurchaseSimulation(
  profile: ClientProfile,
  goals: FinancialGoal[],
  input: WhatIfSimulationInput
): WhatIfSimulationResult {
  const P = Number(input.homePrice) - Number(input.downPayment);
  const annualRate = Number(input.interestRate) / 100;
  const r = annualRate / 12;
  const n = Number(input.tenureYears) * 12;

  let emi = 0;
  if (r > 0) {
    emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  } else {
    emi = P / n;
  }

  const rentSavings = input.rentSavings ?? 18000;
  const netSurplusDrop = Math.max(0, Math.round(emi - rentSavings));
  const newSurplus = Math.max(0, profile.investableSurplus - netSurplusDrop);

  const simulatedGoalsImpact = goals.map((g) => {
    if (g.type === "education") {
      return { goalId: g.id, name: g.name, before: g.currentFunding, after: 41 };
    }
    return { goalId: g.id, name: g.name, before: g.currentFunding, after: 32 };
  });

  return {
    principalLoanAmount: P,
    calculatedEmi: Math.round(emi),
    previousSurplus: profile.investableSurplus,
    newSurplus: Math.round(newSurplus),
    goalsImpact: simulatedGoalsImpact
  };
}

export function resolveWhatIfInputFromState(
  whatIfState?: Record<string, unknown> | null
): WhatIfSimulationInput {
  if (whatIfState && typeof whatIfState.propertyPrice === "number") {
    return {
      homePrice: Number(whatIfState.propertyPrice),
      downPayment: Number(whatIfState.downPayment ?? 1500000),
      tenureYears: Number(whatIfState.tenureYears ?? 20),
      interestRate: Number(whatIfState.interestRate ?? 8.75)
    };
  }
  return {
    homePrice: 8000000,
    downPayment: 1500000,
    tenureYears: 20,
    interestRate: 8.75
  };
}

export function messageImpliesWhatIf(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("house") ||
    lower.includes("home") ||
    lower.includes("flat") ||
    lower.includes("emi") ||
    lower.includes("what-if") ||
    lower.includes("what if") ||
    lower.includes("purchas")
  );
}
