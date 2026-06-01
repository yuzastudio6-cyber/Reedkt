export const TOOL_READINESS_STATES = [
  "not_configured",
  "planning_only",
  "readiness_check_only",
  "mock_only",
  "disabled",
  "blocked_missing_runtime",
  "blocked_missing_approval",
  "blocked_missing_secret",
  "blocked_by_policy",
  "ready_for_future_activation",
  "never_public",
] as const;

export type ToolReadinessState = (typeof TOOL_READINESS_STATES)[number];

export type ToolReadinessTrack =
  | "track_a_visual_video"
  | "track_b_audio"
  | "track_b_ocr"
  | "track_b_vlm"
  | "track_b_data"
  | "track_b_hybrid"
  | "foundation"
  | "blocked_provider";

export type ToolReadinessFamily =
  | "visual_video"
  | "audio"
  | "ocr"
  | "vlm"
  | "web_capture"
  | "maps"
  | "charts"
  | "data"
  | "hybrid_compute"
  | "provider";

export interface ToolRuntimeRequirement {
  toolId: string;
  displayName: string;
  family: ToolReadinessFamily;
  track: ToolReadinessTrack;
  allowedInPlanning: boolean;
  allowedInReadinessCheck: boolean;
  allowedInMock: boolean;
  allowedInRuntime: boolean;
  requiresWorker: boolean;
  requiredWorkerType: string | null;
  requiresDockerImage: boolean;
  requiresCloudRunJob: boolean;
  requiresGPU: boolean;
  allowedGpuType: string | null;
  requiresModelArtifact: boolean;
  modelArtifactRequiredPath: string | null;
  requiresSecret: boolean;
  secretNames: string[];
  requiresProvider: boolean;
  requiresStorageRead: boolean;
  requiresStorageWrite: boolean;
  requiresSignedUrl: boolean;
  requiresFrontendExecution: boolean;
  productionAllowed: boolean;
  externalBetaAllowed: boolean;
  broadRealMediaAllowed: boolean;
  readinessState: ToolReadinessState;
  blockedReason: string | null;
  nextRequiredPhase: string | null;
}

export interface ToolReadinessPolicySummary {
  prompt: "13";
  scope: string;
  defaultState: ToolReadinessState;
  runtimeExecutionAllowed: false;
  providerExecutionAllowed: false;
  mediaProcessingAllowed: false;
  signedUrlSourceOfTruthAllowed: false;
  productionAllowed: false;
  externalBetaAllowed: false;
  broadRealMediaAllowed: false;
}

export type ToolReadinessDiagnosticStatus = "passed" | "failed" | "warning";

export interface ToolReadinessDiagnosticCheck {
  id: string;
  status: ToolReadinessDiagnosticStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolReadinessDiagnosticsSummary {
  status: "passed" | "failed";
  checks: ToolReadinessDiagnosticCheck[];
  failedCheckIds: string[];
  warningCheckIds: string[];
  registrySize: number;
}

export interface ToolReadinessReport {
  prompt: "13";
  status: "ready_for_foundation_checks" | "blocked";
  generatedAt: string;
  policy: ToolReadinessPolicySummary;
  readinessStates: readonly ToolReadinessState[];
  tools: ToolRuntimeRequirement[];
  diagnostics: ToolReadinessDiagnosticsSummary;
  noScope: string[];
  nextPrompt: string;
}

export function isToolReadinessState(value: string): value is ToolReadinessState {
  return TOOL_READINESS_STATES.includes(value as ToolReadinessState);
}
