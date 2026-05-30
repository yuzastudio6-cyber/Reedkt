import { getApprovedDeepFilterNetRuntimeEvidence } from '../deepfilternet-runtime'
import { realVideoDeepFilterNetConfig } from './real-video-deepfilternet-audio-cleanup-policy'
import type { RealVideoDeepFilterNetSourceSummary } from './real-video-deepfilternet-audio-cleanup-types'

export function buildRealVideoDeepFilterNetSourceSummary(): RealVideoDeepFilterNetSourceSummary {
  const runtime = getApprovedDeepFilterNetRuntimeEvidence()
  const blockers: string[] = []
  const warnings: string[] = []
  if (runtime.status !== 'verified') blockers.push('Phase 36C DeepFilterNet generated-audio runtime evidence is not verified.')
  if (runtime.runId !== realVideoDeepFilterNetConfig.phase36CRunId) blockers.push('Phase 36C run ID does not match the approved Phase 36D runtime evidence.')
  if (runtime.cloudRunExecutionId !== realVideoDeepFilterNetConfig.phase36CExecutionId) blockers.push('Phase 36C execution ID does not match the approved Phase 36D runtime evidence.')
  if (runtime.runtimeImageDigest !== realVideoDeepFilterNetConfig.phase36CImageDigest) blockers.push('Phase 36C runtime image digest does not match the approved Phase 36D evidence.')
  warnings.push('Phase 36D may use only the approved Phase 32 private export and Phase 31 audio-normalized reference.')
  warnings.push('The Phase 32 source is a controlled real-video chain sample, not arbitrary user media.')
  return {
    approvedInputVideo: realVideoDeepFilterNetConfig.approvedInputVideo,
    referencePhase31Audio: realVideoDeepFilterNetConfig.referencePhase31Audio,
    phase36CRunId: realVideoDeepFilterNetConfig.phase36CRunId,
    phase36CExecutionId: realVideoDeepFilterNetConfig.phase36CExecutionId,
    sourceLocked: blockers.length === 0,
    blockers,
    warnings,
  }
}
