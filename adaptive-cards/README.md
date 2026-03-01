# Adaptive Cards

This folder contains Adaptive Card designs for each major MCP tool response in the Incident Commander system.

> **Note:** `response_semantics` / `static_template` is currently only supported in **OpenAPI API plugins**, not `RemoteMCPServer` MCP plugins. These cards are designed ready for when Microsoft extends Adaptive Card support to MCP plugins, or for use in a future Bot Framework / Messaging Extension integration.
>
> All cards can be previewed today at **https://adaptivecards.io/designer/** — paste the JSON content to see the rendered output.

---

## Cards

| File | Tool | Agent | Description |
|------|------|-------|-------------|
| [incident-dashboard.json](incident-dashboard.json) | `list_active_incidents` | IC Triage | Color-coded active incident list with severity badges |
| [service-health.json](service-health.json) | `get_service_health` | IC Triage | Service health grid with colored status dots (🟢 healthy / 🟡 degraded / 🔴 down) |
| [status-timeline.json](status-timeline.json) | `get_status_timeline` | IC Communication, IC Post-Mortem | Chronological incident timeline with per-entry status badge |
| [stakeholder-notifications.json](stakeholder-notifications.json) | `get_stakeholders` | IC Communication | Grouped stakeholder list (Executive / Engineering) with notify-on severity |
| [postmortem-summary.json](postmortem-summary.json) | `create_post_mortem` | IC Post-Mortem | Full post-mortem report with summary, root cause, impact, and action items table |

---

## Card Design Patterns

All cards follow a consistent design language:

- **Header container** — coloured band (`emphasis` / `attention` / `good`) with emoji icon + title
- **FactSet** for structured key-value metadata
- **`$data` iteration** for list responses (incidents, services, timeline entries, action items)
- **Severity colour coding:**
  - P1 → `Attention` (red)
  - P2 → `Warning` (yellow)  
  - P3/P4 → `Good` (green)
- **Service status colour coding:**
  - `down` → `Attention` (red) ●
  - `degraded` → `Warning` (yellow) ●
  - `healthy` → `Good` (green) ●
- **Change type colour coding:**
  - `rollback` → `Attention` (red)
  - `hotfix` → `Warning` (yellow)
  - `deployment` → `Default`

---

## How to Preview

1. Open **https://adaptivecards.io/designer/**
2. Paste the contents of any `.json` file from this folder into the **Card Payload Editor**
3. The card renders live in the preview pane
4. Use the **Sample Data Editor** to swap in different data values
