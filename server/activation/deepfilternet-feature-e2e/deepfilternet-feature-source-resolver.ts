import { getApprovedDeepFilterNetRuntimeEvidence } from '../deepfilternet-runtime'
import { getApprovedRealVideoDeepFilterNetEvidence } from '../real-video-deepfilternet-audio-cleanup'
import { deepFilterNetFeatureE2EConfig } from './deepfilternet-feature-e2e-policy'
import type { DeepFilterNetFeatureE2ESourceSummary } from './deepfilternet-feature-e2e-types'

export function buildDeepFilterNetFeatureE2ESourceSummary(): DeepFilterNetFeatureE2ESourceSummary {
  const runtime = getApprovedDeepFilterNetRuntimeEvidence()
  const phase36D = getApprovedRealVideoDeepFilterNetEvidence()
  const blockers: string[] = []
  const warnings: string[] = []
  if (runtime.status !== 'verified') blockers.push('Phase 36C DeepFilterNet generated-audio runtime evidence is not verified.')
  if (runtime.runId !== deepFilterNetFeatureE2EConfig.phase36CRunId) blockers.push('Phase 36C run ID does not match the approved Phase 36E runtime evidence.')
  if (runtime.cloudRunExecutionId !== deepFilterNetFeatureE2EConfig.phase36CExecutionId) blockers.push('Phase 36C execution ID does not match the approved Phase 36E runtime evidence.')
  if (runtime.runtimeImageDigest !== deepFilterNetFeatureE2EConfig.phase36CImageDigest) blockers.push('Phase 36C runtime image digest does not match the approved Phase 36E evidence.')
  if (phase36D.status !== 'completed' || !phase36D.realMediaAudioAiCleanupCompleted) blockers.push('Phase 36D controlled real-video DeepFilterNet evidence is not completed.')
  if (phase36D.runId !== deepFilterNetFeatureE2EConfig.phase36DRunId) blockers.push('Phase 36D run ID does not match the approved Phase 36E evidence.')
  if (phase36D.cloudRunExecutionId !== deepFilterNetFeatureE2EConfig.phase36DExecutionId) blockers.push('Phase 36D execution ID does not match the approved Phase 36E evidence.')
  if (phase36D.runtimeImageDigest !== deepFilterNetFeatureE2EConfig.phase36DImageDigest) blockers.push('Phase 36D runtime image digest does not match the approved Phase 36E evidence.')
  if (phase36D.qaReportUri !== deepFilterNetFeatureE2EConfig.phase36DReportUri) blockers.push('Phase 36D QA report URI does not match the approved Phase 36E evidence.')
  warnings.push('Phase 36E may use only the approved Phase 32 private export and Phase 31 audio-normalized reference.')
  warnings.push('The Phase 32 source is a controlled real-video chain sample, not arbitrary user media.')
  return {
    approvedInputVideo: deepFilterNetFeatureE2EConfig.approvedInputVideo,
    referencePhase31Audio: deepFilterNetFeatureE2EConfig.referencePhase31Audio,
    phase36CRunId: deepFilterNetFeatureE2EConfig.phase36CRunId,
    phase36CExecutionId: deepFilterNetFeatureE2EConfig.phase36CExecutionId,
    phase36DRunId: deepFilterNetFeatureE2EConfig.phase36DRunId,
    phase36DExecutionId: deepFilterNetFeatureE2EConfig.phase36DExecutionId,
    phase36DReportUri: deepFilterNetFeatureE2EConfig.phase36DReportUri,
    sourceLocked: blockers.length === 0,
    blockers,
    warnings,
  }
}
