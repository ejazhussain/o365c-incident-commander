/**
 * Express app with StreamableHTTP routes for MCP transport,
 * plus a /health endpoint.
 */

import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { logger } from "../utils/logger.js";
import { TOOLS, READ_TOOLS, WRITE_TOOLS } from "../tools/toolDefinitions.js";
import { createMcpServer } from "./mcpServerFactory.js";
import { entraAuthMiddleware } from "../auth/entraAuth.js";

// ── Express app ─────────────────────────────────────────────
export const app = express();
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "incident-commander-mcp-server",
    version: "1.0.0",
    tools: TOOLS.length,
    uptime: process.uptime(),
  });
});

// ── Session store ───────────────────────────────────────────
const transports: Record<string, StreamableHTTPServerTransport> = {};
const sessionLastUsed: Record<string, number> = {};
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Stale session cleanup (runs every 2 minutes) ────────────
setInterval(
  () => {
    const now = Date.now();
    for (const sid of Object.keys(transports)) {
      if (now - (sessionLastUsed[sid] || 0) > SESSION_TTL_MS) {
        logger.info("Evicting stale session", { sessionId: sid });
        delete transports[sid];
        delete sessionLastUsed[sid];
      }
    }
  },
  2 * 60 * 1000,
);

// ── POST /mcp — initialize or continue a session ───────────
app.post("/mcp", entraAuthMiddleware, async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const isInitialize = req.body?.method === "initialize";
    let transport = sessionId ? transports[sessionId] : undefined;

    // If client sends a stale session ID with a fresh initialize, drop the old session
    if (transport && isInitialize) {
      logger.info(
        "Re-initialize on existing session — creating fresh session",
        { sessionId },
      );
      delete transports[sessionId!];
      delete sessionLastUsed[sessionId!];
      transport = undefined;
    }

    if (transport) {
      sessionLastUsed[sessionId!] = Date.now();
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // New session
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    transport.onclose = () => {
      const sid = transport!.sessionId;
      if (sid) {
        logger.info("Session closed", { sessionId: sid });
        delete transports[sid];
        delete sessionLastUsed[sid];
      }
    };

    const mcpServer = createMcpServer();
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);

    if (transport.sessionId) {
      transports[transport.sessionId] = transport;
      sessionLastUsed[transport.sessionId] = Date.now();
      logger.success("New session established", {
        sessionId: transport.sessionId,
      });
    }
  } catch (error) {
    logger.error("Error in /mcp POST", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── GET /mcp — SSE streaming for existing session ──────────
app.get("/mcp", entraAuthMiddleware, async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports[sessionId] : undefined;

    if (!transport) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }

    sessionLastUsed[sessionId!] = Date.now();
    await transport.handleRequest(req, res);
  } catch (error) {
    logger.error("Error in /mcp GET", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── DELETE /mcp — close session ─────────────────────────────
app.delete("/mcp", entraAuthMiddleware, async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports[sessionId] : undefined;

    if (!transport) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    logger.error("Error in /mcp DELETE", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── Start listener ──────────────────────────────────────────
export function startServer(port: number, host: string): void {
  app.listen(port, host, () => {
    logger.success(
      `🚨 Incident Commander MCP Server running at http://${host}:${port}`,
    );
    logger.info(`   Health check: http://${host}:${port}/health`);
    logger.info(`   MCP endpoint: http://${host}:${port}/mcp`);
    logger.info(
      `   Tools: ${TOOLS.length} registered (${READ_TOOLS.length} read, ${WRITE_TOOLS.length} write)`,
    );
    logger.info("");
    logger.info(`   To expose via ngrok:  ngrok http ${port}`);
    logger.info("   To inspect tools:     npm run inspector");
  });
}
