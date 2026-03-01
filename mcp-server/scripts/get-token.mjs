/**
 * get-token.mjs — Acquire a real Entra ID token for testing Phase 2 auth.
 *
 * Uses device code flow: prints a URL + code, you sign in in the browser,
 * then prints the access token you can use as a Bearer token.
 *
 * Usage:
 *   node scripts/get-token.mjs
 *
 * Then in another terminal, test with:
 *   $token = "<paste token here>"
 *   Invoke-RestMethod -Uri http://127.0.0.1:3001/mcp `
 *     -Method POST `
 *     -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
 *     -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
 */

import { PublicClientApplication } from "@azure/msal-node";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars from .env.dev
const envPath = resolve(__dirname, "../env/.env.dev");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

const CLIENT_ID = envVars.OAUTH_CLIENT_ID;
const TENANT_ID = envVars.OAUTH_TENANT_ID;
const SCOPE = envVars.OAUTH_SCOPE;

if (!CLIENT_ID || !TENANT_ID || !SCOPE) {
  console.error("❌ Missing OAUTH_CLIENT_ID, OAUTH_TENANT_ID, or OAUTH_SCOPE in .env.dev");
  process.exit(1);
}

const pca = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
  },
});

console.log(`\n🔐 Acquiring token for scope: ${SCOPE}\n`);

const result = await pca.acquireTokenByDeviceCode({
  scopes: [SCOPE],
  deviceCodeCallback: (response) => {
    console.log("━".repeat(60));
    console.log(`  1. Open:  ${response.verificationUri}`);
    console.log(`  2. Enter: ${response.userCode}`);
    console.log("━".repeat(60));
    console.log(`  Expires in ${Math.floor(response.expiresIn / 60)} minutes\n`);
  },
});

console.log("\n✅ Token acquired!\n");
console.log("━".repeat(60));
console.log("Access Token (copy this):\n");
console.log(result.accessToken);
console.log("\n━".repeat(60));
console.log("\n📋 Test command (PowerShell):\n");
console.log(`$token = "${result.accessToken.slice(0, 40)}..."`);
console.log(`Invoke-RestMethod -Uri http://127.0.0.1:3001/mcp \`
  -Method POST \`
  -Headers @{ Authorization = "Bearer <PASTE_FULL_TOKEN>"; "Content-Type" = "application/json" } \`
  -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`);
console.log(`\nToken expires at: ${result.expiresOn?.toLocaleString()}`);
