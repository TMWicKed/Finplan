/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BehavioralClassification =
  | "panic_selling"
  | "concentration_risk"
  | "fomo_chasing"
  | "rational";

export interface BehavioralTendencyResult {
  classification: BehavioralClassification;
  nudge: string;
  score: number;
}

/** Keyword-based behavioral detection (unchanged business rules from api.ts). */
export function detectBehavioralTendency(message: string): BehavioralTendencyResult {
  const msgLower = message.toLowerCase();

  if (
    msgLower.includes("crash") ||
    msgLower.includes("fall") ||
    (msgLower.includes("stop") && msgLower.includes("sip")) ||
    msgLower.includes("sell everything") ||
    msgLower.includes("panic")
  ) {
    return {
      classification: "panic_selling",
      nudge:
        "Panic Trigger: Pausing SIPs during a 15% market drawdown locks in losses. Continuing SIPs leverages rupee-cost average mechanisms buy-in, boosting long term CAGR by 4.2%.",
      score: 85
    };
  }

  if (
    msgLower.includes("everything in gold") ||
    msgLower.includes("all my money in gold") ||
    msgLower.includes("gold only") ||
    msgLower.includes("everything in crypto") ||
    msgLower.includes("put all in")
  ) {
    return {
      classification: "concentration_risk",
      nudge:
        "Concentration Hazard: Single asset classes carry massive systemic volatility. Restricting allocation to maximum 10-15% protects compound growth runways.",
      score: 72
    };
  }

  if (
    msgLower.includes("next big") ||
    msgLower.includes("crypto multiplier") ||
    msgLower.includes("get rich") ||
    msgLower.includes("penny stock") ||
    msgLower.includes("leveraged")
  ) {
    return {
      classification: "fomo_chasing",
      nudge:
        "FOMO Risk: chasing speculative, unhedged assets without robust risk profiling often precipitates 40%+ portfolio drawdowns. Maintain stable asset index paths.",
      score: 64
    };
  }

  return {
    classification: "rational",
    nudge:
      "Balanced Behavior: Reasoning is backed by quantitative targets and standard asset rebalancing frameworks.",
    score: 10
  };
}
