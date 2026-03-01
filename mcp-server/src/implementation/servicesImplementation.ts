/**
 * Services Implementation — Service health, change log, deployments, known issues, stakeholders
 */

import { logger } from "../utils/logger.js";
import { dataStore } from "../services/dataStore.js";
import {
  ServiceHealth,
  ChangeLogEntry,
  KnownIssue,
  Stakeholder,
} from "../types/index.js";

/**
 * Normalize a service name for fuzzy matching.
 * "payment service" → "payment-service", "Payment Service" → "payment-service"
 */
function normalizeServiceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Find a service by name with fuzzy matching (handles spaces vs hyphens, case).
 * Falls back to partial/contains match if exact normalized match fails.
 */
function findService(name: string) {
  const normalized = normalizeServiceName(name);
  const all = dataStore.getServices();
  // 1. Exact normalized match
  let match = all.find(
    (s) => normalizeServiceName(s.serviceName) === normalized,
  );
  // 2. Contains match (e.g. "payment" matches "payment-service")
  if (!match) {
    match = all.find(
      (s) =>
        normalizeServiceName(s.serviceName).includes(normalized) ||
        normalized.includes(normalizeServiceName(s.serviceName)),
    );
  }
  return match ?? null;
}

export class ServicesImplementation {
  /**
   * Get health status for all services or a specific service
   */
  async getHealth(serviceName?: string): Promise<ServiceHealth[]> {
    logger.info("Fetching service health", { serviceName });

    if (serviceName) {
      const service = findService(serviceName);
      return service ? [service] : dataStore.getServices(); // return all if no match
    }
    return dataStore.getServices();
  }

  /**
   * Get change log entries, optionally filtered by service and time window
   */
  async getChangeLog(
    serviceName?: string,
    hoursBack?: number,
  ): Promise<ChangeLogEntry[]> {
    logger.info("Fetching change log", { serviceName, hoursBack });

    let entries: ChangeLogEntry[];

    if (hoursBack) {
      entries = dataStore.getChangeLogSince(hoursBack);
    } else {
      entries = dataStore.getChangeLog();
    }

    if (serviceName) {
      const norm = normalizeServiceName(serviceName);
      entries = entries.filter(
        (e) =>
          normalizeServiceName(e.serviceName) === norm ||
          normalizeServiceName(e.serviceName).includes(norm) ||
          norm.includes(normalizeServiceName(e.serviceName)),
      );
    }

    // Sort by timestamp descending (most recent first)
    return entries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Get deployment history for a specific service
   */
  async getDeployments(
    serviceName?: string,
    hoursBack?: number,
  ): Promise<ChangeLogEntry[]> {
    logger.info("Fetching deployment history", { serviceName, hoursBack });

    let entries = dataStore.getChangeLog();

    // Filter by service name only when a non-empty value is provided
    if (serviceName && serviceName !== "all") {
      const normName = normalizeServiceName(serviceName);
      entries = entries.filter(
        (e) =>
          normalizeServiceName(e.serviceName) === normName ||
          normalizeServiceName(e.serviceName).includes(normName) ||
          normName.includes(normalizeServiceName(e.serviceName)),
      );
    }

    // Filter to deployment-type entries only
    entries = entries.filter(
      (e) =>
        e.type === "deployment" || e.type === "rollback" || e.type === "hotfix",
    );

    if (hoursBack) {
      const cutoff = new Date(
        Date.now() - hoursBack * 60 * 60 * 1000,
      ).toISOString();
      entries = entries.filter((e) => e.timestamp >= cutoff);
    }

    return entries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Get known issues, optionally filtered by service and keyword
   */
  async getKnownIssues(
    serviceName?: string,
    keyword?: string,
  ): Promise<KnownIssue[]> {
    logger.info("Fetching known issues", { serviceName, keyword });

    let issues: KnownIssue[];

    if (serviceName) {
      const norm = normalizeServiceName(serviceName);
      issues = dataStore
        .getKnownIssues()
        .filter(
          (i) =>
            normalizeServiceName(i.serviceName) === norm ||
            normalizeServiceName(i.serviceName).includes(norm) ||
            norm.includes(normalizeServiceName(i.serviceName)),
        );
    } else {
      issues = dataStore.getKnownIssues();
    }

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      issues = issues.filter(
        (ki) =>
          ki.title.toLowerCase().includes(lowerKeyword) ||
          ki.description.toLowerCase().includes(lowerKeyword) ||
          (ki.workaround && ki.workaround.toLowerCase().includes(lowerKeyword)),
      );
    }

    return issues;
  }

  /**
   * Get stakeholders to notify based on service and severity
   */
  async getStakeholders(
    serviceName?: string,
    severity?: string,
  ): Promise<Stakeholder[]> {
    logger.info("Fetching stakeholders", { serviceName, severity });
    // Normalise: empty / "all" → "all" so the dataStore filter returns
    // stakeholders with serviceName === "all" (i.e. global on-calls)
    const svc = serviceName && serviceName !== "all" ? serviceName : "all";
    const sev = severity ?? "P1";
    return dataStore.getStakeholdersByServiceAndSeverity(svc, sev);
  }
}

export const servicesImplementation = new ServicesImplementation();
