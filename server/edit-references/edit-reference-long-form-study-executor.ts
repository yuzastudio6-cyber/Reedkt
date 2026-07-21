import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat } from 'node:fs/promises'
import type { RuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_COMPLETION_ATTESTATION_VERSION,
  cancelEditReferenceLongFormStudyRun,
  claimEditReferenceLongFormStudyWork,
  completeEditReferenceLongFormStudyWork,
  failEditReferenceLongFormStudyWork,
  finalizeEditReferenceLongFormStudyRun,
  heartbeatEditReferenceLongFormStudyWork,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyCompletionAttestation,
  type EditReferenceLongFormStudyRunRecord,
  type EditReferenceLongFormStudyStageId,
  type EditReferenceLongFormStudyWorkItem,
} from './edit-reference-long-form-study-contract'
import {
  editReferenceLongFormDependencyArtifactKey,
  executeEditReferenceLongFormChunkMediaStage,
  type ExecuteEditReferenceLongFormChunkMediaStageInput,
} from './edit-reference-long-form-chunk-media-executor'
import type { EditReferenceRepositoryScope } from './edit-reference-repository'
import { PrivateEditReferenceLongFormStudyRepository } from './private-edit-reference-long-form-study-repository'
import {
  resolveVerifiedEditReferenceLongFormLocalMediaInput,
  type EditReferenceLongFormSourcePurpose,
  type EditReferenceLongFormStorageObject,
} from './edit-reference-long-form-source-inspector'
import {
  isEditReferenceLongFormTechnicalStage,
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import {
  EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS,
  type EditReferenceLongFormSpecialistStageId,
} from './edit-reference-long-form-specialist-stage-contract'

export const EDIT_REFERENCE_LONG_FORM_LOCAL_TECHNICAL_STAGE_IDS = [
  'analysis_proxy',
  'audio_extract',
  'scene_boundary_scan',
  'visual_sampling',
  'color_motion_signals',
] as const satisfies readonly EditReferenceLongFormStudyStageId[]

const artifactVerificationCache = new Map<string, string>()

export interface ExecuteEditReferenceLongFormStudyInput {
  readonly env: RuntimeEnv
  readonly scope: EditReferenceRepositoryScope
  readonly runId: string
  readonly storageObject: EditReferenceLongFormStorageObject
  readonly requiredObjectPurpose?: EditReferenceLongFormSourcePurpose
  readonly repository?: PrivateEditReferenceLongFormStudyRepository
  readonly workerId?: string
  readonly maximumWorkItems?: number
  readonly eligibleStageIds?: readonly EditReferenceLongFormStudyStageId[]
  readonly executeStage?: (
    input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  ) => Promise<EditReferenceLongFormStudyWorkOutput>
}

export interface ExecuteEditReferenceLongFormSpecialistStudyInput
  extends Omit<ExecuteEditReferenceLongFormStudyInput, 'eligibleStageIds' | 'executeStage'> {
  readonly eligibleStageIds?: readonly EditReferenceLongFormSpecialistStageId[]
  readonly executeStage: NonNullable<ExecuteEditReferenceLongFormStudyInput['executeStage']>
}

export interface ExecuteEditReferenceLongFormStudyResult {
  readonly runId: string
  readonly startingRevision: number
  readonly finalRevision: number
  readonly completedWorkItemIds: readonly string[]
  readonly recoveredWorkItemIds: readonly string[]
  readonly failedWorkItemIds: readonly string[]
  readonly remainingEligibleWorkItemCount: number
  readonly disposition: 'advanced' | 'idle' | 'operator_review_required' | 'completed' | 'paused' | 'cancelled'
  readonly originalRemainsImmutable: true
  readonly checkpointAfterEveryWorkItem: true
  readonly providerCallMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
}

export async function executeEditReferenceLongFormStudyTechnicalWork(
  input: ExecuteEditReferenceLongFormStudyInput,
): Promise<ExecuteEditReferenceLongFormStudyResult> {
  const repository = input.repository ?? new PrivateEditReferenceLongFormStudyRepository()
  const workerId = input.workerId ?? `${input.env.workerInstanceId}-edit-reference-long-form-technical`
  const maximumWorkItems = input.maximumWorkItems ?? 1
  const eligibleStageIds = input.eligibleStageIds ?? EDIT_REFERENCE_LONG_FORM_LOCAL_TECHNICAL_STAGE_IDS
  validateEligibleStagePolicy(eligibleStageIds, input.executeStage)
  if (!Number.isSafeInteger(maximumWorkItems) || maximumWorkItems < 1 || maximumWorkItems > 100) {
    throw new Error('Long-form executor work-item bound is invalid.')
  }
  const persisted = await repository.read({ scope: input.scope, runId: input.runId })
  if (!persisted) throw new Error('The exact long-form study checkpoint is unavailable.')
  const requiredObjectPurpose = input.requiredObjectPurpose ?? 'reference_media'
  validateStorageBinding(input.storageObject, persisted.plan, requiredObjectPurpose)
  const sourceMediaInput = await resolveVerifiedEditReferenceLongFormLocalMediaInput({
    env: input.env,
    storageObject: input.storageObject,
    requiredObjectPurpose,
  })
  const sourceIdentity = await sourceFilesIdentity(sourceMediaInput.identityFilePaths)
  const startingRevision = persisted.run.revision
  const completedWorkItemIds: string[] = []
  const recoveredWorkItemIds: string[] = []
  const failedWorkItemIds: string[] = []
  let cycleCount = 0

  while (cycleCount < maximumWorkItems) {
    const current = await repository.read({ scope: input.scope, runId: input.runId })
    if (!current) throw new Error('The long-form study checkpoint disappeared during execution.')
    if (['completed', 'paused', 'cancelled', 'needs_operator_review'].includes(current.run.state)) break
    const now = new Date().toISOString()
    const candidate = selectEligibleCandidate(current.run, workerId, now, eligibleStageIds)
    if (!candidate) break
    const claimKey = claimIdempotencyKey(current.run, candidate, workerId, now)
    const claim = claimEditReferenceLongFormStudyWork({
      run: current.run,
      plan: current.plan,
      workerId,
      idempotencyKey: claimKey,
      leaseDurationMs: leaseDurationMs(input.env),
      now,
      eligibleStageIds,
    })
    if (!claim.workItem || !claim.leaseToken || !['authorized', 'authorized_replay'].includes(claim.disposition)) break
    if (claim.workItem.workItemId !== candidate.workItemId) {
      throw new Error('Long-form executor claim selection changed outside the exact checkpoint authority.')
    }
    if (claim.disposition === 'authorized') {
      await repository.saveRun({
        scope: input.scope,
        expectedRevision: current.run.revision,
        run: claim.run,
      })
    }
    cycleCount += 1

    const heartbeat = startHeartbeat({
      env: input.env,
      scope: input.scope,
      repository,
      plan: current.plan,
      runId: input.runId,
      workItemId: candidate.workItemId,
      workerId,
      leaseToken: claim.leaseToken,
    })
    try {
      const existingOutput = await repository.readWorkOutput({
        scope: input.scope,
        runId: input.runId,
        workItemId: candidate.workItemId,
      })
      let output: EditReferenceLongFormStudyWorkOutput
      if (existingOutput) {
        validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
          output: existingOutput,
          plan: current.plan,
          workItem: candidate,
        })
        await verifyOutputArtifacts({
          output: existingOutput,
          scope: input.scope,
          repository,
        })
        output = existingOutput
        recoveredWorkItemIds.push(candidate.workItemId)
      } else {
        const dependencyOutputs = await readRelevantDependencyOutputs({
          scope: input.scope,
          repository,
          plan: current.plan,
          run: claim.run,
          workItem: candidate,
        })
        const dependencyArtifactLocalPaths = Object.fromEntries(dependencyOutputs.flatMap((dependencyOutput) => (
          dependencyOutput.artifacts.map((artifact) => [
            editReferenceLongFormDependencyArtifactKey(
              dependencyOutput.workItemId,
              artifact.storageObjectPath,
            ),
            repository.resolveWorkOutputArtifactPath({
              scope: input.scope,
              runId: dependencyOutput.runId,
              workItemId: dependencyOutput.workItemId,
              storageObjectPath: artifact.storageObjectPath,
            }),
          ])
        )))
        const outputDirectory = await repository.prepareWorkOutputDirectory({
          scope: input.scope,
          runId: input.runId,
          workItemId: candidate.workItemId,
        })
        const executeStage = input.executeStage ?? executeEditReferenceLongFormChunkMediaStage
        output = await executeStage({
          env: input.env,
          plan: current.plan,
          run: claim.run,
          runId: input.runId,
          workItem: candidate,
          sourceLocalPath: sourceMediaInput.ffmpegInput,
          sourceBackingFilePaths: sourceMediaInput.identityFilePaths,
          sourceProtocolWhitelist: sourceMediaInput.protocolWhitelist,
          outputDirectory,
          dependencyOutputs,
          dependencyArtifactLocalPaths,
          createdAt: new Date().toISOString(),
        })
        validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan: current.plan, workItem: candidate })
        await verifySourceUnchanged(sourceMediaInput.identityFilePaths, sourceIdentity)
        await verifyOutputArtifacts({ output, scope: input.scope, repository })
        await repository.writeWorkOutput({ scope: input.scope, output })
      }

      await heartbeat.stop()
      await verifySourceUnchanged(sourceMediaInput.identityFilePaths, sourceIdentity)
      const latest = await repository.read({ scope: input.scope, runId: input.runId })
      if (!latest) throw new Error('The long-form checkpoint disappeared before work completion.')
      const completionAttestation = output.result.kind === 'coverage_qa'
        && output.result.fullyStudiedEligible
        && output.completionAuthority === 'authoritative'
        ? await buildOutputBackedCompletionAttestation({
            scope: input.scope,
            repository,
            plan: latest.plan,
            run: latest.run,
            coverageQaOutput: output,
          })
        : undefined
      const completed = completeEditReferenceLongFormStudyWork({
        run: latest.run,
        plan: latest.plan,
        workItemId: candidate.workItemId,
        workerId,
        leaseToken: claim.leaseToken,
        outputDigestSha256: output.outputDigestSha256,
        outputRuntimeSource: output.runtimeSource,
        outputCompletionAuthority: output.completionAuthority,
        observedWallClockMs: output.usage.observedWallClockMs,
        now: new Date().toISOString(),
      })
      const completedCheckpoint = await repository.saveRun({
        scope: input.scope,
        expectedRevision: latest.run.revision,
        run: completed,
      })
      if (completionAttestation) {
        const finalized = finalizeEditReferenceLongFormStudyRun({
          run: completedCheckpoint,
          plan: latest.plan,
          attestation: completionAttestation,
        })
        await repository.saveRun({
          scope: input.scope,
          expectedRevision: completedCheckpoint.revision,
          run: finalized,
        })
      }
      completedWorkItemIds.push(candidate.workItemId)
    } catch (error) {
      await heartbeat.stop().catch(() => undefined)
      const latest = await repository.read({ scope: input.scope, runId: input.runId })
      const item = latest?.run.workItems.find((record) => record.workItemId === candidate.workItemId)
      if (latest && isSourceIdentityFailure(error)) {
        const cancelled = cancelEditReferenceLongFormStudyRun({
          run: latest.run,
          plan: latest.plan,
          reason: 'source_replaced',
          now: new Date().toISOString(),
        })
        await repository.saveRun({
          scope: input.scope,
          expectedRevision: latest.run.revision,
          run: cancelled,
        })
      } else if (latest && item?.status === 'leased') {
        const failure = classifyStageFailure(candidate.stageId, error, item.attemptCount)
        const failed = failEditReferenceLongFormStudyWork({
          run: latest.run,
          plan: latest.plan,
          workItemId: candidate.workItemId,
          workerId,
          leaseToken: claim.leaseToken,
          blockerCode: failure.blockerCode,
          blockerMessage: failure.blockerMessage,
          retryDelayMs: failure.retryDelayMs,
          now: new Date().toISOString(),
        })
        await repository.saveRun({
          scope: input.scope,
          expectedRevision: latest.run.revision,
          run: failed,
        })
      }
      failedWorkItemIds.push(candidate.workItemId)
      if (isSourceIdentityFailure(error)) throw error
    }
  }

  await verifySourceUnchanged(sourceMediaInput.identityFilePaths, sourceIdentity)
  const final = await repository.read({ scope: input.scope, runId: input.runId })
  if (!final) throw new Error('The long-form study checkpoint disappeared after execution.')
  const eligibleSet = new Set<EditReferenceLongFormStudyStageId>(eligibleStageIds)
  const remainingEligibleWorkItemCount = final.run.workItems.filter((item) => (
    eligibleSet.has(item.stageId)
    && item.status !== 'completed'
    && item.status !== 'cancelled'
  )).length
  return {
    runId: input.runId,
    startingRevision,
    finalRevision: final.run.revision,
    completedWorkItemIds,
    recoveredWorkItemIds,
    failedWorkItemIds,
    remainingEligibleWorkItemCount,
    disposition: final.run.state === 'needs_operator_review'
      ? 'operator_review_required'
      : final.run.state === 'completed'
        ? 'completed'
        : final.run.state === 'paused'
          ? 'paused'
          : final.run.state === 'cancelled'
            ? 'cancelled'
            : completedWorkItemIds.length > 0 || failedWorkItemIds.length > 0
              ? 'advanced'
              : 'idle',
    originalRemainsImmutable: true,
    checkpointAfterEveryWorkItem: true,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
  }
}

