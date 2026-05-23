/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  TrendingUp, 
  Percent, 
  HelpCircle, 
  Briefcase, 
  ShieldCheck, 
  ArrowUpRight, 
  Info,
  Layers,
  Award
} from "lucide-react";
import { INVESTMENT_ALLOCATIONS_SEED, RAHUL_SHARMA_PROFILE } from "../types.js";

export default function InvestmentPlanner() {
  const [profile, setProfile] = useState(RAHUL_SHARMA_PROFILE);
  
  // Interactive tax optimizer user allocations
  const [alloc80C_PPF, setAlloc80C_PPF] = useState<number>(70000);
  const [alloc80C_ELSS, setAlloc80C_ELSS] = useState<number>(50000);
  const [alloc80CCD_NPS, setAlloc80CCD_NPS] = useState<number>(50000); // 80CCD(1B) limit is ₹50K
  const [alloc80D_Health, setAlloc80D_Health] = useState<number>(20000);
  const [alloc24B_HomeInterest, setAlloc24B_HomeInterest] = useState<number>(0); // Section 24B up to ₹2L

  const formatRupee = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Evaluate India specific tax optimization savings
  // Section 80C: PPF + ELSS + LIC + Employee EPF up to ₹1,50,000 maximum
  const raw80C = alloc80C_PPF + alloc80C_ELSS;
  const optimized80C = Math.min(150000, raw80C);
  
  // Section 80CCD(1B): NPS additional deduction up to ₹50,000 maximum
  const optimized80CCD = Math.min(50000, alloc80CCD_NPS);

  // Section 80D: Medical Insurance premium up to ₹25,000 maximum for family (or ₹50k if parents are senior citizens)
  const optimized80D = Math.min(25000, alloc80D_Health);

  // Section 24B: Interest on self-occupied house property loan up to ₹2,00,000 maximum
  const optimized24B = Math.min(200000, alloc24B_HomeInterest);

  const totalDeductionsClaimed = optimized80C + optimized80CCD + optimized80D + optimized24B;
  
  // Assuming a median tax slab of 20% (or 30% for high earners) to calculate dynamic tax rupees saved
  const estimatedTaxSaved = Math.round(totalDeductionsClaimed * 0.20); 

  return (
    <div id="investment-planner-section" className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Introduction */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-[#2cab52]" />
            <h2 className="text-2xl font-extrabold text-[#071a2b]">Investment Planner & Portfolio</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              Tax Optimizer & Portfolio Microservice v1
            </span>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm">
            Review PPF, NPS, ELSS asset distributions, and optimize tax write-offs for the old tax regime.
          </p>
        </div>
      </div>

      {/* Tax Saving Optimizer Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Tax inputs */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-[#071a2b] flex items-center space-x-2">
              <Percent className="w-4.5 h-4.5 text-[#2cab52]" />
              <span>Old Regime Tax Optimizer Sandbox (FY 2025-26)</span>
            </h3>
            <span className="text-[10px] font-semibold text-gray-400">Section 80C/80D/24B Limits</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                <span className="uppercase">Section 80C Mutual Funds / ELSS (Limit: 1.5L)</span>
                <span className="text-[#071a2b] font-bold">{formatRupee(alloc80C_ELSS)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={200000}
                step={5000}
                value={alloc80C_ELSS}
                onChange={(e) => setAlloc80C_ELSS(Number(e.target.value))}
                className="w-full h-1.5 accent-[#2cab52] bg-gray-100 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                <span className="uppercase">Section 80C Provident Fund / PPF (Limit: 1.5L)</span>
                <span className="text-[#071a2b] font-bold">{formatRupee(alloc80C_PPF)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={200000}
                step={5000}
                value={alloc80C_PPF}
                onChange={(e) => setAlloc80C_PPF(Number(e.target.value))}
                className="w-full h-1.5 accent-[#2cab52] bg-gray-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>PPF + ELSS Combined Claim: {formatRupee(raw80C)}</span>
                <span className="font-bold text-[#071a2b]">Eligible Deduction: {formatRupee(optimized80C)}</span>
              </div>
            </div>

            <div className="w-full h-[1px] bg-gray-100 my-4" />

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                <span className="uppercase">Section 80CCD(1B) NPS Tier-1 Deduction (Limit: ₹50k)</span>
                <span className="text-[#071a2b] font-bold">{formatRupee(alloc80CCD_NPS)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100000}
                step={2500}
                value={alloc80CCD_NPS}
                onChange={(e) => setAlloc80CCD_NPS(Number(e.target.value))}
                className="w-full h-1.5 accent-[#2cab52] bg-gray-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Additional retirement deduction</span>
                <span className="font-bold text-[#071a2b]">Deduction claimed: {formatRupee(optimized80CCD)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                <span className="uppercase">Section 80D Health Insurance Premium (Limit: ₹25k)</span>
                <span className="text-[#071a2b] font-bold">{formatRupee(alloc80D_Health)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={1000}
                value={alloc80D_Health}
                onChange={(e) => setAlloc80D_Health(Number(e.target.value))}
                className="w-full h-1.5 accent-[#2cab52] bg-gray-100 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                <span className="uppercase">Section 24B Home Loan Interest Repayment (Limit: ₹2L)</span>
                <span className="text-rose-600 font-bold">{formatRupee(alloc24B_HomeInterest)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={300000}
                step={10000}
                value={alloc24B_HomeInterest}
                onChange={(e) => setAlloc24B_HomeInterest(Number(e.target.value))}
                className="w-full h-1.5 accent-rose-600 bg-gray-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Applicable if buying property with a loan</span>
                <span className="font-bold text-rose-600">Deduction claimed: {formatRupee(optimized24B)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tax computation output */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#071a2b] to-slate-900 rounded-3xl p-6 text-slate-100 flex flex-col justify-between border border-slate-800 shadow-lg cursor-default">
          <div className="space-y-4">
            <span className="text-[10px] px-2.5 py-1 bg-[#2cab52]/10 text-[#2cab52] border border-[#2cab52]/20 rounded-full font-bold uppercase tracking-widest inline-block">
              Tax Relief Certificate
            </span>
            <h4 className="text-slate-200 font-bold text-base leading-tight">Optimized Exemption Summary</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on the simulated PPF, ELSS, NPS, and loan numbers above, your claimable deductions stack as follows:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Section 80C (PPF + ELSS):</span>
                <span className="font-bold text-slate-200">{formatRupee(optimized80C)}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Section 80CCD (NPS Premium):</span>
                <span className="font-bold text-slate-200">{formatRupee(optimized80CCD)}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Section 80D (Health Insurance):</span>
                <span className="font-bold text-slate-200">{formatRupee(optimized80D)}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Section 24B (Home Interest):</span>
                <span className="font-bold text-slate-200">{formatRupee(optimized24B)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 font-bold pt-1">
                <span>Total Taxable Income Deducted:</span>
                <span>{formatRupee(totalDeductionsClaimed)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-[#0c243a]/80 p-4 rounded-xl border border-[#1a334d]/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block leading-tight">Net Tax Rupees Saved</span>
                <span className="text-[10px] text-slate-500 block leading-tight">(Assuming 20% slab average)</span>
              </div>
              <span className="text-2xl font-black text-emerald-400">{formatRupee(estimatedTaxSaved)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocations Table List */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="w-5 h-5 text-[#2cab52]" />
          <h3 className="text-base font-bold text-[#071a2b]">FinPlan GPS Recommended Core Portfolio Instruments</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INVESTMENT_ALLOCATIONS_SEED.map((alloc) => (
            <div
              key={alloc.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition relative group"
            >
              <div className="absolute top-4 right-4 text-[#2cab52]">
                <Layers className="w-4 h-4" />
              </div>

              <div>
                <span className="text-[9px] bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider block w-max mb-2">
                  {alloc.category}
                </span>
                <h4 className="text-sm font-bold text-[#071a2b] pr-4">{alloc.instrument}</h4>
                
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase block font-semibold">Expected Return</span>
                    <span className="font-extrabold text-[#2cab52] text-sm">{alloc.expectedReturn.toFixed(1)}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase block font-semibold">Lock-In Period</span>
                    <span className="font-bold text-gray-700">{alloc.lockInPeriod}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-4 text-xs font-medium text-slate-500 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{alloc.taxSection}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-[#071a2b] shrink-0">
                  {alloc.benefitLimit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sovereign Gold Bond (SGB) & LTCG specific detail card */}
      <div className="bg-gray-50 rounded-2xl border border-gray-150 p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <h4 className="text-sm font-bold text-[#071a2b] flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Sovereign Gold Bonds (SGB) Insight</span>
          </h4>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Issued by the Reserve Bank of India (RBI) on behalf of the Government, SGBs offer a <strong>2.50% annual coupon interest</strong> paid semi-annually, plus capital gains appreciation linked to gold prices. Zero tax is payable on capital gains held until the 8-year maturity.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-150">
          <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-bold uppercase tracking-wider">LTCG Tax Amendment</span>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Equity mutual fund gains above <strong>₹1,00,000 per financial year</strong> are taxed under Long-Term Capital Gains (LTCG) regulations at <strong>10%</strong> (without indexation). Short-Term Capital Gains (STCG) are taxed at 15%. FinPlan GPS advises maintaining ELSS distributions with a minimum 3-year plan to capture LTCG benefits properly.
          </p>
        </div>
      </div>
    </div>
  );
}
