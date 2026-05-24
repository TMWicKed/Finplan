/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentExecutionContext, AgentResult } from "./types.js";

export abstract class BaseAgent {
  abstract readonly name: string;

  abstract run(context: AgentExecutionContext): Promise<AgentResult>;

  protected buildResult(partial: Omit<AgentResult, "agentName" | "executionTime"> & { executionTime?: number }): AgentResult {
    return {
      agentName: this.name,
      executionTime: partial.executionTime ?? 0,
      ...partial
    };
  }
}
