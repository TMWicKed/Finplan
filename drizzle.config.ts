/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema/index.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres_secure_pass@localhost:5432/finplan_db",
  },
  strict: true,
  verbose: true,
});
