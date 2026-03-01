# 🚨 Incident Commander

**An intelligent multi-agent system for IT Major Incident Response, built for Microsoft 365 Copilot.**

> 🏆 Built for the [Agents League Competition](https://github.com/microsoft/agentsleague) — Enterprise Agents Track

---

## Problem

When a P1/P2 production incident hits, enterprises scramble — engineers are paged, war rooms are chaotic, status updates are manual, and post-mortems are forgotten. **Mean Time To Resolve (MTTR)** is the #1 metric every CTO cares about, yet incident response remains largely unstructured and reactive.

## Solution

**Incident Commander** is a connected multi-agent system inside M365 Copilot Chat that acts as an automated Incident Commander. It orchestrates 4 specialized agents to handle the full incident lifecycle — from detection to post-mortem — reducing MTTR and eliminating manual coordination overhead.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     M365 Copilot Chat                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           🎖️ Commander (Orchestrator DA)               │  │
│  │    Routes user intent → delegates to specialist agents │  │
│  │    worker_agents: [triage, investigation,              │  │
│  │                     communication, postmortem]         │  │
│  └─────┬────────────┬────────────┬────────────┬──────────┘  │
│        │            │            │            │              │
│  ┌─────▼─────┐ ┌────▼──────┐ ┌──▼────────┐ ┌─▼──────────┐  │
│  │ 🚨 Triage │ │ 🔍 Invest-│ │ 📢 Commu- │ │ 📝 Post-   │  │
│  │   Agent   │ │  igation  │ │  nication │ │   Mortem   │  │
│  │   (DA)    │ │  Agent    │ │  Agent    │ │   Agent    │  │
│  │           │ │  (DA)     │ │  (DA)     │ │   (DA)     │  │
│  └─────┬─────┘ └────┬──────┘ └──┬────────┘ └─┬──────────┘  │
│        └────────────┴───────────┴────────────┘              │
│                          │                                   │
│                    MCP Protocol                              │
└──────────────────────────┼───────────────────────────────────┘
                           │ OAuth 2.0 (Entra ID)
                ┌──────────▼──────────┐
                │   🔧 MCP Server     │
                │   (Node.js)         │
                │                     │
                │  READ:              │
                │  • listActiveIncidents   │
                │  • getIncident           │
                │  • getServiceHealth      │
                │  • getChangeLog          │
                │  • getKnownIssues        │
                │  • getDeploymentHistory  │
                │  • getStatusTimeline     │
                │  • getStakeholders       │
                │                     │
                │  WRITE:             │
                │  • createIncident        │
                │  • updateSeverity        │
                │  • addStatusUpdate       │
                │  • createPostMortem      │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────┐
                │  📦 Incident Store  │
                │  (Mock JSON DB /    │
                │   Azure Cosmos DB)  │
                └─────────────────────┘
```

---

## Agents

### 🎖️ Commander (Orchestrator)

| Property | Value |
|----------|-------|
| **Type** | Declarative Agent (No Action) |
| **Role** | Routes user queries to the correct specialist agent |
| **Config** | `worker_agents: [triage, investigation, communication, postmortem]` |

**Routing Logic:**
- "new incident" / "something is down" / "report outage" → **Triage Agent**
- "what caused this" / "root cause" / "recent changes" → **Investigation Agent**
- "notify stakeholders" / "status update" / "who needs to know" → **Communication Agent**
- "generate post-mortem" / "incident review" / "what happened" → **Post-Mortem Agent**

---

### 🚨 Triage Agent

| Property | Value |
|----------|-------|
| **Type** | Declarative Agent + MCP Actions |
| **Role** | Classifies severity, identifies affected services, creates incident records |
| **MCP Tools** | `listActiveIncidents`, `getServiceHealth`, `createIncident`, `updateSeverity` |
| **Output** | Triage Form Adaptive Card, Incident Dashboard Card |

**Reasoning Flow:**
1. Receive incident report from user
2. Query `getServiceHealth` to identify affected services
3. Check `listActiveIncidents` for duplicate/related incidents
4. Classify severity (P1–P4) based on impact & urgency matrix
5. `createIncident` with structured data
6. Return Adaptive Card with incident summary + escalation actions

---

### 🔍 Investigation Agent

| Property | Value |
|----------|-------|
| **Type** | Declarative Agent + MCP Actions + Embedded Knowledge |
| **Role** | Correlates data to identify probable root cause |
| **MCP Tools** | `getIncident`, `getChangeLog`, `getKnownIssues`, `getDeploymentHistory` |
| **Knowledge** | Embedded runbook PDFs for common incident patterns |

**Reasoning Flow:**
1. Pull incident details via `getIncident`
2. Retrieve recent changes via `getChangeLog` (last 48h)
3. Check `getDeploymentHistory` for the affected service
4. Cross-reference with `getKnownIssues` for pattern matches
5. Correlate timestamps: deployment → symptom onset
6. Rank probable root causes with confidence levels
7. Recommend remediation steps from embedded runbooks

---

### 📢 Communication Agent

| Property | Value |
|----------|-------|
| **Type** | Declarative Agent + MCP Actions |
| **Role** | Drafts stakeholder communications, provides live status dashboards |
| **MCP Tools** | `getIncident`, `getStatusTimeline`, `addStatusUpdate`, `getStakeholders` |
| **Output** | Status Update Adaptive Card, Incident Dashboard Card |

**Reasoning Flow:**
1. Pull current incident state via `getIncident`
2. Retrieve full timeline via `getStatusTimeline`
3. Identify audience via `getStakeholders` (execs, engineering, customers)
4. Draft tailored updates per audience with appropriate detail level
5. `addStatusUpdate` to persist the communication
6. Return Adaptive Cards with live status + action buttons

---

### 📝 Post-Mortem Agent

| Property | Value |
|----------|-------|
| **Type** | Declarative Agent + MCP Actions |
| **Role** | Generates structured post-mortem reports after incident resolution |
| **MCP Tools** | `getIncident`, `getStatusTimeline`, `getChangeLog`, `createPostMortem` |

**Reasoning Flow:**
1. Pull full incident data via `getIncident`
2. Reconstruct timeline from `getStatusTimeline`
3. Correlate with `getChangeLog` for root cause evidence
4. Generate structured post-mortem:
   - **Summary** — what happened, duration, impact
   - **Timeline** — chronological event sequence
   - **Root Cause** — technical analysis
   - **Impact** — affected users, services, revenue
   - **Action Items** — preventive measures with owners & deadlines
5. `createPostMortem` to persist the report

---

## MCP Server

### Tools Reference

| Tool | Type | Parameters | Returns |
|------|------|-----------|---------|
| `listActiveIncidents` | Read | `status?`, `severity?` | Array of incident summaries |
| `getIncident` | Read | `incidentId` | Full incident details |
| `getServiceHealth` | Read | `serviceName?` | Service health status map |
| `getChangeLog` | Read | `serviceName?`, `hoursBack?` | Recent changes/deployments |
| `getKnownIssues` | Read | `serviceName?`, `keyword?` | Known issues database entries |
| `getDeploymentHistory` | Read | `serviceName`, `hoursBack?` | Deployment timeline |
| `getStatusTimeline` | Read | `incidentId` | Chronological status updates |
| `getStakeholders` | Read | `serviceName`, `severity` | Contact list by role |
| `createIncident` | Write | `title`, `severity`, `services`, `description` | New incident with ID |
| `updateSeverity` | Write | `incidentId`, `newSeverity`, `reason` | Updated incident |
| `addStatusUpdate` | Write | `incidentId`, `message`, `author` | Persisted status entry |
| `createPostMortem` | Write | `incidentId`, `summary`, `rootCause`, `actionItems` | Persisted post-mortem |

### Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express + `@modelcontextprotocol/sdk`
- **Auth**: OAuth 2.0 via Microsoft Entra ID (JWT validation against JWKS)
- **Data**: Mock JSON store (swappable with Azure Cosmos DB)
- **Tunnel**: VS Code Dev Tunnels for HTTPS during development

---

## Adaptive Cards

### 1. Incident Dashboard Card
Displays live incident status with severity badge, affected services, assigned team, and timeline. Includes action buttons: **Escalate**, **Update Status**, **Resolve**.

### 2. Triage Form Card
Input form for reporting a new incident: service selector, severity dropdown (P1–P4), impact description textarea, and a **Submit** action button.

### 3. Status Update Card
Formatted communication card with timestamp, severity indicator, current status, next steps, and audience tag (Executive / Engineering / Customer).

### 4. Post-Mortem Summary Card
Structured report with collapsible sections: Summary, Timeline, Root Cause Analysis, Impact Assessment, and Action Items table with owners and deadlines.

---

## Project Structure

```
📂 o365c-incident-commander/
│
├── 📂 agents/
│   ├── 📂 commander-orchestrator/     # DA #1 — routes to sub-agents
│   │   ├── 📂 appPackage/
│   │   │   ├── declarativeAgent.json  # worker_agents: [4 IDs]
│   │   │   ├── instruction.txt        # Routing decision framework
│   │   │   ├── manifest.json
│   │   │   ├── color.png
│   │   │   └── outline.png
│   │   ├── 📂 env/
│   │   └── m365agent.yml
│   │
│   ├── 📂 triage-agent/              # DA #2 — severity classification
│   │   ├── 📂 appPackage/
│   │   │   ├── declarativeAgent.json  # actions: [ai-plugin.json]
│   │   │   ├── ai-plugin.json         # MCP tools: create/read incidents
│   │   │   ├── instruction.txt        # Triage reasoning logic
│   │   │   └── manifest.json
│   │   ├── 📂 env/
│   │   └── m365agent.yml
│   │
│   ├── 📂 investigation-agent/       # DA #3 — root cause analysis
│   │   ├── 📂 appPackage/
│   │   │   ├── declarativeAgent.json  # actions + EmbeddedKnowledge
│   │   │   ├── ai-plugin.json         # MCP tools: read changes/issues
│   │   │   ├── instruction.txt        # Investigation reasoning chain
│   │   │   ├── manifest.json
│   │   │   └── 📂 EmbeddedKnowledge/
│   │   │       └── runbooks.pdf       # Common incident playbooks
│   │   ├── 📂 env/
│   │   └── m365agent.yml
│   │
│   ├── 📂 communication-agent/       # DA #4 — stakeholder updates
│   │   ├── 📂 appPackage/
│   │   │   ├── declarativeAgent.json  # actions: [ai-plugin.json]
│   │   │   ├── ai-plugin.json         # MCP tools: read/write updates
│   │   │   ├── instruction.txt        # Communication templates
│   │   │   └── manifest.json
│   │   ├── 📂 env/
│   │   └── m365agent.yml
│   │
│   └── 📂 postmortem-agent/          # DA #5 — post-mortem generation
│       ├── 📂 appPackage/
│       │   ├── declarativeAgent.json  # actions: [ai-plugin.json]
│       │   ├── ai-plugin.json         # MCP tools: read all + write report
│       │   ├── instruction.txt        # Post-mortem structure template
│       │   └── manifest.json
│       ├── 📂 env/
│       └── m365agent.yml
│
├── 📂 mcp-server/                     # OAuth-secured MCP server
│   ├── 📂 src/
│   │   ├── server.ts                  # Express + MCP SDK entry point
│   │   ├── 📂 tools/
│   │   │   ├── incidents.ts           # CRUD incident tools
│   │   │   ├── services.ts            # Service health tools
│   │   │   ├── changes.ts             # Change log tools
│   │   │   └── postmortem.ts          # Post-mortem tools
│   │   ├── 📂 auth/
│   │   │   └── entraId.ts             # JWT validation + JWKS
│   │   └── 📂 data/
│   │       └── seed.json              # Pre-populated demo scenario
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── 📂 adaptive-cards/                 # Shared Adaptive Card templates
│   ├── incident-dashboard.json
│   ├── triage-form.json
│   ├── status-update.json
│   └── postmortem-summary.json
│
├── .gitignore
├── LICENSE
└── README.md                          # ← This file
```

---

## Competition Scoring Target

### Technical Bonus Points (33/33)

| Criterion | Points | Status |
|-----------|--------|--------|
| M365 Copilot Chat Agent | Required | ✅ Commander orchestrator in Copilot Chat |
| Connected Agents Architecture | 15 | ✅ 5 DAs with `worker_agents` orchestration |
| External MCP Server (Read/Write) | 8 | ✅ 12 tools (8 read + 4 write) with OAuth |
| OAuth Security for MCP | 5 | ✅ Entra ID JWT validation |
| Adaptive Cards UI/UX | 5 | ✅ 4 card templates |
| **Total** | **33** | **✅** |

### Judging Criteria Strategy

| Criterion | Weight | Our Approach |
|-----------|--------|-------------|
| Accuracy & Relevance | 20% | Directly solves a universal enterprise problem with proper M365 integration |
| Reasoning & Multi-step Thinking | 20% | Each agent has a documented multi-step reasoning chain |
| Reliability & Safety | 20% | OAuth, Entra ID, input validation, no hardcoded secrets |
| Creativity & Originality | 15% | Unique incident response angle — nobody else will build this |
| UX & Presentation | 15% | Adaptive Cards + compelling live demo video |
| Community Vote | 10% | Relatable problem — every developer has lived through a P1 |

---

## Build Order

| Phase | Task | Est. Time |
|-------|------|-----------|
| 1 | MCP Server — scaffold, implement 12 tools, seed data | 4–6 hrs |
| 2 | MCP Server — add OAuth (Entra ID app reg + JWT validation) | 2–3 hrs |
| 3 | Triage Agent — scaffold DA, connect MCP tools, write instructions | 2–3 hrs |
| 4 | Investigation Agent — scaffold DA, connect MCP tools, add runbook PDF | 2–3 hrs |
| 5 | Communication Agent — scaffold DA, connect MCP tools, Adaptive Cards | 2–3 hrs |
| 6 | Post-Mortem Agent — scaffold DA, connect MCP tools, write instructions | 2–3 hrs |
| 7 | Commander Orchestrator — scaffold DA, wire `worker_agents`, routing instructions | 1–2 hrs |
| 8 | End-to-end testing in M365 Copilot Chat | 2–3 hrs |
| 9 | Demo video recording + README polish | 2–3 hrs |
| **Total** | | **~20–28 hrs** |

---

## Demo Scenario

**"Payment Service Outage"** — A realistic P1 incident walk-through:

1. 🚨 **User reports**: "The payment service is returning 500 errors, customers can't checkout"
2. 🎖️ **Commander** routes to → **Triage Agent**
3. 🚨 **Triage** checks service health, classifies as P1, creates incident INC-2026-042
4. 🎖️ **Commander** routes "what caused this?" to → **Investigation Agent**
5. 🔍 **Investigation** finds a deployment 2 hours ago, correlates with error spike, identifies bad config change
6. 🎖️ **Commander** routes "notify the stakeholders" to → **Communication Agent**
7. 📢 **Communication** drafts exec summary + engineering details + customer notice, returns Adaptive Card dashboard
8. _(User resolves the issue by rolling back the deployment)_
9. 🎖️ **Commander** routes "generate post-mortem" to → **Post-Mortem Agent**
10. 📝 **Post-Mortem** produces a full report with timeline, root cause, and 3 action items

---

## Prerequisites

| Requirement | Purpose |
|-------------|---------|
| Node.js 18+ | MCP Server runtime |
| VS Code + M365 Agents Toolkit (ATK v6.4.2+) | Scaffold & provision DAs |
| Microsoft 365 tenant with sideloading enabled | Test agents in Copilot Chat |
| Microsoft Entra ID app registration | OAuth for MCP server |
| Azure subscription (optional) | Cosmos DB if replacing mock store |
| GitHub CLI (`gh`) | Repo management |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<YOUR_USERNAME>/o365c-incident-commander.git
cd o365c-incident-commander

# Set up the MCP server
cd mcp-server
npm install
cp .env.example .env
# Fill in Entra ID credentials in .env
npm run dev

# Open each agent project in VS Code with ATK
# Follow the build order above
```

---

## License

[MIT](./LICENSE)