export async function executeEditReferenceLongFormStudySpecialistWork(
  input: ExecuteEditReferenceLongFormSpecialistStudyInput,
): Promise<ExecuteEditReferenceLongFormStudyResult> {
  const eligibleStageIds = input.eligibleStageIds ?? EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS
  return executeEditReferenceLongFormStudyTechnicalWork({
    ...input,
    workerId: input.workerId ?? `${input.env.workerInstanceId}-edit-reference-long-form-specialist`,
    eligibleStageIds,
    executeStage: input.executeStage,
  })
}

export interface EditReferenceLongFormRequiredOutputManifestItem {
  readonly workItemId: string
  readonly stageId: EditReferenceLongFormStudyStageId
  readonly chunkId: string | null
  readonly outputDigestSha256: string
  readonly outputRuntimeSource: NonNullable<EditReferenceLongFormStudyWorkItem['outputRuntimeSource']>
  readonly outputCompletionAuthority: NonNullable<EditReferenceLongFormStudyWorkItem['outputCompletionAuthority']>
  readonly outputRecordVerified: boolean
}

export function deriveEditReferenceLongFormRequiredOutputManifest(input: {
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly coverageQaWorkItemId: string
}): {
  readonly items: readonly EditReferenceLongFormRequiredOutputManifestItem[]
  readonly digestSha256: string
  readonly priorRequiredWorkItemCount: number
  readonly expectedOutputRecordCount: number
} {
  const coverageQa = input.run.workItems.find((item) => (
    item.workItemId === input.coverageQaWorkItemId && item.stageId === 'coverage_qa' && item.required
  ))
  if (!coverageQa) throw new Error('Long-form output manifest requires the exact coverage QA work item.')
  const prior = input.run.workItems.filter((item) => item.required && item.workItemId !== coverageQa.workItemId)
  const items = prior.map((item): EditReferenceLongFormRequiredOutputManifestItem => {
    if (
      item.status !== 'completed'
      || !item.outputDigestSha256
      || !item.outputRuntimeSource
      || !item.outputCompletionAuthority
    ) throw new Error('Long-form output manifest found incomplete prior work.')
    return {
      workItemId: item.workItemId,
      stageId: item.stageId,
      chunkId: item.chunkId,
      outputDigestSha256: item.outputDigestSha256,
      outputRuntimeSource: item.outputRuntimeSource,
      outputCompletionAuthority: item.outputCompletionAuthority,
      outputRecordVerified: !['ingest_integrity', 'media_probe'].includes(item.stageId),
    }
  })
  return {
    items,
    digestSha256: sha256(stableStringify(items)),
    priorRequiredWorkItemCount: prior.length,
    expectedOutputRecordCount: items.filter((item) => item.outputRecordVerified).length,
  }
}

