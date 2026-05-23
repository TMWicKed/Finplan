/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { 
  Compass, 
  Plus, 
  HelpCircle, 
  Calculator, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles,
  Info,
  AlertTriangle,
  X,
  TrendingDown,
  Percent,
  Download
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { FinancialGoal, RAHUL_SHARMA_GOALS } from "../types.js";

interface GoalGPSProps {
  goals: FinancialGoal[];
  setGoals: React.Dispatch<React.SetStateAction<FinancialGoal[]>>;
  authToken: string;
}

export default function GoalGPS({ goals, setGoals, authToken }: GoalGPSProps) {
  // Goal Creator State
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalType, setNewGoalType] = useState<"retirement" | "education" | "home" | "custom">("custom");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalYears, setNewGoalYears] = useState("");

  // Pushed recommendations state
  const [pushedNudges, setPushedNudges] = useState<any[]>([]);
  const [loadingNudges, setLoadingNudges] = useState<boolean>(false);

  const fetchClientNudges = async () => {
    if (!authToken) return;
    setLoadingNudges(true);
    try {
      const response = await fetch("/api/v1/news/suggestions", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // filter for pushed suggestions
        const pushed = (data.data.suggestions || []).filter((s: any) => s.pushed);
        setPushedNudges(pushed);
      }
    } catch (err) {
      console.error("Failed to load client pushed suggestions:", err);
    } finally {
      setLoadingNudges(false);
    }
  };

  const handleViewNudge = async (id: string) => {
    try {
      const response = await fetch("/api/v1/news/view-nudge", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ suggestionId: id })
      });
      const data = await response.json();
      if (data.success) {
        fetchClientNudges();
      }
    } catch (err) {
      console.error("Failed to mark nudge as viewed:", err);
    }
  };

  useEffect(() => {
    fetchClientNudges();
    // Setting clean live pooling logic to dynamically pull new nudges
    const interval = setInterval(fetchClientNudges, 4000);
    return () => clearInterval(interval);
  }, [authToken]);

  // Live Simulator States
  const [simMonthlySIP, setSimMonthlySIP] = useState<number>(10000);
  const [simAnnualRate, setSimAnnualRate] = useState<number>(12); // Nifty/MF standard ~12%
  const [simYears, setSimYears] = useState<number>(15);
  const [simInflationRate, setSimInflationRate] = useState<number>(6); // Standard ~6% in India
  
  const [simResult, setSimResult] = useState({
    futureValue: 0,
    totalInvestment: 0,
    wealthGained: 0,
    inflationAdjustedValue: 0
  });

  // Calculate simulated values using exact mathematical formulas
  useEffect(() => {
    const pmt = simMonthlySIP;
    const nominalRate = simAnnualRate / 100;
    const inflation = simInflationRate / 100;
    
    // 1. Monthly rate r & months n
    const r = nominalRate / 12;
    const n = simYears * 12;

    // 2. Future Value: FV = PMT × (((1 + r)^n - 1) / r) × (1 + r) (assuming begin rate)
    let fv = 0;
    if (r > 0) {
      fv = pmt * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    } else {
      fv = pmt * n;
    }

    // 3. Real Return compounding (inflation-adjusted real return)
    // real_return = (1 + nominal_return) / (1 + inflation_rate) - 1
    const realReturnRate = ((1 + nominalRate) / (1 + inflation)) - 1;
    const realR = realReturnRate / 12;
    
    let infAdjustedFv = 0;
    if (realR > 0) {
      infAdjustedFv = pmt * ((Math.pow(1 + realR, n) - 1) / realR) * (1 + realR);
    } else {
      infAdjustedFv = pmt * n;
    }

    const totalInvested = pmt * n;

    setSimResult({
      futureValue: Math.round(fv),
      totalInvestment: totalInvested,
      wealthGained: Math.round(Math.max(0, fv - totalInvested)),
      inflationAdjustedValue: Math.round(infAdjustedFv)
    });
  }, [simMonthlySIP, simAnnualRate, simYears, simInflationRate]);

  // Generate Recharts cumulative projection points over time
  const getChartData = () => {
    const data = [];
    const pmt = simMonthlySIP;
    const r = (simAnnualRate / 100) / 12;
    const inflation = simInflationRate / 100;
    const realReturnRate = ((1 + (simAnnualRate / 100)) / (1 + inflation)) - 1;
    const realR = realReturnRate / 12;

    for (let yr = 1; yr <= simYears; yr++) {
      const n = yr * 12;
      const fv = r > 0 ? pmt * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : pmt * n;
      const infFv = realR > 0 ? pmt * ((Math.pow(1 + realR, n) - 1) / realR) * (1 + realR) : pmt * n;
      const totalInv = pmt * n;

      data.push({
        year: `Y${yr}`,
        "Corpus (Nominal)": Math.round(fv),
        "Inflation Adjusted": Math.round(infFv),
        "Total Saved": totalInv
      });
    }
    return data;
  };

  const handleAddNewGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget || !newGoalYears) return;

    // Calculate inflation target (6%)
    const targetAmt = Number(newGoalTarget);
    const yrs = Number(newGoalYears);
    const infTarget = targetAmt * Math.pow(1 + 0.06, yrs);

    // Dynamic expected SIP assuming 12% returns
    const r = 0.12 / 12;
    const n = yrs * 12;
    const sipReq = (targetAmt * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));

    const newGoal: FinancialGoal = {
      id: `goal_${Date.now()}`,
      name: newGoalName,
      type: newGoalType,
      targetAmount: targetAmt,
      targetYears: yrs,
      currentFunding: 100, // standard new goal starting expectations
      monthlyRequiredSIP: Math.round(sipReq),
      inflationAdjustedTarget: Math.round(infTarget)
    };

    setGoals([...goals, newGoal]);
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalYears("");
    setShowAddGoal(false);
  };

  const formatRupee = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const formatINR = (val: number) => {
      return "INR " + new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
      }).format(val);
    };

    // Color Theme Settings
    const primaryNavy = [7, 26, 43];      // #071a2b
    const accentGreen = [44, 171, 82];     // #2cab52
    const warningRose = [225, 29, 72];     // #e11d48
    const darkSlate = [15, 23, 42];        // #0f172a
    const mutedSlate = [71, 85, 105];      // #475569
    const lightSlate = [241, 245, 249];    // #f1f5f9

    // --- PAGE 1: HEADER & ACTIVE GOALS ---
    
    // Header Banner
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, 210, 42, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("WEALTH GPS INVESTMENT REPORT", 15, 18);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
    doc.text("Client-Ready Comprehensive Goals Planning & Portfolio Protection Analysis", 15, 25);

    // Generation Timestamp
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const dateFormatted = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    doc.text(`Generated: ${dateFormatted}`, 135, 25);

    // Section 1: Executive Summary Title
    let currentY = 54;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("1. EXECUTIVE ADVISORY ANALYSIS", 15, currentY);
    
    doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setLineWidth(0.4);
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 8;

    // Advisory Narrative block
    doc.setFillColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, currentY, 180, 22, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("This report provides a formal strategic analysis of your primary financial objectives, monthly investment ratios,", 19, currentY + 5);
    doc.text("and core compounding metrics. All models account for targeted Indian Core CPI inflation levels (assumed at 6% CAGR)", 19, currentY + 10);
    doc.text("to ensure purchasing power safety. Review the tactical guidelines on Page 2 for managing risk and market drawdowns.", 19, currentY + 15);

    currentY += 30;

    // Section 2: Active Financial Goals Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("2. ACTIVE CLIENT FINANCIAL GOALS", 15, currentY);
    
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 8;

    // Goals Table Headers
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(15, currentY, 180, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Goal Name", 18, currentY + 5.5);
    doc.text("Type / Period", 62, currentY + 5.5);
    doc.text("Nominal Target", 97, currentY + 5.5);
    doc.text("Inflation Adj. (6%)", 132, currentY + 5.5);
    doc.text("Monthly SIP Required", 165, currentY + 5.5);

    currentY += 8;

    // Render Goals Rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFontSize(8);

    goals.forEach((g, idx) => {
      // Alternate row backgrounds
      if (idx % 2 === 1) {
        doc.setFillColor(lightSlate[0], lightSlate[1], lightSlate[2]);
        doc.rect(15, currentY, 180, 8.5, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.text(g.name.length > 24 ? g.name.substring(0, 22) + "..." : g.name, 18, currentY + 5.5);
      
      doc.setFont("helvetica", "normal");
      doc.text(`${g.type.toUpperCase()} (${g.targetYears} Yrs)`, 62, currentY + 5.5);
      doc.text(formatINR(g.targetAmount), 97, currentY + 5.5);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(warningRose[0], warningRose[1], warningRose[2]);
      doc.text(formatINR(g.inflationAdjustedTarget), 132, currentY + 5.5);
      
      doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
      doc.text(formatINR(g.monthlyRequiredSIP), 165, currentY + 5.5);

      // reset text color
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      currentY += 8.5;
    });

    currentY += 8;

    // Section 3: Live Sandbox Projection Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("3. ACTIVE RETIREE & WEALTH COMPOUNDING SANDBOX", 15, currentY);
    
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 8;

    // Sandbox Input Stats summary cards
    doc.setFillColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, currentY, 56, 16, "FD");
    doc.rect(77, currentY, 56, 16, "FD");
    doc.rect(139, currentY, 56, 16, "FD");

    // Card 1
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("CONTRIBUTION PRESET", 18, currentY + 4.5);
    doc.setFontSize(9);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(`${formatINR(simMonthlySIP)}/month`, 18, currentY + 11);

    // Card 2
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("EXPECTED RETURN CAGR", 80, currentY + 4.5);
    doc.setFontSize(9);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(`${simAnnualRate}% vs ${simInflationRate}% Inflation`, 80, currentY + 11);

    // Card 3
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("PLAN TENURE HORIZON", 142, currentY + 4.5);
    doc.setFontSize(9);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(`${simYears} Total Saving Years`, 142, currentY + 11);

    currentY += 22;

    // Sandbox Output metrics block
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(15, currentY, 180, 24, "F");

    // Output Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
    doc.text("SANDBOX SIMULATION OUTCOME (COMPLEX BEGIN-MODE COMPOUNDING)", 19, currentY + 5);

    // Metric 1: Total Principal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(190, 201, 210);
    doc.text("Total Cash Saved", 19, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(formatINR(simResult.totalInvestment), 19, currentY + 18);

    // Metric 2: Nominal Future Value
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(190, 201, 210);
    doc.text("Compound Value (Nominal)", 75, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
    doc.text(formatINR(simResult.futureValue), 75, currentY + 18);

    // Metric 3: Inflation Adjusted Value
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(190, 201, 210);
    doc.text("Purchasing Power Value", 135, currentY + 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(230, 241, 255);
    doc.text(formatINR(simResult.inflationAdjustedValue), 135, currentY + 18);

    // --- PAGE 2: RISK PLAYBOOK & REGULATORY WARNINGS ---
    doc.addPage();
    let p2Y = 20;

    // Page 2 header
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, 210, 15, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("WEALTH GPS INVESTMENT REPORT - RISK PLAYBOOK & EXPLANATORY GUIDE", 15, 9.5);

    p2Y = 25;

    // Layman guide risk explanations
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("4. VOLATILITY & INFLATION RISKS EXPLAINED (LAYMAN TERMS)", 15, p2Y);
    doc.line(15, p2Y + 2, 195, p2Y + 2);

    p2Y += 8;

    // Layman Volatility Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(warningRose[0], warningRose[1], warningRose[2]);
    doc.text("Market Volatility is Normal:", 15, p2Y);
    p2Y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("Growth is never a straight line. While Indian equities deliver average annual gains of 12% to 14%", 15, p2Y);
    p2Y += 4.5;
    doc.text("over a long period of 10-15 years, there will be brief years or months where your portfolio might decrease in", 15, p2Y);
    p2Y += 4.5;
    doc.text("value by 15% to 30%. This is expected market behavior. To gain the best compounding, investors should", 15, p2Y);
    p2Y += 4.5;
    doc.text("stay committed to their goals during sudden downswings and avoid panicking.", 15, p2Y);

    p2Y += 9;

    // Layman Inflation Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(warningRose[0], warningRose[1], warningRose[2]);
    doc.text("Inflation Decays Value Over Time:", 15, p2Y);
    p2Y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("An average inflation rate of 6% means the prices of items like education and medical services double nearly", 15, p2Y);
    p2Y += 4.5;
    doc.text("every 12 years. If you need INR 40 Lakhs today, that identical package will require an actual cash outlay of nearly", 15, p2Y);
    p2Y += 4.5;
    doc.text("INR 95.8 Lakhs in 15 years. Our Goal GPS automatically factors this compounding core decay in so that you", 15, p2Y);
    p2Y += 4.5;
    doc.text("never end up underfunded. Always focus on 'Inflation Adjusted' targets instead of nominal values.", 15, p2Y);

    p2Y += 12;

    // Strategic Protection Playbook Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("5. STRATEGIC PROTECTION PLAYBOOK (SEQUENCE OF RETURNS)", 15, p2Y);
    doc.line(15, p2Y + 2, 195, p2Y + 2);

    p2Y += 8;

    doc.setFillColor(254, 243, 199); // light orange warning
    doc.setDrawColor(245, 158, 11);
    doc.rect(15, p2Y, 180, 24, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    doc.text("Adviser Playbook Notice: The Dynamic Risk-Dewater Strategy", 19, p2Y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("To guarantee that a short-term market drop does not wipe out your savings right before your target date", 19, p2Y + 11);
    doc.text("(known as Sequence of Returns Risk), you are advised to migrate accumulated high-growth assets to stable", 19, p2Y + 15.5);
    doc.text("bank fixed deposits (FD) or safe government schemes 2-3 years prior to reaching your final goal year.", 19, p2Y + 20);

    p2Y += 34;

    // Section 6: SEBI compliance footer information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("6. REGULATORY COMPLIANCE NOTES", 15, p2Y);
    doc.line(15, p2Y + 2, 195, p2Y + 2);

    p2Y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    
    doc.text("1. All values, rates, and parameters are calibrated according to standard Indian SEBI advisory protocols.", 15, p2Y);
    p2Y += 4.5;
    doc.text("2. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.", 15, p2Y);
    p2Y += 4.5;
    doc.text("3. Bank savings deposit levels and Fixed Deposit rates are insured by the RBI DICGC scheme up to standard limits of INR 5 Lakhs.", 15, p2Y);
    p2Y += 4.5;
    doc.text("4. Linear calculations are simulated based on standard compounding rules and serve for client education only.", 15, p2Y);

    p2Y += 15;

    // Sign off or brand signature
    doc.setDrawColor(226, 232, 240);
    doc.line(15, p2Y, 195, p2Y);
    p2Y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("CONFIDENTIAL CLIENT DOCUMENT - PREPARED BY WEALTH GPS CO-PILOT", 15, p2Y);

    // Save PDF
    doc.save("Goal_GPS_Investment_Report.pdf");
  };

  return (
    <div id="goal-gps-section" className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Module Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-[#2cab52]" />
            <h2 className="text-2xl font-extrabold text-[#071a2b]">Goal GPS</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              Goal Tracking Microservice v1
            </span>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm">
            Configure dynamic targets, simulate corpus valuation with expected inflation adjustments, and track milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <button
            type="button"
            onClick={exportToPDF}
            className="px-4 py-2 bg-[#2cab52] hover:bg-[#259145] text-slate-900 rounded-xl font-bold text-sm flex items-center space-x-2 transition duration-150 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-900 stroke-[2.5]" />
            <span>Export Goals Report (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRiskModal(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-sm flex items-center space-x-2 transition duration-150 cursor-pointer border border-rose-100/60 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
            <span>Risk Disclosure Notice</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="px-4 py-2 bg-[#071a2b] hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center space-x-2 transition duration-150 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#2cab52] stroke-[3]" />
            <span>Add Custom Goal</span>
          </button>
        </div>
      </div>

      {/* Prominent Risk Disclosure Callout Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/60 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="bg-amber-100/80 p-2 rounded-xl text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Volatility & Inflation Warning Disclosure</h4>
            <p className="text-xs text-amber-950/80 leading-relaxed max-w-4xl">
              Linear target simulations assume clean, non-volatile market trajectories. Learn how <strong>core inflation</strong> compounding and <strong>sequence of returns volatility risk</strong> will dramatically alter your target goal milestones over time.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowRiskModal(true)}
          className="text-xs font-black text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-4 py-2.5 rounded-xl border border-amber-300/40 cursor-pointer shrink-0 transition"
        >
          Explore Risk Playbook
        </button>
      </div>

      {/* Pushed Advisor Nudges Tray */}
      {pushedNudges.length > 0 && (
        <div id="pushed-advisor-nudges-tray" className="bg-gradient-to-br from-[#0c243a] to-[#071a2b] text-white rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#2cab52] animate-pulse" />
              <h3 className="text-sm font-bold text-slate-150 uppercase tracking-wider">
                Strategic Recommendations from Senior Advisor
              </h3>
            </div>
            <span className="text-[10px] bg-[#2cab52]/20 text-[#2cab52] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#2cab52]/30">
              {pushedNudges.filter(n => !n.viewed).length} Pending Action
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pushedNudges.map((nudge) => (
              <div 
                key={nudge.id} 
                className={`p-4.5 rounded-xl border transition-all duration-200 relative ${
                  nudge.viewed 
                    ? "bg-slate-900/40 border-slate-800 text-slate-400" 
                    : "bg-slate-800/80 border-slate-700/80 text-white shadow-lg shadow-[#000]/20"
                }`}
              >
                <div className="flex items-start justify-between min-w-0">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        nudge.viewed 
                          ? "bg-slate-800 text-slate-500" 
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-400/20"
                      }`}>
                        {nudge.viewed ? "Acknowledged" : "Active Nudge"}
                      </span>
                      
                      {/* Trend Indicator */}
                      {nudge.sentimentTrend && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          nudge.sentimentTrend === "upward"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          <span>{nudge.sentimentTrend === "upward" ? "📈" : "📉"}</span>
                          <span className="capitalize">{nudge.sentimentTrend} Trend</span>
                        </span>
                      )}

                      {/* Urgency Badge */}
                      {nudge.urgency && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          nudge.urgency === "Critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse font-extrabold"
                            : nudge.urgency === "High"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/25"
                            : nudge.urgency === "Medium"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          <span>•</span>
                          <span>{nudge.urgency} Priority</span>
                        </span>
                      )}

                      <span className="text-[9px] text-gray-500 font-mono">
                        {new Date(nudge.pushedAt || Date.now()).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-200 tracking-tight leading-snug">
                      {nudge.headline}
                    </h4>
                  </div>
                  {!nudge.viewed && (
                    <button
                      type="button"
                      onClick={() => handleViewNudge(nudge.id)}
                      className="px-3 py-1.5 bg-[#2cab52] hover:bg-[#259145] text-slate-950 font-black text-[10px] rounded-lg tracking-wide uppercase cursor-pointer shrink-0 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-[#0c243a]/40 p-3 rounded-lg border border-slate-800/30">
                  <span className="font-bold text-[#2cab52] block text-[10px] uppercase mb-1">Direct Advisory recommendation:</span>
                  {nudge.recommendation}
                </p>

                <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed pl-1 italic">
                  <span className="font-bold text-gray-300 not-italic block text-[10px] uppercase mb-0.5">Tactical Rationale:</span>
                  "{nudge.rationale}"
                </p>

                {nudge.viewed && nudge.viewedAt && (
                  <div className="mt-3 text-[10px] text-slate-500 flex items-center space-x-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span>Viewed & Acknowledged at: {new Date(nudge.viewedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Creator Form */}
      {showAddGoal && (
        <form onSubmit={handleAddNewGoal} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xl max-w-xl animate-fade-in relative">
          <h3 className="text-base font-bold text-[#071a2b] mb-4 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#2cab52]" />
            <span>Create New Financial Target</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Goal Name</label>
              <input
                type="text"
                required
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="e.g. Higher Ed in London"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2cab52]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category Type</label>
              <select
                value={newGoalType}
                onChange={(e) => setNewGoalType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
              >
                <option value="education">Child Education</option>
                <option value="retirement">Retirement Corpus</option>
                <option value="home">Home Purchase</option>
                <option value="custom">Custom Goal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Amount (₹ / Rupees)</label>
              <input
                type="number"
                required
                min="10000"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="4000000"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2cab52]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tenure Target (Years)</label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={newGoalYears}
                onChange={(e) => setNewGoalYears(e.target.value)}
                placeholder="16"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2cab52]/40"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 border-t border-gray-50 pt-4">
            <button
              type="button"
              onClick={() => setShowAddGoal(false)}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2cab52] hover:bg-[#259145] text-[#071a2b] font-bold text-xs cursor-pointer shadow-md"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* Goal Cards Grid */}
      <div id="goals-card-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          return (
            <div
              key={goal.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-200 relative group"
            >
              <div className="absolute top-4 right-4 bg-gray-50 rounded-full p-2 group-hover:bg-[#2cab52]/10 transition-colors">
                <Compass className="w-5 h-5 text-gray-400 group-hover:text-[#2cab52] transition-colors" />
              </div>

              <div>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-[#071a2b] bg-[#2cab52]/10 inline-block mb-3">
                  {goal.type}
                </span>
                <h4 className="text-lg font-bold text-[#071a2b]">{goal.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">Target Horizon: {goal.targetYears} Years</p>

                {/* Corpus Numbers */}
                <div className="grid grid-cols-2 gap-4 my-5 bg-gray-50/60 p-4 rounded-xl border border-gray-50">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Target (Nominal)</span>
                    <span className="text-md font-bold text-slate-800">{formatRupee(goal.targetAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase leading-tight">Target (Inflation Adj. 6%)</span>
                    <span className="text-md font-bold text-rose-600">{formatRupee(goal.inflationAdjustedTarget)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                    <span>Expected Funding Ratio</span>
                    <span className={goal.currentFunding >= 60 ? "text-[#2cab52] font-bold" : "text-amber-600 font-bold"}>
                      {goal.currentFunding}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.currentFunding >= 60 ? "bg-[#2cab52]" : "bg-amber-500 animate-pulse"
                      }`}
                      style={{ width: `${goal.currentFunding}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4 mt-6 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-1.5 text-gray-400">
                  <Calculator className="w-3.5 h-3.5 text-[#2cab52]" />
                  <span>Required Monthly SIP:</span>
                </div>
                <span className="font-extrabold text-[#071a2b] text-sm bg-gray-100/50 px-2 py-1 rounded">
                  {formatRupee(goal.monthlyRequiredSIP)}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SIP Future Value & Real Return simulation */}
      <div id="goals-simulator-panel" className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-md">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-[#2cab52]" />
            <h3 className="text-lg font-bold text-[#071a2b]">Microservice SIP & Future Value Sandbox</h3>
          </div>
          <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded">
            Formula: FV = PMT × (((1 + r)^n - 1) / r)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sliders Control Pane */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex justify-between font-semibold text-xs text-gray-600 mb-2">
                <span className="uppercase">Monthly SIP Contribution</span>
                <span className="text-[#2cab52] font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded">
                  {formatRupee(simMonthlySIP)}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={simMonthlySIP}
                onChange={(e) => setSimMonthlySIP(Number(e.target.value))}
                className="w-full accent-[#2cab52] bg-gray-100 rounded-lg h-1.5"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>₹1k</span>
                <span>₹100k</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Expected Rate (CAGR %)</label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  step="0.5"
                  value={simAnnualRate}
                  onChange={(e) => setSimAnnualRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 italic">Equity avg: ~12-14%</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Inflation Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  value={simInflationRate}
                  onChange={(e) => setSimInflationRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 italic">Standard India core CPI ~6%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-xs text-gray-600 mb-2">
                <span className="uppercase">Tenure Horizon (Years)</span>
                <span className="text-[#071a2b] font-bold text-sm">
                  {simYears} Years
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={simYears}
                onChange={(e) => setSimYears(Number(e.target.value))}
                className="w-full accent-[#071a2b] bg-gray-100 rounded-lg h-1.5"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>1 Year</span>
                <span>40 Years</span>
              </div>
            </div>

            {/* Calculations recap */}
            <div className="bg-[#071a2b] text-slate-100 p-4 rounded-xl border border-[#1a334d] flex items-start space-x-2.5">
              <Sparkles className="w-5 h-5 text-[#2cab52] shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[10px] text-[#2cab52] font-mono tracking-wider font-extrabold uppercase">Real Return Engine</span>
                <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                  Adjusting for {simInflationRate}% Indian inflation, your actual purchasing power rate drops to {" "}
                  <strong className="text-white">
                    {(((1 + (simAnnualRate / 100)) / (1 + (simInflationRate / 100))) - 1 * 100).toFixed(2)}%
                  </strong>. 
                  Always construct goals using inflation-adjusted targets (Goals GPS does this automatically).
                </p>
              </div>
            </div>
          </div>

          {/* Graph visualizer */}
          <div className="lg:col-span-7 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">Saved Cash</span>
                <span className="text-xs font-bold text-gray-600">{formatRupee(simResult.totalInvestment)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">Compound Corpus</span>
                <span className="text-xs font-bold text-[#2cab52]">{formatRupee(simResult.futureValue)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">Purchasing Power</span>
                <span className="text-xs font-bold text-indigo-600">{formatRupee(simResult.inflationAdjustedValue)}</span>
              </div>
            </div>

            {/* Graph wrapper */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getChartData()}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2cab52" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2cab52" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAdjusted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" tickLine={false} style={{ fontSize: 10 }} />
                  <YAxis tickFormater={(v: number) => `₹${(v / 100000).toFixed(0)}L`} tickLine={false} style={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(val: number) => [formatRupee(val), ""]} 
                    contentStyle={{ borderRadius: 12, border: "1.5px solid #2cab52", fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="Corpus (Nominal)" stroke="#2cab52" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCorpus)" />
                  <Area type="monotone" dataKey="Inflation Adjusted" stroke="#4f46e5" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorAdjusted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-gray-400 flex items-center space-x-1 mt-3 justify-center">
              <Info className="w-3 h-3 text-[#2cab52]" />
              <span>Scroll sliders on the left to watch live projection curves adjust</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Risk Disclosure Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-[#071a2b]/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200">
          <div className="bg-white rounded-3xl border border-gray-150 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-white sticky top-0 z-10 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-100">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#071a2b] font-sans">Inflation & Volatility Risk Disclosure</h3>
                  <p className="text-[11px] text-rose-700 font-bold font-mono tracking-wider uppercase">Compliance Notice • Regulation Guide</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="text-gray-400 hover:text-[#071a2b] transition duration-150 p-2 hover:bg-gray-50 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              
              {/* Alert Warning Box */}
              <div className="bg-rose-50/40 border-l-4 border-l-rose-500 border border-rose-100 p-4 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-rose-800 text-xs uppercase tracking-wide">Primary Advisory Notice</h4>
                <p className="text-xs text-slate-705 leading-relaxed">
                  Linear compounding projections are highly simplified mathematical models. Real-world investment products are subject to market risks, systemic standard-deviation variance, macro inflations, and sequence of returns risk. Past performance never guarantees future returns.
                </p>
              </div>

              {/* Grid: 1. Volatility Risk vs 2. Inflation Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center space-x-2 text-[#071a2b]">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <h5 className="font-extrabold text-[#071a2b] text-xs uppercase tracking-wide">1. Market Volatility Risks</h5>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Indian equities (Nifty/Sensex) deliver average annualized returns of ~12% over 10-15 year horizons, but experience high volatility with potential short-term pullbacks of <strong className="text-rose-600 font-extrabold">-20% to -40%</strong> during corrections. Linear simulation hides these major systemic asset swings.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center space-x-2 text-[#071a2b]">
                    <Percent className="w-4 h-4 text-indigo-500" />
                    <h5 className="font-extrabold text-[#071a2b] text-xs uppercase tracking-wide">2. Inflation Decay Risks</h5>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    India Core CPI inflation (averaging ~6% CAGR) silently degrades your purchasing power. A nominal target profile of <strong>₹40 Lakhs</strong> needed today translates to a required cash outlay of <strong>₹95.8 Lakhs</strong> in 15 years. Standard non-indexed projections leave families heavily underfunded.
                  </p>
                </div>
              </div>

              {/* Exact Formula with Sandbox match info */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#071a2b] uppercase tracking-wider block font-sans">Compounding & Inflation Math</h4>
                <div className="bg-slate-900 text-slate-105 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px] leading-relaxed">
                  <div className="flex justify-between border-b border-white/5 pb-1 mb-1 text-[10px] text-emerald-400 uppercase tracking-widest font-black">
                    <span>Active Math Mechanics</span>
                    <span>Exact Formula</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nominal Future Value (FV):</span>
                    <span className="text-slate-300">PMT × [((1+r)^n - 1) / r] × (1+r)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real Inflation Adjusted Rate:</span>
                    <span className="text-[#2cab52]">((1 + Nominal Rate) / (1 + Inflation Rate)) - 1</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 font-sans italic leading-normal">
                    *Our simulator computes exact monthly compounded values based on Begin-mode recurring deposits.
                  </div>
                </div>
              </div>

              {/* Sequence of returns protection playbook */}
              <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-amber-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 font-bold" />
                  <span>Strategic Goal Protection Playbook</span>
                </h4>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  To safeguard against a market crash right before your target date (Sequence of Returns Risk), advisors recommend a <strong>"Risk Dewater Tapering"</strong> strategy. Gradually rebalance your accumulated equity corpus to safe triple-A bank deposits or high-yield savings (configured in savings-intelligence-service) 2-3 years prior to your goal date.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky bottom-0 z-10">
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-400">
                <Info className="w-4 h-4 text-[#2cab52]" />
                <span>Values generated comply with standard SEBI advisor protocols.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="px-5 py-2.5 bg-[#071a2b] hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md text-center transition"
              >
                Acknowledge & Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
