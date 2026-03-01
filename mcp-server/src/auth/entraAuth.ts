/**
 * Entra ID JWT validation middleware (Phase 2 — OAuth)
 *
 * Validates Bearer tokens issued by Microsoft Entra ID against the
 * tenant's JWKS endpoint. Protects the /mcp endpoint.
 *
 * Set AUTH_ENABLED=false in .env to bypass auth (local dev / MCP Inspector).
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { logger } from "../utils/logger.js";

// ── Extend Express Request with validated claims ─────────────
declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}

// ── Config (read once at startup) ───────────────────────────
const TENANT_ID = process.env.OAUTH_TENANT_ID ?? "";
const AUDIENCE = process.env.OAUTH_AUDIENCE ?? "";
const AUTH_ENABLED = process.env.AUTH_ENABLED !== "false";

const JWKS_URI = `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`;

// Lazily initialised JWKS client (cached singleton)
let _client: jwksClient.JwksClient | null = null;

function getJwksClient(): jwksClient.JwksClient {
  if (!_client) {
    _client = jwksClient({
      jwksUri: JWKS_URI,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600_000, // 10 min
      rateLimit: true,
    });
  }
  return _client;
}

// Promisified signing key retrieval for jsonwebtoken
function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    getJwksClient().getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

// ── Middleware ───────────────────────────────────────────────
export async function entraAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Bypass auth for local dev / MCP Inspector testing
  if (!AUTH_ENABLED) {
    logger.warn("Auth: AUTH_ENABLED=false — skipping token validation");
    next();
    return;
  }

  // Require misconfiguration guard
  if (!TENANT_ID || !AUDIENCE) {
    logger.error("Auth: OAUTH_TENANT_ID or OAUTH_AUDIENCE not configured");
    res.status(500).json({ error: "Server OAuth configuration missing" });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          getSigningKey(header)
            .then((key) => callback(null, key))
            .catch((err) => callback(err));
        },
        {
          audience: AUDIENCE,
          issuer: [
            `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
            `https://sts.windows.net/${TENANT_ID}/`,
          ],
          algorithms: ["RS256"],
        },
        (err, payload) => {
          if (err) return reject(err);
          resolve(payload as jwt.JwtPayload);
        },
      );
    });

    req.user = decoded;
    logger.info("Auth: token validated", {
      sub: decoded.sub,
      upn: decoded.upn,
    });

    next();
  } catch (error) {
    logger.error("Auth: token validation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
