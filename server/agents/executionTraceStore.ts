/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentExecutionTrace } from "./types.js";

const traces = new Map<string, AgentExecutionTrace>();

export function storeExecutionTrace(trace: AgentExecutionTrace): void {
  traces.set(trace.executionId, trace);
  if (traces.size > 100) {
    const oldest = traces.keys().next().value;
    if (oldest) traces.delete(oldest);
  }
}

export function getExecutionTrace(executionId: string): AgentExecutionTrace | undefined {
  return traces.get(executionId);
}

export function listRecentTraces(limit = 20): AgentExecutionTrace[] {
  return Array.from(traces.values())
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))
    .slice(0, limit);
}
