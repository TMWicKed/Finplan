/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  PiggyBank, 
  Search, 
  HelpCircle, 
  ArrowRightLeft, 
  TrendingUp, 
  Info,
  CheckCircle2,
  Sparkles,
  Calculator,
  ArrowUpRight,
  TrendingUp as TrendingUpIcon,
  Layers,
  ChevronRight
} from "lucide-react";

interface SavingsIntelligenceProps {
  authToken?: string;
}

interface BankComparisonResult {
  id: string;
  bankName: string;
  category: string;
  rate: number;
  totalInvested: number;
  futureValue: number;
  interestGained: number;
}

export default function SavingsIntelligence({ authToken }: SavingsIntelligenceProps) {
  const [activeCategory, setActiveCategory] = useState<"All" | "PSU" | "Private" | "SFB">("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Interactive microservice calculator parameters
  const [depositType, setDepositType] = useState<"savings" | "fd" | "rd">("savings");
  const [amount, setAmount] = useState<number>(500000); // 5L default
  const [tenureYears, setTenureYears] = useState<number>(5);
  
  // State from server API service
  const [comparisonResults, setComparisonResults] = useState<BankComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Web Scraping states (Addition 4)
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<string[]>([]);
  const [scrapedAt, setScrapedAt] = useState<string>("");

  // Auto-sweep parameters
  const [sweepAvgBalance, setSweepAvgBalance] = useState<number>(300000); 
  const [sweepThreshold, setSweepThreshold] = useState<number>(50000); 
  const [sweepSourceBank, setSweepSourceBank] = useState<string>("sbi");
  const [sweepDestBank, setSweepDestBank] = useState<string>("equitas");
  const [sweepYears, setSweepYears] = useState<number>(3);

  const formatRupee = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const runLiveRatesScraper = async () => {
    setIsScraping(true);
    setScrapeLogs(["Initiating headless web scraper session...", "Loading configuration policies..."]);
    
    try {
      const response = await fetch("/api/v1/savings/scrape-rates", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setScrapedAt(data.data.scrapedAt);
        const logs = data.data.scrapeLogs || [];
        
        // Sequentially project log feeds
        let i = 0;
        const interval = setInterval(() => {
          if (i < logs.length) {
            setScrapeLogs(prev => [...prev, logs[i]]);
            i++;
          } else {
            clearInterval(interval);
            setIsScraping(false);
            fetchBankComparisonsByAPI(); // refresh comparison rates
          }
        }, 350);
      } else {
        setScrapeLogs(prev => [...prev, "Error: Master Scraper microservice rejected connection with current AuthToken."]);
        setIsScraping(false);
      }
    } catch (err) {
      setScrapeLogs(prev => [...prev, "Error: Scraping Gateway service offline. Please verify routing tables."]);
      setIsScraping(false);
    }
  };

  // Helper local fallback calculation in case network fails
  const calculateLocalProjections = (type: "savings" | "fd" | "rd", amt: number, yrs: number) => {
    const REGULAR_BANK_RATES = [
      { bankName: "SBI (PSU)", category: "PSU", savingsRate: 2.70, fdRate: 6.80, rdRate: 6.80 },
      { bankName: "PNB (PSU)", category: "PSU", savingsRate: 2.70, fdRate: 6.75, rdRate: 6.75 },
      { bankName: "Bank of Baroda (PSU)", category: "PSU", savingsRate: 2.75, fdRate: 6.85, rdRate: 6.80 },
      { bankName: "HDFC Bank (Private)", category: "Private", savingsRate: 3.00, fdRate: 7.10, rdRate: 7.00 },
      { bankName: "ICICI Bank (Private)", category: "Private", savingsRate: 3.00, fdRate: 7.20, rdRate: 7.10 },
      { bankName: "Kotak Mahindra (Private)", category: "Private", savingsRate: 4.00, fdRate: 7.25, rdRate: 7.15 },
      { bankName: "Axis Bank (Private)", category: "Private", savingsRate: 3.00, fdRate: 7.15, rdRate: 7.10 },
      { bankName: "AU SFB (Small Finance)", category: "SFB", savingsRate: 7.25, fdRate: 8.00, rdRate: 7.75 },
      { bankName: "Equitas SFB (Small Finance)", category: "SFB", savingsRate: 7.00, fdRate: 8.50, rdRate: 8.00 },
      { bankName: "Jana SFB (Small Finance)", category: "SFB", savingsRate: 7.25, fdRate: 8.25, rdRate: 8.00 }
    ];

    return REGULAR_BANK_RATES.map((bank, index) => {
      let rate = bank.savingsRate;
      if (type === "fd") rate = bank.fdRate;
      else if (type === "rd") rate = bank.rdRate;
      
      let futureValue = 0;
      let totalInvested = amt;

      if (type === "rd") {
        totalInvested = amt * yrs * 12;
        // precise quarterly recurring deposit loop
        let accumulated = 0;
        const r = rate / 100;
        for (let i = 1; i <= yrs * 12; i++) {
          const remainingMonths = (yrs * 12) - i + 1;
          const quarters = remainingMonths / 3;
          accumulated += amt * Math.pow(1 + r / 4, quarters);
        }
        futureValue = Math.round(accumulated);
      } else {
        const r = rate / 100;
        futureValue = Math.round(amt * Math.pow(1 + r / 4, 4 * yrs));
      }

      const interestGained = Math.max(0, futureValue - totalInvested);

      return {
        id: `compare_${index + 1}`,
        bankName: bank.bankName,
        category: bank.category,
        rate,
        totalInvested,
        futureValue,
        interestGained
      };
    });
  };

  // Sync with API backend microservice
  const fetchBankComparisonsByAPI = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/v1/savings/compare-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          amount,
          tenureYears,
          type: depositType
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data && resJson.data.comparisonResults) {
        setComparisonResults(resJson.data.comparisonResults);
      } else {
        // Safe backend fallback representation inside client-side
        setComparisonResults(calculateLocalProjections(depositType, amount, tenureYears));
      }
    } catch (err) {
      setErrorMsg("Gateway service is processing parameters. Using local fallback metrics.");
      setComparisonResults(calculateLocalProjections(depositType, amount, tenureYears));
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when parameters or token change
  useEffect(() => {
    fetchBankComparisonsByAPI();
  }, [depositType, amount, tenureYears, authToken]);

  // Adjust defaults when depositType changes (lump sum vs recurring amount)
  const handleTypeChange = (newType: "savings" | "fd" | "rd") => {
    setDepositType(newType);
    if (newType === "rd" && amount > 50000) {
      setAmount(15000); // Set reasonable monthly RD amount default
    } else if (newType !== "rd" && amount <= 50000) {
      setAmount(500000); // Reset reasonable lump sum default
    }
  };

  const filteredBanks = comparisonResults.filter((b) => {
    const categoryMatches = activeCategory === "All" || b.category === activeCategory;
    const searchMatches = b.bankName.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatches && searchMatches;
  });

  // Calculate highest rate
  const sortedByRate = [...comparisonResults].sort((a, b) => b.rate - a.rate);
  const bestOption = sortedByRate[0];

  // Calculate standard SBI or PSU rate options for compare
  const sbiOption = comparisonResults.find(b => b.bankName.includes("SBI")) || comparisonResults[0];

  return (
    <div id="savings-intel-section" className="space-y-8 p-6 max-w-7xl mx-auto font-sans">
      
      {/* Intro Heading Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <PiggyBank className="w-6 h-6 text-[#2cab52]" />
            <h2 className="text-2xl font-extrabold text-[#071a2b]">Savings Maximizer</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              Grow Your Savings Faster
            </span>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm">
            Instantly compare current interest rates across major Indian banks and find the highest paying deposit plans.
          </p>
        </div>
      </div>

      {/* Dynamic Web Scraper Dashboard (Addition 4) */}
      <div className="bg-slate-930 rounded-2xl border border-slate-850 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1c2e 0%, #071221 100%)" }}>
        {/* Glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10 flex-1">
          <div className="flex items-center space-x-2 text-[#2cab52]">
            <Layers className="w-4 h-4 animate-pulse text-[#2cab52]" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Live Rate Verification</span>
          </div>
          <h3 className="text-base font-extrabold text-white">Live Rate Scanner</h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Scan and update deposit rates across major Indian banks instantly to view the latest, most accurate options.
          </p>
          {scrapedAt && (
            <p className="text-[10px] text-emerald-400 font-mono font-bold">
              Rates updated successfully on {new Date(scrapedAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          onClick={runLiveRatesScraper}
          disabled={isScraping}
          className="px-5 py-3 bg-[#2cab52] hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shrink-0 z-10 select-none shadow-lg shadow-emerald-950/10 border border-emerald-400/20"
        >
          {isScraping ? (
            <>
              <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Scanning bank websites...</span>
            </>
          ) : (
            <>
              <Layers className="w-4 h-4 text-slate-950" />
              <span>Update Rates Right Now</span>
            </>
          )}
        </button>

        {/* Live Terminal outputs */}
        {(isScraping || scrapeLogs.length > 0) && (
          <div className="w-full md:absolute md:bottom-0 md:left-0 md:right-0 bg-[#040c16]/95 border-t border-slate-800 max-h-40 overflow-y-auto p-4 z-20 font-mono text-[9px] text-[#2cab52] md:opacity-95 md:hover:opacity-100 transition-all animate-fade-in">
            <div className="flex justify-between items-center text-slate-400 font-bold border-b border-white/5 pb-1 mb-2">
              <span className="uppercase text-[8px] tracking-wider font-mono">Live Scan Logs</span>
              <button type="button" onClick={() => setScrapeLogs([])} className="text-[8px] text-slate-500 hover:text-white cursor-pointer font-bold font-mono">CLEAR</button>
            </div>
            <div className="space-y-1 text-[10px] font-mono leading-relaxed">
              {scrapeLogs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-1">
                  <span className="text-slate-500 shrink-0 font-mono">[{new Date().toLocaleTimeString()}]</span>
                  <span className={log.startsWith("Error:") ? "text-rose-400 font-bold font-mono" : "text-emerald-400 font-normal leading-relaxed font-mono"}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Selector Slider & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gradient-to-br from-[#0c243a] via-[#071a2b] to-[#040f1a] p-6 md:p-8 rounded-3xl text-slate-100 border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2cab52]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center space-x-2 text-[#2cab52]">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">Personal Rates Calculator</span>
          </div>
          
          <h3 className="text-lg font-bold text-white leading-tight">Calculate Your Potential Return</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Choose your planning budget and timeframe to see how much money your savings will earn you.
          </p>

          <div className="space-y-4 pt-1">
            {/* Tab selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">How do you want to save?</label>
              <div className="grid grid-cols-1 gap-1.5 bg-[#051320] p-1.5 rounded-xl border border-white/5">
                {[
                  { id: "savings", label: "Savings Account (Instant Access)" },
                  { id: "fd", label: "Fixed Deposit (Save Lump Sum)" },
                  { id: "rd", label: "Recurring Deposit (Save Monthly)" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTypeChange(t.id as any)}
                    className={`py-2 px-3 text-left text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      depositType === t.id 
                        ? "bg-[#2cab52] text-slate-900 shadow font-bold" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider / Numeric inputs */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {depositType === "rd" ? "Monthly Deposit Amount (₹)" : "One-Time Principal Balance (₹)"}
                </label>
                <span className="text-xs font-bold text-[#2cab52] font-mono">{formatRupee(amount)}</span>
              </div>
              <input
                type="range"
                min={depositType === "rd" ? 1000 : 10000}
                max={depositType === "rd" ? 100000 : 2500000}
                step={depositType === "rd" ? 1000 : 10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-[#2cab52] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                <span>Min: {depositType === "rd" ? "₹1,000" : "₹10,000"}</span>
                <span>Max: {depositType === "rd" ? "₹1 Lakh" : "₹25 Lakhs"}</span>
              </div>
            </div>

            {/* Tenure select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Horizon Tenure (Years)</label>
              <select
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full bg-[#051320] text-slate-100 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2cab52]"
              >
                <option value={1}>1 Year Horizon</option>
                <option value={3}>3 Years Horizon</option>
                <option value={5}>5 Years (Standard Horizon)</option>
                <option value={7}>7 Years Horizon</option>
                <option value={10}>10 Years Horizon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Sandbox Analytics Visualizer Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Baseline traditional returns SBI */}
          <div className="bg-[#051320]/60 rounded-2xl border border-white/5 p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                {sbiOption ? sbiOption.bankName : "SBI"} (PSU Standard Baseline)
              </span>
              <p className="text-xs text-slate-400">
                Performance under public sector bank rates with stable legacy.
              </p>
            </div>
            {sbiOption ? (
              <div className="mt-8 space-y-1">
                <span className="text-[9px] text-slate-500 block font-semibold uppercase">Projected Value (Age + {tenureYears}Yr)</span>
                <span className="text-2xl font-bold block text-slate-300">
                  {formatRupee(sbiOption.futureValue)}
                </span>
                <div className="flex items-center justify-between text-[10px] text-slate-400/80 font-mono pt-1 border-t border-white/5">
                  <span>Interest Earned:</span>
                  <span className="font-bold text-slate-300">{formatRupee(sbiOption.interestGained)}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  Applied Compound Rate: {sbiOption.rate}%
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Retrieving base parameters...</div>
            )}
          </div>

          {/* Premium Maximizer suggestion card */}
          <div className="bg-emerald-950/20 rounded-2xl border border-[#2cab52]/30 p-5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-[#2cab52] text-slate-900 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1 font-mono">
              <TrendingUpIcon className="w-2.5 h-2.5" />
              <span>Optimized Yield</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2cab52] block mb-1">
                {bestOption ? bestOption.bankName : "Small Finance Bank Peak"}
              </span>
              <p className="text-xs text-slate-300">
                Extract peak yields with RBI-DICGC insurance-guaranteed scheduled institutions.
              </p>
            </div>

            {bestOption && sbiOption ? (
              <div className="mt-8 space-y-1.5">
                <div>
                  <span className="text-[9px] text-emerald-400/80 block font-semibold uppercase">Projected Yield ({tenureYears}Yr)</span>
                  <span className="text-3xl font-extrabold block text-emerald-400">
                    {formatRupee(bestOption.futureValue)}
                  </span>
                </div>
                <div className="space-y-1 text-[10px] border-t border-[#2cab52]/10 pt-2">
                  <div className="flex justify-between text-emerald-300/80">
                    <span>Peak Compound Rate:</span>
                    <span className="font-extrabold">{bestOption.rate}%</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Interest Gained:</span>
                    <span className="font-black">{formatRupee(bestOption.interestGained)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-300 border-t border-dashed border-[#2cab52]/15 pt-1 mt-1 font-bold">
                    <span>Delta Wealth Gain:</span>
                    <span className="text-white">+ {formatRupee(bestOption.futureValue - sbiOption.futureValue)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Retrieving recommendations...</div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Sweep Potential Optimizer Section */}
      {(() => {
        const BANK_OPTIONS = [
          { id: "sbi", bankName: "SBI (PSU)", savingsRate: 2.70, fdRate: 6.80 },
          { id: "pnb", bankName: "PNB (PSU)", savingsRate: 2.70, fdRate: 6.75 },
          { id: "bob", bankName: "Bank of Baroda (PSU)", savingsRate: 2.75, fdRate: 6.85 },
          { id: "hdfc", bankName: "HDFC Bank (Private)", savingsRate: 3.00, fdRate: 7.10 },
          { id: "icici", bankName: "ICICI Bank (Private)", savingsRate: 3.00, fdRate: 7.20 },
          { id: "kotak", bankName: "Kotak Mahindra (Private)", savingsRate: 4.00, fdRate: 7.25 },
          { id: "axis", bankName: "Axis Bank (Private)", savingsRate: 3.00, fdRate: 7.15 },
          { id: "au", bankName: "AU SFB (Small Finance)", savingsRate: 7.25, fdRate: 8.00 },
          { id: "equitas", bankName: "Equitas SFB (Small Finance)", savingsRate: 7.00, fdRate: 8.55 },
          { id: "jana", bankName: "Jana SFB (Small Finance)", savingsRate: 7.25, fdRate: 8.25 }
        ];

        const srcBank = BANK_OPTIONS.find(b => b.id === sweepSourceBank) || BANK_OPTIONS[0];
        const tgtBank = BANK_OPTIONS.find(b => b.id === sweepDestBank) || BANK_OPTIONS[8];

        const sweepSurplus = Math.max(0, sweepAvgBalance - sweepThreshold);
        const sweepRetained = Math.min(sweepAvgBalance, sweepThreshold);

        const calcCompounded = (principal: number, annualRate: number, yrs: number) => {
          return Math.round(principal * Math.pow(1 + (annualRate / 100) / 4, 4 * yrs));
        };

        const fvNoSweep = calcCompounded(sweepAvgBalance, srcBank.savingsRate, sweepYears);
        const interestNoSweep = Math.max(0, fvNoSweep - sweepAvgBalance);

        const fvRetained = calcCompounded(sweepRetained, srcBank.savingsRate, sweepYears);
        const fvSwept = calcCompounded(sweepSurplus, tgtBank.fdRate, sweepYears);
        const fvWithSweep = fvRetained + fvSwept;
        const interestWithSweep = Math.max(0, fvWithSweep - sweepAvgBalance);

        const extraInterestEarned = Math.max(0, interestWithSweep - interestNoSweep);
        const percentIncrease = interestNoSweep > 0 ? (extraInterestEarned / interestNoSweep) * 100 : 0;

        return (
          <div id="auto-sweep-optimizer" className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2cab52] flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#071a2b]">Auto-Sweep Potential Optimizer</h3>
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
                    Unlock Passive Yield
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  A standard savings account leaves surplus capital idle. Auto-sweep maintains liquidity while automating movement of surplus funds to high-rate fixed deposits.
                </p>
              </div>
              
              <div className="mt-3 md:mt-0 flex items-center space-x-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl self-start">
                <span className="text-[10px] uppercase font-black text-slate-500 px-2 font-mono">Project Horizon</span>
                <div className="inline-flex rounded-lg border border-slate-200">
                  {[1, 3, 5].map((y) => (
                    <button
                      key={y}
                      onClick={() => setSweepYears(y)}
                      className={`px-3 py-1 text-xs font-bold transition rounded-md font-mono cursor-pointer ${
                        sweepYears === y 
                          ? "bg-[#071a2b] text-white shadow" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      {y} {y === 1 ? "Year" : "Years"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Controls Form: Left 5 Cols */}
              <div className="lg:col-span-5 space-y-5">
                {/* Input 1: Bank accounts select */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-[#071a2b]/75 uppercase tracking-wider mb-1.5">
                      1. Current Source Bank
                    </label>
                    <select
                      value={sweepSourceBank}
                      onChange={(e) => setSweepSourceBank(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2cab25] cursor-pointer"
                    >
                      {BANK_OPTIONS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.savingsRate.toFixed(2)}% Savings)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#071a2b]/75 uppercase tracking-wider mb-1.5">
                      2. Sweep-To Target Bank
                    </label>
                    <select
                      value={sweepDestBank}
                      onChange={(e) => setSweepDestBank(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2cab25] cursor-pointer"
                    >
                      {BANK_OPTIONS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.fdRate.toFixed(2)}% FD Rate)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slider 1: Average Monthly Savings Balance */}
                <div className="space-y-1 bg-slate-50/55 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      3. Average Savings Account Balance
                    </span>
                    <span className="text-[13px] font-black text-[#071a2b] font-mono">
                      {formatRupee(sweepAvgBalance)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={2500000}
                    step={10000}
                    value={sweepAvgBalance}
                    onChange={(e) => setSweepAvgBalance(Number(e.target.value))}
                    className="w-full accent-[#2cab25] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                    <span>Min: ₹20,000</span>
                    <span>Max: ₹25 Lakhs</span>
                  </div>
                </div>

                {/* Slider 2: Sweep Retention Threshold */}
                <div className="space-y-1 bg-slate-50/55 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        4. Sweep Trigger Threshold
                      </span>
                      <div className="group relative">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-900 text-white text-[9px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-30 shadow-lg leading-relaxed font-sans font-medium">
                          Keeps this exact flat buffer in liquid savings; everything above this threshold automatically sweeps into the high-rate FD.
                        </div>
                      </div>
                    </div>
                    <span className="text-[13px] font-black text-[#071a2b] font-mono">
                      {formatRupee(sweepThreshold)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={500000}
                    step={5000}
                    value={sweepThreshold}
                    onChange={(e) => setSweepThreshold(Number(e.target.value))}
                    className="w-full accent-[#2cab25] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                    <span>Min: ₹10,000</span>
                    <span>Max: ₹5 Lakhs</span>
                  </div>
                </div>

                {/* Helper micro-indicators */}
                <div className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-500/10 text-[11px] text-emerald-900 space-y-1">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Auto-Sweep monthly allocation breakdown:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                      <span className="text-slate-500 block">⚡ Liquid Reserves:</span>
                      <span className="font-extrabold text-slate-800">{formatRupee(sweepRetained)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">⚙️ Auto-Swept to FD:</span>
                      <span className="font-extrabold text-emerald-700">{formatRupee(sweepSurplus)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Visualizer: Right 7 Cols */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                
                {/* Main Delta Banner Card */}
                <div className="bg-gradient-to-br from-[#0c243a] to-[#051320] p-5 rounded-2xl text-white border border-slate-800 flex items-center justify-between relative overflow-hidden shrink-0 shadow-lg" style={{ background: "linear-gradient(135deg, #0c243a 0%, #051320 100%)" }}>
                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2cab25]/15 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-1.5 z-10">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block font-mono">
                      Guaranteed Dynamic Compound Delta
                    </span>
                    <span className="text-xs text-slate-300">Extra interest earned seamlessly:</span>
                    <div className="flex items-baseline space-x-2">
                      <h4 className="text-3xl font-black text-[#2cab25] tracking-tight font-display-title">
                        +{formatRupee(extraInterestEarned)}
                      </h4>
                      {percentIncrease > 0 && (
                        <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/15 px-2 py-0.5 rounded-full">
                          +{percentIncrease.toFixed(0)}% Boost
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed">
                      Calculated systematically with quarterly interest compounded over {sweepYears} Years inside DICGC layers.
                    </p>
                  </div>

                  {/* Graphic Circle Progress of Sweep */}
                  <div className="hidden sm:flex flex-col items-center justify-center p-3 z-10 shrink-0">
                    <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-white/5" style={{ background: "conic-gradient(#2cab25 0% " + (sweepAvgBalance > 0 ? (sweepSurplus / sweepAvgBalance) * 100 : 0) + "%, rgba(255,255,255,0.05) 0% 100%)" }}>
                      <div className="absolute inset-2 bg-[#051320] rounded-full flex flex-col items-center justify-center">
                        <span className="text-[9px] text-slate-400 uppercase font-black text-center leading-none">Swept</span>
                        <span className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                          {sweepAvgBalance > 0 ? Math.round((sweepSurplus / sweepAvgBalance) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Comparison details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Traditional (Baseline) */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">
                          Basic Savings Protocol
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {srcBank.savingsRate.toFixed(2)}% Rate
                        </span>
                      </div>
                      <h5 className="text-slate-800 font-extrabold text-sm mt-1">{srcBank.bankName}</h5>
                      <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                        Surplus balance sits dormant under standard low savings yield.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Total Interest Earned</span>
                      <span className="text-base font-bold text-slate-700 font-mono">
                        {formatRupee(interestNoSweep)}
                      </span>
                      <div className="flex justify-between text-[9px] text-slate-500 pt-0.5 mt-0.5">
                        <span>Maturity Sum:</span>
                        <span className="font-mono">{formatRupee(fvNoSweep)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optimized (Auto-sweep active) */}
                  <div className="bg-emerald-50/20 border border-emerald-500/15 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-black text-emerald-700 tracking-wider">
                          Auto-Sweep Protocol
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 font-mono">
                          {tgtBank.fdRate.toFixed(2)}% Peak
                        </span>
                      </div>
                      <h5 className="text-slate-800 font-extrabold text-sm mt-1">Sweep to {tgtBank.bankName}</h5>
                      <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                        Surplus above {formatRupee(sweepThreshold)} relocated systematically to high-yield FD.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-500/10">
                      <span className="text-[9px] text-emerald-600 block font-black uppercase">Total Interest Earned</span>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        {formatRupee(interestWithSweep)}
                      </span>
                      <div className="flex justify-between text-[9px] text-emerald-700/80 pt-0.5 mt-0.5">
                        <span>Maturity Sum:</span>
                        <span className="font-mono font-bold">{formatRupee(fvWithSweep)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informational trigger note */}
                {sweepSurplus === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-center text-[10px] font-black uppercase tracking-wider animate-pulse leading-normal">
                    ⚠️ Attention: Your balance is below the sweep trigger threshold! Lower the threshold to start earning optimized interest on surplus.
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/50 text-emerald-800 border border-emerald-100/40 rounded-xl flex items-center justify-between text-[11px] leading-relaxed">
                    <span className="font-medium text-slate-600">
                      🔮 Auto-Sweep maintains full liquidity! If the balance falls, swept FD funds dissolve instantly back to cash.
                    </span>
                    <span className="text-[9px] font-black text-emerald-700 font-mono bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                      ACTIVE
                    </span>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* Grid Filter Actions */}
      <div className="bg-white rounded-2xl border border-gray-150 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Sort Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 md:pb-0">
          {(["All", "PSU", "Private", "SFB"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer select-none ${
                activeCategory === cat
                  ? "bg-[#071a2b] text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {cat === "All" ? "All Major Banks" : cat === "SFB" ? "Small Finance Banks (SFBs)" : `${cat} Institutions`}
            </button>
          ))}
        </div>

        {/* Input search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bank name..."
            className="w-full md:w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2cab52]/40"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Indian Deposit Insurance Warning Info */}
      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start space-x-3 text-xs leading-relaxed max-w-4xl">
        <Info className="w-5 h-5 text-[#2cab52] shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-0.5 text-emerald-900">Is my money safe? Yes, 100% insured up to ₹5 Lakhs!</span>
          Your money is fully protected. The Reserve Bank of India (RBI) guarantees and insures your deposits (both your principal saved and interest earned) up to <strong className="text-emerald-900">₹5,00,000 (5 Lakhs Rupees)</strong> per bank through the official <strong className="text-emerald-900">DICGC insurance scheme</strong>. This gives you ultimate sovereign-backed safety for your cash.
        </div>
      </div>

      {/* Main Comparative Dynamic Rates Table Grid */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 font-semibold space-y-2">
              <span className="animate-spin block h-5 w-5 bg-emerald-400 rounded-full mx-auto" />
              <p className="text-xs">Calculating compound interest gains...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-150 font-bold text-[10px] text-gray-400 uppercase tracking-widest select-none">
                  <th className="p-4">Trusted Bank</th>
                  <th className="p-4">Bank Type</th>
                  <th className="p-4 text-center">Interest Rate</th>
                  <th className="p-4 text-right">Your Total Saved</th>
                  <th className="p-4 text-right">Total Sum at the End</th>
                  <th className="p-4 text-right">Your Total Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredBanks.map((bank) => {
                  const isSFB = bank.category === "SFB";
                  const isTopRate = bank.rate >= 7.0;

                  return (
                    <tr key={bank.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="p-4 font-bold text-[#071a2b]">
                        <div className="flex items-center space-x-2">
                          <PiggyBank className={`w-4 h-4 ${isSFB ? "text-[#2cab52]" : "text-slate-400"}`} />
                          <span className="text-sm">{bank.bankName}</span>
                          {isTopRate && (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">
                              Top Yield
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          bank.category === "SFB" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          bank.category === "Private" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                          "bg-slate-50 text-slate-700 border border-slate-100"
                        }`}>
                          {bank.category}
                        </span>
                      </td>
                      <td className="p-4 text-center font-extrabold text-sm text-[#071a2b] bg-slate-50/20">
                        {bank.rate.toFixed(2)}%
                      </td>
                      <td className="p-4 text-right font-medium text-gray-500 font-mono">
                        {formatRupee(bank.totalInvested)}
                      </td>
                      <td className="p-4 text-right font-black text-[#071a2b] text-sm font-mono">
                        {formatRupee(bank.futureValue)}
                      </td>
                      <td className="p-4 text-right font-extrabold text-[#2cab52] text-sm font-mono">
                        +{formatRupee(bank.interestGained)}
                      </td>
                    </tr>
                  );
                })}

                {filteredBanks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">
                      No matching banks found in category or search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