function validateEligibleStagePolicy(
  eligibleStageIds: readonly EditReferenceLongFormStudyStageId[],
  executeStage: ExecuteEditReferenceLongFormStudyInput['executeStage'],
): void {
  if (
    eligibleStageIds.length < 1
    || new Set(eligibleStageIds).size !== eligibleStageIds.length
    || eligibleStageIds.some((stageId) => ![
      ...EDIT_REFERENCE_LONG_FORM_LOCAL_TECHNICAL_STAGE_IDS,
      ...EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS,
    ].includes(stageId as never))
  ) throw new Error('Long-form executor eligible-stage policy is invalid.')
  if (
    eligibleStageIds.some((stageId) => EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS.includes(stageId as EditReferenceLongFormSpecialistStageId))
    && !executeStage
  ) throw new Error('Long-form specialist stages require an explicitly authorized stage executor.')
}

function selectEligibleCandidate(
  run: EditReferenceLongFormStudyRunRecord,
  workerId: string,
  now: string,
  eligibleStageIds: readonly EditReferenceLongFormStudyStageId[],
): EditReferenceLongFormStudyWorkItem | undefined {
  const eligible = new Set<EditReferenceLongFormStudyStageId>(eligibleStageIds)
  const ownerDigest = sha256(workerId)
  const activeReplay = run.workItems.find((item) => (
    item.status === 'leased'
    && eligible.has(item.stageId)
    && item.leaseOwnerIdDigestSha256 === ownerDigest
    && Date.parse(item.leaseExpiresAt ?? '') > Date.parse(now)
  ))
  if (activeReplay) return activeReplay
  const completed = new Set(run.workItems.filter((item) => item.status === 'completed').map((item) => item.workItemId))
  return run.workItems.find((item) => (
    eligible.has(item.stageId)
    && (
      item.status === 'queued'
      || (item.status === 'retry_wait' && Date.parse(item.nextAttemptAt ?? '') <= Date.parse(now))
      || (item.status === 'leased' && Date.parse(item.leaseExpiresAt ?? '') <= Date.parse(now))
    )
    && item.dependencyWorkItemIds.every((dependencyId) => completed.has(dependencyId))
  ))
}

