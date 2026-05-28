import { requiredNonGpuArtifactPushImageIds } from './artifact-image-manifest'
import type {
  ArtifactImageDigestEvidence,
  ArtifactPushBlocker,
  ArtifactPushPhase24Readiness,
  ArtifactPushPhase27Readiness,
  ArtifactPushResult,
  ArtifactPushWarning,
} from './artifact-push-types'

export interface EvaluateArtifactPushBlockersInput {
  pushResults: ArtifactPushResult[]
  digestEvidence: ArtifactImageDigestEvidence[]
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  realUserMediaTestingAllowed: boolean
}

export interface ArtifactPushBlockerEvaluation {
  blockers: ArtifactPushBlocker[]
  warnings: ArtifactPushWarning[]
  phase24Readiness: ArtifactPushPhase24Readiness
  phase27Readiness: ArtifactPushPhase27Readiness
}

export function evaluateArtifactPushBlockers(input: EvaluateArtifactPushBlockersInput): ArtifactPushBlockerEvaluation {
  const blockers: ArtifactPushBlocker[] = []
  const warnings: ArtifactPushWarning[] = [
    { id: 'gpu-deferred', imageId: 'gpu-worker', summary: 'GPU image push is deferred until a later GPU phase.' },
  ]

  for (const result of input.pushResults) {
    if (result.imageId === 'unknown') {
      blockers.push({ id: 'unknown-push-log', imageId: 'unknown', summary: 'Push log could not be tied to a known image.' })
      continue
    }
    if (result.imageId === 'gpu-worker' && result.status !== 'deferred') {
      blockers.push({ id: 'gpu-push-attempt', imageId: 'gpu-worker', summary: 'GPU image must not be pushed in Phase 23B.' })
    }
    if (['failed', 'blocked', 'unknown'].includes(result.status)) {
      blockers.push({ id: `push-result-${result.imageId}`, imageId: result.imageId, summary: `${result.imageId} push result is ${result.status}.` })
    }
    for (const finding of result.forbiddenFindings) {
      blockers.push({ id: `forbidden-push-${result.imageId}`, imageId: result.imageId, summary: finding })
    }
    for (const warning of result.warnings) {
      warnings.push({ id: `push-warning-${result.imageId}`, imageId: result.imageId, summary: warning })
    }
  }

  const pushedImageIds = new Set(input.pushResults.filter((result) => ['pushed', 'verified'].includes(result.status)).map((result) => result.imageId))
  const verifiedDigestImageIds = new Set(input.digestEvidence.filter((entry) => entry.verified && entry.digest).map((entry) => entry.imageId))
  const requiredImagesPushed = requiredNonGpuArtifactPushImageIds.filter((imageId) => pushedImageIds.has(imageId) && verifiedDigestImageIds.has(imageId))

  for (const imageId of requiredNonGpuArtifactPushImageIds) {
    if (!pushedImageIds.has(imageId)) blockers.push({ id: `missing-push-${imageId}`, imageId, summary: `${imageId} must have docker push evidence before Phase 24B.` })
    if (!verifiedDigestImageIds.has(imageId)) blockers.push({ id: `missing-digest-${imageId}`, imageId, summary: `${imageId} must have verified Artifact Registry digest evidence before Phase 24B.` })
  }

  if (input.productionReadyAllowed) blockers.push({ id: 'production-ready-allowed', summary: 'Production readiness must remain blocked.' })
  if (input.externalBetaAllowed) blockers.push({ id: 'external-beta-allowed', summary: 'External beta must remain blocked.' })
  if (input.realUserMediaTestingAllowed) blockers.push({ id: 'real-user-media-allowed', summary: 'Real user media testing must remain blocked.' })

  const phase24Blockers = blockers.map((blocker) => blocker.summary)

  return {
    blockers,
    warnings,
    phase24Readiness: {
      readyForNonGpuStagingDeploy: phase24Blockers.length === 0,
      requiredImagesPushed,
      blockers: phase24Blockers,
      warnings: warnings.map((warning) => warning.summary),
    },
    phase27Readiness: {
      readyForGpuStaging: false,
      gpuImageStatus: 'deferred',
      blockers: ['GPU image was not built, checked, or pushed in Phase 23B.'],
      warnings: ['GPU push remains deferred for the later GPU phase.'],
    },
  }
}
