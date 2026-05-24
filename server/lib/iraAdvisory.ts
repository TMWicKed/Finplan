/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "@google/genai";
import type { ClientProfile, FinancialGoal } from "../../src/types.js";
import type { AgentResult, IraAdvisoryPayload } from "../agents/types.js";
import { formatPlaybooksForPrompt } from "./playbooks.js";
import type { PlaybookRecord } from "./playbooks.js";
import { cleanAndRepairJSON, getGeminiClient, maskSensitiveFields } from "./geminiSupport.js";
import type { BehavioralTendencyResult } from "./behavioralFinance.js";

const GEMINI_REQUEST_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export interface IraAdvisoryInput {
  message: string;
  chatHistory: { sender: string; text: string }[];
  profile: ClientProfile;
  goals: FinancialGoal[];
  whatIfState?: Record<string, unknown> | null;
  playbooks: PlaybookRecord[];
  systemPromptCorrections: string[];
  behavioralTendency: BehavioralTendencyResult;
  agentBriefing: string;
}

function buildProfileContext(profile: ClientProfile, goals: FinancialGoal[], whatIfState?: Record<string, unknown> | null): string {
  return `
CLIENT PROFILE IN THE SYSTEM:
- Name: ${profile.name}
- Age: ${profile.age} (Married, 1 child aged 2)
- Location: ${profile.location}
- Income: ₹${profile.income}/month
- Expenses: ₹${profile.expenses}/month
- Investable Surplus: ₹${profile.investableSurplus}/month
- Current Savings: ₹${profile.currentSavings} stored inside SBI Savings Account (2.70% interest rate)
- Current Investments: ₹${profile.currentInvestments.sipAmount}/month in ${profile.currentInvestments.description}

GOAL GPS TRACKING:
${goals.map((g) => `- ${g.name} (${g.type}): Needed ₹${g.targetAmount} in ${g.targetYears} years. Funding state: ${g.currentFunding}%`).join("\n")}

WHAT-IF CONTEXT FROM PLANNER SLIDER:
${whatIfState ? JSON.stringify(whatIfState) : "No active what-if simulation is set by user yet."}

PPF details: 7.1% tax-exempt. Section 80C applies.
NPS details: Section 80C + 80CCD(1B) (additional 50K tax benefit).
ELSS details: 3 year minimum lock-in.
Banks interest: PSU (SBI 2.70%, BOB 2.75%), Private (Kotak 3.5-4.0%), SFB (Equitas 7%, AU SFB 7.25%).
`;
}

const IRA_SYSTEM_PROMPT = `
You are Ira, the premier AI financial planning assistant for "FinPlan GPS".
Always adhere to the following strictly:
- Always refer to the client's specific numbers (such as income, surplus, EMI) — never give generic copy-pasted rules.
- Speak in plain, reassuring, jargon-free language. If you mention a technical financial term (e.g., LTCG, PPF lock-in, SFBs), explain its mechanics immediately.
- Never make final binding financial decisions autonomously — always say "I recommend this route" or "consider this strategy".
- Thoroughly explain the mathematical reasoning behind each recommendation.
- When modeling life events (e.g. buying the ₹80L flat with ₹15L down payment, ₹57k/month EMI), highlight that the surplus will tumble from ₹55K to ₹21K. Discuss how this affects the Higher education goal funding (dropping 70% to 41%) and suggest a re-balancing plan (increasing high-return ELSS/mutual funds or using Small Finance Bank rates to build down payments faster).
- Propose a specific, highly mathematical "Rebalancing plan" if the client surplus falls short.
- If unsure or missing details, say so clearly — do not make up imaginary interest rates or statistics.
- Flag any custom recommendation that requires the human planner's final review.

You MUST respond strictly in a valid JSON format matching this schema:
{
  "intent": "goal_gap_analysis" | "savings_comparison" | "what_if_rebalancing" | "general_advice",
  "confidence": 0.0 to 1.0,
  "summary": "plain language summary analyzing their input and calculations",
  "recommendations": ["Core actionable item 1", "Core actionable item 2", ...],
  "impact": { "goal_id": "goal_daughter_edu", "before": 70, "after": 41 },
  "requires_human_approval": true/false (true if proposing critical investment switches or SGB/NPS asset allocations),
  "explanation": "rich step-by-step description with financial formula calculations"
}
`;

