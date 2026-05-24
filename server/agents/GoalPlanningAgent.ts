/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import { analyzeGoalPlanning } from "../lib/goalPlanning.js";

export class GoalPlanningAgent extends BaseAgent {
  readonly name = "GoalPlanningAgent";

  async run(context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();
    try {
      const analysis = analyzeGoalPlanning(context.profile, context.goals);
      const underFunded = analysis.goals.filter((g) => g.fundingGapPercent > 30);
      const confidence =
        analysis.surplusAfterGoals >= 0
          ? Math.min(98, 88 + analysis.goals.length * 2)
          : Math.max(45, 70 - underFunded.length * 10);

      const recommendations = analysis.goals.map(
        (g) =>
          `${g.name}: ${g.currentFunding}% funded; maintain ₹${g.monthlyRequiredSIP.toLocaleString("en-IN")}/mo SIP (12% projection → ₹${g.projectedCorpusAt12Pct.toLocaleString("en-IN")}).`
      );

      if (analysis.surplusAfterGoals < 0) {
        recommendations.push(
          `Surplus shortfall of ₹${Math.abs(analysis.surplusAfterGoals).toLocaleString("en-IN")}/mo — rebalance expenses or extend horizons before adding goals.`
        );
      }

      return this.buildResult({
        status: "completed",
        confidence,
        summary: `Tracked ${analysis.goals.length} goals for ${analysis.profile.name}. Monthly SIP need ₹${analysis.totalMonthlyRequiredSip.toLocaleString("en-IN")} vs surplus ₹${analysis.profile.investableSurplus.toLocaleString("en-IN")}.`,
        recommendations,
        nextAction: underFunded.length > 0 ? "Review under-funded goals with planner" : "Proceed to scenario simulation",
        executionTime: Date.now() - start,
        metadata: { analysis }
      });
    } catch (err: unknown) {
      return this.buildResult({
        status: "failed",
        confidence: 0,
        summary: "Goal planning analysis could not complete.",
        recommendations: [],
        nextAction: "Continue pipeline with cached goal seed data",
        executionTime: Date.now() - start,
        metadata: { error: err instanceof Error ? err.message : String(err) }
      });
    }
  }
}
