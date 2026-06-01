import { VLM_RUNTIME_L4_TUNING_MATRIX_ID, vlmRuntimeL4TuningProfiles } from './vlm-runtime-l4-tuning-profiles'
import type { VlmRuntimeL4TuningMatrixReport, VlmRuntimeL4TuningProfileResult } from './vlm-runtime-types'

export function buildVlmRuntimeL4TuningMatrixReport(input: {
  runId: string
  createdAt?: string
  profileResults?: VlmRuntimeL4TuningProfileResult[]
  selectedProfileId?: string
  status?: 'planned' | 'passed' | 'blocked'
}): VlmRuntimeL4TuningMatrixReport {
  const profileResults = input.profileResults ?? []
  const status = input.status ?? (input.selectedProfileId ? 'passed' : profileResults.length ? 'blocked' : 'planned')
  return {
    phase: '39C',
    runId: input.runId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    matrixId: VLM_RUNTIME_L4_TUNING_MATRIX_ID,
    status,
    selectedProfileId: input.selectedProfileId,
    profilesDefined: vlmRuntimeL4TuningProfiles,
    profilesAttempted: profileResults,
    allProfilesFailed: status === 'blocked' && profileResults.length > 0 && profileResults.every((profile) => profile.status !== 'passed'),
    fullPhase39CPassRequiresAllGeneratedFixtures: true,
    minimalSmokeCompletesPhase39C: false,
    blockedScopesStillBlocked: [
      'Phase 39D controlled real-frame VLM',
      'Phase 39E planning integration',
      'provider calls',
      'production',
      'beta',
      'public output',
      'broad media',
      'arbitrary media',
      'unapproved GPU types',
      'quantized variants',
      'smaller model candidates',
      'Track A',
    ],
  }
}
