/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, FinancialGoal, RAHUL_SHARMA_GOALS } from "./types.js";
import Sidebar from "./components/Sidebar.js";
import AuthScreen from "./components/AuthScreen.js";
import GoalGPS from "./components/GoalGPS.js";
import SavingsIntelligence from "./components/SavingsIntelligence.js";
import InvestmentPlanner from "./components/InvestmentPlanner.js";
import WhatIfEngine from "./components/WhatIfEngine.js";
import IraAgentChat from "./components/IraAgentChat.js";
import PlannerClientAlerts from "./components/PlannerClientAlerts.js";
import UserOnboarding from "./components/UserOnboarding.js";

export default function App() {
  // Session User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Tab Routing State
  const [currentTab, setCurrentTab] = useState<string>("goals");
  
  // Shared Domain States
  const [goals, setGoals] = useState<FinancialGoal[]>(RAHUL_SHARMA_GOALS);
  const [iraPrompt, setIraPrompt] = useState<string>("");
  const [whatIfState, setWhatIfState] = useState<any>(null);

  // Sync tab navigation on login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "PLANNER") {
        setCurrentTab("planner_dashboard");
      } else {
        setCurrentTab("goals");
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (userPayload: User) => {
    setCurrentUser(userPayload);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const toggleRole = () => {
    if (!currentUser) return;
    const nextRole = currentUser.role === "PLANNER" ? "CLIENT" : "PLANNER";
    setCurrentUser({
      ...currentUser,
      role: nextRole,
      name: nextRole === "PLANNER" ? "Amit Mehta (Senior Advisor)" : "Rahul Sharma",
      email: nextRole === "PLANNER" ? "planner@finplan.in" : "rahul@gmail.com"
    });
  };

  const handleAskIra = (prompt: string) => {
    setIraPrompt(prompt);
  };

  // Login view fallback if not authenticated
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-850 font-sans">
      
      {/* 1. Global Navigation Sidebar */}
      <Sidebar
        currentRole={currentUser.role}
        currentTab={currentTab}
        setTab={(tabId) => {
          setCurrentTab(tabId);
          // clear prompt expectation if navigating away from Ira
          if (tabId !== "ira") setIraPrompt("");
        }}
        toggleRole={toggleRole}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Module Frame */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {currentTab === "planner_dashboard" && "Advisor Risk Desk"}
              {currentTab === "goals" && "Goal GPS Navigator"}
              {currentTab === "savings" && "Savings Intelligence Unit"}
              {currentTab === "investments" && "Investment Tax-Saving Planner"}
              {currentTab === "whatif" && "Life Event What-If Engine"}
              {currentTab === "ira" && "Ira Conversational Agent"}
              {currentTab === "onboarding" && "Client Onboarding & Risk Profiling"}
            </h1>
            <p className="text-xs text-slate-500">
              {currentUser.role === "PLANNER" 
                ? "Senior Advisor Portal • Amit Mehta" 
                : `Aesthetic Financial Strategy for ${currentUser.name} • Age 32 • Bangalore`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="h-2 w-2 rounded-full bg-[#2cab52] animate-pulse"></span>
              <span>All Systems Active</span>
            </div>
            <span className="rounded-lg bg-[#2cab52] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#2cab52]/20">
              Secure JWT
            </span>
          </div>
        </header>

        {/* View Router Selector */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {currentTab === "planner_dashboard" && (
            <PlannerClientAlerts
              onSelectClientQuestion={(qn) => {
                handleAskIra(qn);
              }}
              setTab={setCurrentTab}
              authToken={currentUser.token || ""}
            />
          )}

          {currentTab === "goals" && (
            <GoalGPS
              goals={goals}
              setGoals={setGoals}
              authToken={currentUser.token || ""}
            />
          )}

          {currentTab === "savings" && (
            <SavingsIntelligence authToken={currentUser.token || ""} />
          )}

          {currentTab === "onboarding" && (
            <UserOnboarding
              authToken={currentUser.token || ""}
              onOnboardingComplete={(onboardedProfile, suggestedGoals) => {
                setGoals(suggestedGoals);
                setCurrentUser(prevUser => {
                  if (!prevUser) return null;
                  return {
                    ...prevUser,
                    name: onboardedProfile.name,
                    email: `${onboardedProfile.name.toLowerCase().replace(/\s+/g, "")}@gmail.com`
                  };
                });
                setCurrentTab("goals");
              }}
            />
          )}

          {currentTab === "investments" && (
            <InvestmentPlanner />
          )}

          {currentTab === "whatif" && (
            <WhatIfEngine
              onAskIra={handleAskIra}
              setTab={setCurrentTab}
              whatIfState={whatIfState}
              setWhatIfState={setWhatIfState}
            />
          )}

          {currentTab === "ira" && (
            <IraAgentChat
              initialPrompt={iraPrompt}
              authToken={currentUser.token || ""}
              whatIfState={whatIfState}
            />
          )}
        </div>
      </main>
    </div>
  );
}
