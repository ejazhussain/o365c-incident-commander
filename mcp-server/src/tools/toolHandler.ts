/**
 * Tool handler — routes MCP tool calls to the correct implementation.
 */

import {
  ListActiveIncidentsSchema,
  GetIncidentSchema,
  GetServiceHealthSchema,
  GetChangeLogSchema,
  GetKnownIssuesSchema,
  GetDeploymentHistorySchema,
  GetStatusTimelineSchema,
  GetStakeholdersSchema,
  InvestigateIncidentSchema,
  CreateIncidentSchema,
  UpdateSeveritySchema,
  AddStatusUpdateSchema,
  CreatePostMortemSchema,
} from "../schemas/toolSchemas.js";

import { incidentsImplementation } from "../implementation/incidentsImplementation.js";
import { servicesImplementation } from "../implementation/servicesImplementation.js";
import { postMortemImplementation } from "../implementation/postmortemImplementation.js";

/**
 * Dispatch a tool call by name to the matching implementation.
 * Returns the JSON-serialized result string.
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    // ─── READ ──────────────────────────────────────────────
    case "list_active_incidents": {
      const parsed = ListActiveIncidentsSchema.parse(args);
      const result = await incidentsImplementation.getActiveIncidents(parsed);
      return JSON.stringify(result, null, 2);
    }
    case "get_incident": {
      const parsed = GetIncidentSchema.parse(args);
      const result = await incidentsImplementation.getById(parsed.incidentId);
      return JSON.stringify(result, null, 2);
    }
    case "get_service_health": {
      const parsed = GetServiceHealthSchema.parse(args);
      const result = await servicesImplementation.getHealth(parsed.serviceName);
      return JSON.stringify(result, null, 2);
    }
    case "get_change_log": {
      const parsed = GetChangeLogSchema.parse(args);
      // resolve aliases: service → serviceName, hours → hoursBack
      const svcName = parsed.serviceName ?? parsed.service;
      const hrs = parsed.hoursBack ?? parsed.hours;
      const result = await servicesImplementation.getChangeLog(svcName, hrs);
      return JSON.stringify(result, null, 2);
    }
    case "get_known_issues": {
      const parsed = GetKnownIssuesSchema.parse(args);
      // resolve alias: service → serviceName
      const svcName = parsed.serviceName ?? parsed.service;
      const result = await servicesImplementation.getKnownIssues(
        svcName,
        parsed.keyword,
      );
      return JSON.stringify(result, null, 2);
    }
    case "get_deployment_history": {
      const parsed = GetDeploymentHistorySchema.parse(args);
      // resolve aliases: service → serviceName, hours → hoursBack
      const svcName = parsed.serviceName ?? parsed.service;
      const hrs = parsed.hoursBack ?? parsed.hours;
      const result = await servicesImplementation.getDeployments(
        svcName ?? "",
        hrs,
      );
      return JSON.stringify(result, null, 2);
    }
    case "get_status_timeline": {
      const parsed = GetStatusTimelineSchema.parse(args);
      const result = await incidentsImplementation.getTimeline(
        parsed.incidentId,
      );
      return JSON.stringify(result, null, 2);
    }
    case "get_stakeholders": {
      const parsed = GetStakeholdersSchema.parse(args);
      let svcName = parsed.serviceName ?? "all";
      let sev = parsed.severity ?? "P1";
      // If called with incidentId, look up the incident to get service + severity
      if (parsed.incidentId) {
        const found = await incidentsImplementation
          .getById(parsed.incidentId)
          .catch(() => null);
        if (found?.incident) {
          svcName = found.incident.services?.[0] ?? "all";
          sev = found.incident.severity ?? "P1";
        }
      }
      const result = await servicesImplementation.getStakeholders(svcName, sev);
      return JSON.stringify(result, null, 2);
    }

    case "investigate_incident": {
      const parsed = InvestigateIncidentSchema.parse(args);
      // Load incident first to get affected services
      const incidentData = await incidentsImplementation.getById(parsed.incidentId);
      const services = incidentData.incident.services ?? [];
      // Fetch all investigation data in parallel — one round-trip instead of 4
      const [deploymentsArr, changeLogsArr, knownIssuesArr] = await Promise.all([
        Promise.all(services.map((svc) => servicesImplementation.getDeployments(svc, 24))),
        Promise.all(services.map((svc) => servicesImplementation.getChangeLog(svc, 24))),
        Promise.all(services.map((svc) => servicesImplementation.getKnownIssues(svc))),
      ]);
      const result = {
        incident: incidentData.incident,
        statusUpdates: incidentData.statusUpdates,
        recentDeployments: deploymentsArr.flat(),
        recentChanges: changeLogsArr.flat(),
        knownIssues: knownIssuesArr.flat(),
      };
      return JSON.stringify(result, null, 2);
    }

    // ─── WRITE ─────────────────────────────────────────────
    case "create_incident": {
      const parsed = CreateIncidentSchema.parse(args);
      const result = await incidentsImplementation.create(parsed);
      return JSON.stringify(result, null, 2);
    }
    case "update_severity": {
      const parsed = UpdateSeveritySchema.parse(args);
      const result = await incidentsImplementation.updateSeverity(
        parsed.incidentId,
        parsed.newSeverity,
        parsed.reason,
      );
      return JSON.stringify(result, null, 2);
    }
    case "add_status_update": {
      const parsed = AddStatusUpdateSchema.parse(args);
      const result = await incidentsImplementation.addStatusUpdate(parsed);
      return JSON.stringify(result, null, 2);
    }
    case "create_post_mortem": {
      const parsed = CreatePostMortemSchema.parse(args);
      const result = await postMortemImplementation.create(parsed);
      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
