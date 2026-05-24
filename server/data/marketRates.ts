/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BankSavingsOption } from "../../src/types.js";
import { getMajorBankRateMatrix } from "./majorBankCatalog.js";

/** Curated major banks for comparison (not a full market feed). */
export const DEFAULT_BANK_RATE_MATRIX: readonly BankRateMatrixRow[] = getMajorBankRateMatrix();

export interface BankRateMatrixRow {
  bankName: string;
  category: string;
  savingsRate: number;
  fdRate: number;
  rdRate: number;
}

const PRINCIPAL_FOR_FV = 500_000;
const FV_YEARS = 5;

function lumpSumFv(principal: number, ratePct: number, years: number): number {
  const r = ratePct / 100;
  const n = 4;
  return Math.round(principal * Math.pow(1 + r / n, n * years));
}

export function buildBankSavingsOptions(matrix: readonly BankRateMatrixRow[]): BankSavingsOption[] {
  return matrix.map((row, index) => ({
    id: String(index + 1),
    bankName: row.bankName,
    category: row.category as BankSavingsOption["category"],
    interestRate: row.savingsRate,
    futureValue5Yr: lumpSumFv(PRINCIPAL_FOR_FV, row.savingsRate, FV_YEARS),
  }));
}
