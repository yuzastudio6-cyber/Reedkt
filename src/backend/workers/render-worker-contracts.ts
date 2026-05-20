export interface MockRenderWorkerInput {
  renderTimingManifestId: string
  masterTimingMapId: string
  projectId: string
  editPlanId: string
  renderJobId?: string
  tracks: unknown[]
  events: unknown[]
  dependencies: unknown[]
  requiredAssets: string[]
  workerNotes: string[]
  mockOnly: true
}

export interface MockRenderWorkerOutput {
  renderTimingManifestId: string
  status: 'not_started' | 'mock_ready' | 'blocked' | 'failed'
  message: string
  warnings: string[]
  mockOnly: true
}
