import type { RenderTimingWorkerInputRecord } from '../../types/storytiming'
import type { MockRenderWorkerOutput } from './render-worker-contracts'

export function createMockRenderWorkerOutput(
  workerInput: RenderTimingWorkerInputRecord,
): MockRenderWorkerOutput {
  const blocked = workerInput.readiness === 'blocked_by_timing_conflicts' ||
    workerInput.readiness === 'blocked_by_missing_assets' ||
    workerInput.readiness === 'blocked_by_missing_tracks' ||
    workerInput.readiness === 'requires_user_review' ||
    workerInput.readiness === 'not_ready'

  return {
    renderTimingManifestId: workerInput.renderTimingManifestId,
    status: blocked ? 'blocked' : 'mock_ready',
    message: blocked
      ? `Mock render worker readiness is blocked by ${workerInput.readiness}.`
      : 'Mock render worker readiness passed. No rendering was executed.',
    warnings: workerInput.workerNotes.filter((note) => note.toLowerCase().includes('mock')),
    mockOnly: true,
  }
}

export function runMockRenderWorkerReadinessCheck(
  workerInput: RenderTimingWorkerInputRecord,
): MockRenderWorkerOutput {
  return createMockRenderWorkerOutput(workerInput)
}
