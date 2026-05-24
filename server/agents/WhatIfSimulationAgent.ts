/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import {
  messageImpliesWhatIf,
  resolveWhatIfInputFromState,
  runWhatIfHomePurchaseSimulation
} from "../lib/whatIfSimulation.js";

export class WhatIfSimulationAgent extends BaseAgent {
  readonly name = "WhatIfSimulationAgent";

  async run(context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();
    const shouldRun =
      messageImpliesWhatIf(context.message) || Boolean(context.whatIfState);

    if (!shouldRun) {
      return this.buildResult({
        status: "skipped",
        confidence: 90,
        summary: "No home-purchase what-if scenario required for this query.",
        recommendations: ["Activate What-If sliders or mention home/EMI to run simulation."],
        nextAction: "Skip to behavioral analysis",
        executionTime: Date.now() - start,
        metadata: { skipped: true }
      });
    }

    try {
      const input = resolveWhatIfInputFromState(context.whatIfState);
      const simulation = runWhatIfHomePurchaseSimulation(
        context.profile,
        context.goals,
        input
      );

      const surplusDrop = simulation.previousSurplus - simulation.newSurplus;
      const confidence = simulation.newSurplus > 0 ? 92 : 68;

      return this.buildResult({
        status: "completed",
        confidence,
        summary: `EMI ₹${simulation.calculatedEmi.toLocaleString("en-IN")}/mo on ₹${simulation.principalLoanAmount.toLocaleString("en-IN")} loan; surplus drops from ₹${simulation.previousSurplus.toLocaleString("en-IN")} to ₹${simulation.newSurplus.toLocaleString("en-IN")} (−₹${surplusDrop.toLocaleString("en-IN")}).`,
        recommendations: simulation.goalsImpact.map(
          (g) => `${g.name} funding: ${g.before}% → ${g.after}% after EMI commitment.`
        ),
        nextAction: "Feed simulation into Ira summary for rebalancing plan",
        executionTime: Date.now() - start,
        metadata: { simulation, input }
      });
    } catch (err: unknown) {
      return this.buildResult({
        status: "failed",
        confidence: 0,
        summary: "What-if simulation engine failed.",
        recommendations: [],
        nextAction: "Continue without scenario overlay",
        executionTime: Date.now() - start,
        metadata: { error: err instanceof Error ? err.message : String(err) }
      });
    }
  }
}
