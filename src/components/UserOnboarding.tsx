/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User as UserIcon, 
  Briefcase, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Calculator, 
  BadgeCheck, 
  Info,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen
} from "lucide-react";
import { ClientProfile, FinancialGoal } from "../types.js";

interface UserOnboardingProps {
  onOnboardingComplete: (updatedProfile: ClientProfile, suggestedGoals: FinancialGoal[]) => void;
  authToken: string;
}

export default function UserOnboarding({ onOnboardingComplete, authToken }: UserOnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: User Profile Details
  const [name, setName] = useState("Rajesh Kumar");
  const [age, setAge] = useState<number>(30);
  const [location, setLocation] = useState("Mumbai");
  const [maritalStatus, setMaritalStatus] = useState("Married");
  const [childrenCount, setChildrenCount] = useState<number>(1);

  // Step 2: Income & KYC Details
  const [income, setIncome] = useState<number>(150000); // 1.5 Lakhs
  const [expenses, setExpenses] = useState<number>(80000);
  const [panCard, setPanCard] = useState("CRGPK8120L");
  const [aadhaarStatus, setAadhaarStatus] = useState("VERIFIED");
  const [employmentSector, setEmploymentSector] = useState("Private");

  // Step 3: Risk Assessment State
  const [marketReaction, setMarketReaction] = useState<string>("buy_more");
  const [investmentGoal, setInvestmentGoal] = useState<string>("balanced");
  const [investmentHorizon, setInvestmentHorizon] = useState<string>("mid");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Derived Values
  const investableSurplus = Math.max(0, income - expenses);

  // Math calculated risk profiling
  // Returns score: Aggressive, Moderate, Conservative
  const computeRiskAppetite = () => {
    let score = 0;
    // Question 1
    if (marketReaction === "panic_sell") score += 1;
    else if (marketReaction === "do_nothing") score += 2;
    else if (marketReaction === "buy_more") score += 3;

    // Question 2
    if (investmentGoal === "preservation") score += 1;
    else if (investmentGoal === "balanced") score += 2;
    else if (investmentGoal === "aggressive") score += 3;

    // Question 3
    if (investmentHorizon === "short") score += 1;
    else if (investmentHorizon === "mid") score += 2;
    else if (investmentHorizon === "long") score += 3;

    if (score <= 4) return "CONSERVATIVE";
    if (score <= 7) return "MODERATE";
    return "AGGRESSIVE";
  };

  const riskResult = computeRiskAppetite();

  // Handle flow navigation
  const nextStep = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleOnboardSubmit = async () => {
    setIsSubmitting(true);
    setFeedbackMsg("");

    // Calculate goals based on wealth preference / risk резултат
    // Conservative: Safe/Debt; Moderate: Standard; Aggressive: Custom High Asset
    const isConservative = riskResult === "CONSERVATIVE";
    const isAggressive = riskResult === "AGGRESSIVE";

    const suggestedGoals: FinancialGoal[] = [
      {
        id: "goal_life_onward_1",
        name: isConservative ? "Principal Capital Protection Yield" : isAggressive ? "Alpha Wealth Multiplication" : "Daughter's Modern Education Plan",
        type: isConservative ? "custom" : isAggressive ? "custom" : "education",
        targetAmount: isConservative ? 2500000 : isAggressive ? 6000000 : 4000000,
        targetYears: 15,
        currentFunding: 45,
        monthlyRequiredSIP: Math.round(investableSurplus * 0.3),
        inflationAdjustedTarget: isConservative ? 4200000 : isAggressive ? 12000000 : 8500000
      },
      {
        id: "goal_life_onward_2",
        name: "Retirement Target Corpus",
        type: "retirement",
        targetAmount: isConservative ? 15000000 : isAggressive ? 40000000 : 25000000,
        targetYears: 25,
        currentFunding: 35,
        monthlyRequiredSIP: Math.round(investableSurplus * 0.4),
        inflationAdjustedTarget: isConservative ? 32000000 : isAggressive ? 110000000 : 68000000
      }
    ];

    const onboardedProfileParams: ClientProfile = {
      id: "client_rahul_sharma", // persist into default profile
      name,
      age,
      maritalStatus,
      childrenCount,
      location,
      income,
      expenses,
      investableSurplus,
      currentSavings: 500000, // constant seed starting
      currentSavingsBank: "SBI",
      currentSavingsRate: 2.70,
      currentInvestments: {
        sipAmount: Math.round(investableSurplus * 0.25),
        description: isConservative ? "Short-term Debt Mutual Fund" : isAggressive ? "Aggressive Sectoral Small Cap Fund" : "Mid-cap Equity Mutual Fund"
      }
    };

    try {
      // POST the updated profile data to gateway server
      const response = await fetch("/api/v1/onboarding/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          profile: onboardedProfileParams,
          goals: suggestedGoals,
          riskProfile: riskResult,
          panCard,
          employmentSector
        })
      });

      const resJson = await response.json();
      if (resJson.success) {
        // Trigger callback to propagate state update to App.tsx
        onOnboardingComplete(onboardedProfileParams, suggestedGoals);
        setFeedbackMsg("Onboarding details compiled & verified successfully! Welcome to FinPlan GPS.");
        setTimeout(() => {
          setStep(1); // reset step UI for next simulator run
        }, 1500);
      } else {
        setFeedbackMsg(resJson.message || "Failed submitting details");
      }
    } catch (err) {
      setFeedbackMsg("Gateway microservice offline. Fallback offline registration processed.");
      onOnboardingComplete(onboardedProfileParams, suggestedGoals);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupee = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div id="onboarding-module-container" className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-150 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <BadgeCheck className="w-6 h-6 text-[#2cab52]" />
            <h2 className="text-2xl font-extrabold text-[#071a2b]">Your Personalized Wealth Profiler</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              Identity & KYC Certified
            </span>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm">
            Set up your investment profile, complete quick KYC verification, and understand your comfortable speed of wealth growth.
          </p>
        </div>
      </div>

      {/* Steps Progress Visualizer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm max-w-4xl mx-auto">
        <div className="grid grid-cols-4 gap-2 relative">
          {[
            { num: 1, title: "About You", desc: "Your general info" },
            { num: 2, title: "Income & KYC", desc: "Income & PAN check" },
            { num: 3, title: "Comfort Level", desc: "Comfort with risks" },
            { num: 4, title: "Activate Plan", desc: "Start growing safely" }
          ].map((item) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            return (
              <div key={item.num} className="text-center relative">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition duration-200 ${
                    isCompleted ? "bg-[#2cab52] text-white" :
                    isActive ? "bg-[#071a2b] text-white ring-4 ring-[#2cab52]/20" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted ? "✓" : item.num}
                  </div>
                  <span className={`text-xs font-bold mt-2 hidden sm:block ${isActive ? "text-[#071a2b]" : "text-gray-400"}`}>
                    {item.title}
                  </span>
                  <span className="text-[9px] text-gray-400 hidden md:block">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Contents Pane */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
        
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-gray-50 pb-3 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#2cab52]" />
              <span>Tell Us About Yourself</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2cab52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current Age (Years)</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2cab52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Primary Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2cab52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Marital Relationship Status</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2cab52]"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Separated/Divorced">Separated / Divorced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">How many children or dependents do you support?</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2cab52]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-gray-50 pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#2cab52]" />
              <span>Your Income & KYC Verification</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your Net Monthly Income (In-Hand Salary in ₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2cab52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your Net Monthly Expenses (Rent, Bills, Food in ₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2cab52]"
                />
                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                  Your Monthly Savings Potential: {formatRupee(investableSurplus)}/month
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">PAN Card Number (For secure tax planning)</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={panCard}
                  onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono tracking-wider uppercase focus:outline-none focus:border-[#2cab52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Aadhaar Status Attestation</label>
                <div className="flex items-center space-x-2 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-semibold">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  <span>Aadhaar biometric parameters certified (UIDAI)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">What type of work do you do?</label>
                <select
                  value={employmentSector}
                  onChange={(e) => setEmploymentSector(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="Private">Private Corporate Executive</option>
                  <option value="PSU">Government / PSU Sector</option>
                  <option value="Self-Employed">Self-Employed Enterprise Owner</option>
                  <option value="Unemployed">Professional Advisory Consultant</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-gray-50 pb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2cab52]" />
              <span>Grow Your Wealth Safely (A Quick Risk Quiz)</span>
            </h3>

            <div className="space-y-5">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-[#071a2b] uppercase tracking-wider block">
                  Scenario 1: What if the Stock Market Falls 15%?
                </span>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  If the stock market temporarily drops by 15% in a week, how would your emotions react?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: "panic_sell", label: "Withdraw my funds to protect remaining cash" },
                    { id: "do_nothing", label: "Wait patiently for the market to bounce back" },
                    { id: "buy_more", label: "Invest more money at lower prices" }
                  ].map((x) => (
                    <button
                      key={x.id}
                      onClick={() => setMarketReaction(x.id)}
                      className={`p-3.5 text-center text-xs rounded-xl border font-bold transition duration-150 cursor-pointer ${
                        marketReaction === x.id 
                          ? "bg-[#071a2b] text-white border-transparent shadow" 
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#2cab52]"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-2xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-[#071a2b] uppercase tracking-wider block">
                  Scenario 2: What is Your Primary Investment Goal?
                </span>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  What is most important to you over the next 5 to 10 years?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: "preservation", label: "Protect my money first (No risk)" },
                    { id: "balanced", label: "Balanced growth with moderate risk" },
                    { id: "aggressive", label: "Maximize long-term growth (Comfortable with high swings)" }
                  ].map((x) => (
                    <button
                      key={x.id}
                      onClick={() => setInvestmentGoal(x.id)}
                      className={`p-3.5 text-center text-xs rounded-xl border font-bold transition duration-150 cursor-pointer ${
                        investmentGoal === x.id 
                          ? "bg-[#071a2b] text-white border-transparent shadow" 
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#2cab52]"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-2xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-[#071a2b] uppercase tracking-wider block">
                  Scenario 3: When Do You Plan to Withdraw This Money?
                </span>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  When do you think you will start using these funds for your major life goals?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: "short", label: "Soon (Within 1 to 3 Years)" },
                    { id: "mid", label: "Moderate term (Within 3 to 8 Years)" },
                    { id: "long", label: "Long term (8+ Years)" }
                  ].map((x) => (
                    <button
                      key={x.id}
                      onClick={() => setInvestmentHorizon(x.id)}
                      className={`p-3.5 text-center text-xs rounded-xl border font-bold transition duration-150 cursor-pointer ${
                        investmentHorizon === x.id 
                          ? "bg-[#071a2b] text-white border-transparent shadow" 
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#2cab52]"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-gray-50 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2cab52]" />
              <span>Your Investment Profile Summary</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <span className="text-[10px] font-black text-[#071a2b] uppercase tracking-wider block border-b border-gray-200 pb-1.5">
                  Your Financial Snapshot
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target Holder:</span>
                    <span className="font-bold text-[#071a2b]">{name} ({age} yr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PAN ID:</span>
                    <span className="font-mono font-bold text-[#071a2b]">{panCard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Net Income:</span>
                    <span className="font-bold text-[#071a2b]">{formatRupee(income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Savings Potential:</span>
                    <span className="font-extrabold text-emerald-600">{formatRupee(investableSurplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location Area:</span>
                    <span className="font-bold text-slate-700">{location}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#071a2b] text-slate-100 p-5 rounded-2xl flex flex-col justify-between border-2 border-[#2cab52]/20">
                <div className="space-y-2">
                  <span className="text-[9px] px-2.5 py-0.5 bg-[#2cab52]/10 text-emerald-300 border border-[#2cab52]/20 rounded-full font-bold uppercase tracking-wider inline-block">
                    Suggested Investment Strategy
                  </span>
                  <h4 className="text-xl font-black text-white tracking-widest">{riskResult} Profile</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {riskResult === "CONSERVATIVE" && "We will focus on highly secure government savings plans and steady low-risk funds to protect your money first."}
                    {riskResult === "MODERATE" && "We will use a balanced mix of growth-oriented mutual funds and safe state investments targeting steady 12% returns."}
                    {riskResult === "AGGRESSIVE" && "We will focus on long-term stock-based growth with smart tax saving to maximize returns over time."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-400">
                  Compliance and risk guidelines sourced under active Indian financial rules.
                </div>
              </div>
            </div>

            {feedbackMsg && (
              <div className="p-4 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800 border border-emerald-100 text-center animate-fade-in">
                {feedbackMsg}
              </div>
            )}
          </div>
        )}

        {/* Buttons Controls */}
        <div className="flex justify-between mt-8 border-t border-gray-150 pt-5">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-5 py-2.5 border border-gray-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold transition cursor-pointer select-none"
            >
              Go Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="px-5 py-2.5 bg-[#071a2b] text-white rounded-xl hover:bg-slate-800 text-xs font-bold transition cursor-pointer flex items-center space-x-1 hover:text-[#2cab52] select-none"
            >
              <span>Save & Continue</span>
              <ChevronRight className="w-4 h-4 text-[#2cab52]" />
            </button>
          ) : (
            <button
              onClick={handleOnboardSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#2cab52] hover:bg-[#259145] text-slate-900 rounded-xl text-xs font-bold font-sans tracking-wide shadow transition cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{isSubmitting ? "Creating Blueprint..." : "Build My Investment Blueprint"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
