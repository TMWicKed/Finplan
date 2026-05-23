/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/api.js";

// Load Environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Core Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Attach API Router
  app.use(apiRouter);

  // 3. Mount Vite Dev Middleware OR Serve Static Production Build
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static frontend assets
    app.use(express.static(distPath));
    
    // Fallback everything else to SPA index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`-----------------------------------------------`);
    console.log(`FinPlan GPS Server active on http://0.0.0.0:${PORT}`);
    console.log(`-----------------------------------------------`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to initiate server:", err);
  process.exit(1);
});