export async function generateIraAdvisoryResponse(
  input: IraAdvisoryInput
): Promise<{ payload: IraAdvisoryPayload; tokensIn: number; tokensOut: number }> {
  const activePlaybooksInjected = formatPlaybooksForPrompt(input.playbooks);
  const correctionsInjected = input.systemPromptCorrections
    .map((c, i) => `  Correction ${i + 1}: ${c}`)
    .join("\n");

  const profileContext = buildProfileContext(input.profile, input.goals, input.whatIfState);

  const formattedPrompt = `
SYSTEM INSTRUCTIONS:
${IRA_SYSTEM_PROMPT}

${activePlaybooksInjected ? `### WEALTH MANAGEMENT ADVISORY PLAYBOOKS (ACTIVE):\n${activePlaybooksInjected}\n` : ""}
${correctionsInjected ? `### CRITICAL LEARNING FEEDBACK CONSTRAINTS (ENFORCED):\n${correctionsInjected}\n` : ""}

### MULTI-AGENT ORCHESTRATION BRIEFING (verified deterministic engines):
${input.agentBriefing}

---
CONTEXT:
${profileContext}

---
CHAT HISTORY RECORD:
${JSON.stringify((input.chatHistory || []).slice(-6))}

---
CLIENT PROMPT:
"${input.message}"
`;

  const behavioral = input.behavioralTendency;

  const ai = getGeminiClient();
  if (!ai) {
    console.warn("[Ira] GEMINI_API_KEY missing — using offline simulated advisory response.");
    return buildOfflineFallback(input.message, formattedPrompt, behavioral);
  }

  try {
    const chatResponse = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["intent", "confidence", "summary", "recommendations", "requires_human_approval", "explanation"],
            properties: {
              intent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              impact: {
                type: Type.OBJECT,
                properties: {
                  goal_id: { type: Type.STRING },
                  before: { type: Type.NUMBER },
                  after: { type: Type.NUMBER }
                }
              },
              requires_human_approval: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING }
            }
          }
        }
      }),
      GEMINI_REQUEST_TIMEOUT_MS,
      "Gemini generateContent"
    );

  const parsedResponse = cleanAndRepairJSON(chatResponse.text || "{}");
  const maskSum = maskSensitiveFields(String(parsedResponse.summary || ""));
  const maskExp = maskSensitiveFields(String(parsedResponse.explanation || ""));
  const maskRecs = ((parsedResponse.recommendations as string[]) || []).map(
    (r) => maskSensitiveFields(r).maskedText
  );

  const tokensIn = Math.round(formattedPrompt.length / 4);
  const tokensOut = Math.round(
    (String(parsedResponse.summary || "").length + String(parsedResponse.explanation || "").length) / 4
  );

  const payload: IraAdvisoryPayload = {
    intent: String(parsedResponse.intent || "general_advice"),
    confidence: Number(parsedResponse.confidence ?? 0.9),
    summary: maskSum.maskedText,
    recommendations: maskRecs,
    impact: parsedResponse.impact as IraAdvisoryPayload["impact"],
    requires_human_approval: Boolean(parsedResponse.requires_human_approval),
    explanation: maskExp.maskedText,
    aiProvider: "Gemini 2.0 / 3.5 Flash",
    behavioralClassification: behavioral.classification,
    behavioralNudge: behavioral.nudge
  };

  return { payload, tokensIn, tokensOut };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Ira] Gemini API call failed:", message.slice(0, 300));
    if (message.includes("timed out") || message.includes("429") || message.includes("quota")) {
      console.warn("[Ira] Using offline advisory fallback after Gemini failure/timeout.");
      return buildOfflineFallback(input.message, formattedPrompt, behavioral);
    }
    throw err;
  }
}

function buildOfflineFallback(
  message: string,
  formattedPrompt: string,
  behavioral: BehavioralTendencyResult
): { payload: IraAdvisoryPayload; tokensIn: number; tokensOut: number } {
  let fallbackSummary = "I have simulated the impact of your financial situation.";
  let fallbackRecs = [
    "Switch current ₹5L holding to AU SFB or Equitas to extract 7.25% interest.",
    "Increase Equity SIP from ₹3,000 to ₹12,000/month after adjusting standard expenses."
  ];
  let fallbackExplanation =
    "Our calculations show that by maintaining savings at SBI (2.70%), you lose interest gain. High-yield Small Finance banks let you secure ~7.25%, elevating ₹5L to ₹7.09L in 5 years instead of ₹5.71L.";
  let intent = "general_advice";

  if (
    message.toLowerCase().includes("house") ||
    message.toLowerCase().includes("home") ||
    message.toLowerCase().includes("purchas") ||
    message.toLowerCase().includes("flat")
  ) {
    intent = "what_if_rebalancing";
    fallbackSummary =
      "Buying the ₹80L home drastically reduces your monthly investable surplus from ₹55,000 to ₹21,000 due to the ₹56,730 home loan EMI.";
    fallbackRecs = [
      "Increase Daughter's education SIP rate using ELSS tax savings to plug the gap.",
      "Restructure 80C tax deductions via Section 24B up to ₹2 Lakhs limit on home interest.",
      "Allocate 10% of current savings toward Sovereign Gold Bonds for stable 2.5% RBI coupon gains."
    ];
    fallbackExplanation =
      "The EMI of ₹56,730 consumes the bulk of your surplus. By utilizing Section 24B (Rs 2L tax write-off on home loan interest) and saving on rent, we must aggressively rebalance.";
  }

  const maskSum = maskSensitiveFields(fallbackSummary);
  const maskExp = maskSensitiveFields(fallbackExplanation);
  const maskRecs = fallbackRecs.map((r) => maskSensitiveFields(r).maskedText);

  const tokensIn = Math.round(formattedPrompt.length / 4);
  const tokensOut = Math.round((fallbackSummary.length + fallbackExplanation.length) / 4);

  return {
    payload: {
      intent,
      confidence: 0.95,
      summary: maskSum.maskedText,
      recommendations: maskRecs,
      impact: { goal_id: "goal_daughter_edu", before: 70, after: 41 },
      requires_human_approval: true,
      explanation: maskExp.maskedText,
      aiProvider: "Simulated Model Engine",
      behavioralClassification: behavioral.classification,
      behavioralNudge: behavioral.nudge
    },
    tokensIn,
    tokensOut
  };
}

export function buildAgentBriefing(priorResults: Record<string, AgentResult>): string {
  return Object.values(priorResults)
    .filter((r) => r.agentName !== "FinancialSummaryAgent")
    .map(
      (r) =>
        `[${r.agentName}] confidence=${r.confidence} status=${r.status}\nSummary: ${r.summary}\nRecommendations: ${r.recommendations.join("; ")}`
    )
    .join("\n\n");
}
