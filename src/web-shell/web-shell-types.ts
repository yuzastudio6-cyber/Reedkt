export type WebShellStructureMode = 'transitional'

export type WebShellRouteId =
  | 'home'
  | 'projects'
  | 'project_intake'
  | 'project_overview'
  | 'editor_workspace'
  | 'job_queue'
  | 'artifact_library'
  | 'system_readiness'
  | 'compute_routes'
  | 'settings'
  | 'not_found'

export type WebShellRouteKind = 'global' | 'project' | 'system' | 'fallback'

export interface WebShellRouteDefinition {
  id: WebShellRouteId
  label: string
  path: string
  kind: WebShellRouteKind
  summary: string
}

export type WebShellSafetyTone = 'ready' | 'warning' | 'blocked' | 'future' | 'info' | 'private'

export interface WebShellSafetyPolicy {
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealMediaAllowed: false
  heavyLocalExecutionAllowed: false
  providerCallsFromBrowserAllowed: false
  serviceRoleEnvExposureAllowed: false
  signedUrlSourceOfTruthAllowed: false
  publicDeliveryControlsEnabled: false
  desktopLocalWorkerStatus: 'deferred'
  cloudExecutionStatus: 'gated'
  localComputeStatus: 'future'
  notes: string[]
}

export interface DisabledExecutionControl {
  controlId: string
  label: string
  reason: string
  mockSafe: true
  enabled: false
}

export interface WebShellProject {
  projectId: string
  name: string
  status: 'controlled_private_test'
  ownerLabel: string
  sourceLabel: string
  updatedLabel: string
  safetySummary: string
  chainSummary: string[]
}

export type WebShellJobStatus = 'completed' | 'warning' | 'blocked' | 'queued_future'

export interface WebShellJob {
  jobId: string
  label: string
  status: WebShellJobStatus
  routeCategory: ComputeRouteCategory
  summary: string
  details: string[]
}

export type WebShellArtifactKind =
  | 'source_media'
  | 'transcript'
  | 'captions'
  | 'timeline_manifest'
  | 'private_export'
  | 'mask'
  | 'preview'
  | 'qa_report'

export interface WebShellArtifact {
  artifactId: string
  label: string
  kind: WebShellArtifactKind
  privacy: 'private'
  summary: string
  userFacing: boolean
}

export type ComputeRouteCategory =
  | 'browser_preview'
  | 'desktop_local_worker_future'
  | 'cloud_cpu'
  | 'cloud_gpu_l4'
  | 'cloud_render'
  | 'blocked_by_policy'
  | 'needs_approval'

export interface ComputeRouteExample {
  routeId: string
  label: string
  source: string
  destination: string
  category: ComputeRouteCategory
  status: 'preview_only' | 'planned' | 'sample_first' | 'blocked' | 'needs_approval'
  executionEnabled: false
  summary: string
}

export interface WebShellReadinessItem {
  itemId: string
  label: string
  tone: WebShellSafetyTone
  summary: string
}
