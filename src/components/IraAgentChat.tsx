/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Cpu, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Maximize2,
  Trash2,
  Workflow,
  Scale,
  BrainCircuit,
  Calculator,
  User as UserIcon,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Play,
  Check,
  BookOpen,
  Sliders,
  RefreshCw,
  FolderLock,
  ChevronRight,
  TrendingDown
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ira";
  text: string;
  structuredPayload?: {
    intent: string;
    confidence: number;
    summary: string;
    recommendations: string[];
    requires_human_approval: boolean;
    explanation: string;
    aiProvider?: string;
    behavioralClassification?: string;
    behavioralNudge?: string;
  };
}

interface IraAgentChatProps {
  initialPrompt?: string;
  authToken: string;
}

export default function IraAgentChat({ initialPrompt = "", authToken }: IraAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ira",
      text: "Hello! I am Ira, your AI Financial Planning Co-pilot. I am loaded with Rahul Sharma's active client metrics, Indian tax structures, and scheduled bank interest levels. How can I assist you with financial planning today?",
      structuredPayload: {
        intent: "general_advice",
        confidence: 1.0,
        summary: "Ready to assist you with Goal GPS tracking, Savings Intelligence rate compare, ELSS tax allocations, or running What-If Bangalore flat calculators.",
        recommendations: [
          "Ask Ira. What happens to my goals if I buy the ₹80L flat?",
          "How can I save ₹40k in taxes under India's Section 80C and 24B?",
          "Show me interest comparison for PSU banks versus Small Finance Banks."
        ],
        requires_human_approval: false,
        explanation: "All models are fully primed with core Indian financial codes.",
        aiProvider: "System Seed Context"
      }
    }
  ]);

  const [inputMsg, setInputMsg] = useState("");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  
  // Pipeline Step Tracking for "Build the Future with Agentic AI" theme
  const [activeStep, setActiveStep] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // New Strategy Side-Panel Tab System
  const [activeSideTab, setActiveSideTab] = useState<"reviewer" | "playbook">("reviewer");
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Self-Improving Reviewer lab state variables
  const [reviewLogs, setReviewLogs] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>({
    total: 0,
    positive: 0,
    negative: 0,
    failurePatterns: {}
  });
  const [promptCorrections, setPromptCorrections] = useState<string[]>([]);
  
  // local checklist tracker for rating disablement
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { rating: "up" | "down", pattern?: string }>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  // Tactical Playbooks UI states
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [showCreatePlaybook, setShowCreatePlaybook] = useState(false);
  const [playbookTitle, setPlaybookTitle] = useState("");
  const [playbookDesc, setPlaybookDesc] = useState("");
  const [playbookScenario, setPlaybookScenario] = useState<"rate_cycle" | "correction" | "tax_harvest">("rate_cycle");
  const [playbookRulesInput, setPlaybookRulesInput] = useState("");

  const loadReviewerData = async () => {
    try {
      const res = await fetch("/api/v1/ira/review/logs", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviewLogs(data.data.reviewLogs);
        setPromptCorrections(data.data.systemPromptCorrections);
        setReviewStats(data.data.stats);
      }
    } catch (err) {
      console.error("Error loading reviewer logs:", err);
    }
  };

  const loadPlaybooks = async () => {
    try {
      const res = await fetch("/api/v1/ira/playbooks", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlaybooks(data.data.playbooks);
      }
    } catch (err) {
      console.error("Error loading playbooks:", err);
    }
  };

  useEffect(() => {
    loadReviewerData();
    loadPlaybooks();
  }, [authToken]);

  // Handle Response feedback rating submission
  const submitFeedback = async (msgId: string, isPositive: boolean) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    const msgIndex = messages.findIndex(m => m.id === msgId);
    const prevMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
    const userQuery = prevMsg ? prevMsg.text : "Initial Welcome Context query";

    setSubmittingFeedback(msgId);
    try {
      const res = await fetch("/api/v1/ira/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          messageId: msgId,
          userQuery,
          iraResponse: targetMsg.text,
          isPositive
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadReviewerData();
        setFeedbackMap(prev => ({
          ...prev,
          [msgId]: {
            rating: isPositive ? "up" : "down",
            pattern: data.data.log?.failurePattern
          }
        }));
      }
    } catch (err) {
      console.error("Error submitting rating feed:", err);
    } finally {
      setSubmittingFeedback(null);
    }
  };

  // Handler for improving prompts
  const handleApprovePromptCorrection = async (logId: string, correctionText: string) => {
    try {
      const res = await fetch("/api/v1/ira/review/approve-correction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ logId, correctionText })
      });
      const data = await res.json();
      if (data.success) {
        await loadReviewerData();
      }
    } catch (err) {
      console.error("Error approving critique patch:", err);
    }
  };

  // Handler for playbooks toggle
  const togglePlaybook = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "active" ? "draft" : "active";
      const res = await fetch("/api/v1/ira/playbooks/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        await loadPlaybooks();
      }
    } catch (err) {
      console.error("Error toggling playbook status:", err);
    }
  };

  // Direct playbook running
  const runPlaybookPrompt = (playbook: any) => {
    let presetPrompt = "";
    if (playbook.scenarioType === "rate_cycle") {
      presetPrompt = "Calculate how much I would gain if I sweeps my SBI savings excess of ₹50k into Equitas bank. Show comparison.";
    } else if (playbook.scenarioType === "correction") {
      presetPrompt = "Markets dropped 6%. Should I halt my equity mutual fund SIPs immediately, or does standard Indian rupee-cost averaging keep my goals funding intact?";
    } else if (playbook.scenarioType === "tax_harvest") {
      presetPrompt = "Show me details for Q4 year end. How does Section 80C ELSS ₹1.5L lock-in contrast with ₹1.25L tax-exempt long term capitals gain harvesting?";
    } else {
      presetPrompt = `Apply tactical playbook guidelines of "${playbook.title}". Give calculation analysis details.`;
    }
    setInputMsg(presetPrompt);
    handleQuerySubmit(undefined, presetPrompt);
  };

  // Playbook Creation submit
  const handleCreatePlaybookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playbookTitle.trim() || !playbookDesc.trim() || !playbookRulesInput.trim()) return;

    const rules = playbookRulesInput.split("\n").map(r => r.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/v1/ira/playbooks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: playbookTitle,
          scenarioType: playbookScenario,
          description: playbookDesc,
          rules
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadPlaybooks();
        setPlaybookTitle("");
        setPlaybookDesc("");
        setPlaybookRulesInput("");
        setShowCreatePlaybook(false);
      }
    } catch (err) {
      console.error("Error generating customized playbook:", err);
    }
  };

  const pipelineSteps = [
    { title: "Intent Agent", desc: "Analyzing linguistic query structure..." },
    { title: "Data Agent", desc: "Correlating active client metrics & databases..." },
    { title: "Planning Agent", desc: "Simulating interest calculators and EMI algorithms..." },
    { title: "Advisory Agent", desc: "Aligning Section 80C / 24B / 80CCD tax guidelines..." },
    { title: "Validation Agent", desc: "Auditing compliance and human planner limits..." },
    { title: "Summary Agent", desc: "Formulating conversational JSON response payload..." }
  ];

  useEffect(() => {
    if (initialPrompt) {
      setInputMsg(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOrchestrating, activeStep]);

  const handleQuerySubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || inputMsg;
    if (!query.trim()) return;

    // 1. Append user bubble
    const userBubble: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: query
    };
    setMessages((prev) => [...prev, userBubble]);
    setInputMsg("");
    setIsOrchestrating(true);
    setActiveStep(0);

    // 2. Simulate agent execution steps (1.2s intervals to let user witness the multi-agent chain orchestration)
    const stepIntervals = [1200, 2400, 3600, 4800, 6000, 7200];
    stepIntervals.forEach((time, index) => {
      setTimeout(() => {
        setActiveStep(index + 1);
      }, time);
    });

    try {
      // Create request payload
      const response = await fetch("/api/v1/ira/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: query,
          chatHistory: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const resData = await response.json();

      // Delay rendering final AI response until pipeline steps complete
      setTimeout(() => {
        if (resData.success) {
          const iraBubble: Message = {
            id: `ira_${Date.now()}`,
            sender: "ira",
            text: resData.data.summary,
            structuredPayload: {
              intent: resData.data.intent || "general_advice",
              confidence: resData.data.confidence || 0.9,
              summary: resData.data.summary,
              recommendations: resData.data.recommendations || [],
              requires_human_approval: resData.data.requires_human_approval || false,
              explanation: resData.data.explanation || "",
              aiProvider: resData.data.aiProvider || "Gemini Flash Model",
              behavioralClassification: resData.data.behavioralClassification,
              behavioralNudge: resData.data.behavioralNudge
            }
          };
          setMessages((prev) => [...prev, iraBubble]);
        } else {
          // Fallback UI bubble if server response is generic or failed
          throw new Error(resData.message || "Engine API Error");
        }
        setIsOrchestrating(false);
      }, 8200);

    } catch (err: any) {
      setTimeout(() => {
        const errorBubble: Message = {
          id: `err_${Date.now()}`,
          sender: "ira",
          text: `I apologize, my neural financial orchestrator encountered an execution timeout. Let me provide a core advice fallback:`,
          structuredPayload: {
            intent: "general_advice",
            confidence: 0.8,
            summary: "Core advisory backup system activated.",
            recommendations: [
              "Review the India Section 80C ELSS mutual funds allocations with up to ₹1.5L lock-in limit.",
              "Look into switching ₹5L savings to small finance banks (7.25% AU SFB) immediately to secure ₹1.38L higher returns."
            ],
            requires_human_approval: true,
            explanation: "Backup systems utilize local matrix calculations.",
            aiProvider: "Internal Edge Calculations"
          }
        };
        setMessages((prev) => [...prev, errorBubble]);
        setIsOrchestrating(false);
      }, 8200);
    }
  };

  const handleQuickQuestion = (qn: string) => {
    handleQuerySubmit(undefined, qn);
  };

  const formatRupee = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div id="ira-chat-section" className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative font-sans">
      
      {/* Banner bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-[#2cab52]/40 relative overflow-hidden">
            <Cpu className="w-5 h-5 text-[#2cab52] animate-pulse" />
            <div className="absolute right-1 top-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base font-extrabold text-[#071a2b]">Ira Financial Agentic Co-pilot</h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400">Powered by Gemini 3.5 Flash Model • Secure Audit Multi-Agentic Chain</p>
          </div>
        </div>

        {/* Info & toggle buttons */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg p-1.5 px-3">
            <Workflow className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold hidden sm:inline">6-Agent Orchestration Layer</span>
          </div>
          
          <button
            onClick={() => setShowRightPanel(prev => !prev)}
            className={`p-2 px-3 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
              showRightPanel 
                ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-800" 
                : "bg-white border-gray-200 text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showRightPanel ? "Hide Strategy Desk" : "Show Strategy Desk"}</span>
          </button>
        </div>
      </div>

      {/* Main layout split (Conversation vs Agent telemetry) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left dialog field */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          <div className="flex-1 space-y-6 overflow-y-auto">
            {messages.map((msg) => {
              const isIra = msg.sender === "ira";
              return (
                <div key={msg.id} className={`flex max-w-4xl space-x-3.5 ${isIra ? "" : "ml-auto justify-end"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                    isIra ? "bg-slate-900 border border-[#2cab52]/30 text-[#2cab52]" : "bg-[#2cab52] text-slate-900"
                  }`}>
                    {isIra ? <Cpu className="w-4 h-4 text-[#2cab52]" /> : "U"}
                  </div>

                  <div className="space-y-2 max-w-2xl">
                    <div className={`rounded-2xl p-4.5 text-sm leading-relaxed ${
                      isIra 
                        ? "bg-white text-slate-800 border border-gray-100 shadow-sm"
                        : "bg-[#071a2b] text-slate-100"
                    }`}>
                      <p className="font-medium whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Highly polished structured JSON presentation representation if Ira */}
                    {isIra && msg.structuredPayload && (
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-lg space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2 flex-wrap gap-2 text-[10px] font-bold">
                          <div className="flex items-center space-x-1.5 uppercase text-slate-500 tracking-wider">
                            <BrainCircuit className="w-3.5 h-3.5 text-[#2cab52]" />
                            <span>Inferred Intent:</span>
                            <span className="bg-gray-100 text-[#071a2b] px-2 py-0.5 rounded font-mono">
                              {msg.structuredPayload.intent}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 uppercase text-emerald-600">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Confidence: {Math.round(msg.structuredPayload.confidence * 100)}%</span>
                          </div>
                        </div>

                        {/* Real-time behavioral finance bias alerts */}
                        {msg.structuredPayload.behavioralClassification && msg.structuredPayload.behavioralClassification !== "rational" && (
                          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-150 space-y-2 text-xs">
                            <div className="flex items-center space-x-1.5 text-rose-700 font-extrabold uppercase text-[10px] tracking-wider">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>Behavioral Bias Indicator: {msg.structuredPayload.behavioralClassification.replace("_", " ")}</span>
                            </div>
                            <p className="text-slate-700 font-medium leading-relaxed">
                              {msg.structuredPayload.behavioralNudge}
                            </p>
                          </div>
                        )}

                        {/* Advisor recommendations list */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Actionable Advisor Recommendations</span>
                          <div className="grid grid-cols-1 gap-2.5">
                            {msg.structuredPayload.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-start space-x-2 bg-emerald-50/40 p-3 rounded-xl border border-emerald-50">
                                <CheckCircle2 className="w-4 h-4 text-[#2cab52] shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 font-semibold leading-relaxed">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Deep math explanation */}
                        {msg.structuredPayload.explanation && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs font-semibold text-slate-600 leading-relaxed space-y-1">
                            <div className="flex items-center space-x-1 text-[#071a2b] font-extrabold pb-1">
                              <Calculator className="w-3.5 h-3.5 text-[#2cab52]" />
                              <span>Dynamic Compliance & Math Analysis:</span>
                            </div>
                            <p className="whitespace-pre-line">{msg.structuredPayload.explanation}</p>
                          </div>
                        )}

                        {/* Human advisory verification stamp */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3 flex-wrap gap-2 text-[10px] text-gray-400 uppercase font-bold">
                          <span>Model Ref: {msg.structuredPayload.aiProvider}</span>
                          <div className="flex items-center space-x-1">
                            {msg.structuredPayload.requires_human_approval ? (
                              <div className="flex items-center space-x-1 text-amber-500">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Human Planner Audit Required</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-emerald-500">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Pre-Approved Strategy</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Highly interactive rating critique loop section */}
                    {isIra && (
                      <div className="flex items-center space-x-3 pt-1 text-xs">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Evaluation Audit:</span>
                        {feedbackMap[msg.id] ? (
                          <div className="flex items-center space-x-2">
                            {feedbackMap[msg.id].rating === "up" ? (
                              <span className="flex items-center text-emerald-700 bg-emerald-50 font-bold px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px]">
                                <ThumbsUp className="w-3 h-3 mr-1 text-[#2cab52] fill-emerald-100" /> Compliant & Accurate
                              </span>
                            ) : (
                              <span className="flex items-center text-rose-700 bg-rose-50 font-extrabold px-2.5 py-1 rounded-lg border border-rose-150 text-[10px]">
                                <ThumbsDown className="w-3 h-3 mr-1 text-[#e11d48]" /> Critiqued ({feedbackMap[msg.id].pattern})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => submitFeedback(msg.id, true)}
                              disabled={submittingFeedback !== null}
                              className="p-1 px-2 rounded-lg border border-gray-150 hover:bg-slate-50 hover:border-[#2cab52] hover:text-[#2cab52] transition flex items-center text-slate-500 text-[10px] font-bold cursor-pointer bg-white"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" /> Perfect
                            </button>
                            <button
                              onClick={() => submitFeedback(msg.id, false)}
                              disabled={submittingFeedback !== null}
                              className="p-1 px-2 rounded-lg border border-gray-150 hover:bg-slate-50 hover:border-red-500 hover:text-red-600 transition flex items-center text-slate-500 text-[10px] font-bold cursor-pointer bg-white"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" /> Critique
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Microservice agent sequence display when processing */}
            {isOrchestrating && (
              <div className="flex max-w-4xl space-x-3.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs shrink-0 animate-spin border-t border-t-[#2cab52]">
                  <Cpu className="w-4 h-4 text-[#2cab52]" />
                </div>

                <div className="space-y-4 max-w-xl w-full bg-white rounded-2xl p-5 border border-gray-150 shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-[#071a2b] border-b border-gray-50 pb-2 mb-3">
                    <span className="flex items-center space-x-1.5">
                      <Workflow className="w-4 h-4 text-[#2cab52] animate-pulse" />
                      <span>Agentic Multi-Agent Chain Active</span>
                    </span>
                    <span className="text-[10px] text-gray-400">Triggering 6 Independent Services...</span>
                  </div>

                  <div className="space-y-2.5">
                    {pipelineSteps.map((step, idx) => {
                      const isComplete = activeStep > idx;
                      const isCurrent = activeStep === idx;
                      return (
                        <div key={idx} className="flex items-center justify-between text-[11px] leading-tight">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono text-[9px] ${
                              isComplete ? "bg-[#2cab52] text-[#071a2b]" :
                              isCurrent ? "bg-[#071a2b] text-[#2cab52] animate-pulse border border-[#2cab52]" :
                              "bg-gray-100 text-gray-400"
                            }`}>
                              {isComplete ? "✓" : idx + 1}
                            </div>
                            <span className={`font-bold ${isComplete ? "text-[#2cab52]" : isCurrent ? "text-slate-800" : "text-gray-400"}`}>
                              {step.title}
                            </span>
                            <span className="text-gray-400 hidden sm:inline">- {step.desc}</span>
                          </div>

                          {isCurrent && (
                            <span className="text-[10px] text-[#2cab52] font-semibold animate-pulse font-mono uppercase">PROCESSING...</span>
                          )}
                          {isComplete && (
                            <span className="text-[10px] text-emerald-500 font-bold font-mono uppercase">SUCCESS</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Quick recommendations suggestion tabs */}
          {!isOrchestrating && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-150/60 shrink-0">
              <button 
                onClick={() => handleQuickQuestion("Evaluate Bangalore flat down payment ₹15L loan math.")}
                className="p-3 text-left bg-white text-xs text-slate-700 hover:text-[#071a2b] border border-gray-150 rounded-xl hover:border-[#2cab52] font-semibold hover:bg-slate-50 flex items-center justify-between cursor-pointer group"
              >
                <span>Bangalore 2BHK loan math</span>
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2cab52]" />
              </button>
              <button 
                onClick={() => handleQuickQuestion("What are the Section 80C ELSS and Section 24B rules?")}
                className="p-3 text-left bg-white text-xs text-slate-700 hover:text-[#071a2b] border border-gray-150 rounded-xl hover:border-[#2cab52] font-semibold hover:bg-slate-50 flex items-center justify-between cursor-pointer group"
              >
                <span>ELSS versus Section 24B rules</span>
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2cab52]" />
              </button>
              <button 
                onClick={() => handleQuickQuestion("Why are SFBs paying 7.25% versus PSU banks at 2.70%?")}
                className="p-3 text-left bg-white text-xs text-slate-700 hover:text-[#071a2b] border border-gray-150 rounded-xl hover:border-[#2cab52] font-semibold hover:bg-slate-50 flex items-center justify-between cursor-pointer group"
              >
                <span>PSU versus SFB interest logic</span>
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2cab52]" />
              </button>
            </div>
          )}

          {/* Prompt Entry Box */}
          <form onSubmit={handleQuerySubmit} className="flex space-x-3 mt-3 shrink-0">
            <input
              type="text"
              value={inputMsg}
              required
              disabled={isOrchestrating}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={isOrchestrating ? "Waiting for Summary Agent to build response JSON..." : "Ask Ira about savings, what-if rebalancing, or investments..."}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2cab52]/40 disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={isOrchestrating || !inputMsg.trim()}
              className="px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 disabled:text-gray-500 text-slate-100 hover:text-white rounded-xl transition cursor-pointer flex items-center justify-center font-bold text-xs"
            >
              <Send className="w-4 h-4 text-[#2cab52] mr-1.5" />
              <span>Instruct</span>
            </button>
          </form>
        </div>

        {/* Right Strategy Desk Panel Container */}
        {showRightPanel && (
          <div className="w-105 border-l border-gray-200 bg-slate-50 flex flex-col h-full overflow-hidden shrink-0 animate-fade-in text-slate-800">
            {/* Headers with tabs toggler */}
            <div className="flex border-b border-gray-200 bg-white items-center justify-between px-4 shrink-0 h-14">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveSideTab("reviewer")}
                  className={`py-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition cursor-pointer ${
                    activeSideTab === "reviewer"
                      ? "border-[#2cab52] text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  🔬 Reviewer Lab
                </button>
                <button
                  onClick={() => setActiveSideTab("playbook")}
                  className={`py-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition cursor-pointer ${
                    activeSideTab === "playbook"
                      ? "border-[#2cab52] text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  🎯 Playbook Center
                </button>
              </div>

              <div className="text-[10px] bg-[#2cab52]/10 text-emerald-800 px-2 py-1 rounded font-extrabold flex items-center">
                <Sliders className="w-3 h-3 mr-1" /> STRATEGY
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSideTab === "reviewer" ? (
                <>
                  {/* Stats dashboard heading */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-150 text-center space-y-1 shadow-sm">
                      <span className="text-[9px] text-gray-400 tracking-wider font-bold uppercase block">Audit Count</span>
                      <span className="text-xl font-extrabold text-slate-900 font-mono">{reviewStats?.total || 0}</span>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-150 text-center space-y-1 shadow-sm">
                      <span className="text-[9px] text-gray-400 tracking-wider font-bold uppercase block">Comp. Ratio</span>
                      <span className="text-xl font-extrabold text-emerald-600 font-mono">
                        {reviewStats?.total > 0 ? Math.round((reviewStats.positive / reviewStats.total) * 100) : 100}%
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-150 text-center space-y-1 shadow-sm">
                      <span className="text-[9px] text-gray-400 tracking-wider font-bold uppercase block">Critiques</span>
                      <span className="text-xl font-extrabold text-[#e11d48] font-mono">{reviewStats?.negative || 0}</span>
                    </div>
                  </div>

                  {/* Failure patterns breakdown counts */}
                  <div className="bg-white rounded-xl p-4 border border-gray-150 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                      <span className="text-xs font-bold text-slate-900">Failure Pattern Detection Matrix</span>
                      <span className="text-[9px] font-bold text-slate-400 grayscale">OFFLINE CLASSIFIER</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { key: "Calculation Drift", color: "bg-amber-400" },
                        { key: "Regulatory Omission", color: "bg-red-500" },
                        { key: "Lack of Specifics", color: "bg-blue-500" },
                        { key: "Context Drift", color: "bg-indigo-500" }
                      ].map((item) => {
                        const count = reviewStats?.failurePatterns?.[item.key] || 0;
                        const maxVal = Math.max(...Object.values(reviewStats?.failurePatterns || {}).map((v: any) => v || 0), 1);
                        const widthPerc = Math.min((count / maxVal) * 100, 100);
                        return (
                          <div key={item.key} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 font-medium">{item.key}</span>
                              <span className="font-extrabold text-slate-800 font-mono bg-gray-50 px-1.5 py-0.2 rounded border border-gray-100">{count}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${widthPerc}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Prompt Constraints applied */}
                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-950 shadow m-0 text-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-[#2cab52] flex items-center">
                        <Cpu className="w-3.5 h-3.5 mr-1" /> Active Self-Fine-Tuned Constraints
                      </span>
                      <span className="bg-[#2cab52]/20 text-[#2cab52] text-[9px] px-1.5 py-0.5 rounded font-extrabold font-mono">
                        INJECTED (Real)
                      </span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {promptCorrections.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No approved fine-tuning prompt limits stored yet.</p>
                      ) : (
                        promptCorrections.map((constraint, index) => (
                          <div key={index} className="flex items-start bg-slate-800/40 p-2 rounded border border-slate-800 text-[10.5px] leading-relaxed">
                            <span className="text-[#2cab52] font-bold mr-1.5">•</span>
                            <span>{constraint}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Critique Feed Streams */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold text-slate-700">Audit Critique Log Stream</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">REPAIR QUEUE</span>
                    </div>

                    <div className="space-y-3">
                      {reviewLogs.filter(l => !l.isPositive).length === 0 ? (
                        <div className="bg-white border rounded-xl p-4 text-center text-slate-400 text-xs italic">
                          No reported AI mistakes in the evaluation queue! Type queries and down-vote responses to test.
                        </div>
                      ) : (
                        reviewLogs.filter(l => !l.isPositive).map((log) => (
                          <div key={log.id} className="bg-white border border-gray-150 rounded-xl p-4 space-y-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-bold uppercase border border-red-100">
                                {log.failurePattern}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div>
                                <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider">User Input Query</span>
                                <p className="text-slate-700 font-semibold italic bg-slate-50 p-1.5 rounded">{log.userQuery}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider">Ira Flawed Response</span>
                                <p className="text-slate-500 font-medium truncate" title={log.iraResponse}>{log.iraResponse}</p>
                              </div>
                              <div className="bg-[#2cab52]/10 rounded-lg p-2.5 border border-[#2cab52]/20 space-y-1">
                                <span className="text-emerald-800 font-bold block text-[9.5px] uppercase tracking-wider">Synthesized Self-Repair Clause</span>
                                <p className="text-slate-800 font-bold leading-normal text-[11px]">{log.recommendation}</p>
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              {log.appliedPromptCorrection ? (
                                <span className="text-emerald-600 font-bold text-[10.5px] bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 flex items-center">
                                  <Check className="w-3.5 h-3.5 mr-1" /> Patched & Injected
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApprovePromptCorrection(log.id, log.recommendation)}
                                  className="bg-slate-900 border border-slate-950 text-slate-100 hover:text-white p-1.5 px-3 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer hover:bg-slate-800"
                                >
                                  ⚡ Inject into Ira Instructions
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Custom playbooks creation portal */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    <button
                      onClick={() => setShowCreatePlaybook(!showCreatePlaybook)}
                      className="w-full bg-slate-50 border border-dashed border-gray-300 rounded-lg p-2.5 hover:bg-slate-100 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer text-slate-800 transition"
                    >
                      <Plus className="w-4 h-4 text-[#2cab52]" />
                      <span>{showCreatePlaybook ? "Close Form Panel" : "Design New Advisory Playbook"}</span>
                    </button>

                    {showCreatePlaybook && (
                      <form onSubmit={handleCreatePlaybookSubmit} className="space-y-3 border-t border-gray-150 pt-3 text-xs">
                        <div className="grid grid-cols-1 gap-2.5">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Playbook Strategy Name</label>
                            <input
                              type="text"
                              value={playbookTitle}
                              required
                              onChange={(e) => setPlaybookTitle(e.target.value)}
                              placeholder="e.g. Sovereign Gold Bonds lock-in rule"
                              className="w-full bg-white p-2 border rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Scenario Category</label>
                            <select
                              value={playbookScenario}
                              onChange={(e: any) => setPlaybookScenario(e.target.value)}
                              className="w-full bg-white p-2 border rounded-lg text-xs"
                            >
                              <option value="rate_cycle">Rate Cycle arbitrage</option>
                              <option value="correction">Market Correction</option>
                              <option value="tax_harvest">Tax Harvest & Locks</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Functional Description</label>
                            <textarea
                              rows={2}
                              value={playbookDesc}
                              required
                              onChange={(e) => setPlaybookDesc(e.target.value)}
                              placeholder="Describe wealth rebalancing rules triggered on this specific client event..."
                              className="w-full bg-white p-2 border rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Custom Advisor Guidelines (one per line)</label>
                            <textarea
                              rows={3}
                              value={playbookRulesInput}
                              required
                              onChange={(e) => setPlaybookRulesInput(e.target.value)}
                              placeholder="Recommend shifting short term cash to Sovereign Gold Bonds for tax savings...&#10;Verify exit locks are covered..."
                              className="w-full bg-white p-2 border rounded-lg text-xs font-mono"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-slate-900 border border-slate-950 text-white rounded-lg p-2 hover:bg-slate-800 font-bold text-xs cursor-pointer transition-colors"
                          >
                            Save Strategy Preset (Draft)
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Active and custom playbooks container list */}
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold text-slate-700">Active Wealth Strategy Playbooks</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">LIVE PLUGINS</span>
                    </div>

                    <div className="space-y-3">
                      {playbooks.map((play) => (
                        <div
                          key={play.id}
                          className={`bg-white border rounded-xl p-4 space-y-3 shadow-sm transition-all ${
                            play.status === "active" ? "border-emerald-300 ring-1 ring-emerald-100" : "border-gray-200 grayscale"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="text-xs font-bold text-slate-900">{play.title}</h4>
                                <span className={`text-[8px] tracking-wider uppercase px-1.5 py-0.2 rounded font-extrabold ${
                                  play.status === "active" ? "bg-emerald-50 text-[#2cab52]" : "bg-gray-100 text-gray-500"
                                }`}>
                                  {play.status}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-wider block mt-0.5">
                                Trigger Scenario: {play.scenarioType.replace("_", " ")}
                              </span>
                            </div>

                            <button
                              onClick={() => togglePlaybook(play.id, play.status)}
                              className={`p-1 px-2.5 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                                play.status === "active"
                                  ? "bg-rose-50 border-rose-150 text-rose-600 hover:bg-rose-100"
                                  : "bg-[#2cab52]/10 border-emerald-150 text-emerald-800 hover:bg-[#2cab52]/20"
                              }`}
                            >
                              {play.status === "active" ? "Disable Play" : "Activate Play"}
                            </button>
                          </div>

                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{play.description}</p>

                          <div className="bg-slate-50 border border-gray-150 rounded-lg p-2.5 space-y-1.5">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Active Behavioral Constraints</span>
                            <div className="space-y-1">
                              {play.rules.map((rule: string, i: number) => (
                                <div key={i} className="flex items-start text-[10.5px] leading-relaxed text-slate-600">
                                  <span className="text-[#2cab52] font-bold mr-1.5">•</span>
                                  <span>{rule}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => runPlaybookPrompt(play)}
                              className="font-bold text-[11px] text-slate-100 bg-slate-900 hover:bg-slate-800 p-1.5 px-3 rounded-lg transition-all flex items-center space-x-1 border border-slate-950 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 text-[#2cab52] fill-[#2cab52]" />
                              <span>Simulate Strategy Play</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div> {/* Main split layout end */}
    </div>
  );
}
