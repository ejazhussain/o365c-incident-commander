/**
 * Colored console logger for the Incident Commander MCP Server
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function timestamp(): string {
  return new Date().toISOString();
}

function formatMeta(meta?: unknown): string {
  if (!meta) return "";
  try {
    return " " + JSON.stringify(meta);
  } catch {
    return " [unserializable]";
  }
}

export const logger = {
  info: (message: string, meta?: unknown): void => {
    console.log(
      `${colors.blue}[INFO]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}${formatMeta(meta)}`,
    );
  },

  warn: (message: string, meta?: unknown): void => {
    console.warn(
      `${colors.yellow}[WARN]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}${formatMeta(meta)}`,
    );
  },

  error: (message: string, meta?: unknown): void => {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}${formatMeta(meta)}`,
    );
  },

  success: (message: string, meta?: unknown): void => {
    console.log(
      `${colors.green}[OK]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${message}${formatMeta(meta)}`,
    );
  },

  tool: (
    toolName: string,
    action: "call" | "result" | "error",
    meta?: unknown,
  ): void => {
    const icon = action === "call" ? "→" : action === "result" ? "✓" : "✗";
    const color =
      action === "call"
        ? colors.cyan
        : action === "result"
          ? colors.green
          : colors.red;
    console.log(
      `${color}[TOOL ${icon}]${colors.reset} ${colors.bright}${toolName}${colors.reset} ${colors.dim}${timestamp()}${colors.reset}${formatMeta(meta)}`,
    );
  },
};
