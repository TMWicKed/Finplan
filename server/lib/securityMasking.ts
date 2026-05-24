/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MaskingResult {
  maskedText: string;
  totalMasks: number;
  typesMasked: string[];
}

export function maskSensitiveText(text: string): MaskingResult {
  let totalMasks = 0;
  const typesMasked: string[] = [];

  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/g;
  let masked = text.replace(panRegex, (match) => {
    totalMasks++;
    if (!typesMasked.includes("PAN_CARD")) typesMasked.push("PAN_CARD");
    return `${match.slice(0, 3)}XXXXX${match.slice(8)}`;
  });

  const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;
  masked = masked.replace(aadhaarRegex, () => {
    totalMasks++;
    if (!typesMasked.includes("AADHAAR")) typesMasked.push("AADHAAR");
    return "XXXX-XXXX-XXXX";
  });

  const accountRegex = /\b\d{10,16}\b/g;
  masked = masked.replace(accountRegex, (match) => {
    totalMasks++;
    if (!typesMasked.includes("ACCOUNT_NUMBER")) typesMasked.push("ACCOUNT_NUMBER");
    return `XXXXXX${match.slice(-4)}`;
  });

  return { maskedText: masked, totalMasks, typesMasked };
}

export function maskFields(texts: string[]): {
  masked: string[];
  totalMasks: number;
  typesMasked: string[];
} {
  const masked: string[] = [];
  let totalMasks = 0;
  const typesMasked: string[] = [];

  for (const t of texts) {
    const r = maskSensitiveText(t);
    masked.push(r.maskedText);
    totalMasks += r.totalMasks;
    for (const type of r.typesMasked) {
      if (!typesMasked.includes(type)) typesMasked.push(type);
    }
  }

  return { masked, totalMasks, typesMasked };
}