function claimIdempotencyKey(
  run: EditReferenceLongFormStudyRunRecord,
  item: EditReferenceLongFormStudyWorkItem,
  workerId: string,
  now: string,
): string {
  const activeReplay = item.status === 'leased'
    && item.leaseOwnerIdDigestSha256 === sha256(workerId)
    && Date.parse(item.leaseExpiresAt ?? '') > Date.parse(now)
  const attempt = activeReplay ? item.attemptCount : item.attemptCount + 1
  return `long-form:${run.runId}:${item.workItemId}:attempt:${attempt}`
}

async function readRelevantDependencyOutputs(input: {
  readonly scope: EditReferenceRepositoryScope
  readonly repository: PrivateEditReferenceLongFormStudyRepository
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly workItem: EditReferenceLongFormStudyWorkItem
}): Promise<EditReferenceLongFormStudyWorkOutput[]> {
  const requiredIds = relevantDependencyWorkItemIds(input.run, input.workItem)
  const outputs: EditReferenceLongFormStudyWorkOutput[] = []
  for (const dependency of input.run.workItems.filter((candidate) => requiredIds.has(candidate.workItemId))) {
    if (dependency.status !== 'completed') {
      throw new Error('A long-form dependency was selected before its exact checkpoint completed.')
    }
    if (['ingest_integrity', 'media_probe'].includes(dependency.stageId)) continue
    const output = await input.repository.readWorkOutput({
      scope: input.scope,
      runId: input.run.runId,
      workItemId: dependency.workItemId,
    })
    if (!output) throw new Error('A completed long-form dependency is missing its private output record.')
    validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan: input.plan, workItem: dependency })
    await verifyOutputArtifacts({ output, scope: input.scope, repository: input.repository })
    outputs.push(output)
  }
  return outputs
}

