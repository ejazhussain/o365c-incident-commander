#!/usr/bin/env node

/**
 * Incident Commander MCP Server — Entry Point
 *
 * Loads environment, initializes the data store, and starts the
 * Express + StreamableHTTP server.  All logic lives in sub-modules.
 */

import dotenv from "dotenv";
import { resolve } from "path";

// ── Load environment (.env.dev by default) ──────────────────
const args = process.argv.slice(2);
let targetEnv = "dev";
const envFlagIndex = args.findIndex(
  (arg) => arg.startsWith("--env=") || arg === "--env",
);
if (envFlagIndex !== -1) {
  const envArg = args[envFlagIndex];
  targetEnv = envArg.startsWith("--env=")
    ? envArg.split("=")[1]
    : args[envFlagIndex + 1] || "dev";
}
const envPath = resolve(process.cwd(), "env", `.env.${targetEnv}`);
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// ── Imports (after env is loaded) ───────────────────────────
import { logger } from "./utils/logger.js";
import { dataStore } from "./services/dataStore.js";
import { startServer } from "./server/routes.js";

// ── Process-level error handlers (prevent crashes) ──────────
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception (server staying alive)", {
    error: error.message,
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection (server staying alive)", {
    reason: String(reason),
  });
});

// ── Initialize & start ──────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "127.0.0.1";

dataStore.initialize();
startServer(PORT, HOST);
