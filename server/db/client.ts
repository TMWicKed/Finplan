/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

let queryClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

/**
 * Lazily connects to PostgreSQL. Returns null when DATABASE_URL is unset.
 */
export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    return null;
  }

  if (!queryClient) {
    queryClient = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 15 });
    dbInstance = drizzle(queryClient, { schema });
  }

  return dbInstance;
}

export type AppDatabase = NonNullable<ReturnType<typeof getDb>>;

/** Raw postgres.js client for FTS/pgvector queries. */
export function getSqlClient(): ReturnType<typeof postgres> | null {
  getDb();
  return queryClient;
}

export async function closeDb(): Promise<void> {
  if (queryClient) {
    await queryClient.end();
    queryClient = null;
    dbInstance = null;
  }
}