function relevantDependencyWorkItemIds(
  run: EditReferenceLongFormStudyRunRecord,
  workItem: EditReferenceLongFormStudyWorkItem,
): Set<string> {
  const selected = new Set<string>(workItem.dependencyWorkItemIds)
  for (const dependencyId of selected) {
    if (!run.workItems.some((candidate) => candidate.workItemId === dependencyId)) {
      throw new Error('A long-form dependency references an unknown work item.')
    }
  }
  if (workItem.stageId === 'coverage_qa') {
    for (const candidate of run.workItems) {
      if (candidate.required && candidate.workItemId !== workItem.workItemId) selected.add(candidate.workItemId)
    }
  }
  return selected
}

function startHeartbeat(input: {
  readonly env: RuntimeEnv
  readonly scope: EditReferenceRepositoryScope
  readonly repository: PrivateEditReferenceLongFormStudyRepository
  readonly plan: EditReferenceLongFormStudyPlan
  readonly runId: string
  readonly workItemId: string
  readonly workerId: string
  readonly leaseToken: string
}): { stop: () => Promise<void> } {
  let stopped = false
  let failure: unknown
  let pending = Promise.resolve()
  const intervalMs = Math.max(1_000, Math.min(
    input.env.workerHeartbeatIntervalSeconds * 1_000,
    Math.floor(leaseDurationMs(input.env) / 3),
  ))
  const beat = () => {
    pending = pending.then(async () => {
      if (stopped || failure) return
      try {
        const current = await input.repository.read({ scope: input.scope, runId: input.runId })
        if (!current) throw new Error('Long-form heartbeat checkpoint is unavailable.')
        const next = heartbeatEditReferenceLongFormStudyWork({
          run: current.run,
          plan: current.plan,
          workItemId: input.workItemId,
          workerId: input.workerId,
          leaseToken: input.leaseToken,
          extendLeaseDurationMs: leaseDurationMs(input.env),
          now: new Date().toISOString(),
        })
        await input.repository.saveRun({
          scope: input.scope,
          expectedRevision: current.run.revision,
          run: next,
        })
      } catch (error) {
        failure = error
      }
    })
  }
  const timer = setInterval(beat, intervalMs)
  return {
    stop: async () => {
      stopped = true
      clearInterval(timer)
      await pending
      if (failure) throw new Error('Long-form worker lost its durable heartbeat authority.')
    },
  }
}

