/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Curated major Indian banks for Savings Maximizer comparisons.
 * Rates are indicative (typical published tiers) — users must confirm on official bank pages.
 * Additional banks are link-only; we do not store or sync every institution in the DB.
 */

import type { BankRateMatrixRow } from "./marketRates.js";

export interface MajorBankEntry extends BankRateMatrixRow {
  id: string;
  officialRatesUrl: string;
  /** Shown in UI — e.g. verify tenure on bank site */
  rateNote: string;
}

/** Banks included in in-app comparison calculator (major institutions only). */
export const MAJOR_BANK_CATALOG: readonly MajorBankEntry[] = [
  {
    id: "sbi",
    bankName: "State Bank of India (PSU)",
    category: "PSU",
    savingsRate: 2.7,
    fdRate: 6.45,
    rdRate: 6.4,
    officialRatesUrl: "https://sbi.bank.in/web/interest-rates/deposits/interest-rates",
    rateNote: "Indicative 1-year FD; confirm tenure on SBI site",
  },
  {
    id: "hdfc",
    bankName: "HDFC Bank (Private)",
    category: "Private",
    savingsRate: 3.0,
    fdRate: 7.1,
    rdRate: 7.0,
    officialRatesUrl: "https://www.hdfcbank.com/personal/save/deposits/fixed-deposit-interest-rate",
    rateNote: "Indicative 1-year FD; rates vary by tenure and amount",
  },
  {
    id: "icici",
    bankName: "ICICI Bank (Private)",
    category: "Private",
    savingsRate: 3.0,
    fdRate: 7.2,
    rdRate: 7.1,
    officialRatesUrl: "https://www.icicibank.com/personal-banking/deposits/fixed-deposit/fd-interest-rates",
    rateNote: "Indicative 1-year FD; confirm on ICICI site",
  },
  {
    id: "axis",
    bankName: "Axis Bank (Private)",
    category: "Private",
    savingsRate: 3.0,
    fdRate: 7.15,
    rdRate: 7.1,
    officialRatesUrl: "https://www.axis.bank.in/deposits/fixed-deposits/fd-interest-rates",
    rateNote: "Indicative 1-year FD; senior-citizen tiers may differ",
  },
  {
    id: "kotak",
    bankName: "Kotak Mahindra Bank (Private)",
    category: "Private",
    savingsRate: 4.0,
    fdRate: 7.25,
    rdRate: 7.15,
    officialRatesUrl: "https://www.kotak.com/en/personal-banking/deposits/fixed-deposit.html",
    rateNote: "Indicative 1-year FD",
  },
  {
    id: "bob",
    bankName: "Bank of Baroda (PSU)",
    category: "PSU",
    savingsRate: 2.75,
    fdRate: 6.6,
    rdRate: 6.5,
    officialRatesUrl: "https://bankofbaroda.bank.in/personal-banking/deposits/fixed-deposits",
    rateNote: "Indicative 1-year FD",
  },
  {
    id: "au_sfb",
    bankName: "AU Small Finance Bank (SFB)",
    category: "SFB",
    savingsRate: 7.25,
    fdRate: 8.0,
    rdRate: 7.75,
    officialRatesUrl: "https://www.au.bank.in/interest-rates",
    rateNote: "Indicative peak FD tier; DICGC insured up to ₹5L per bank",
  },
] as const;

export interface MoreBankLink {
  bankName: string;
  category: "PSU" | "Private" | "SFB";
  officialRatesUrl: string;
}

/** Additional banks — official rate pages only (no in-app rate storage). */
export const MORE_BANK_OFFICIAL_LINKS: readonly MoreBankLink[] = [
  {
    bankName: "Punjab National Bank",
    category: "PSU",
    officialRatesUrl: "https://www.pnbindia.in/Interest-Rates-Deposit.html",
  },
  {
    bankName: "Canara Bank",
    category: "PSU",
    officialRatesUrl: "https://canarabank.bank.in/pages/deposit-interest-rates",
  },
  {
    bankName: "Union Bank of India",
    category: "PSU",
    officialRatesUrl: "https://www.unionbankofindia.bank.in/english/interest-rate.aspx",
  },
  {
    bankName: "IndusInd Bank",
    category: "Private",
    officialRatesUrl: "https://www.indusind.com/in/en/personal/deposits/fixed-deposit.html",
  },
  {
    bankName: "IDFC FIRST Bank",
    category: "Private",
    officialRatesUrl: "https://www.idfcfirstbank.com/personal-banking/deposits/fixed-deposit",
  },
  {
    bankName: "Yes Bank",
    category: "Private",
    officialRatesUrl: "https://www.yes.bank.in/personal-banking/deposits/fixed-deposit",
  },
  {
    bankName: "Equitas Small Finance Bank",
    category: "SFB",
    officialRatesUrl: "https://www.equitas.bank.in/personal-banking/deposits/fixed-deposit",
  },
  {
    bankName: "Jana Small Finance Bank",
    category: "SFB",
    officialRatesUrl: "https://www.jana.bank.in/interest-rates",
  },
  {
    bankName: "Utkarsh Small Finance Bank",
    category: "SFB",
    officialRatesUrl: "https://www.utkarsh.bank.in/personal/interest-rates",
  },
  {
    bankName: "Bandhan Bank",
    category: "Private",
    officialRatesUrl: "https://www.bandhan.bank.in/personal/deposits/fixed-deposit",
  },
] as const;

export const SAVINGS_RATES_DISCLAIMER =
  "Rates shown are indicative for planning only. Always confirm current savings, FD, and RD rates on each bank's official website before investing.";

export function getMajorBankRateMatrix(): BankRateMatrixRow[] {
  return MAJOR_BANK_CATALOG.map(({ bankName, category, savingsRate, fdRate, rdRate }) => ({
    bankName,
    category,
    savingsRate,
    fdRate,
    rdRate,
  }));
}

export function findOfficialRatesUrl(bankName: string): string | undefined {
  const normalized = bankName.toLowerCase();
  const major = MAJOR_BANK_CATALOG.find((b) => b.bankName.toLowerCase().includes(normalized.split(" ")[0]!) || normalized.includes(b.id));
  if (major) return major.officialRatesUrl;
  const more = MORE_BANK_OFFICIAL_LINKS.find((b) => normalized.includes(b.bankName.toLowerCase().split(" ")[0]!));
  return more?.officialRatesUrl;
}

export function getMajorBankByName(bankName: string): MajorBankEntry | undefined {
  const key = bankName.toLowerCase();
  return MAJOR_BANK_CATALOG.find((b) => {
    const name = b.bankName.toLowerCase();
    return name === key || name.includes(key) || key.includes(name.split(" ")[0]!);
  });
}
