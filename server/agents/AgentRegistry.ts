/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BaseAgent } from "./BaseAgent.js";

export class AgentRegistry {
  private readonly agents = new Map<string, BaseAgent>();

  register(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getOrdered(names: string[]): BaseAgent[] {
    return names
      .map((n) => this.agents.get(n))
      .filter((a): a is BaseAgent => Boolean(a));
  }

  listNames(): string[] {
    return Array.from(this.agents.keys());
  }
}
