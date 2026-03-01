/**
 * In-memory data store for the Incident Commander MCP Server.
 * Loads seed data on startup. All writes mutate in-memory only (no persistence needed for demo).
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { logger } from "../utils/logger.js";
import { DataStore } from "../types/index.js";

class DataStoreService {
  private store: DataStore;

  constructor() {
    this.store = {
      incidents: [],
      statusUpdates: [],
      services: [],
      changeLog: [],
      knownIssues: [],
      stakeholders: [],
      postMortems: [],
    };
  }

  /**
   * Load seed data from JSON file
   */
  initialize(): void {
    try {
      const seedPath = resolve(process.cwd(), "data", "seed.json");
      const raw = readFileSync(seedPath, "utf-8");
      const seedData = JSON.parse(raw) as DataStore;

      this.store.incidents = seedData.incidents || [];
      this.store.statusUpdates = seedData.statusUpdates || [];
      this.store.services = seedData.services || [];
      this.store.changeLog = seedData.changeLog || [];
      this.store.knownIssues = seedData.knownIssues || [];
      this.store.stakeholders = seedData.stakeholders || [];
      this.store.postMortems = seedData.postMortems || [];

      logger.success("Seed data loaded", {
        incidents: this.store.incidents.length,
        statusUpdates: this.store.statusUpdates.length,
        services: this.store.services.length,
        changeLog: this.store.changeLog.length,
        knownIssues: this.store.knownIssues.length,
        stakeholders: this.store.stakeholders.length,
        postMortems: this.store.postMortems.length,
      });
    } catch (err) {
      logger.error("Failed to load seed data", err);
      throw err;
    }
  }

  // --- Incidents ---

  getIncidents() {
    return this.store.incidents;
  }
  getIncidentById(id: string) {
    return this.store.incidents.find((i) => i.id === id);
  }
  addIncident(incident: DataStore["incidents"][0]) {
    this.store.incidents.push(incident);
  }
  updateIncident(id: string, updates: Partial<DataStore["incidents"][0]>) {
    const idx = this.store.incidents.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.store.incidents[idx] = { ...this.store.incidents[idx], ...updates };
    return this.store.incidents[idx];
  }

  // --- Status Updates ---

  getStatusUpdates() {
    return this.store.statusUpdates;
  }
  getStatusUpdatesByIncident(incidentId: string) {
    return this.store.statusUpdates
      .filter((su) => su.incidentId === incidentId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }
  addStatusUpdate(update: DataStore["statusUpdates"][0]) {
    this.store.statusUpdates.push(update);
  }

  // --- Services ---

  getServices() {
    return this.store.services;
  }
  getServiceByName(name: string) {
    return this.store.services.find((s) => s.serviceName === name);
  }

  // --- Change Log ---

  getChangeLog() {
    return this.store.changeLog;
  }
  getChangeLogByService(serviceName: string) {
    return this.store.changeLog.filter((c) => c.serviceName === serviceName);
  }
  getChangeLogSince(hoursBack: number) {
    const cutoff = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000,
    ).toISOString();
    return this.store.changeLog.filter((c) => c.timestamp >= cutoff);
  }

  // --- Known Issues ---

  getKnownIssues() {
    return this.store.knownIssues;
  }
  getKnownIssuesByService(serviceName: string) {
    return this.store.knownIssues.filter(
      (ki) => ki.serviceName === serviceName,
    );
  }

  // --- Stakeholders ---

  getStakeholders() {
    return this.store.stakeholders;
  }
  getStakeholdersByServiceAndSeverity(serviceName: string, severity: string) {
    const norm = (n: string) => n.trim().toLowerCase().replace(/\s+/g, "-");
    const normSvc = norm(serviceName);
    const normSev = severity.toUpperCase();
    return this.store.stakeholders.filter(
      (s) =>
        (s.serviceName === "all" || norm(s.serviceName) === normSvc) &&
        (s.notifyOnSeverity as string[]).includes(normSev),
    );
  }

  // --- Post-Mortems ---

  getPostMortems() {
    return this.store.postMortems;
  }
  getPostMortemByIncident(incidentId: string) {
    return this.store.postMortems.find((pm) => pm.incidentId === incidentId);
  }
  addPostMortem(pm: DataStore["postMortems"][0]) {
    this.store.postMortems.push(pm);
  }

  // --- Next ID generators ---

  getNextIncidentId(): string {
    const year = new Date().getFullYear();
    const existing = this.store.incidents
      .map((i) => parseInt(i.id.replace(`INC-${year}-`, ""), 10))
      .filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `INC-${year}-${String(next).padStart(3, "0")}`;
  }

  getNextStatusUpdateId(): string {
    const existing = this.store.statusUpdates
      .map((su) => parseInt(su.id.replace("SU-", ""), 10))
      .filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `SU-${String(next).padStart(3, "0")}`;
  }

  getNextPostMortemId(): string {
    const existing = this.store.postMortems
      .map((pm) => parseInt(pm.id.replace("PM-", ""), 10))
      .filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `PM-${String(next).padStart(3, "0")}`;
  }
}

// Singleton
export const dataStore = new DataStoreService();
