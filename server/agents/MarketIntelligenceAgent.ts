/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import { getBankInterestMatrix } from "../data/marketRateService.js";
import { MAJOR_BANK_CATALOG } from "../data/majorBankCatalog.js";

export class MarketIntelligenceAgent extends BaseAgent {
  readonly name = "MarketIntelligenceAgent";

  async run(_context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();
    const matrix = getBankInterestMatrix();
    const latestRates = matrix.map((r) => ({
      bankName: r.bankName,
      fdRate: r.fdRate,
      savingsRate: r.savingsRate
    }));

    const topFd = [...latestRates].sort((a, b) => b.fdRate - a.fdRate)[0];
    const summary = `Major bank catalog (${MAJOR_BANK_CATALOG.length} institutions). Top indicative FD: ${topFd?.bankName ?? "N/A"} at ${topFd?.fdRate ?? 0}%. Confirm live rates on official bank sites.`;

    return this.buildResult({
      status: "completed",
      confidence: 85,
      summary,
      recommendations: latestRates.slice(0, 3).map(
        (r) => `${r.bankName}: savings ${r.savingsRate}%, FD ${r.fdRate}% (indicative)`
      ),
      nextAction: "Feed rates into goal and summary agents",
      executionTime: Date.now() - start,
      metadata: { latestRates, marketPrices: [] }
    });
  }
}
