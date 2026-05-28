import {
  buildArtifactImageManifest,
  requiredNonGpuArtifactPushImageIds,
} from './artifact-image-manifest'
import {
  buildArtifactPushCommandPlans,
  buildArtifactPushVerificationCommandPlans,
  validateArtifactPushCommandPlanInput,
} from './artifact-push-command-plan'
import { evaluateArtifactPushBlockers } from './artifact-push-blocker-policy'
import type {
  ArtifactImageDigestEvidence,
  ArtifactPushReport,
  ArtifactPushResult,
  BuildArtifactPushReportInput,
  ParsedArtifactPushLog,
} from './artifact-push-types'

export const ARTIFACT_PUSH_REPORT_ID = 'activation-phase-23b-artifact-push-report'

export function buildArtifactPushReport(input: BuildArtifactPushReportInput): ArtifactPushReport {
  const parsedLogs = input.parsedLogs ?? []
  const mode = input.mode ?? (parsedLogs.length > 0 ? 'report_from_logs' : 'static_plan')
  const imageManifests = buildArtifactImageManifest(input)
  const commandPlans = buildArtifactPushCommandPlans(input)
  const verificationCommandPlans = buildArtifactPushVerificationCommandPlans(input)
  const inputCheck = validateArtifactPushCommandPlanInput(input)
  const hasEvidence = parsedLogs.length > 0 || (input.digestEvidence?.length ?? 0) > 0
  const pushResults = parsedLogs.length > 0
    ? parsedLogs.map(({ logPath, parsedLog }) => buildArtifactPushResultFromParsedLog({
        logPath,
        parsedLog,
        imageTag: input.imageTag,
        targetFullImageName: imageManifests.find((entry) => entry.imageId === parsedLog.imageId)?.targetFullImageName,
      }))
    : plannedPushResults(input.imageTag)
  const digestEvidence = mergeDigestEvidence(
    input.digestEvidence ?? [],
    pushResults.map(pushResultDigestEvidence).filter((entry): entry is ArtifactImageDigestEvidence => Boolean(entry)),
  )
  const evaluation = hasEvidence
    ? evaluateArtifactPushBlockers({
        pushResults,
        digestEvidence,
        productionReadyAllowed: false,
        externalBetaAllowed: false,
        realUserMediaTestingAllowed: false,
      })
    : staticPlanEvaluation()
  const inputBlockers = inputCheck.blockers.map((summary) => ({ id: 'artifact-push-input', summary }))
  const blockers = [...inputBlockers, ...evaluation.blockers]
  const phase24Readiness = inputBlockers.length > 0
    ? {
        ...evaluation.phase24Readiness,
        readyForNonGpuStagingDeploy: false,
        blockers: [...inputCheck.blockers, ...evaluation.phase24Readiness.blockers],
      }
    : evaluation.phase24Readiness

  return {
    reportId: ARTIFACT_PUSH_REPORT_ID,
    createdAt: input.createdAt ?? new Date().toISOString(),
    mode,
    project: input.project,
    artifactRegion: input.artifactRegion,
    repository: input.repository,
    imageTag: input.imageTag,
    imageManifests,
    commandPlans,
    verificationCommandPlans,
    pushResults,
    digestEvidence,
    blockers,
    warnings: evaluation.warnings,
    phase24Readiness,
    phase27Readiness: evaluation.phase27Readiness,
    dockerPushExecuted: parsedLogs.length > 0,
    gcloudExecuted: false,
    deploymentExecuted: false,
    dockerBuildExecuted: false,
    providerExecuted: false,
    modelDownloadExecuted: false,
    mediaProcessingExecuted: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

function staticPlanEvaluation(): ReturnType<typeof evaluateArtifactPushBlockers> {
  return {
    blockers: [],
    warnings: [
      { id: 'gpu-deferred', imageId: 'gpu-worker', summary: 'GPU image push is deferred until a later GPU phase.' },
      { id: 'push-evidence-pending', summary: 'No push or digest evidence provided yet; Phase 24B remains blocked until execution evidence exists.' },
    ],
    phase24Readiness: {
      readyForNonGpuStagingDeploy: false,
      requiredImagesPushed: [],
      blockers: ['Push and digest evidence has not been collected yet.'],
      warnings: ['Static plan only.'],
    },
    phase27Readiness: {
      readyForGpuStaging: false,
      gpuImageStatus: 'deferred',
      blockers: ['GPU image was not built, checked, or pushed in Phase 23B.'],
      warnings: ['GPU push remains deferred for the later GPU phase.'],
    },
  }
}

export function buildArtifactPushResultFromParsedLog(input: {
  parsedLog: ParsedArtifactPushLog
  logPath: string
  imageTag?: string
  targetFullImageName?: string
}): ArtifactPushResult {
  const imageId = input.parsedLog.imageId ?? 'unknown'
  return {
    imageId,
    status: statusFromParsedLog(input.parsedLog),
    targetFullImageName: input.targetFullImageName ?? input.parsedLog.detectedImageName,
    imageTag: input.imageTag,
    logPath: input.logPath,
    parsedLog: input.parsedLog,
    digest: input.parsedLog.detectedDigest,
    verified: Boolean(input.parsedLog.detectedDigest) && input.parsedLog.parsedStatus === 'pushed',
    warnings: input.parsedLog.warnings,
    errors: input.parsedLog.errors,
    forbiddenFindings: input.parsedLog.forbiddenFindings,
  }
}

function plannedPushResults(imageTag?: string): ArtifactPushResult[] {
  return [
    ...requiredNonGpuArtifactPushImageIds.map((imageId) => ({
      imageId,
      status: 'planned' as const,
      imageTag,
      verified: false,
      warnings: ['No push log evidence provided.'],
      errors: [],
      forbiddenFindings: [],
    })),
    {
      imageId: 'gpu-worker' as const,
      status: 'deferred' as const,
      imageTag,
      verified: false,
      warnings: ['GPU image deferred and not pushed in Phase 23B.'],
      errors: [],
      forbiddenFindings: [],
    },
  ]
}

function statusFromParsedLog(parsedLog: ParsedArtifactPushLog): ArtifactPushResult['status'] {
  if (parsedLog.parsedStatus === 'pushed') return 'pushed'
  if (parsedLog.parsedStatus === 'blocked') return 'blocked'
  if (parsedLog.parsedStatus === 'failed') return 'failed'
  return 'unknown'
}

function pushResultDigestEvidence(result: ArtifactPushResult): ArtifactImageDigestEvidence | undefined {
  if (result.imageId === 'unknown' || !result.digest || !result.targetFullImageName) return undefined
  return {
    imageId: result.imageId,
    targetFullImageName: result.targetFullImageName,
    digest: result.digest,
    verified: result.verified,
    source: 'push_log',
    warnings: result.warnings,
  }
}

function mergeDigestEvidence(
  explicitEvidence: ArtifactImageDigestEvidence[],
  parsedEvidence: ArtifactImageDigestEvidence[],
): ArtifactImageDigestEvidence[] {
  const byImage = new Map<string, ArtifactImageDigestEvidence>()
  for (const evidence of parsedEvidence) byImage.set(evidence.imageId, evidence)
  for (const evidence of explicitEvidence) byImage.set(evidence.imageId, evidence)
  return Array.from(byImage.values())
}
