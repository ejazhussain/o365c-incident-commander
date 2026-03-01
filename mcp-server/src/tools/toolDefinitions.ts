/**
 * MCP Tool definitions — metadata exposed to MCP clients.
 * 8 read tools + 4 write tools = 12 total.
 */

export const TOOLS = [
  // ─── READ Tools ───────────────────────────────────────────
  {
    name: "list_active_incidents",
    description:
      "List all incidents in the system, optionally filtered by status (open, investigating, identified, monitoring, resolved) and/or severity (P1, P2, P3, P4)",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            "Filter by incident status: open, investigating, identified, monitoring, resolved",
        },
        severity: {
          type: "string",
          description: "Filter by severity level: P1, P2, P3, P4",
        },
      },
    },
  },
  {
    name: "get_incident",
    description:
      "Get full details of a specific incident by its ID (e.g., INC-2026-042), including all status updates and post-mortem if available",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description: 'The incident ID (e.g., "INC-2026-042")',
        },
      },
      required: ["incidentId"],
    },
  },
  {
    name: "get_service_health",
    description:
      "Get current health status for all monitored services or a specific service. Returns status (healthy, degraded, down, maintenance), uptime percentage, and details.",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceName: {
          type: "string",
          description:
            'Optional service name to filter (e.g., "payment-service"). Omit to get all services.',
        },
      },
    },
  },
  {
    name: "get_change_log",
    description:
      "Get recent changes (deployments, config changes, rollbacks, hotfixes) across all services or a specific service, within an optional time window",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceName: {
          type: "string",
          description: 'Filter by service name (e.g., "payment-service")',
        },
        hoursBack: {
          type: "number",
          description: "Only show changes from the last N hours (default: all)",
        },
      },
    },
  },
  {
    name: "get_known_issues",
    description:
      "Search the known issues database by service name and/or keyword. Returns issues with their status (open, mitigated, resolved) and workarounds.",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceName: { type: "string", description: "Filter by service name" },
        keyword: {
          type: "string",
          description:
            "Search keyword to match in title, description, or workaround",
        },
      },
    },
  },
  {
    name: "get_deployment_history",
    description:
      "Get deployment history (deployments, rollbacks, hotfixes) for a specific service within an optional time window",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceName: {
          type: "string",
          description: 'The service name (required, e.g., "payment-service")',
        },
        hoursBack: {
          type: "number",
          description: "Only show deployments from the last N hours",
        },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "get_status_timeline",
    description:
      "Get the full chronological timeline of status updates for a specific incident, ordered from earliest to latest",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description: 'The incident ID (e.g., "INC-2026-042")',
        },
      },
      required: ["incidentId"],
    },
  },
  {
    name: "get_stakeholders",
    description:
      "Get the list of stakeholders who should be notified for a given incident, service, or severity level. Returns names, roles, emails, and notification preferences. Prefer calling with incidentId — the server will auto-resolve the service and severity.",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description:
            'The incident ID to look up stakeholders for (e.g., "INC-2026-042"). Preferred over serviceName+severity.',
        },
        serviceName: {
          type: "string",
          description:
            'The affected service name (e.g., "payment-service"). Used when incidentId is not provided.',
        },
        severity: {
          type: "string",
          description:
            "The incident severity (P1, P2, P3, or P4). Used when incidentId is not provided.",
        },
      },
      required: [],
    },
  },

  {
    name: "investigate_incident",
    description:
      "Run a complete root cause analysis for an incident in a single call. Returns the incident details, all recent deployments (24h), change log entries (24h), and known issues for every affected service — aggregated and ready to analyse.",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description: 'The incident ID to investigate (e.g., "INC-2026-042")',
        },
      },
      required: ["incidentId"],
    },
  },

  // ─── WRITE Tools ──────────────────────────────────────────
  {
    name: "create_incident",
    description:
      "Create a new incident record in the system. Returns the created incident with an auto-generated ID. Also creates an initial status update automatically.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Short descriptive title of the incident",
        },
        severity: {
          type: "string",
          description:
            "Severity level: P1 (critical), P2 (high), P3 (medium), P4 (low)",
        },
        services: {
          type: "array",
          items: { type: "string" },
          description: "Array of affected service names",
        },
        description: {
          type: "string",
          description: "Detailed description of the incident and its impact",
        },
        reportedBy: {
          type: "string",
          description:
            "Who reported the incident (optional, defaults to copilot-agent)",
        },
        assignedTo: {
          type: "string",
          description:
            "Who is assigned to resolve it (optional, defaults to unassigned)",
        },
      },
      required: ["title", "severity", "services", "description"],
    },
  },
  {
    name: "update_severity",
    description:
      "Escalate or de-escalate the severity of an existing incident. Requires a reason for the change. Automatically creates a status update recording the change.",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description: "The incident ID to update",
        },
        newSeverity: {
          type: "string",
          description: "New severity level: P1, P2, P3, or P4",
        },
        reason: {
          type: "string",
          description: "Reason for the severity change",
        },
      },
      required: ["incidentId", "newSeverity", "reason"],
    },
  },
  {
    name: "add_status_update",
    description:
      "Add a new status update to an existing incident. Use this to record investigation progress, communication updates, or resolution steps.",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description: "The incident ID to add the update to",
        },
        message: {
          type: "string",
          description: "The status update message content",
        },
        author: {
          type: "string",
          description: "The author of the status update",
        },
      },
      required: ["incidentId", "message", "author"],
    },
  },
  {
    name: "create_post_mortem",
    description:
      "Generate and store a post-mortem report for an incident. The timeline is automatically built from the incident status updates. Only one post-mortem per incident is allowed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        incidentId: {
          type: "string",
          description: "The incident ID to create the post-mortem for",
        },
        summary: {
          type: "string",
          description: "Executive summary of what happened",
        },
        rootCause: {
          type: "string",
          description: "Technical root cause analysis",
        },
        impact: {
          type: "string",
          description: "Description of business and user impact",
        },
        actionItems: {
          type: "array",
          description: "List of follow-up action items",
          items: {
            type: "object",
            properties: {
              action: { type: "string", description: "What needs to be done" },
              owner: { type: "string", description: "Who is responsible" },
              deadline: {
                type: "string",
                description: "Target completion date",
              },
              status: {
                type: "string",
                description: "Current status: open, in_progress, or done",
              },
            },
            required: ["action", "owner", "deadline", "status"],
          },
        },
      },
      required: ["incidentId", "summary", "rootCause", "impact"],
    },
  },
];

/** Names of read-only tools (for counting / filtering). */
export const READ_TOOLS = [
  "list_active_incidents",
  "get_incident",
  "get_service_health",
  "get_change_log",
  "get_known_issues",
  "get_deployment_history",
  "get_status_timeline",
  "get_stakeholders",
  "investigate_incident",
] as const;

/** Names of write tools (for counting / filtering). */
export const WRITE_TOOLS = [
  "create_incident",
  "update_severity",
  "add_status_update",
  "create_post_mortem",
] as const;
