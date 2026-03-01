/**
 * Zod schemas for MCP tool input validation.
 */

import { z } from "zod";

// --- READ tool schemas ---

export const ListActiveIncidentsSchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
});

export const GetIncidentSchema = z.object({
  incidentId: z.string(),
});

export const GetServiceHealthSchema = z.object({
  serviceName: z.string().optional(),
});

export const GetChangeLogSchema = z.object({
  serviceName: z.string().optional(),
  service: z.string().optional(), // alias used by agent ai-plugin.json
  hoursBack: z.number().optional(),
  hours: z.number().optional(), // alias used by agent ai-plugin.json
});

export const GetKnownIssuesSchema = z.object({
  serviceName: z.string().optional(),
  service: z.string().optional(), // alias used by agent ai-plugin.json
  status: z.string().optional(),
  keyword: z.string().optional(),
});

export const GetDeploymentHistorySchema = z.object({
  serviceName: z.string().optional(),
  service: z.string().optional(), // alias used by agent ai-plugin.json
  hoursBack: z.number().optional(),
  hours: z.number().optional(), // alias used by agent ai-plugin.json
});

export const GetStatusTimelineSchema = z.object({
  incidentId: z.string(),
});

export const GetStakeholdersSchema = z.object({
  serviceName: z.string().optional(),
  severity: z.string().optional(),
  incidentId: z.string().optional(), // agents call with incidentId
});

export const InvestigateIncidentSchema = z.object({
  incidentId: z.string().describe("The incident ID to investigate (e.g. INC-2026-042)"),
});

// --- WRITE tool schemas ---

export const CreateIncidentSchema = z.object({
  title: z.string(),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  services: z.array(z.string()),
  description: z.string(),
  reportedBy: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const UpdateSeveritySchema = z.object({
  incidentId: z.string(),
  newSeverity: z.enum(["P1", "P2", "P3", "P4"]),
  reason: z.string(),
});

export const AddStatusUpdateSchema = z.object({
  incidentId: z.string(),
  message: z.string(),
  author: z.string(),
});

export const CreatePostMortemSchema = z.object({
  incidentId: z.string(),
  summary: z.string(),
  rootCause: z.string(),
  impact: z.string(),
  actionItems: z
    .array(
      z.object({
        action: z.string(),
        owner: z.string(),
        deadline: z.string(),
        status: z.enum(["open", "in_progress", "done"]),
      }),
    )
    .optional(),
});
