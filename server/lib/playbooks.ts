/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlaybookRecord {
  id: string;
  title: string;
  scenarioType: "rate_cycle" | "correction" | "tax_harvest";
  description: string;
  rules: string[];
  status: "active" | "draft";
  createdAt: string;
}

export function getActivePlaybooks(playbooks: PlaybookRecord[]): PlaybookRecord[] {
  return playbooks.filter((p) => p.status === "active");
}

export function formatPlaybooksForPrompt(playbooks: PlaybookRecord[]): string {
  const active = getActivePlaybooks(playbooks);
  if (active.length === 0) return "";
  return active
    .map(
      (p) =>
        `[PLAYBOOK INJECTED: ${p.title}]\n${p.rules.map((r) => `  - ${r}`).join("\n")}`
    )
    .join("\n\n");
}

export function selectPlaybooksForMessage(
  playbooks: PlaybookRecord[],
  message: string
): PlaybookRecord[] {
  const lower = message.toLowerCase();
  const active = getActivePlaybooks(playbooks);
  if (active.length === 0) return [];

  return active.filter((p) => {
    if (p.scenarioType === "rate_cycle") {
      return (
        lower.includes("rate") ||
        lower.includes("interest") ||
        lower.includes("sfb") ||
        lower.includes("fd") ||
        lower.includes("savings")
      );
    }
    if (p.scenarioType === "correction") {
      return (
        lower.includes("crash") ||
        lower.includes("market") ||
        lower.includes("sip") ||
        lower.includes("equity") ||
        lower.includes("correction")
      );
    }
    if (p.scenarioType === "tax_harvest") {
      return (
        lower.includes("tax") ||
        lower.includes("80c") ||
        lower.includes("elss") ||
        lower.includes("harvest") ||
        lower.includes("ltcg")
      );
    }
    return true;
  });
}