async function verifyOutputArtifacts(input: {
  readonly output: EditReferenceLongFormStudyWorkOutput
  readonly scope: EditReferenceRepositoryScope
  readonly repository: PrivateEditReferenceLongFormStudyRepository
}): Promise<void> {
  for (const artifact of input.output.artifacts) {
    const artifactPath = input.repository.resolveWorkOutputArtifactPath({
      scope: input.scope,
      runId: input.output.runId,
      workItemId: input.output.workItemId,
      storageObjectPath: artifact.storageObjectPath,
    })
    const stat = await lstat(artifactPath)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== artifact.sizeBytes) {
      throw new Error('A long-form private work artifact failed its exact file identity check.')
    }
    const cacheKey = `${artifactPath}:${stat.size}:${stat.mtimeMs}`
    if (artifactVerificationCache.get(cacheKey) !== artifact.checksumSha256) {
      const checksum = await checksumFile(artifactPath)
      if (checksum !== artifact.checksumSha256) {
        throw new Error('A long-form private work artifact failed checksum verification.')
      }
      artifactVerificationCache.set(cacheKey, checksum)
    }
  }
}

async function buildOutputBackedCompletionAttestation(input: {
  readonly scope: EditReferenceRepositoryScope
  readonly repository: PrivateEditReferenceLongFormStudyRepository
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly coverageQaOutput: EditReferenceLongFormStudyWorkOutput
}): Promise<EditReferenceLongFormStudyCompletionAttestation> {
  if (input.coverageQaOutput.result.kind !== 'coverage_qa') {
    throw new Error('Long-form finalization requires the exact coverage QA output.')
  }
  const requiredItems = input.run.workItems.filter((item) => item.required)
  const coverageQaItem = requiredItems.find((item) => item.stageId === 'coverage_qa')
  if (
    !coverageQaItem
    || coverageQaItem.workItemId !== input.coverageQaOutput.workItemId
    || coverageQaItem.status !== 'leased'
    || requiredItems.some((item) => item.workItemId !== coverageQaItem.workItemId && item.status !== 'completed')
  ) throw new Error('Long-form coverage QA output does not match the completed checkpoint.')

  const priorItems = requiredItems.filter((item) => item.workItemId !== coverageQaItem.workItemId)
  let priorOutputRecordCount = 0
  let everyPriorOutputCostAuthoritySatisfied = true
  for (const item of priorItems) {
    if (!item.outputDigestSha256 || !item.outputRuntimeSource || !item.outputCompletionAuthority) {
      throw new Error('Long-form completion manifest found incomplete output authority.')
    }
    const preflight = ['ingest_integrity', 'media_probe'].includes(item.stageId)
    const output = preflight
      ? undefined
      : await input.repository.readWorkOutput({
          scope: input.scope,
          runId: input.run.runId,
          workItemId: item.workItemId,
        })
    if (!preflight) {
      if (!output || output.outputDigestSha256 !== item.outputDigestSha256) {
        throw new Error('A required long-form work output record is missing or has changed.')
      }
      validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan: input.plan, workItem: item })
      await verifyOutputArtifacts({ output, scope: input.scope, repository: input.repository })
      everyPriorOutputCostAuthoritySatisfied = everyPriorOutputCostAuthoritySatisfied
        && output.usage.productionCostAuthoritySatisfied
      priorOutputRecordCount += 1
    }
  }
  const manifest = deriveEditReferenceLongFormRequiredOutputManifest({
    run: input.run,
    coverageQaWorkItemId: coverageQaItem.workItemId,
  })
  const qa = input.coverageQaOutput.result
  if (
    qa.requiredOutputManifestDigestSha256 !== manifest.digestSha256
    || qa.expectedPriorRequiredWorkItemCount !== manifest.priorRequiredWorkItemCount
    || qa.verifiedPriorRequiredWorkItemCount !== manifest.priorRequiredWorkItemCount
    || qa.verifiedOutputRecordCount !== priorOutputRecordCount
    || priorOutputRecordCount !== manifest.expectedOutputRecordCount
    || qa.temporalCoverageRatio !== 1
    || qa.chunkStageCoverageRatio !== 1
    || qa.continuousAudioCoverageRatio !== input.plan.completionStandard.continuousAudioCoverageRatio
    || qa.globalReconciliationVerified !== true
    || qa.everyRequiredOutputVerified !== true
    || qa.everySemanticRuntimeAuthoritative !== true
    || qa.everyRequiredOutputCostAuthoritySatisfied !== true
    || everyPriorOutputCostAuthoritySatisfied !== true
    || input.coverageQaOutput.usage.productionCostAuthoritySatisfied !== true
    || qa.qaPassed !== true
    || qa.fullyStudiedEligible !== true
    || qa.blockers.length !== 0
    || requiredItems.some((item) => item.outputCompletionAuthority !== 'authoritative')
  ) throw new Error('Long-form coverage QA is not eligible for an authoritative full-study claim.')

  return {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_COMPLETION_ATTESTATION_VERSION,
    coverageQaWorkItemId: coverageQaItem.workItemId,
    coverageQaOutputDigestSha256: input.coverageQaOutput.outputDigestSha256,
    requiredOutputManifestDigestSha256: manifest.digestSha256,
    requiredWorkItemCount: requiredItems.length,
    verifiedOutputRecordCount: priorOutputRecordCount + 1,
    temporalCoverageRatio: 1,
    chunkStageCoverageRatio: 1,
    continuousAudioCoverageRatio: input.plan.completionStandard.continuousAudioCoverageRatio,
    everyRequiredOutputVerified: true,
    everySemanticRuntimeAuthoritative: true,
    everyRequiredOutputCostAuthoritySatisfied: true,
    coverageQaPassed: true,
    finalizedAt: new Date().toISOString(),
  }
}

