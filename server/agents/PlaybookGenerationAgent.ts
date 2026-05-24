/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from "./BaseAgent.js";
import type { AgentExecutionContext, AgentResult } from "./types.js";
import { formatPlaybooksForPrompt, selectPlaybooksForMessage } from "../lib/playbooks.js";

export class PlaybookGenerationAgent extends BaseAgent {
  readonly name = "PlaybookGenerationAgent";

  async run(context: AgentExecutionContext): Promise<AgentResult> {
    const start = Date.now();
    try {
      const matched = selectPlaybooksForMessage(context.playbooks, context.message);
      const activeCount = context.playbooks.filter((p) => p.status === "active").length;
      const injected = formatPlaybooksForPrompt(matched.length > 0 ? matched : context.playbooks);

      const recommendations = matched.length
        ? matched.flatMap((p) => p.rules.slice(0, 2).map((r) => `[${p.title}] ${r}`))
        : ["No scenario-specific playbook matched; using global active playbooks in Ira prompt."];

      return this.buildResult({
        status: "completed",
        confidence: matched.length > 0 ? 90 : activeCount > 0 ? 82 : 60,
        summary:
          matched.length > 0
            ? `Selected ${matched.length} playbook(s) for this query (${matched.map((p) => p.title).join(", ")}).`
            : `${activeCount} active playbook(s) available; none strongly matched query keywords.`,
        recommendations,
        nextAction: "Inject playbook rules into Financial Summary Agent (Gemini)",
        executionTime: Date.now() - start,
        metadata: {
          matchedPlaybookIds: matched.map((p) => p.id),
          promptInjectionPreview: injected.slice(0, 500)
        }
      });
    } catch (err: unknown) {
      return this.buildResult({
        status: "failed",
        confidence: 55,
        summary: "Playbook selection failed.",
        recommendations: [],
        nextAction: "Continue with default active playbooks",
        executionTime: Date.now() - start,
        metadata: { error: err instanceof Error ? err.message : String(err) }
      });
    }
  }
}
