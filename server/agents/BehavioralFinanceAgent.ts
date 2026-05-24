/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import { detectBehavioralTendency } from "../lib/behavioralFinance.js";

export class BehavioralFinanceAgent extends BaseAgent {
  readonly name = "BehavioralFinanceAgent";

  async run(context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();
    try {
      const tendency = detectBehavioralTendency(context.message);
      const isEmotional = tendency.classification !== "rational";
      const confidence = isEmotional ? Math.max(60, tendency.score) : 94;

      return this.buildResult({
        status: "completed",
        confidence,
        summary: isEmotional
          ? `Detected ${tendency.classification.replace("_", " ")} bias (risk score ${tendency.score}).`
          : "Client message shows rational, goal-aligned framing.",
        recommendations: isEmotional ? [tendency.nudge] : ["Continue standard advisory path."],
        nextAction: isEmotional ? "Surface behavioral nudge in final Ira response" : "Proceed to playbook selection",
        executionTime: Date.now() - start,
        metadata: {
          tendency,
          shouldRecordAlert: isEmotional
        }
      });
    } catch (err: unknown) {
      return this.buildResult({
        status: "failed",
        confidence: 50,
        summary: "Behavioral classification unavailable.",
        recommendations: [],
        nextAction: "Assume rational default",
        executionTime: Date.now() - start,
        metadata: { error: err instanceof Error ? err.message : String(err) }
      });
    }
  }
}
