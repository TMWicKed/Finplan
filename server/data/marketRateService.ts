/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildBankSavingsOptions,
  DEFAULT_BANK_RATE_MATRIX,
  type BankRateMatrixRow
} from "./marketRates.js";

export function getBankInterestMatrix(): BankRateMatrixRow[] {
  return [...DEFAULT_BANK_RATE_MATRIX];
}

export function getBankSavingsRates() {
  return buildBankSavingsOptions(DEFAULT_BANK_RATE_MATRIX);
}
