/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "PLANNER" | "CLIENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  age: number;
  maritalStatus: string;
  childrenCount: number;
  location: string;
  income: number;   // Monthly
  expenses: number; // Monthly
  investableSurplus: number; // Monthly
  currentSavings: number; // Cumulative (e.g. 5L)
  currentSavingsBank: string;
  currentSavingsRate: number; // e.g. 0.027 for SBI
  currentInvestments: {
    sipAmount: number;
    description: string;
  };
}

export interface FinancialGoal {
  id: string;
  name: string;
  type: "retirement" | "education" | "home" | "custom";
  targetAmount: number;
  targetYears: number;
  currentFunding: number; // Percentage or absolute amount
  monthlyRequiredSIP: number;
  inflationAdjustedTarget: number;
}

export interface BankSavingsOption {
  id: string;
  bankName: string;
  category: "PSU" | "Private" | "SFB";
  interestRate: number; // Percentage (e.g. 0.03 for HDFC)
  futureValue5Yr: number; // Projection for 5L over 5yr
}

export interface InvestmentAllocation {
  id: string;
  instrument: string; // PPF, NPS, ELSS, Mutual Fund (Equity), SGB
  category: string;
  percentage: number;
  expectedReturn: number;
  lockInPeriod: string;
  taxSection: string;
  benefitLimit: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  homePrice: number;
  downPayment: number;
  loanTenureYears: number;
  loanInterestRate: number; // Percentage (e.g. 0.0875 for HDFC)
  impactEmi: number;
  investableSurplusRemaining: number;
  goalFundingImpacts: {
    goalId: string;
    beforeFunding: number; // Percentage
    afterFunding: number;  // Percentage
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  service: string;
  initiatedBy: string;
  status: "SUCCESS" | "FAILED";
}

// Global Seed Data representing Rahul Sharma
export const RAHUL_SHARMA_PROFILE: ClientProfile = {
  id: "client_rahul_sharma",
  name: "Rahul Sharma",
  age: 32,
  maritalStatus: "Married",
  childrenCount: 1, // age 2
  location: "Bangalore",
  income: 120000,
  expenses: 65000,
  investableSurplus: 55000,
  currentSavings: 500000, // 5 Lakhs
  currentSavingsBank: "SBI",
  currentSavingsRate: 2.70, // %
  currentInvestments: {
    sipAmount: 3000,
    description: "Mid-cap Equity Mutual Fund"
  }
};

export const RAHUL_SHARMA_GOALS: FinancialGoal[] = [
  {
    id: "goal_daughter_edu",
    name: "Daughter's Higher Education",
    type: "education",
    targetAmount: 4000000, // 40L
    targetYears: 16,
    currentFunding: 70, // 70% funded with current plan expectation
    monthlyRequiredSIP: 10450, // Calculated expected contribution
    inflationAdjustedTarget: 9140000 // with inflation adjusted target (approx 6% inflation)
  },
  {
    id: "goal_retirement",
    name: "Retirement Corpus",
    type: "retirement",
    targetAmount: 25000000, // 2.5 Cr
    targetYears: 28,
    currentFunding: 65, // 65% funded with current profile surplus
    monthlyRequiredSIP: 15300,
    inflationAdjustedTarget: 127700000 // with 6% inflation
  }
];

export const BANK_SAVINGS_DATA: BankSavingsOption[] = [
  { id: "1", bankName: "SBI (PSU)", category: "PSU", interestRate: 2.70, futureValue5Yr: 571000 },
  { id: "2", bankName: "PNB (PSU)", category: "PSU", interestRate: 2.70, futureValue5Yr: 571000 },
  { id: "3", bankName: "Bank of Baroda (PSU)", category: "PSU", interestRate: 2.75, futureValue5Yr: 572450 },
  { id: "4", bankName: "HDFC (Private)", category: "Private", interestRate: 3.00, futureValue5Yr: 579630 },
  { id: "5", bankName: "ICICI (Private)", category: "Private", interestRate: 3.00, futureValue5Yr: 579630 },
  { id: "6", bankName: "Kotak (Private)", category: "Private", interestRate: 4.00, futureValue5Yr: 608830 },
  { id: "7", bankName: "Axis (Private)", category: "Private", interestRate: 3.00, futureValue5Yr: 579630 },
  { id: "8", bankName: "AU SFB (Small Finance)", category: "SFB", interestRate: 7.25, futureValue5Yr: 709600 },
  { id: "9", bankName: "Equitas (Small Finance)", category: "SFB", interestRate: 7.00, futureValue5Yr: 701200 },
  { id: "10", bankName: "Jana (Small Finance)", category: "SFB", interestRate: 7.25, futureValue5Yr: 709600 },
];

export const INVESTMENT_ALLOCATIONS_SEED: InvestmentAllocation[] = [
  {
    id: "1",
    instrument: "Public Provident Fund (PPF)",
    category: "Debt",
    percentage: 15,
    expectedReturn: 7.1,
    lockInPeriod: "15 Years",
    taxSection: "Section 80C (Exempt-Exempt-Exempt)",
    benefitLimit: "Up to ₹1.5 Lakhs/year"
  },
  {
    id: "2",
    instrument: "National Pension System (NPS) Tier 1",
    category: "Pension/Hybrid",
    percentage: 20,
    expectedReturn: 10.0,
    lockInPeriod: "Till age 60",
    taxSection: "Sec 80C & Sec 80CCD(1B) (Additional ₹50k)",
    benefitLimit: "Up to ₹2 Lakhs total/year"
  },
  {
    id: "3",
    instrument: "ELSS (Tax Saving Mutual Fund)",
    category: "Equity",
    percentage: 25,
    expectedReturn: 14.0,
    lockInPeriod: "3 Years",
    taxSection: "Section 80C (LTCG at 10% post ₹1L)",
    benefitLimit: "Up to ₹1.5 Lakhs/year"
  },
  {
    id: "4",
    instrument: "Equity Mutual Funds (S&P/Nifty Index)",
    category: "Equity",
    percentage: 30,
    expectedReturn: 12.5,
    lockInPeriod: "None",
    taxSection: "LTCG above ₹1L taxed at 10%",
    benefitLimit: "No maximum limit"
  },
  {
    id: "5",
    instrument: "Sovereign Gold Bonds (SGB)",
    category: "Gold",
    percentage: 10,
    expectedReturn: 8.5, // 2.5% dividend coupon + price appreciation
    lockInPeriod: "8 Years (Exit option after 5Yr)",
    taxSection: "Capital gains exempt if held till maturity",
    benefitLimit: "Max 4 kg/individual/year"
  }
];

export const DEMO_WHATIF_SCENARIO: WhatIfScenario = {
  id: "scenario_bangalore_home",
  name: "Value-Buying a 2BHK flat in Bangalore",
  homePrice: 8000000, // 80L
  downPayment: 1500000, // 15L
  loanTenureYears: 20,
  loanInterestRate: 8.75, // 8.75%
  impactEmi: 56730, // Approx ~57,000 using standard formula
  investableSurplusRemaining: 21000, // Drop from 55k down to ~21k (55k - 34k additional commitment, EMI is 57k, but replaces rent too)
  goalFundingImpacts: [
    { goalId: "goal_daughter_edu", beforeFunding: 70, afterFunding: 41 },
    { goalId: "goal_retirement", beforeFunding: 65, afterFunding: 32 }
  ]
};
