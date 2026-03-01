/**
 * MCP Server factory — creates a fresh Server instance per session.
 *
 * Each StreamableHTTP session needs its own Server + Transport pair,
 * so we use a factory rather than a singleton.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { logger } from "../utils/logger.js";
import { isCustomError } from "../utils/errors.js";
import { TOOLS } from "../tools/toolDefinitions.js";
import { handleToolCall } from "../tools/toolHandler.js";

export function createMcpServer(): Server {
  const mcpServer = new Server(
    {
      name: "incident-commander-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register tool listing
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Register tool execution
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.tool(name, "call", args);

    try {
      const result = await handleToolCall(name, args || {});
      logger.tool(name, "result", { length: result.length });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error: unknown) {
      const message = isCustomError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
      logger.tool(name, "error", { error: message });
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return mcpServer;
}
