/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Compass, 
  Database, 
  PiggyBank, 
  TrendingUp, 
  Cpu, 
  ShieldAlert, 
  LogOut, 
  User as UserIcon,
  Bell,
  CheckCircle2,
  ListFilter
} from "lucide-react";
import { UserRole } from "../types.js";

interface SidebarProps {
  currentRole: UserRole;
  currentTab: string;
  setTab: (tab: string) => void;
  toggleRole: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentRole,
  currentTab,
  setTab,
  toggleRole,
  onLogout
}: SidebarProps) {
  const isPlanner = currentRole === "PLANNER";

  const clientTabs = [
    { id: "onboarding", label: "1. Basic Profile Setup", icon: UserIcon },
    { id: "goals", label: "2. Track Life Goals", icon: Compass },
    { id: "savings", label: "3. Savings Maximizer", icon: PiggyBank },
    { id: "investments", label: "4. Future Planner", icon: TrendingUp },
    { id: "whatif", label: "5. Alternative Scenarios", icon: Cpu },
    { id: "ira", label: "6. Chat with Ira AI", icon: Cpu }
  ];

  const plannerTabs = [
    { id: "planner_dashboard", label: "Risk Management", icon: ShieldAlert },
    { id: "onboarding", label: "1. Basic Profile Setup", icon: UserIcon },
    { id: "goals", label: "2. Track Life Goals", icon: Compass },
    { id: "savings", label: "3. Savings Maximizer", icon: PiggyBank },
    { id: "investments", label: "4. Future Planner", icon: TrendingUp },
    { id: "whatif", label: "5. Alternative Scenarios", icon: Cpu },
    { id: "ira", label: "Chat with Agency Desk", icon: Cpu }
  ];

  const activeTabs = isPlanner ? plannerTabs : clientTabs;

  return (
    <aside id="sidebar-container" className="w-64 bg-[#071a2b] text-slate-100 flex flex-col border-r border-white/10 h-screen shrink-0 font-sans shadow-2xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2cab52] shadow-md shadow-[#2cab52]/20">
            <Compass className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">FinPlan <span className="text-[#2cab52]">GPS</span></h1>
            <span className="text-[9px] font-semibold text-[#2cab52]/80 tracking-widest uppercase block mt-1">Agentic Wealth AI</span>
          </div>
        </div>
      </div>

      {/* Role Indicator Widget */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#0c243a]/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Session</span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
            isPlanner ? "bg-amber-500/25 text-amber-300 border border-amber-500/30" : "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
          }`}>
            {currentRole}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white uppercase text-xs">
            {isPlanner ? "AM" : "RS"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate text-xs">
              {isPlanner ? "Amit Mehta" : "Rahul Sharma"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {isPlanner ? "planner@finplan.in" : "rahul@gmail.com"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleRole}
          className="mt-3 w-full py-2 px-3 rounded-lg bg-[#2cab52]/10 hover:bg-[#2cab52]/25 border border-[#2cab52]/20 hover:border-[#2cab52]/40 text-[#2cab52] font-semibold text-xs transition duration-200 cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Go to {isPlanner ? "Client View" : "Planner View"}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav id="navigation-sidebar" className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Modules</span>
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-left text-sm cursor-pointer ${
                isActive 
                  ? "bg-white/10 text-white font-medium border border-white/5" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {isActive ? (
                <div className="h-2 w-2 rounded-full bg-[#2cab52]"></div>
              ) : (
                <Icon className="w-4 h-4 shrink-0 text-[#2cab52]/75" />
              )}
              <span className="flex-1 truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Exit Option */}
      <div className="p-4 bg-[#051320] border-t border-white/10 text-[11px] text-slate-500">
        <div className="flex items-center justify-between mb-3 text-slate-400">
          <span className="font-bold text-[9px] uppercase tracking-widest">System Status</span>
          <span className="flex items-center text-[10px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
            Secure & Shielded
          </span>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
