/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  HelpCircle, 
  Users, 
  CheckCircle2, 
  History, 
  Server, 
  ArrowUpRight, 
  Sparkles,
  Info,
  Brain,
  Cpu,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Newspaper,
  Megaphone,
  Bell,
  Plus,
  Loader2,
  Search,
  Send,
  Clock
} from "lucide-react";
import { AuditLog } from "../types.js";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";

interface PlannerClientAlertsProps {
  onSelectClientQuestion: (qn: string) => void;
  setTab: (tab: string) => void;
  authToken: string;
}

interface BehavioralAlert {
  id: string;
  clientName: string;
  classification: "panic_selling" | "concentration_risk" | "fomo_chasing" | "rational";
  message: string;
  timestamp: string;
  nudge: string;
  score: number;
}

interface TokenUsageRecord {
  id: string;
  queryType: string;
  tokensIn: number;
  tokensOut: number;
  costInr: number;
  timestamp: string;
  compressionApplied: boolean;
  optimizedSavingsInr: number;
}

// Landmark Historical Macroeconomic Indices (India 2012 - 2026)
const HISTORICAL_MACRO_DATA = [
  { year: "2012", inflation: 9.30, interestRate: 8.00, event: "Post-Crisis Expansion" },
  { year: "2013", inflation: 10.90, interestRate: 8.75, event: "Taper Tantrum Panic" },
  { year: "2014", inflation: 6.37, interestRate: 8.00, event: "Tightened Policy" },
  { year: "2015", inflation: 5.88, interestRate: 7.25, event: "Rate Easing" },
  { year: "2016", inflation: 4.97, interestRate: 6.75, event: "Demonetization Shock" },
  { year: "2017", inflation: 2.49, interestRate: 6.00, event: "Post-GST Transition" },
  { year: "2018", inflation: 4.86, interestRate: 6.50, event: "Oil Shock Highs" },
  { year: "2019", inflation: 3.72, interestRate: 5.15, event: "Growth Slowdown Support" },
  { year: "2020", inflation: 6.62, interestRate: 4.00, event: "Pandemic Emergency Fluidity" },
  { year: "2021", inflation: 5.13, interestRate: 4.00, event: "Extended Low Yield Period" },
  { year: "2022", inflation: 6.70, interestRate: 6.25, event: "Global Commodity Hiking" },
  { year: "2023", inflation: 5.65, interestRate: 6.50, event: "Repo Rate Neutral Peaks" },
  { year: "2024", inflation: 5.09, interestRate: 7.25, event: "Private Rate Competition" },
  { year: "2025", inflation: 5.40, interestRate: 7.50, event: "Sticky Food Prices" },
  { year: "2552", inflation: 6.20, interestRate: 8.50, event: "Active Yield Cap Era" } // Note: we represent current simulated env as 2026 in code
];

// Map 2026 correctly for rendering
const CHART_DATA_RENDERED = HISTORICAL_MACRO_DATA.map(d => d.year === "2552" ? { ...d, year: "2026" } : d);

const HISTORICAL_EVENTS_DETAILS: Record<string, { title: string; inflation: string; rates: string; context: string; leverageHint: string }> = {
  "2013": {
    title: "The Taper Tantrum Crisis (2013)",
    inflation: "10.90% (Double digit hyper peak)",
    rates: "8.75% (SBI 1-Year deposit hike)",
    context: "US Fed's surprising hints of cutting quantitative easing sent hot money fleeing from India. Wholesale and retail prices surged instantly near 11%, prompting domestic credit bodies to spike system rates.",
    leverageHint: "Leaving assets inside basic Savings structures during high inflation resulted in severe capital dilution of ~3% real buying power loss annually. Ira AI would push active bond re-allocations immediately."
  },
  "2016": {
    title: "Demonetization & Banking Inflows (2016-17)",
    inflation: "4.97% decreasing to 2.49%",
    rates: "6.75% dropping to 6.00%",
    context: "Sovereign currency shifts forced unprecedented paper value deposits into retail banking branches overnight. Banks dropped interest returns due to heavy liabilities excess.",
    leverageHint: "During massive liquidity surges, savers require dynamic yield shields such as Arbitrage or Equity SIPs to bypass collapsing low risk bank FD payouts."
  },
  "2020": {
    title: "COVID-19 Financial Stimulus (2020-21)",
    inflation: "6.62% (Supply disruption pressure)",
    rates: "4.00% (Historic low interest rates)",
    context: "Emergency committees slashed primary repo rates to 4% as policy relief. Meanwhile, agricultural distribution issues drove food inflation upwards to a peak of 6.62%.",
    leverageHint: "This marked the widest negative real yield gap in decades. Under uncompressed formats, planners must strictly recommend SIP escalations into equities to preserve long-term goals timelines."
  },
  "2022": {
    title: "Commodity Surge & Rate Hikes (2022-23)",
    inflation: "6.70% (Energy inflation bump)",
    rates: "6.25% - 6.50% (Sudden hikes cycle)",
    context: "International energy conflicts pushed standard commodity imports to elevated tiers. In response, central regulators conducted rapid-fire series of aggressive hikes to contract supply.",
    leverageHint: "Sudden rate climbs favor capital locked inside short-duration funds to prevent value dilution, taking immediate advantage of rising yields."
  },
  "2026": {
    title: "The Active Inflation Conflict Cycle (2026)",
    inflation: "6.20% (Breached regulatory targets)",
    rates: "7.25% - 8.50% (Private bank rate hiking)",
    context: "Retail price indexes across the nation climbed unexpectedly. Private commercial banking forces raised structural FD rewards upwards to safe extremes to secure short term capital.",
    leverageHint: "Our live News module advises moving Rahul Sharma's excess passive 2.70% cash to special tenured 7.25% structures instantly to pocket ₹18,200 of excess yield safely guaranteed under DICGC laws."
  }
};

