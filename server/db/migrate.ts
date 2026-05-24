/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Applies Drizzle SQL migrations from server/db/migrations.
 * Usage: npx tsx server/db/migrate.ts
 */

import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "migrations");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      JSON.stringify({
        level: "error",
        service: "finplan-db-migrate",
        message: "DATABASE_URL is not set",
      })
    );
    process.exit(1);
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  console.log(
    JSON.stringify({
      level: "info",
      service: "finplan-db-migrate",
      message: "Applying migrations",
      migrationsFolder,
    })
  );

  await migrate(db, { migrationsFolder });

  console.log(
    JSON.stringify({
      level: "info",
      service: "finplan-db-migrate",
      message: "Migrations applied successfully",
    })
  );

  await client.end();
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "finplan-db-migrate",
      message: err instanceof Error ? err.message : String(err),
    })
  );
  process.exit(1);
});
