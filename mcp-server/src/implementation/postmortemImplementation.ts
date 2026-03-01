/**
 * Post-Mortem Implementation — Create and retrieve post-mortem reports
 */

import { logger } from "../utils/logger.js";
import { dataStore } from "../services/dataStore.js";
import { PostMortem, CreatePostMortemRequest } from "../types/index.js";
import {
  IncidentNotFoundError,
  DuplicatePostMortemError,
  ValidationError,
} from "../utils/errors.js";

export class PostMortemImplementation {
  /**
   * Create a post-mortem report for a resolved incident
   */
  async create(data: CreatePostMortemRequest): Promise<PostMortem> {
    if (!data.incidentId || !data.summary || !data.rootCause || !data.impact) {
      throw new ValidationError(
        "incidentId, summary, rootCause, and impact are required",
      );
    }

    // Verify incident exists
    const incident = dataStore.getIncidentById(data.incidentId);
    if (!incident) {
      throw new IncidentNotFoundError(data.incidentId);
    }

    // Check for duplicate
    const existing = dataStore.getPostMortemByIncident(data.incidentId);
    if (existing) {
      throw new DuplicatePostMortemError(data.incidentId);
    }

    // Build timeline from status updates
    const statusUpdates = dataStore.getStatusUpdatesByIncident(data.incidentId);
    const timeline = statusUpdates.map((su) => ({
      timestamp: su.createdAt,
      event: su.message,
    }));

    const postMortem: PostMortem = {
      id: dataStore.getNextPostMortemId(),
      incidentId: data.incidentId,
      summary: data.summary,
      rootCause: data.rootCause,
      impact: data.impact,
      timeline,
      actionItems: data.actionItems || [],
      createdAt: new Date().toISOString(),
      author: "copilot-agent",
    };

    dataStore.addPostMortem(postMortem);
    logger.success(
      `Created post-mortem ${postMortem.id} for incident ${data.incidentId}`,
    );

    return postMortem;
  }

  /**
   * Get a post-mortem by incident ID
   */
  async getByIncidentId(incidentId: string): Promise<PostMortem | undefined> {
    logger.info(`Fetching post-mortem for incident: ${incidentId}`);
    return dataStore.getPostMortemByIncident(incidentId);
  }
}

export const postMortemImplementation = new PostMortemImplementation();
