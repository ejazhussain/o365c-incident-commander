# 🚨 Incident Commander — Build TODO

> **Last updated:** Feb 28, 2026  
> **Status:** Phase 1 ✅ Phase 2 ✅ Phase 3 ✅ Phase 4 ✅ Phase 5 ✅ Phase 6 ✅ Phase 7 ✅ complete — Phase 8 Adaptive Cards next

---

## Phase 1: MCP Server (Core) ✅ DONE
- [x] Scaffold Node.js + TypeScript project in `mcp-server/`
- [x] Set up Express + `@modelcontextprotocol/sdk` (StreamableHTTP transport)
- [x] Implement 8 READ tools:
  - [x] `list_active_incidents`
  - [x] `get_incident`
  - [x] `get_service_health`
  - [x] `get_change_log`
  - [x] `get_known_issues`
  - [x] `get_deployment_history`
  - [x] `get_status_timeline`
  - [x] `get_stakeholders`
- [x] Implement 4 WRITE tools:
  - [x] `create_incident`
  - [x] `update_severity`
  - [x] `add_status_update`
  - [x] `create_post_mortem`
- [x] Create seed data (`data/seed.json`) with Payment Service Outage demo scenario
- [x] Test MCP server locally (MCP Inspector ✅, health endpoint ✅)
- [x] Refactor monolith into modular architecture (schemas, tools, server, implementation)

## Phase 2: MCP Server (OAuth) ✅ DONE (+5 bonus pts)
- [x] Register Entra ID app (single tenant — ejazhussain)
- [x] Configure redirect URIs (Postman callback + native client)
- [x] Expose API scope: `access_as_user`
- [x] Generate client secret
- [x] Implement JWT validation against Entra ID JWKS in `auth/entraAuth.ts` (jsonwebtoken + jwks-rsa)
- [x] Add `AUTH_ENABLED` flag to bypass auth for local dev / MCP Inspector
- [x] Add `.env.example` with OAuth config template
- [x] Add `scripts/get-token.mjs` for device code token acquisition
- [x] Test authenticated MCP calls via Postman (initialize → tools/list → tools/call ✅)

## Phase 3: Triage Agent (DA #2) ✅ DONE
- [x] Scaffold DA via ATK (`Create New App → Declarative Agent → Add Action → MCP server`)
- [x] Select MCP tools: `list_active_incidents`, `get_service_health`, `create_incident`, `update_severity`
- [x] Write `instruction.txt` — triage reasoning logic + severity classification matrix + mandatory MCP tool calls
- [x] Configure `declarativeAgent.json` with actions (name: IC Triage, no suffix)
- [x] Fix ai-plugin.json: auth object, RemoteMCPServer runtime type, schema v2.4 compliant
- [x] Provision to M365 (TEAMS_APP_ID: 101aea02-0db7-4c71-b5cc-c86403d7e268, M365_TITLE_ID: T_8c92ebca-29b7-df7d-0bc5-46470e5ecae1)
- [x] Test in M365 Copilot Chat — tools invoked successfully ✅

## Phase 4: Investigation Agent (DA #3) ✅ DONE
- [x] Scaffold DA (manual file creation matching triage pattern)
- [x] Select MCP tools: `get_incident`, `get_change_log`, `get_known_issues`, `get_deployment_history`
- [x] Write `instruction.txt` — 5-step RCA chain + correlation signal table
- [x] Configure `declarativeAgent.json` with actions (name: IC Investigation)
- [x] Provision to M365 (TEAMS_APP_ID: f110f74c-946d-4af7-b755-fd7013646065, M365_TITLE_ID: T_332b3e34-a33e-4bce-1210-032f655c073d)
- [x] Test in M365 Copilot Chat — full RCA output with deployment correlation ✅

## Phase 5: Communication Agent (DA #4) ✅ DONE
- [x] Scaffold DA (manual file creation matching established pattern)
- [x] Select MCP tools: `get_incident`, `get_status_timeline`, `add_status_update`, `get_stakeholders`
- [x] Write `instruction.txt` — 4-step process + message templates for 4 audiences (exec, customer, engineering, resolution)
- [x] Configure `declarativeAgent.json` with actions (name: IC Communication)
- [x] Provision to M365 (TEAMS_APP_ID: 246e0da5-37bb-431e-964a-d1c61dfcb87e, M365_TITLE_ID: T_bb5ed05b-64ac-9b5a-f617-793f895c287d)
- [x] Test in M365 Copilot Chat — drafted customer-facing resolution notice, confirmed before posting ✅