interface LongFormSourceFileIdentity {
  readonly file: string
  readonly device: number
  readonly inode: number
  readonly sizeBytes: number
  readonly modifiedAtMs: number
}

async function sourceFilesIdentity(files: readonly string[]): Promise<readonly LongFormSourceFileIdentity[]> {
  if (files.length < 1 || new Set(files).size !== files.length) {
    throw new Error('The exact long-form source identity set is invalid.')
  }
  return Promise.all(files.map(async (file): Promise<LongFormSourceFileIdentity> => {
    const stat = await lstat(file)
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('The exact long-form source identity is unsafe.')
    return {
      file,
      device: stat.dev,
      inode: stat.ino,
      sizeBytes: stat.size,
      modifiedAtMs: stat.mtimeMs,
    }
  }))
}

async function verifySourceUnchanged(
  files: readonly string[],
  expected: readonly LongFormSourceFileIdentity[],
): Promise<void> {
  const current = await sourceFilesIdentity(files)
  if (
    current.length !== expected.length
    || current.some((item, index) => (
      item.file !== expected[index]?.file
      || item.device !== expected[index]?.device
      || item.inode !== expected[index]?.inode
      || item.sizeBytes !== expected[index]?.sizeBytes
      || item.modifiedAtMs !== expected[index]?.modifiedAtMs
    ))
  ) throw new Error('The exact private source changed while its bounded study was running.')
}

