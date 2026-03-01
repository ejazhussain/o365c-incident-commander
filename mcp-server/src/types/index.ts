// ============================================================
// Incident Commander MCP Server — Core Types
// ============================================================

// --- Incident ---

export type Severity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  services: string[];
  description: string;
  reportedBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateIncidentRequest {
  title: string;
  severity: Severity;
  services: string[];
  description: string;
  reportedBy?: string;
  assignedTo?: string;
}

export interface UpdateSeverityRequest {
  incidentId: string;
  newSeverity: Severity;
  reason: string;
}

// --- Status Updates ---

export interface StatusUpdate {
  id: string;
  incidentId: string;
  message: string;
  author: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
}

export interface AddStatusUpdateRequest {
  incidentId: string;
  message: string;
  author: string;
}

// --- Service Health ---

export type ServiceStatus = "healthy" | "degraded" | "down" | "maintenance";

export interface ServiceHealth {
  serviceName: string;
  status: ServiceStatus;
  uptime: number;
  lastChecked: string;
  details: string;
}

// --- Change Log ---

export type ChangeType = "deployment" | "config_change" | "rollback" | "hotfix";

export interface ChangeLogEntry {
  id: string;
  serviceName: string;
  type: ChangeType;
  description: string;
  author: string;
  timestamp: string;
  version?: string;
}

// --- Known Issues ---

export type IssueStatus = "open" | "mitigated" | "resolved";

export interface KnownIssue {
  id: string;
  serviceName: string;
  title: string;
  description: string;
  workaround?: string;
  status: IssueStatus;
  createdAt: string;
}

// --- Stakeholders ---

export type StakeholderRole =
  | "executive"
  | "engineering"
  | "customer_success"
  | "on_call"
  | "operations";

export interface Stakeholder {
  name: string;
  role: StakeholderRole;
  email: string;
  serviceName: string;
  notifyOnSeverity: Severity[];
}

// --- Post-Mortem ---

export interface TimelineEntry {
  timestamp: string;
  event: string;
}

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
  status: "open" | "in_progress" | "done";
}

export interface PostMortem {
  id: string;
  incidentId: string;
  summary: string;
  rootCause: string;
  impact: string;
  timeline: TimelineEntry[];
  actionItems: ActionItem[];
  createdAt: string;
  author: string;
}

export interface CreatePostMortemRequest {
  incidentId: string;
  summary: string;
  rootCause: string;
  impact: string;
  actionItems?: ActionItem[];
}

// --- Data Store Shape ---

export interface DataStore {
  incidents: Incident[];
  statusUpdates: StatusUpdate[];
  services: ServiceHealth[];
  changeLog: ChangeLogEntry[];
  knownIssues: KnownIssue[];
  stakeholders: Stakeholder[];
  postMortems: PostMortem[];
}
