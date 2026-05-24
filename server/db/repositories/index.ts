/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDb } from "../client.js";
import { AgentTraceRepository } from "./agentTraceRepository.js";
import { AgentEvaluationRepository } from "./agentEvaluationRepository.js";
import { FeedbackRepository } from "./feedbackRepository.js";

export { AgentTraceRepository } from "./agentTraceRepository.js";
export { AgentEvaluationRepository } from "./agentEvaluationRepository.js";
export { FeedbackRepository } from "./feedbackRepository.js";

export interface AgentPersistenceRepositories {
  traces: AgentTraceRepository;
  evaluations: AgentEvaluationRepository;
  feedback: FeedbackRepository;
}

export function getAgentPersistenceRepositories(): AgentPersistenceRepositories | null {
  const db = getDb();
  if (!db) {
    return null;
  }

  return {
    traces: new AgentTraceRepository(db),
    evaluations: new AgentEvaluationRepository(db),
    feedback: new FeedbackRepository(db)
  };
}

export { isDatabaseConfigured } from "../client.js";