function validateStorageBinding(
  storageObject: EditReferenceLongFormStorageObject,
  plan: EditReferenceLongFormStudyPlan,
  requiredObjectPurpose: EditReferenceLongFormSourcePurpose,
): void {
  if (
    storageObject.id !== plan.source.privateMediaArtifactId
    || storageObject.workspaceId !== plan.workspaceId
    || storageObject.status !== 'ready'
    || storageObject.objectPurpose !== requiredObjectPurpose
    || storageObject.checksumSha256 !== plan.source.mediaChecksumSha256
    || storageObject.sizeBytes !== plan.source.sizeBytes
    || storageObject.mimeType !== plan.source.mimeType
  ) throw new Error('The long-form executor source does not match its exact finalized plan binding.')
}

function leaseDurationMs(env: RuntimeEnv): number {
  return Math.max(5_000, Math.min(15 * 60 * 1_000, env.workerClaimLeaseSeconds * 1_000))
}

function retryDelayMs(attemptCount: number): number {
  return Math.min(15 * 60 * 1_000, 30_000 * 2 ** Math.max(0, attemptCount - 1))
}

function safeStageFailureMessage(stageId: EditReferenceLongFormStudyStageId): string {
  const messages: Partial<Record<EditReferenceLongFormStudyStageId, string>> = {
    analysis_proxy: 'The bounded analysis-copy worker did not finish this section. The original remains unchanged; ReEditPro retained prior checkpoints and scheduled a bounded retry.',
    audio_extract: 'The private study-audio worker did not finish this section. The original remains unchanged; ReEditPro retained prior checkpoints and scheduled a bounded retry.',
    scene_boundary_scan: 'The technical scene-boundary pass did not finish this section. ReEditPro retained completed sections and scheduled a bounded retry.',
    visual_sampling: 'The adaptive private-frame sampling pass did not finish this section. ReEditPro retained completed sections and scheduled a bounded retry.',
    color_motion_signals: 'The technical color/motion pass did not finish this section. ReEditPro retained completed sections and scheduled a bounded retry.',
  }
  return messages[stageId] ?? 'The bounded long-form worker did not finish this section. ReEditPro retained completed checkpoints and scheduled a bounded retry.'
}

function classifyStageFailure(
  stageId: EditReferenceLongFormStudyStageId,
  error: unknown,
  attemptCount: number,
): {
  blockerCode: string
  blockerMessage: string
  retryDelayMs: number
} {
  if (isStorageCapacityFailure(error)) {
    return {
      blockerCode: `${stageId}_storage_capacity_wait`,
      blockerMessage: 'Private study storage is temporarily short of working space. ReEditPro kept the original unchanged and retained every completed section; this bounded section will continue from its checkpoint when capacity returns.',
      retryDelayMs: Math.min(15 * 60 * 1_000, 60_000 * 2 ** Math.max(0, attemptCount - 1)),
    }
  }
  return {
    blockerCode: `${stageId}_execution_failed`,
    blockerMessage: safeStageFailureMessage(stageId),
    retryDelayMs: retryDelayMs(attemptCount),
  }
}

function isStorageCapacityFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  if ('code' in error && ['ENOSPC', 'EDQUOT', 'STORAGE_CAPACITY_UNAVAILABLE'].includes(String(error.code))) {
    return true
  }
  const record = error as { message?: unknown; stderr?: unknown }
  return [record.message, record.stderr]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => /no space left on device|disk quota exceeded|insufficient storage/i.test(value))
}

function isSourceIdentityFailure(error: unknown): boolean {
  return error instanceof Error && /source.*changed|source.*identity|source.*match.*exact/i.test(error.message)
}

async function checksumFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}

export function clearEditReferenceLongFormStudyExecutorProcessStateForSmoke(): void {
  artifactVerificationCache.clear()
}

export function isEditReferenceLongFormStudyTechnicalWorkItem(
  item: EditReferenceLongFormStudyWorkItem,
): boolean {
  return isEditReferenceLongFormTechnicalStage(item.stageId)
}
