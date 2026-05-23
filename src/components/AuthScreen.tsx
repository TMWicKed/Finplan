/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Compass, 
  User, 
  Lock, 
  Mail, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  PiggyBank, 
  Percent, 
  BadgeCheck 
} from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const resData = await response.json();
      if (resData.success) {
        onLoginSuccess(resData.data.user);
      } else {
        setErrorMsg(resData.message || "Invalid email or password");
      }
    } catch (err) {
      setErrorMsg("Failed to reach Gateway Auth Service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const prefillPlanner = () => {
    setEmail("planner@finplan.in");
    setPassword("planner123");
    setErrorMsg("");
  };

  const prefillClient = () => {
    setEmail("rahul@gmail.com");
    setPassword("rahul123");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden font-sans text-slate-800">
      
      {/* Structural Containment */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Column: Corporate Brand Showcase & Interactive Value Propositions (7 Grid Span) */}
        <div className="lg:col-span-7 bg-[#071a2b] text-white p-8 sm:p-12 flex flex-col justify-between relative">
          {/* Subtle Ambient Accent */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-[#2cab25]/5 rounded-full blur-[90px]" />
          
          <div className="space-y-8 relative z-10">
            {/* Elite Brand Header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2cab25] rounded-xl flex items-center justify-center shadow-md shadow-[#2cab25]/20">
                <Compass className="w-5.5 h-5.5 text-white stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#2cab25] tracking-widest uppercase block leading-none">ALPHA PLATFORM</span>
                <h1 className="text-lg font-black tracking-tight text-white leading-none mt-0.5">
                  FinPlan <span className="text-[#2cab25]">GPS</span>
                </h1>
              </div>
            </div>

            {/* Premium Headline & One Strong Value Proposition */}
            <div className="space-y-3.5">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Dynamic Wealth GPS.<br />
                Built for Certainty.
              </h2>
              <p className="text-slate-300 text-sm sm:text-[14.5px] leading-relaxed max-w-xl">
                Elevating retail and family wealth planning through transparent, real-time, explainable agentic AI insights paired with institutional Indian macroeconomic rigor.
              </p>
            </div>

            {/* 3 to 5 Primary Product Benefits */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 text-[#2cab25]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white">Automated Goal-GPS Drift Indicators</h4>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Test, track, and secure long-term capital allocation for child tuition and retirement with automatic alerts.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 text-[#2cab25]">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white">Savings Yield Maximization Engine</h4>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Identify passive, underperforming capital in basic savings accounts and move them to audited, high-rate alternative options instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 text-[#2cab25]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white">Ira Conversational Agent</h4>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Interactive chat assistance featuring bias indicators and real-time behavioral diagnostics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof & Trust Metrics Box */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">RELIABILITY METRIC</span>
              <span className="text-sm sm:text-base font-black text-white font-mono flex items-center gap-1">
                ₹4,500+ Cr <BadgeCheck className="w-4 h-4 text-[#2cab25] shrink-0" />
              </span>
              <p className="text-[10px] text-slate-400">Assets modeled & risk-mapped</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">REGULATORY COBALT</span>
              <span className="text-sm sm:text-base font-black text-white font-mono">
                100% Secure
              </span>
              <p className="text-[10px] text-slate-400">DICGC covered bank comparisons</p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Institutional Login Form Gate (5 Grid Span) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div className="my-auto space-y-6">
            
            {/* Header statement */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#071a2b] tracking-tight">Institutional Access</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide secure credentials to enter your customized financial planning cockpit.
              </p>
            </div>

            {/* Quick pre-set switches */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2.5">
              <span className="text-[9px] font-black text-[#071a2b]/75 uppercase tracking-wider block text-center">
                Interactive Pre-set Login Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={prefillPlanner}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-250 hover:border-[#2cab25] text-slate-705 text-slate-800 text-[11px] font-bold select-none cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Advisor Mode</span>
                </button>
                <button
                  type="button"
                  onClick={prefillClient}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-250 hover:border-[#2cab25] text-slate-705 text-slate-800 text-[11px] font-bold select-none cursor-pointer transition flex items-center justify-center space-x-1 shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-[#2cab25] shrink-0" />
                  <span>Client (Rahul)</span>
                </button>
              </div>
            </div>

            {/* Authenticator Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="planner@finplan.in"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl pl-10 text-xs sm:text-sm focus:outline-none focus:border-[#2cab52] focus:bg-white font-medium"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl pl-10 text-xs sm:text-sm focus:outline-none focus:border-[#2cab52] focus:bg-white font-medium"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold border border-red-100 text-center leading-normal">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#2cab25] hover:bg-[#259145] text-white font-black rounded-xl text-xs sm:text-sm transition tracking-wider uppercase flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:bg-slate-300"
              >
                <span>{isSubmitting ? "Securing Session..." : "Secure Account Sign-In"}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>

          <p className="text-[10px] text-gray-400 text-center select-none mt-6">
            Adheres to SEBI guidelines & 256-Bit Security standard.
          </p>
        </div>
        
      </div>
    </div>
  );
}