// Custom Tooltip component for Recharts Macro Trend visualizer
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 max-w-xs">
        <div className="font-bold flex justify-between items-center text-slate-300 gap-4">
          <span>Year {label}</span>
          <span className="text-[9px] text-[#2cab52] uppercase font-mono font-black">{data.event}</span>
        </div>
        <div className="h-[1px] bg-slate-800 my-1" />
        <p className="flex justify-between space-x-6">
          <span className="text-red-400">CPI Inflation:</span>
          <span className="font-mono font-bold text-red-300">{data.inflation.toFixed(2)}%</span>
        </p>
        <p className="flex justify-between space-x-6">
          <span className="text-emerald-400">1-Yr FD Yield:</span>
          <span className="font-mono font-bold text-emerald-300">{data.interestRate.toFixed(2)}%</span>
        </p>
        <p className="text-[9px] text-gray-400 pt-1 italic leading-tight">
          Click timeline node to lock interactive review panel.
        </p>
      </div>
    );
  }
  return null;
};

export default function PlannerClientAlerts({
  onSelectClientQuestion,
  setTab,
  authToken
}: PlannerClientAlertsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"risk" | "behavioral" | "tokens" | "audit" | "news" | "nudges">("risk");
  const [nudgesSearch, setNudgesSearch] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [behavioralAlerts, setBehavioralAlerts] = useState<BehavioralAlert[]>([]);
  const [tokenUsageLogs, setTokenUsageLogs] = useState<TokenUsageRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Financial News & Action Suggestions State
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState<string>("Rahul Sharma");

  // Form states for creating news
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("Inflation");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsSource, setNewsSource] = useState("MoneyControl Portal");
  const [newsImpact, setNewsImpact] = useState("HIGH");

  // User success notifications
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [updatingNudgeId, setUpdatingNudgeId] = useState<string | null>(null);

  const handleToggleSentiment = async (suggestionId: string, currentTrend: string) => {
    const nextTrend = currentTrend === "downward" ? "upward" : "downward";
    setUpdatingNudgeId(suggestionId);
    try {
      const response = await fetch("/api/v1/news/update-nudge-trend", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ suggestionId, sentimentTrend: nextTrend })
      });
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data.suggestions || []);
        setSuccessBanner(`Automatically recalculating nudge urgency! Market news sentiment trend changed to ${nextTrend.toUpperCase()}.`);
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err) {
      console.error("Failed to update nudge trend direction:", err);
    } finally {
      setUpdatingNudgeId(null);
    }
  };

  // Landmark year selection for historical analysis panel
  const [selectedMacroYear, setSelectedMacroYear] = useState<string>("2026");

  // Poll audit, token stats, news articles, and behavioral indicators from Express services
  const fetchAllTelemetryLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const headers = { "Authorization": `Bearer ${authToken}` };
      
      const [resAudit, resBehav, resTok, resNews, resSug] = await Promise.all([
        fetch("/api/v1/audit/logs", { headers }),
        fetch("/api/v1/behavioral/alerts", { headers }),
        fetch("/api/v1/token-usage/metrics", { headers }),
        fetch("/api/v1/news/articles", { headers }),
        fetch("/api/v1/news/suggestions", { headers })
      ]);

      const auditData = await resAudit.json();
      const behavData = await resBehav.json();
      const tokData = await resTok.json();
      const newsData = await resNews.json();
      const sugData = await resSug.json();

      if (auditData.success) {
        setAuditLogs(auditData.data.logs || []);
      }
      if (behavData.success) {
        setBehavioralAlerts(behavData.data.alerts || []);
      }
      if (tokData.success) {
        setTokenUsageLogs(tokData.data.logs || []);
      }
      if (newsData.success) {
        setNewsArticles(newsData.data.articles || []);
      }
      if (sugData.success) {
        setSuggestions(sugData.data.suggestions || []);
      }
    } catch (err) {
      console.warn("Telemetry polling failure, offline demo cache online", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAllTelemetryLogs();
    const interval = setInterval(fetchAllTelemetryLogs, 4000); // refresh telemetry reports every 4s
    return () => clearInterval(interval);
  }, [authToken]);

  // Trigger AI news scanning & suggestion generation
  const handleAnalyzeNews = async (articleId: string) => {
    setIsAnalyzingId(articleId);
    setSuccessBanner(null);
    try {
      const headers = { 
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      };
      
      const response = await fetch("/api/v1/news/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ articleId, clientName: selectedClientName })
      });
      
      const resData = await response.json();
      if (resData.success) {
        setSuggestions(resData.data.suggestions || []);
        setSuccessBanner(`Successfully analyzed news with Ira AI! Generated custom suggestion for ${selectedClientName}.`);
        setTimeout(() => setSuccessBanner(null), 5000);
        fetchAllTelemetryLogs();
      }
    } catch (err) {
      console.error("Failed to analyze news article: ", err);
    } finally {
      setIsAnalyzingId(null);
    }
  };

  // Push recommendations to client workspace
  const handlePushRecommendation = async (suggestionId: string) => {
    setSuccessBanner(null);
    try {
      const headers = { 
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      };
      
      const response = await fetch("/api/v1/news/push-recommendation", {
        method: "POST",
        headers,
        body: JSON.stringify({ suggestionId })
      });
      
      const resData = await response.json();
      if (resData.success) {
        setSuggestions(resData.data.suggestions || []);
        setSuccessBanner("Advisory recommendation pushed as active client workspace notification successfully!");
        setTimeout(() => setSuccessBanner(null), 5000);
        fetchAllTelemetryLogs();
      }
    } catch (err) {
      console.error("Failed to push recommendation: ", err);
    }
  };

  // Create & Publish breaking news
  const handlePublishBreakingNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary) return;

    try {
      const headers = { 
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      };
      
      const response = await fetch("/api/v1/news/add-article", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: newsTitle,
          category: newsCategory,
          summary: newsSummary,
          source: newsSource,
          impactLevel: newsImpact
        })
      });
      
      const resData = await response.json();
      if (resData.success) {
        setNewsArticles(resData.data.articles || []);
        setNewsTitle("");
        setNewsSummary("");
        setIsAddingNews(false);
        setSuccessBanner("Breaking financial news published to local network index successfully!");
        setTimeout(() => setSuccessBanner(null), 5000);
        fetchAllTelemetryLogs();
      }
    } catch (err) {
      console.error("Failed to publish breaking news article: ", err);
    }
  };

  const handleReviewWithIra = (clientName: string) => {
    const question = `Analyze Rahul Sharma's severe goal dilution if he purchases the ₹80L flat with ₹15L down payment. Simulate his cash drop to ₹21K and formulate an optimization strategy.`;
    onSelectClientQuestion(question);
    setTab("ira");
  };

  // Compute dynamic behavioral score: averages of alert scores, defaults to standard calculation based on warnings count
  const averageBehavioralScore = behavioralAlerts.length > 0
    ? Math.round(behavioralAlerts.reduce((sum, item) => sum + item.score, 0) / behavioralAlerts.length)
    : 12; // base score

  // Compute total token consumption metrics
  const totalTokens = tokenUsageLogs.reduce((sum, item) => sum + item.tokensIn + item.tokensOut, 0);
  const totalSpendInr = tokenUsageLogs.reduce((sum, item) => sum + item.costInr, 0);
  const totalSavingsInr = tokenUsageLogs.reduce((sum, item) => sum + item.optimizedSavingsInr, 0);

  return (
    <div id="planner-alerts-section" className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Introduction */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-[#2cab52]" />
            <h2 className="text-2xl font-extrabold text-[#071a2b]">Planner Dashboard & Risk Center</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100 animate-pulse">
              Agentic Telemetry Engine v2
            </span>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm">
            Monitor client accounts at risk, review behavioral finance tendencies, view real-time LLM token usage, and audit live transactions.
          </p>
        </div>
      </div>

      {/* Top metrics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-105 p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Portfolio Compliance</span>
            <span className="text-2xl font-extrabold text-[#071a2b]">100% Secure</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#2cab52] flex items-center justify-center">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-105 p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-rose-500" />
          <div>
            <span className="text-[10px] text-rose-500 font-bold uppercase block mb-1">Emotional Risks Detected</span>
            <span className="text-2xl font-extrabold text-rose-600">{behavioralAlerts.length} Warnings</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#071a2b] rounded-2xl border border-slate-805 p-5 flex items-center justify-between text-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">AI Cost Avoidance</span>
            <span className="text-2xl font-extrabold text-[#2cab52]">₹{totalSavingsInr.toFixed(2)} Saved</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 text-[#2cab52] flex items-center justify-center">
            <Coins className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Advanced sub-tabs navigation row */}
      <div className="flex flex-wrap border-b border-gray-200 gap-1">
        {[
          { id: "risk", label: "Goal GPS Warning Alerts", count: 2, icon: ShieldAlert },
          { id: "behavioral", label: "Behavioral Finance Audits", count: behavioralAlerts.length, icon: Brain },
          { id: "tokens", label: "LLM Costs & Token Usage", count: tokenUsageLogs.length, icon: Cpu },
          { id: "news", label: "News Analysis & Client Nudges", count: newsArticles.length, icon: Newspaper },
          { id: "nudges", label: "Pushed Client Nudges", count: suggestions.filter(s => s.pushed && !s.viewed).length, icon: Bell },
          { id: "audit", label: "System Compliance Ledger", count: auditLogs.length, icon: History }
        ].map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                isActive 
                  ? "border-[#2cab52] text-[#071a2b]" 
                  : "border-transparent text-gray-500 hover:text-[#071a2b]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#2cab52]" : "text-gray-400"}`} />
              <span>{sub.label}</span>
              {sub.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-[#2cab52] text-slate-950" : "bg-gray-100 text-gray-500"
                }`}>
                  {sub.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#2cab52]" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Dynamic Sub-tab views */}
      {activeSubTab === "risk" && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-extrabold text-[#071a2b] flex items-center space-x-1.5 font-sans">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>At-Risk Accounts Requiring Immediate Action</span>
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Rahul Sharma Risk Alert details */}
            <div className="bg-white rounded-2xl border-l-4 border-l-rose-500 border border-gray-150 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:shadow-md transition">
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700">Dilution Warning</span>
                  <span className="text-[11px] font-mono text-gray-400">ID: client_rahul_sharma</span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">Rahul Sharma (Unbalanced Life Event)</h4>
                <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
                  Rahul simulated buying a <strong>₹80 Lakhs Bangalore 2BHK</strong> flat with ₹15L down value. The EMI of <strong>₹56,730/mo</strong> completely drains his investable surplus (crashing from ₹55K to ₹21K). This dilution reduces daughter's higher education goal index to 41% and retirement horizon target to 32%, putting both milestones into critical under-saved statuses.
                </p>
              </div>

              <button
                onClick={() => handleReviewWithIra("Rahul Sharma")}
                className="px-4 py-2.5 bg-[#071a2b] hover:bg-slate-800 text-[#2cab52] font-black rounded-xl text-xs flex items-center space-x-1 transition shrink-0 shadow-md border border-[#2cab52]/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2cab52]" />
                <span>Review with Ira AI</span>
              </button>
            </div>

            {/* Alert 2 */}
            <div className="bg-white rounded-2xl border-l-4 border-l-amber-500 border border-gray-150 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:shadow-md transition opacity-85">
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700">Tax Underutilization</span>
                  <span className="text-[11px] font-mono text-gray-400">ID: client_ananya_sen</span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">Ananya Sen (Unclaimed Exemption Omission)</h4>
                <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
                  Ananya has saved only <strong>₹30,000</strong> under Section 80C out of the available ₹1,50,000 threshold limit, leaving ₹1.2L unclaimed. Propose allocation of remaining surplus into custom ELSS tax savers immediately before the March tax audit close.
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectClientQuestion("How can Ananya Sen maximize Section 80C limits with ELSS mutual funds?");
                  setTab("ira");
                }}
                className="px-4 py-2.5 bg-[#071a2b] hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <span>Audit Tax Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "behavioral" && (
        <div className="space-y-6 animate-fade-in">
          {/* Behavioral Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-[#0c243a] to-[#071a2b] p-6 rounded-2xl text-slate-100 border border-slate-800">
            <div className="space-y-2">
              <span className="text-[10px] text-[#2cab52] font-black uppercase tracking-widest font-mono">Behavioral Insights Panel</span>
              <h3 className="text-lg font-extrabold text-white">Client Behavioral Risk Score</h3>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Detect client sentiment shifts, panic-buying patterns, or asset concentration biases during conversations with Ira and generate automated behavioral nudges.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 rounded-xl border border-white/5 md:text-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Weighted Bias Hazard</span>
              <span className={`text-4xl font-extrabold font-mono mt-1 ${
                averageBehavioralScore > 50 ? "text-rose-400" : "text-emerald-400"
              }`}>
                {averageBehavioralScore}%
              </span>
              <span className="text-[10px] text-slate-500 mt-2 font-mono">
                {averageBehavioralScore > 50 ? "● HIGH BIAS PROFILE - COUNSEL REQUIRED" : "● BALANCED IRRATIONAL RATING"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-705 flex items-center space-x-1.5">
              <Brain className="w-4 h-4 text-[#2cab52]" />
              <span>Real-Time Emotional Intent Detections Ledger</span>
            </h3>

            <div className="space-y-3">
              {behavioralAlerts.map((alert) => (
                <div key={alert.id} className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        alert.classification === "panic_selling" ? "bg-red-50 text-red-700 border border-red-200" :
                        alert.classification === "concentration_risk" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}>
                        {alert.classification.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">Logged {new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-700">Risk Severity: {alert.score}%</span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    &ldquo;{alert.message}&rdquo;
                  </p>

                  <div className="flex items-start space-x-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/40 text-xs">
                    <Lightbulb className="w-4.5 h-4.5 text-[#2cab52] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5 font-bold uppercase text-[9px] tracking-wide">Automated Behavioral Nudge</strong>
                      <span className="text-[#071a2b] font-medium leading-relaxed">{alert.nudge}</span>
                    </div>
                  </div>
                </div>
              ))}

              {behavioralAlerts.length === 0 && (
                <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-gray-150 text-xs">
                  <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                  No high-risk emotional heuristics flagged inside client messages yet. Type &ldquo;markets are crashing, stop my SIPs&rdquo; in Ira conversation tab to witness real-time behavioral classifications.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "tokens" && (
        <div className="space-y-6 animate-fade-in">
          {/* Spend widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Cumulative Tokens Used</span>
              <span className="text-2xl font-black text-[#071a2b] font-mono">{totalTokens.toLocaleString()}</span>
              <p className="text-[9px] text-gray-500 mt-1">Sum of API Input + Output payloads</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Operational Model Cost</span>
              <span className="text-2xl font-black text-[#071a2b] font-mono">₹{totalSpendInr.toFixed(3)}</span>
              <p className="text-[9px] text-gray-500 mt-1">Computed with standard regional API rates</p>
            </div>

            <div className="bg-emerald-950 p-5 rounded-2xl border border-emerald-900 shadow-sm text-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Optimization Savings</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">₹{totalSavingsInr.toFixed(3)}</span>
              <p className="text-[9px] text-emerald-300/80 mt-1">~34.0% savings via contextual prompt compression</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-705 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#2cab52]" />
              <span>Real-Time Model Execution Costs Tracking Ledger</span>
            </h3>

            <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <th className="p-4">Reference Query Type</th>
                      <th className="p-4 text-center">Prompt Length In</th>
                      <th className="p-4 text-center">Response Length Out</th>
                      <th className="p-4 text-center">Context Reduction Engine</th>
                      <th className="p-4 text-right">Computed Cost (INR)</th>
                      <th className="p-4 text-right">Optimization Saved (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-slate-600">
                    {tokenUsageLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/20 transition">
                        <td className="p-4 font-bold text-[#071a2b] uppercase tracking-wide font-mono text-[10px]">
                          {log.queryType.replace("_", " ")}
                        </td>
                        <td className="p-4 text-center font-mono">{log.tokensIn.toLocaleString()} tok</td>
                        <td className="p-4 text-center font-mono">{log.tokensOut.toLocaleString()} tok</td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            log.compressionApplied ? "bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse" : "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}>
                            {log.compressionApplied ? "Prompt Optimized (34% Off)" : "Uncompressed"}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">₹{log.costInr.toFixed(3)}</td>
                        <td className="p-4 text-right font-mono text-emerald-500 font-extrabold">+₹{log.optimizedSavingsInr.toFixed(3)}</td>
                      </tr>
                    ))}

                    {tokenUsageLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                          No AI queries evaluated yet. Go to the conversational Ira Agent tab and type a question to seed the model optimizer index.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "audit" && (
        <div className="space-y-4 animate-fade-in">
          {/* Database audits live monitor logs */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#071a2b] flex items-center space-x-1.5">
              <History className="w-5 h-5 text-[#2cab52]" />
              <span>Audit Trail & Security Database Ledger</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2.5 py-1 rounded border border-gray-100">
              Live Polling Activated • Encrypted JWT verification
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Timestamp (UTC)</th>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">Target Service</th>
                    <th className="p-4">Initiator Role</th>
                    <th className="p-4 text-right">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-medium text-slate-600">
                  {auditLogs.map((log) => {
                    const isSuccess = log.status === "SUCCESS";
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono font-bold text-gray-500">{log.id}</td>
                        <td className="p-4 font-mono text-gray-500">{log.timestamp.slice(11, 19)}</td>
                        <td className="p-4 font-bold text-[#071a2b]">{log.action}</td>
                        <td className="p-4">
                          <span className="font-mono text-indigo-600 bg-indigo-50/60 px-2.5 py-0.5 rounded border border-indigo-100 text-[10px]">
                            {log.service}
                          </span>
                        </td>
                        <td className="p-4 text-[#071a2b] font-semibold">{log.initiatedBy}</td>
                        <td className="p-4 text-right">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                        No ledger transactions logged inside microservice cache yet. Initiate calculations to seed audits.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "news" && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Header section with publish trigger */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#071a2b] p-6 rounded-2xl text-slate-100 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="z-10 space-y-1.5 max-w-2xl">
              <span className="text-[10px] text-[#2cab52] font-black uppercase tracking-widest font-mono">Dynamic News intelligence Room</span>
              <h3 className="text-xl font-extrabold text-white">Automated Market News Scanner & NLP Advisory Suggestions</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Analyze breaking economic events, inflation changes, tax reforms, or banking yields with Ira AI. Generate context-aware recommendations tailored to active clients' profiles and push notifications instantly.
              </p>
            </div>
            <button
              onClick={() => setIsAddingNews(!isAddingNews)}
              className="mt-4 md:mt-0 px-4 py-2.5 bg-[#2cab52] hover:bg-[#20833e] text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1 transition select-none z-10 cursor-pointer shadow-lg shadow-[#2cab52]/10 shrink-0 border-none"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{isAddingNews ? "Close Article Deck" : "Publish Breaking News"}</span>
            </button>
          </div>

          {/* Quick interactive form to publish breaking financial news */}
          {isAddingNews && (
            <form onSubmit={handlePublishBreakingNews} className="bg-white p-6 rounded-2xl border border-dashed border-gray-305 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <Megaphone className="w-4 h-4 text-[#2cab52]" />
                <h4 className="text-sm font-extrabold text-slate-800">Publish Simulated Market Event Stream</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Article Title / Headline</label>
                  <input
                    type="text"
                    required
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="e.g., RBI raises key repo rate by 25 bps"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#2cab52] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Category Tag</label>
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-[#2cab52]"
                  >
                    <option value="Inflation">Inflation</option>
                    <option value="Interest Rates">Interest Rates</option>
                    <option value="Tax & Policy">Tax & Policy</option>
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="Macroeconomics">Macroeconomics</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Impact Exposure</label>
                    <select
                      value={newsImpact}
                      onChange={(e) => setNewsImpact(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-[#2cab52]"
                    >
                      <option value="HIGH">HIGH (Red)</option>
                      <option value="MEDIUM">MEDIUM (Amber)</option>
                      <option value="LOW">LOW (Gray)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Source Agency</label>
                    <input
                      type="text"
                      required
                      value={newsSource}
                      onChange={(e) => setNewsSource(e.target.value)}
                      placeholder="e.g., Economic Times"
                      className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#2cab52] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Detailed Summary of Event</label>
                <textarea
                  required
                  rows={2}
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  placeholder="Insert a short explanation. e.g. With domestic retail prices trending elevated, core committees voted to restrict fluid money circulation..."
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#2cab52] resize-none bg-white font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNews(false)}
                  className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-100 transition cursor-pointer border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#071a2b] hover:bg-slate-850 text-[#2cab52] rounded-lg text-xs font-bold transition cursor-pointer border-none"
                >
                  Publish & Stream News
                </button>
              </div>
            </form>
          )}

          {/* Quick Interactive Target selector */}
          <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-850 block">Select Active Target Client to Analyze Against</span>
                <span className="text-[10px] text-gray-500">Ira AI checks their assets size, savings rates, and goals timelines.</span>
              </div>
            </div>
            <select
              value={selectedClientName}
              onChange={(e) => setSelectedClientName(e.target.value)}
              className="text-xs p-2.5 rounded-lg border border-gray-200 bg-white font-bold text-[#071a2b] outline-none shrink-0"
            >
              <option value="Rahul Sharma">Rahul Sharma (Surplus: ₹55k/mo, SBI 2.7%)</option>
              <option value="Ananya Sen">Ananya Sen (Unutilized 80C, FD Saver)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: News feeds list */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center space-x-1.5">
                <Newspaper className="w-4.5 h-4.5 text-[#2cab52]" />
                <span>Live Financial Events Stream ({newsArticles.length})</span>
              </h4>

              <div className="space-y-4">
                {newsArticles.map((article) => {
                  const isAnalyzing = isAnalyzingId === article.id;
                  return (
                    <div key={article.id} className="bg-white p-5 rounded-xl border border-gray-150 space-y-3.5 hover:shadow-sm transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            article.category === "Inflation" ? "bg-red-50 text-red-700 border border-red-200" :
                            article.category === "Interest Rates" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            article.category === "Tax & Policy" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                            "bg-gray-100 text-gray-605"
                          }`}>
                            {article.category}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">{article.source}</span>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                          article.impactLevel === "HIGH" ? "bg-rose-100 text-rose-800" :
                          article.impactLevel === "MEDIUM" ? "bg-amber-100 text-amber-805" :
                          "bg-slate-100 text-slate-655"
                        }`}>
                          {article.impactLevel} IMPACT
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-extrabold text-slate-850 text-xs sm:text-sm leading-tight">{article.title}</h5>
                        <p className="text-xs text-gray-550 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                          &ldquo;{article.summary}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1.5 border-t border-gray-50">
                        <span>Published {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          type="button"
                          onClick={() => handleAnalyzeNews(article.id)}
                          disabled={!!isAnalyzingId}
                          className="px-3.5 py-2 bg-[#071a2b] hover:bg-slate-800 text-[#2cab52] font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition select-none cursor-pointer disabled:opacity-50 border-none"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2cab52]" />
                              <span>Scanning Context...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-[#2cab52]" />
                              <span>Analyze with Ira AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {newsArticles.length === 0 && (
                  <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-150">
                    No active financial news articles. Try publishing some breaking issues now.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Suggestions Generated */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center space-x-1.5">
                <Bell className="w-4.5 h-4.5 text-amber-500" />
                <span>Actionable Client Nudges Suggestions ({suggestions.length})</span>
              </h4>

              <div className="space-y-4">
                {suggestions.map((sug) => {
                  const matchingNews = newsArticles.find(n => n.id === sug.articleId);
                  return (
                    <div key={sug.id} className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-3.5 relative overflow-hidden">
                      {sug.pushed && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-slate-900 text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                          Pushed Alert Live
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-150 text-slate-800 font-bold border border-slate-200">
                            Client: {sug.clientName}
                          </span>
                          {matchingNews && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[180px]">
                              Based on: {matchingNews.title}
                            </span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-[#071a2b] text-sm leading-tight">{sug.headline}</h5>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
                        <span className="text-[9px] font-black text-[#2cab52] uppercase block tracking-wider">Actionable Recommendation</span>
                        <p className="text-slate-800 font-medium leading-relaxed">{sug.recommendation}</p>
                      </div>

                      <div className="bg-amber-50/20 p-3 rounded-lg border border-amber-100/40 space-y-1 text-xs">
                        <span className="text-[9px] font-black text-amber-600 uppercase block tracking-wider">Strategic Mathematical Rationale</span>
                        <p className="text-gray-600 leading-relaxed italic">{sug.rationale}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[9px] font-mono text-gray-450">UUID: {sug.id}</span>
                        {!sug.pushed ? (
                          <button
                            type="button"
                            onClick={() => handlePushRecommendation(sug.id)}
                            className="px-4 py-2 bg-amber-550 hover:bg-amber-500 text-slate-905 bg-amber-400 font-black rounded-lg text-xs flex items-center space-x-1.5 transition select-none cursor-pointer border-none"
                          >
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>Push strategic nudge</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Client Workspace Alert Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {suggestions.length === 0 && (
                  <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-gray-150 text-xs">
                    <Sparkles className="w-7 h-7 text-slate-300 mx-auto mb-2 animate-pulse" />
                    No tactical suggestions generated yet. Click &ldquo;Analyze with Ira AI&rdquo; on any news article card in the left stream to extract direct compliance recommendation nudges.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "nudges" && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Sub-tab Introduction banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#071a2b] p-6 rounded-2xl text-slate-100 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="z-10 space-y-1.5 max-w-3xl">
              <span className="text-[10px] text-[#2cab52] font-black uppercase tracking-widest font-mono font-sans">CLIENT DELIVERY & ENGAGEMENT REGISTRY</span>
              <h3 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span>Client Nudges & Delivery Reports Desk</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Track and register every pushed tactical advice nudge. Audit delivery timelines, confirm when the client has viewed and acknowledged active nudges inside their Goal GPS workspace, and inspect client cognitive receptiveness patterns.
              </p>
            </div>
            <div className="bg-slate-800/80 p-4.5 rounded-xl border border-slate-700 max-w-xs shrink-0 self-start md:self-auto space-y-2 mt-4 md:mt-0 text-xs text-slate-300 font-sans">
              <span className="text-[9px] uppercase font-black tracking-wider text-[#2cab52] block font-sans">Client Nudges sync status</span>
              <p className="text-[11px] text-slate-400">Live polling is active. Recommendations pushed by database are automatically tracked and mirrored upon client acknowledgement activity.</p>
            </div>
          </div>

          {/* Quick Metrics Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-gray-150 flex items-center space-x-4 animate-fade-in">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5 font-sans">Total Pushed Nudges</span>
                <span className="text-lg font-black text-[#071a2b] font-mono">
                  {suggestions.filter(s => s.pushed).length} Issued
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-gray-150 flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-[#2cab52] rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5 font-sans">Viewed / Acknowledged</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {suggestions.filter(s => s.pushed && s.viewed).length} Nudges
                </span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-gray-150 flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5 font-sans">Unread / Pending Client View</span>
                <span className="text-lg font-black text-amber-600 font-mono">
                  {suggestions.filter(s => s.pushed && !s.viewed).length} Unread
                </span>
              </div>
            </div>
          </div>

          {/* Search and Table Grid */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 self-start sm:self-auto">
                <h4 className="text-sm font-bold text-slate-900 font-sans">Nudge Engagement & Read Receipts Ledger</h4>
                <p className="text-[11px] text-gray-400 leading-tight">Review transaction identifiers of pushed recommendations, client read status, and response velocities.</p>
              </div>

              {/* Filtering Search Input */}
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by client name or headline..."
                  value={nudgesSearch || ""}
                  onChange={(e) => setNudgesSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-9.5 pr-4 py-2 text-xs focus:outline-none focus:border-[#2cab52] bg-white text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans">
                    <th className="p-4 text-left">Nudge UUID</th>
                    <th className="p-4 text-left">Client Target</th>
                    <th className="p-4 text-left">Structural Nudge Headline</th>
                    <th className="p-4 text-center min-w-[150px]">Market Sentiment Trend</th>
                    <th className="p-4 text-center">Dynamic Urgency</th>
                    <th className="p-4 text-center">Engagement Status</th>
                    <th className="p-4 text-right">Activity Timestamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-medium text-slate-600">
                  {suggestions
                    .filter(s => s.pushed)
                    .filter(s => {
                      if (!nudgesSearch) return true;
                      const term = nudgesSearch.toLowerCase();
                      return (
                        s.clientName.toLowerCase().includes(term) ||
                        s.headline.toLowerCase().includes(term)
                      );
                    })
                    .map((sug) => {
                      const isRead = sug.viewed;
                      const trend = sug.sentimentTrend || "upward";
                      const urg = sug.urgency || "High";
                      
                      return (
                        <tr key={sug.id} className="hover:bg-slate-50/40 transition">
                          <td className="p-4 font-mono font-bold text-[#2cab52]/90">{sug.id}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#071a2b] text-[#2cab52] font-black text-[10px] flex items-center justify-center uppercase shadow-sm shrink-0 font-sans">
                                {sug.clientName.slice(0, 2)}
                              </div>
                              <span className="font-extrabold text-[#071a2b]">{sug.clientName}</span>
                            </div>
                          </td>
                          <td className="p-4 max-w-sm">
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#071a2b] block leading-snug">{sug.headline}</span>
                              <p className="text-[10px] text-gray-500 leading-relaxed truncate max-w-xs">{sug.recommendation}</p>
                            </div>
                          </td>
                          
                          {/* Market Sentiment Trend with Interactive Toggle Recalculator */}
                          <td className="p-4 text-center align-middle">
                            <div className="inline-flex flex-col items-center space-y-1.5">
                              {trend === "upward" ? (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center space-x-1 select-none">
                                  <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Upward Trend</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center space-x-1 select-none">
                                  <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Downward Trend</span>
                                </span>
                              )}
                              
                              <button
                                type="button"
                                disabled={updatingNudgeId === sug.id}
                                onClick={() => handleToggleSentiment(sug.id, trend)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[9px] rounded uppercase cursor-pointer transition flex items-center space-x-1 border border-slate-200 select-none disabled:opacity-50"
                                title="Flip trend to recalculate urgency automatically"
                              >
                                {updatingNudgeId === sug.id ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-2.5 h-2.5" />
                                )}
                                <span>Flip Trend</span>
                              </button>
                            </div>
                          </td>

                          {/* Dynamic Urgency Badge based on computed / AI analysis */}
                          <td className="p-4 text-center">
                            {urg === "Critical" && (
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 inline-flex items-center space-x-1 uppercase animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                <span>Critical</span>
                              </span>
                            )}
                            {urg === "High" && (
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center space-x-1 uppercase">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span>High</span>
                              </span>
                            )}
                            {urg === "Medium" && (
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 inline-flex items-center space-x-1 uppercase">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span>Medium</span>
                              </span>
                            )}
                            {urg === "Routine" && (
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center space-x-1 uppercase">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span>Routine</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider ${
                              isRead 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : "bg-amber-50 text-amber-700 border border-amber-150 animate-pulse"
                            }`}>
                              {isRead ? "Viewed & Read" : "Unread / Pending"}
                            </span>
                          </td>
                          
                          {/* Aggregated activity timestamps */}
                          <td className="p-4 text-right font-mono text-[10px] space-y-1">
                            <div className="flex justify-end items-center space-x-1 text-slate-500">
                              <span className="font-bold text-slate-600">Pushed:</span>
                              <span>
                                {sug.pushedAt ? (
                                  new Date(sug.pushedAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false
                                  })
                                ) : (
                                  "Just now"
                                )}
                              </span>
                            </div>
                            
                            <div className="flex justify-end items-center space-x-1">
                              <span className="font-bold text-slate-600">Viewed:</span>
                              {isRead && sug.viewedAt ? (
                                <span className="text-emerald-700 font-bold">
                                  {new Date(sug.viewedAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false
                                  })}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">pending</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {suggestions.filter(s => s.pushed).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 italic font-medium">
                        No recommendations have been pushed to clients yet. Launch News Analysis room to generate compliance recommendations, and push them to spark active client nudges.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Recharts Historical Impact of Major Financial Events panel */}
      <div id="historical-financial-analysis-panel" className="bg-white rounded-2xl border border-gray-150 p-6 space-y-6 mt-8 animate-fade-in text-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#2cab52]" />
              <h3 className="text-base font-extrabold text-[#071a2b] font-sans">
                Historical Impact Timeline: Inflation vs Interest Rate Spikes
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-3xl leading-relaxed">
              Compare India retail CPI (national inflation) with typical 1-Year bank deposit yield cycles over the last 15 years. This timeline illustrates why leaving assets in passive, low-yield basic bank zones under-saves client futures, and how central rate cycles justify Ira's dynamic advisory nudges.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#2cab52] animate-ping" />
            <span>Interactive Macro Monitor</span>
          </div>
        </div>

        {/* Graphical Area split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Chart visual Column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] mb-2 px-1 text-gray-500 gap-1">
                <span className="font-bold flex items-center space-x-1">
                  <span>📈 Click points or axis values directly on the chart to select any era review:</span>
                </span>
                <span className="font-mono text-[10px] font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 self-start sm:self-auto uppercase tracking-wide">
                  Active Reference: {selectedMacroYear === "2026" ? "2026 (Active)" : selectedMacroYear}
                </span>
              </div>
              
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={CHART_DATA_RENDERED} 
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        const yr = String(data.activeLabel);
                        // Map selection if it exists in detailed items
                        if (HISTORICAL_EVENTS_DETAILS[yr]) {
                          setSelectedMacroYear(yr);
                        } else {
                          // Find closest logged landmark year
                          const loggedLandmarks = Object.keys(HISTORICAL_EVENTS_DETAILS);
                          const closest = loggedLandmarks.reduce((prev, curr) => {
                            return Math.abs(parseInt(curr) - parseInt(yr)) < Math.abs(parseInt(prev) - parseInt(yr)) ? curr : prev;
                          });
                          setSelectedMacroYear(closest);
                        }
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorRates" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      domain={[0, 12]} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `${val}%`} 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={32} 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      name="CPI Retail Inflation (%)" 
                      dataKey="inflation" 
                      stroke="#ef4444" 
                      fill="url(#colorInflation)" 
                      strokeWidth={2} 
                      activeDot={{ r: 6 }} 
                    />
                    <Area 
                      type="monotone" 
                      name="1-Year Fixed Deposit Returns (%)" 
                      dataKey="interestRate" 
                      stroke="#10b981" 
                      fill="url(#colorRates)" 
                      strokeWidth={2} 
                      activeDot={{ r: 6 }} 
                    />
                    {/* Add Reference Lines to point out high crisis spikes */}
                    <ReferenceLine x="2013" stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Taper Tantrum', fill: '#64748b', fontSize: 9, position: 'top' }} />
                    <ReferenceLine x="2020" stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Pandemic Cut', fill: '#64748b', fontSize: 9, position: 'top' }} />
                    <ReferenceLine x="2026" stroke="#2cab52" strokeWidth={1.5} label={{ value: 'Active Threshold', fill: '#059669', fontSize: 9, position: 'top', fontWeight: 'bold' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Selector buttons list to toggle custom years */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 mr-1">Select Landmark Era:</span>
              {Object.keys(HISTORICAL_EVENTS_DETAILS).map((yr) => {
                const isActive = selectedMacroYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedMacroYear(yr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none cursor-pointer border ${
                      isActive 
                        ? "bg-[#071a2b] text-[#2cab52] border-[#2cab52]/40 shadow-sm font-black scale-102"
                        : "bg-white hover:bg-slate-50 text-slate-600 border-gray-200"
                    }`}
                  >
                    {yr === "2026" ? "2026 (Active)" : yr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side Info Board Column */}
          <div className="bg-slate-50 p-5 rounded-xl border border-gray-150 flex flex-col justify-between space-y-4">
            {HISTORICAL_EVENTS_DETAILS[selectedMacroYear] ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-[#071a2b]">
                    <Newspaper className="w-4.5 h-4.5 text-[#2cab52]" />
                    <h4 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900">
                      {HISTORICAL_EVENTS_DETAILS[selectedMacroYear].title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-red-50/50 rounded-lg border border-red-100">
                      <span className="text-[9px] uppercase font-bold text-red-500 block">Inflation</span>
                      <span className="font-black font-mono text-red-700 text-xs sm:text-sm">
                        {HISTORICAL_EVENTS_DETAILS[selectedMacroYear].inflation}
                      </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Typical FD Return</span>
                      <span className="font-black font-mono text-emerald-700 text-xs sm:text-sm">
                        {HISTORICAL_EVENTS_DETAILS[selectedMacroYear].rates}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Event Dynamics</span>
                    <p className="text-xs text-gray-650 leading-relaxed font-sans mt-0.5">
                      {HISTORICAL_EVENTS_DETAILS[selectedMacroYear].context}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200/60 text-xs space-y-1 mt-2">
                  <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider block flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Ira Advisory Tactical Insight</span>
                  </span>
                  <p className="text-amber-905 text-amber-900 leading-relaxed font-sans">
                    {HISTORICAL_EVENTS_DETAILS[selectedMacroYear].leverageHint}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-xs text-gray-400">
                Please select a financial marker to preview historical compliance dynamics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
