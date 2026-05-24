/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { hashPassword, verifyPassword } from "./password.js";

export interface DemoAccount {
  email: string;
  role: "PLANNER" | "CLIENT";
  name: string;
  passwordHash: string;
}

const RAW_ACCOUNTS: Array<{
  email: string;
  password: string;
  role: "PLANNER" | "CLIENT";
  name: string;
}> = [
  {
    email: "planner@finplan.in",
    password: "planner123",
    role: "PLANNER",
    name: "Amit Mehta (Senior Planner)"
  },
  {
    email: "rahul@gmail.com",
    password: "rahul123",
    role: "CLIENT",
    name: "Rahul Sharma"
  }
];

let cachedAccounts: DemoAccount[] | null = null;

function loadDemoAccounts(): DemoAccount[] {
  if (!cachedAccounts) {
    cachedAccounts = RAW_ACCOUNTS.map(({ password, email, role, name }) => ({
      email,
      role,
      name,
      passwordHash: hashPassword(password)
    }));
  }
  return cachedAccounts;
}

export function authenticateDemoUser(
  email: string,
  password: string
): Pick<DemoAccount, "email" | "role" | "name"> | null {
  const normalized = email.trim().toLowerCase();
  const account = loadDemoAccounts().find((a) => a.email.toLowerCase() === normalized);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return null;
  }
  return { email: account.email, role: account.role, name: account.name };
}
