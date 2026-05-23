/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  HelpCircle, 
  ArrowRight, 
  Home, 
  ChevronRight, 
  Sparkles, 
  Trash2,
  Wallet,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { DEMO_WHATIF_SCENARIO, RAHUL_SHARMA_PROFILE } from "../types.js";

interface WhatIfEngineProps {
  onAskIra: (question: string) => void;
  setTab: (tab: string) => void;
  whatIfState: any;
  setWhatIfState: React.Dispatch<React.SetStateAction<any>>;
}

export default function WhatIfEngine({ onAskIra, setTab, whatIfState, setWhatIfState }: WhatIfEngineProps) {
  // Scenario Config States
  const [propertyPrice, setPropertyPrice] = useState<number>(8000000); // ₹80L
  const [downPayment, setDownPayment] = useState<number>(1500000); // ₹15L
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.75); // SBI rate ~8.75%
  
  // Calculated status
  const [loanAmount, setLoanAmount] = useState<number>(6500000);
  const [calculatedEMI, setCalculatedEMI] = useState<number>(57410);
  const [surplusDropped, setSurplusDropped] = useState<number>(21000);
  const [rebalanceActivated, setRebalanceActivated] = useState(false);

  // Math equations calculation (EMI Formula)
  useEffect(() => {
    const p = Math.max(0, propertyPrice - downPayment);
    const r = (interestRate / 100) / 12;
    const n = tenureYears * 12;

    // EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
    let emiAmt = 0;
    if (r > 0 && n > 0) {
      emiAmt = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else if (n > 0) {
      emiAmt = p / n;
    }

    // Rent offset: rent savings of ₹18,000 when moving to own house
    const rentOffset = 18000;
    const additionalCommitment = Math.max(0, emiAmt - rentOffset);
    const remainingSurplus = Math.max(0, RAHUL_SHARMA_PROFILE.investableSurplus - additionalCommitment);

    setLoanAmount(p);
    setCalculatedEMI(Math.round(emiAmt));
    setSurplusDropped(Math.round(remainingSurplus));

    // Expose whatife state to Ira chat agent if needed
    setWhatIfState({
      propertyPrice,
      downPayment,
      tenureYears,
      interestRate,
      calculatedEMI: Math.round(emiAmt),
      remainingSurplus: Math.round(remainingSurplus)
    });
  }, [propertyPrice, downPayment, tenureYears, interestRate]);

  const formatRupee = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleMakeItWork = () => {
    setRebalanceActivated(true);
  };

  const handleConsultIra = () => {
    const prompt = `Solve this What-If: I want to buy a Bangalore home worth ${formatRupee(propertyPrice)} with ${formatRupee(downPayment)} down payment. EMI is ${formatRupee(calculatedEMI)}, cutting my surplus to ${formatRupee(surplusDropped)}. Rebalance my goals.`;
    onAskIra(prompt);
    setTab("ira");
  };

  return (
    <div id="what-if-section" className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Introduction */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-[#2cab52]" />
            <h2 className="text-2xl font-extrabold text-[#071a2b]">What-If Simulation Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              Scenario Simulation Microservice v1
            </span>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm">
            Simulate life-altering events dynamically. Calculate direct impacts on cash levels and secondary goals instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left pane: Slider parameters */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-[#071a2b] flex items-center space-x-2 border-b border-gray-50 pb-3">
            <Home className="w-4.5 h-4.5 text-[#2cab52]" />
            <span>Bangalore 2BHK Flat Scenario Configuration</span>
          </h3>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                <span>Property Market Price</span>
                <span className="text-[#071a2b] font-extrabold">{formatRupee(propertyPrice)}</span>
              </div>
              <input
                type="range"
                min={4000000} // 40L
                max={15000000} // 1.5 Cr
                step={250000}
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className="w-full h-1.5 accent-[#2cab52] bg-gray-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>₹40 Lakhs</span>
                <span>₹1.5 Crores</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                <span>Planned Down Payment Capital</span>
                <span className="text-[#2cab52] font-extrabold">{formatRupee(downPayment)}</span>
              </div>
              <input
                type="range"
                min={1000000} // 10L
                max={5000000} // 50L
                step={100000}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full h-1.5 accent-[#2cab52] bg-gray-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>₹10 Lakhs</span>
                <span>₹50 Lakhs</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Loan Tenure (Years)</label>
                <select
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value={10}>10 Years</option>
                  <option value={15}>15 Years</option>
                  <option value={20}>20 Years (Standard)</option>
                  <option value={25}>25 Years</option>
                  <option value={30}>30 Years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Home Loan Interest Rate (%)</label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  step="0.05"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">SBI avg: ~8.50% - 8.85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Real-time impacts visualization */}
        <div className="lg:col-span-6 bg-slate-50 border border-gray-100 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-[#071a2b] uppercase tracking-wider">Dynamic Cash Impact Projections</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-150">
                <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none">Net Principal Loan</span>
                <span className="text-lg font-extrabold text-slate-800 tracking-tight mt-1 inline-block">
                  {formatRupee(loanAmount)}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-rose-100">
                <span className="text-[10px] text-rose-500 font-bold block uppercase leading-none">Calculated Monthly EMI</span>
                <span className="text-lg font-black text-rose-600 tracking-tight mt-1 inline-block">
                  {formatRupee(calculatedEMI)}/mo
                </span>
              </div>
            </div>

            {/* Surplus crash panel */}
            <div className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Investable Cash Surplus Crash</span>
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="text-gray-500">
                  <span>Current Surplus:</span>
                  <p className="text-sm text-[#071a2b]">{formatRupee(RAHUL_SHARMA_PROFILE.investableSurplus)}/mo</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2cab52]" />
                <div className="text-right text-rose-600">
                  <span>Simulated Surplus:</span>
                  <p className="text-sm font-extrabold">{formatRupee(surplusDropped)}/mo</p>
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                <div className="absolute left-0 top-0 h-full bg-[#2cab52]" style={{ width: "100%" }} />
                <div className="absolute left-0 top-0 h-full bg-rose-500" style={{ width: `${(surplusDropped / RAHUL_SHARMA_PROFILE.investableSurplus) * 100}%` }} />
              </div>
            </div>

            {/* Impact indicator */}
            <div className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Goals GPS Funding Dilutions</span>
              
              <div className="space-y-2">
                <div className="text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-600">Daughter's Education (Target 16yr)</span>
                    <span className="text-right">
                      <span className="line-through text-gray-400 mr-2">70%</span> 
                      <span className="text-amber-600">41% Funded</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#fcedeb] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: "41%" }} />
                  </div>
                </div>

                <div className="text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-600">Retirement Corpus (Target 28yr)</span>
                    <span className="text-right">
                      <span className="line-through text-gray-400 mr-2">65%</span> 
                      <span className="text-rose-600">32% Funded</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#fcedeb] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-600 h-full rounded-full" style={{ width: "32%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleMakeItWork}
              className="flex-1 py-3 bg-[#2cab52] hover:bg-[#259145] text-[#071a2b] font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Make It Work</span>
            </button>
            <button
              onClick={handleConsultIra}
              className="flex-1 py-3 bg-[#071a2b] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1 cursor-pointer border border-[#2cab52]/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2cab52]" />
              <span>Consult Ira AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Make it Work solution card */}
      {rebalanceActivated && (
        <div className="bg-white border-2 border-[#2cab52]/40 rounded-3xl p-6 md:p-8 shadow-xl animate-fade-in space-y-6">
          <div className="flex items-center space-x-2 text-[#2cab52]">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h3 className="text-base font-extrabold text-[#071a2b]">Ira Automated Rebalancing Plan Generated</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#2cab52] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">1. Optimize Fixed Holding Yield</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Transfer ₹5 Lakhs idle cash from SBI (2.70%) to AU SFB or Jana (7.25%). Gains <strong>₹1,38,000 extra interest</strong> over 5 years.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#2cab52] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">2. Section 24B Tax Write-off</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Claim home loan interest up to ₹2 Lakhs limit under Section 24B, generating <strong>₹40,000/year cashback savings</strong> based on 20% tax slab.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#2cab52] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">3. Equities SIP Rebalance</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Adjust standard expenses. Allocate ₹10,000/mo into tax-saving ELSS Mutual Funds (+14% returns standard) to compress target gap back to 95%.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 italic">This automation plan is pre-approved for immediate planner review & execution</span>
            <button
              onClick={() => {
                setRebalanceActivated(false);
              }}
              className="px-3.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 font-bold cursor-pointer"
            >
              Clear Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