## Phase 6: Post-Mortem Agent (DA #5) ✅ DONE
- [x] Scaffold DA (manual file creation matching established pattern)
- [x] Select MCP tools: `get_incident`, `get_status_timeline`, `get_change_log`, `create_post_mortem`
- [x] Write `instruction.txt` — 5-step process, blameless culture, full post-mortem doc template with action item guidelines
- [x] Configure `declarativeAgent.json` with actions (name: IC Post-Mortem)
- [x] Provision to M365 (TEAMS_APP_ID: 25dda56c-9d75-4350-aabc-492081b1fd39, M365_TITLE_ID: T_58b93cdb-5ea1-b42e-cb3d-c37d13fb7a61)
- [x] Test in M365 Copilot Chat — working ✅

## Phase 7: Commander Orchestrator (DA #1) ✅ DONE
- [x] Scaffold DA via ATK (No Action — orchestrator only)
- [x] Collect all 4 sub-agent `M365_TITLE_ID` values
- [x] Configure `declarativeAgent.json` with `worker_agents: [4 T_<GUID> IDs]`
- [x] Write `instruction.txt` — mandatory delegation rules, routing table, NEVER answer from own knowledge
- [x] Provision to M365 (TEAMS_APP_ID: e64c295c-0e0d-49b0-9b29-79cdc70a102a, M365_TITLE_ID: T_f8686154-2c4d-12c9-a892-553766a98328)
- [x] Fixed fuzzy service name matching in MCP server (space vs hyphen, case-insensitive)
- [x] Fixed seed data — added open incidents (P1/P2/P3) so agents have real data to return
- [x] Fixed MCP session TTL (5min) + stale session eviction to prevent missing MCP calls
- [x] Test in M365 Copilot Chat — Commander routes to IC Triage, MCP calls fire, real data returned ✅
- [x] Known behaviour: worker agents call MCP in their own session context (confirmed via ngrok logs)

## Phase 8: Adaptive Cards ✅ DONE (+5 bonus pts)
- [x] Designed 5 standalone Adaptive Card JSON files in `adaptive-cards/` folder
- [x] incident-dashboard.json — severity color-coded active incident list (IC Triage)
- [x] service-health.json — service health grid with colored status dots (IC Triage)
- [x] status-timeline.json — chronological timeline with status badges (IC Communication / Post-Mortem)
- [x] stakeholder-notifications.json — grouped stakeholder list with notify-on severity (IC Communication)
- [x] postmortem-summary.json — full post-mortem with root cause + action items table (IC Post-Mortem)
- [x] All cards include `sampleData` — preview at https://adaptivecards.io/designer/
- [x] README.md documents design patterns, color coding rules, and preview instructions
- ⚠️ `response_semantics` is NOT supported in `RemoteMCPServer` MCP plugins (OpenAPI only) — cards removed from ai-plugin.json files to fix 400 provisioning error
- ⚠️ Cards are design artifacts for the repo / future Bot Framework integration, not rendered live in Copilot Chat

## Phase 9: End-to-End Testing — ⏳ TODO
- [ ] Run full demo scenario: report → triage → investigate → communicate → resolve → post-mortem
- [ ] Verify all 4 sub-agents callable from Commander with real MCP data
- [ ] Verify MCP read + write operations work through agents
- [ ] Verify OAuth token flow works end-to-end
- [ ] Fix any routing or data issues

## Phase 10: Demo & Submission — ⏳ TODO
- [ ] Script the demo walkthrough (full lifecycle via IC Commander)
- [ ] Record 3–5 min demo video
- [ ] Polish README with final screenshots/GIFs
- [ ] Verify no secrets in repo (`git secrets --scan`)
- [ ] Ensure repo is public
- [ ] Submit via GitHub Issue using project submission template
- [ ] Post on Discord for community vote

---

## ⏰ Deadline: March 1, 2026 (11:59 PM PT)
## 📅 Days remaining: ~1

### Agent ID Reference
| Agent | TEAMS_APP_ID | M365_TITLE_ID |
|-------|-------------|---------------|
| IC Triage | 101aea02-0db7-4c71-b5cc-c86403d7e268 | T_8c92ebca-29b7-df7d-0bc5-46470e5ecae1 |
| IC Investigation | f110f74c-946d-4af7-b755-fd7013646065 | T_332b3e34-a33e-4bce-1210-032f655c073d |
| IC Communication | 246e0da5-37bb-431e-964a-d1c61dfcb87e | T_bb5ed05b-64ac-9b5a-f617-793f895c287d |
| IC Post-Mortem | 25dda56c-9d75-4350-aabc-492081b1fd39 | T_58b93cdb-5ea1-b42e-cb3d-c37d13fb7a61 |
| IC Commander | e64c295c-0e0d-49b0-9b29-79cdc70a102a | T_f8686154-2c4d-12c9-a892-553766a98328 |
