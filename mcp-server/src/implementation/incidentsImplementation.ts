/**
 * Incidents Implementation — CRUD + status updates for incidents
 */

import { logger } from "../utils/logger.js";
import { dataStore } from "../services/dataStore.js";
import {
  Incident,
  CreateIncidentRequest,
  StatusUpdate,
  AddStatusUpdateRequest,
  Severity,
} from "../types/index.js";
import { IncidentNotFoundError, ValidationError } from "../utils/errors.js";

export class IncidentsImplementation {
  /**
   * List active incidents with optional filters
   */
  async getActiveIncidents(filters?: {
    status?: string;
    severity?: string;
  }): Promise<Incident[]> {
    logger.info("Fetching active incidents", { filters });
    let incidents = dataStore.getIncidents();

    if (filters?.status) {
      incidents = incidents.filter((i) => i.status === filters.status);
    }
    if (filters?.severity) {
      incidents = incidents.filter((i) => i.severity === filters.severity);
    }

    return incidents;
  }

  /**
   * Get a single incident by ID, enriched with status updates and post-mortem
   */
  async getById(incidentId: string): Promise<{
    incident: Incident;
    statusUpdates: StatusUpdate[];
    postMortem?: any;
  }> {
    logger.info(`Fetching incident: ${incidentId}`);
    const incident = dataStore.getIncidentById(incidentId);
    if (!incident) {
      throw new IncidentNotFoundError(incidentId);
    }

    const statusUpdates = dataStore.getStatusUpdatesByIncident(incidentId);
    const postMortem = dataStore.getPostMortemByIncident(incidentId);

    return { incident, statusUpdates, postMortem };
  }

  /**
   * Create a new incident
   */
  async create(data: CreateIncidentRequest): Promise<Incident> {
    if (
      !data.title ||
      !data.severity ||
      !data.services?.length ||
      !data.description
    ) {
      throw new ValidationError(
        "title, severity, services, and description are required",
      );
    }

    const validSeverities: Severity[] = ["P1", "P2", "P3", "P4"];
    if (!validSeverities.includes(data.severity)) {
      throw new ValidationError(
        `severity must be one of: ${validSeverities.join(", ")}`,
      );
    }

    const newIncident: Incident = {
      id: dataStore.getNextIncidentId(),
      title: data.title,
      severity: data.severity,
      status: "open",
      services: data.services,
      description: data.description,
      reportedBy: data.reportedBy || "copilot-agent",
      assignedTo: data.assignedTo || "unassigned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataStore.addIncident(newIncident);
    logger.success(`Created incident ${newIncident.id}`, {
      severity: newIncident.severity,
    });

    // Auto-create initial status update
    const initialUpdate: StatusUpdate = {
      id: dataStore.getNextStatusUpdateId(),
      incidentId: newIncident.id,
      message: `Incident created: ${newIncident.title}. Severity: ${newIncident.severity}. Affected services: ${newIncident.services.join(", ")}.`,
      author: "system",
      severity: newIncident.severity,
      status: newIncident.status,
      createdAt: newIncident.createdAt,
    };
    dataStore.addStatusUpdate(initialUpdate);

    return newIncident;
  }

  /**
   * Update the severity of an incident (escalate/de-escalate)
   */
  async updateSeverity(
    incidentId: string,
    newSeverity: Severity,
    reason: string,
  ): Promise<Incident> {
    const incident = dataStore.getIncidentById(incidentId);
    if (!incident) {
      throw new IncidentNotFoundError(incidentId);
    }

    const validSeverities: Severity[] = ["P1", "P2", "P3", "P4"];
    if (!validSeverities.includes(newSeverity)) {
      throw new ValidationError(
        `severity must be one of: ${validSeverities.join(", ")}`,
      );
    }

    const oldSeverity = incident.severity;
    const updated = dataStore.updateIncident(incidentId, {
      severity: newSeverity,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new IncidentNotFoundError(incidentId);
    }

    // Auto-create status update for severity change
    const severityUpdate: StatusUpdate = {
      id: dataStore.getNextStatusUpdateId(),
      incidentId,
      message: `Severity changed from ${oldSeverity} to ${newSeverity}. Reason: ${reason}`,
      author: "system",
      severity: newSeverity,
      status: updated.status,
      createdAt: new Date().toISOString(),
    };
    dataStore.addStatusUpdate(severityUpdate);

    logger.success(
      `Updated severity for ${incidentId}: ${oldSeverity} → ${newSeverity}`,
    );
    return updated;
  }

  /**
   * Get the status timeline for an incident
   */
  async getTimeline(incidentId: string): Promise<StatusUpdate[]> {
    const incident = dataStore.getIncidentById(incidentId);
    if (!incident) {
      throw new IncidentNotFoundError(incidentId);
    }
    return dataStore.getStatusUpdatesByIncident(incidentId);
  }

  /**
   * Add a status update to an incident
   */
  async addStatusUpdate(data: AddStatusUpdateRequest): Promise<StatusUpdate> {
    if (!data.incidentId || !data.message || !data.author) {
      throw new ValidationError("incidentId, message, and author are required");
    }

    const incident = dataStore.getIncidentById(data.incidentId);
    if (!incident) {
      throw new IncidentNotFoundError(data.incidentId);
    }

    const update: StatusUpdate = {
      id: dataStore.getNextStatusUpdateId(),
      incidentId: data.incidentId,
      message: data.message,
      author: data.author,
      severity: incident.severity,
      status: incident.status,
      createdAt: new Date().toISOString(),
    };

    dataStore.addStatusUpdate(update);
    logger.success(`Added status update ${update.id} to ${data.incidentId}`);
    return update;
  }
}

export const incidentsImplementation = new IncidentsImplementation();
