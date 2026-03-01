/**
 * Custom error classes for the Incident Commander MCP Server
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class IncidentNotFoundError extends Error {
  constructor(incidentId: string) {
    super(`Incident ${incidentId} not found`);
    this.name = "IncidentNotFoundError";
  }
}

export class ServiceNotFoundError extends Error {
  constructor(serviceName: string) {
    super(`Service ${serviceName} not found`);
    this.name = "ServiceNotFoundError";
  }
}

export class PostMortemNotFoundError extends Error {
  constructor(id: string) {
    super(`Post-mortem ${id} not found`);
    this.name = "PostMortemNotFoundError";
  }
}

export class DuplicatePostMortemError extends Error {
  constructor(incidentId: string) {
    super(`Post-mortem already exists for incident ${incidentId}`);
    this.name = "DuplicatePostMortemError";
  }
}

/**
 * Type guard for custom errors
 */
export function isCustomError(
  error: unknown,
): error is
  | ValidationError
  | IncidentNotFoundError
  | ServiceNotFoundError
  | PostMortemNotFoundError
  | DuplicatePostMortemError {
  return (
    error instanceof ValidationError ||
    error instanceof IncidentNotFoundError ||
    error instanceof ServiceNotFoundError ||
    error instanceof PostMortemNotFoundError ||
    error instanceof DuplicatePostMortemError
  );
}
