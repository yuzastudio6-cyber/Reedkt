import { createHash } from 'node:crypto'
import type { TargetVideoUnderstandingPackage } from '../../src/types/edit-reference-target-video-understanding'
import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
  validateRunAgainstPlan,
} from '../edit-references/edit-reference-long-form-study-contract'
import { prepareEditReferenceLongFormStudyRun } from '../edit-references/edit-reference-long-form-study-binding'
import {
  inspectEditReferenceLongFormSource,
  type EditReferenceLongFormSourceInspector,
  type EditReferenceLongFormStorageObject,
} from '../edit-references/edit-reference-long-form-source-inspector'
import {
  type EditReferenceLongFormStudyScheduleResult,
  type EditReferenceLongFormStudyScheduler,
} from '../edit-references/edit-reference-long-form-study-scheduler'
import { PrivateEditReferenceLongFormStudyRepository } from '../edit-references/private-edit-reference-long-form-study-repository'
import type {
  EditReferenceAggregate,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from '../edit-references/edit-reference-repository'
import { createTargetVideoUnderstandingPackage } from '../edit-references/edit-reference-target-video-understanding-contract'
import {
  PrivateTargetVideoUnderstandingRepository,
  type TargetVideoUnderstandingBinding,
} from '../edit-references/private-target-video-understanding-repository'
import type {
  ReadEditReferenceTargetVideoUnderstandingRequest,
  StartEditReferenceTargetVideoUnderstandingRequest,
} from '../validation/edit-reference-target-video-understanding-schemas'
import {
  calculateProjectEditBriefLocalDigest,
  createProjectEditBriefLocalService,
} from './project-edit-brief-local-service'
import {
  createInternalEditStateService,
  type InternalEditStateRecord,
} from './internal-edit-state-service'
import { createProjectService } from './project-service'
import { createUploadService } from './upload-service'
import {
  resolveEditReferenceDomainRepositoryRuntimePort,
  type EditReferenceDomainRepositoryRuntimePort,
} from './edit-reference-domain-repository-runtime-port'
import {
  resolveEditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudySourceBinding,
  type EditReferenceLongFormStudyRuntimePort,
} from './edit-reference-production-long-form-runtime-port'

const BACKEND_LOCAL_WARNING =
  'Target-video understanding is stored in private backend-local versioned records. Production Supabase and distributed worker authority remain fail-closed.'

export interface EditReferenceTargetVideoUnderstandingRuntimeOptions {
  readonly domainRepositoryRuntimePort?: EditReferenceDomainRepositoryRuntimePort
  readonly editReferenceRepository?: EditReferenceRepository
  readonly longFormStudyRuntimePort?: EditReferenceLongFormStudyRuntimePort
  readonly longFormStudyRepository?: PrivateEditReferenceLongFormStudyRepository
  readonly packageRepository?: PrivateTargetVideoUnderstandingRepository
  readonly sourceInspector?: EditReferenceLongFormSourceInspector
  readonly studyScheduler?: EditReferenceLongFormStudyScheduler
}

export interface EditReferenceTargetVideoUnderstandingServiceResult {
  readonly package: TargetVideoUnderstandingPackage
  readonly schedule: EditReferenceLongFormStudyScheduleResult
  readonly persistence: 'backend_local_private_versioned'
  readonly warnings: readonly string[]
  readonly replayed: boolean
  readonly productReady: false
}

type StartInput = StartEditReferenceTargetVideoUnderstandingRequest & {
  readonly projectId: string
  readonly editSessionId: string
  readonly idempotencyKey: string
}

type ReadInput = ReadEditReferenceTargetVideoUnderstandingRequest & {
  readonly projectId: string
  readonly editSessionId: string
}

export function createEditReferenceTargetVideoUnderstandingService(
  context: ServiceContext,
  runtimeOptions: EditReferenceTargetVideoUnderstandingRuntimeOptions = {},
) {
  const ownerUserId = context.auth?.userId
  if (!ownerUserId) throw new ApiError('AUTH_REQUIRED', 'Target-video understanding requires an authenticated user.', 401)
  if (context.clients.admin && !context.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'Target-video understanding remains backend-local until the canonical Supabase identity, RLS, job, and cost authorities are approved.',
      409,
    )
  }

  if (
    runtimeOptions.domainRepositoryRuntimePort
    && context.editReferenceDomainRepositoryRuntimePort
    && runtimeOptions.domainRepositoryRuntimePort !== context.editReferenceDomainRepositoryRuntimePort
  ) {
    throw new ApiError(
      'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
      'Target-video study received conflicting domain repository authorities.',
      503,
      {
        reason: 'multiple_domain_repository_authorities_configured',
        requiredGate: 'canonical_persistence',
        productionReady: false,
      },
    )
  }

  if (
    runtimeOptions.longFormStudyRuntimePort
    && context.editReferenceLongFormStudyRuntimePort
    && runtimeOptions.longFormStudyRuntimePort !== context.editReferenceLongFormStudyRuntimePort
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Target-video study received conflicting long-form runtime authorities.',
      503,
      {
        reason: 'multiple_long_form_runtime_authorities_configured',
        requiredGate: 'durable_long_form_study',
        productionReady: false,
      },
    )
  }

  const domainRepositoryRuntime = resolveEditReferenceDomainRepositoryRuntimePort({
    context,
    runtimePort: runtimeOptions.domainRepositoryRuntimePort
      ?? context.editReferenceDomainRepositoryRuntimePort,
    localRepository: runtimeOptions.editReferenceRepository,
  })
  const editReferenceRepository = domainRepositoryRuntime.repository
  const longFormStudyRuntime = resolveEditReferenceLongFormStudyRuntimePort({
    env: context.env,
    runtimePort: runtimeOptions.longFormStudyRuntimePort
      ?? context.editReferenceLongFormStudyRuntimePort,
    localRepository: runtimeOptions.longFormStudyRepository,
    localScheduler: runtimeOptions.studyScheduler,
  })
  const packageRepository = runtimeOptions.packageRepository ?? new PrivateTargetVideoUnderstandingRepository()
  const sourceInspector = runtimeOptions.sourceInspector ?? inspectEditReferenceLongFormSource

  const scope = (workspaceId: string): EditReferenceRepositoryScope => ({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId,
  })

  return {
    async start(input: StartInput): Promise<EditReferenceTargetVideoUnderstandingServiceResult> {
      requireIdempotencyKey(input.idempotencyKey)
      const authority = await resolveTargetAuthority(context, editReferenceRepository, scope(input.workspaceId), input)
      const runId = targetUnderstandingRunId({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        editReferenceId: input.editReferenceId,
        studySessionId: input.studySessionId,
        storageObjectRecordId: authority.storageObject.id,
        mediaChecksumSha256: authority.storageObject.checksumSha256 as string,
      })
      let persisted = await longFormStudyRuntime.read({ scope: authority.scope, runId })
      let replayed = Boolean(persisted)
      if (!persisted) {
        const inspected = await sourceInspector({
          env: context.env,
          storageObject: authority.storageObject,
          requiredObjectPurpose: 'source_media',
        })
        const createdAt = targetStudyCreatedAt(authority.storageObject)
        const plan = createEditReferenceLongFormStudyPlan({
          workspaceId: input.workspaceId,
          editReferenceId: input.editReferenceId,
          studySessionId: input.studySessionId,
          source: inspected.source,
          // Existing visible text is source evidence even when the requested edit
          // later avoids adding new captions.
          includeCaptionOcr: true,
          createdAt,
        })
        const initialRun = createEditReferenceLongFormStudyRun({ runId, plan, createdAt })
        const preparedRun = prepareEditReferenceLongFormStudyRun({
          plan,
          run: initialRun,
          ingestIntegrityDigestSha256: inspected.ingestIntegrityDigestSha256,
          mediaProbeDigestSha256: inspected.mediaProbeDigestSha256,
          mediaProbeObservedWallClockMs: inspected.mediaProbeObservedWallClockMs,
          now: createdAt,
        })
        try {
          const created = await longFormStudyRuntime.create({
            scope: authority.scope,
            plan,
            run: preparedRun,
            sourceBinding: createTargetLongFormStudySourceBinding(authority),
          })
          persisted = { plan: created.plan, run: created.run }
          replayed = created.disposition !== 'created'
        } catch (error) {
          const concurrent = await longFormStudyRuntime.read({ scope: authority.scope, runId })
          if (!concurrent) throw error
          persisted = concurrent
          replayed = true
        }
      }
      validateTargetStudyCheckpoint(authority, persisted.plan, persisted.run)
      const packageRecord = await materializePackage({
        packageRepository,
        longFormStudyRuntime,
        authority,
        plan: persisted.plan,
        run: persisted.run,
        declaredContext: declaredContextFromStart(authority, input),
        createdAt: persisted.run.createdAt,
      })
      const schedule = longFormStudyRuntime.schedule({
        env: context.env,
        scope: authority.scope,
        runId,
        storageObject: authority.storageObject,
        requiredObjectPurpose: 'source_media',
      })
      return serviceResult(packageRecord, schedule, replayed)
    },

    async readLatest(input: ReadInput): Promise<EditReferenceTargetVideoUnderstandingServiceResult> {
      const authority = await resolveTargetAuthority(context, editReferenceRepository, scope(input.workspaceId), input)
      const binding: TargetVideoUnderstandingBinding = {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        editReferenceId: input.editReferenceId,
        studySessionId: input.studySessionId,
        storageObjectRecordId: input.sourceStorageObjectRecordId,
        editBriefDigestSha256: input.expectedEditBriefDigestSha256,
      }
      const latest = await packageRepository.readLatest({ scope: authority.scope, binding })
      if (!latest) {
        throw new ApiError(
          'PROJECT_NOT_FOUND',
          'No target-video understanding package exists for this exact source, Edit Brief, Edit Reference, and Preference Study.',
          404,
        )
      }
      const persisted = await longFormStudyRuntime.read({
        scope: authority.scope,
        runId: latest.study.runId,
      })
      if (!persisted) {
        throw new ApiError(
          'INTERNAL_ERROR',
          'The target-video understanding package lost its exact private study checkpoint.',
          500,
        )
      }
      validateTargetStudyCheckpoint(authority, persisted.plan, persisted.run)
      const packageRecord = await materializePackage({
        packageRepository,
        longFormStudyRuntime,
        authority,
        plan: persisted.plan,
        run: persisted.run,
        declaredContext: withoutContextDigest(latest.declaredContext),
        createdAt: latest.createdAt,
      })
      const schedule = longFormStudyRuntime.schedule({
        env: context.env,
        scope: authority.scope,
        runId: latest.study.runId,
        storageObject: authority.storageObject,
        requiredObjectPurpose: 'source_media',
      })
      return serviceResult(packageRecord, schedule, packageRecord.packageId === latest.packageId)
    },
  }
}

interface TargetAuthority {
  readonly scope: EditReferenceRepositoryScope
  readonly aggregate: EditReferenceAggregate
  readonly session: TargetSessionAuthority
  readonly brief: TargetBriefAuthority
  readonly projectName: string
  readonly storageObject: EditReferenceLongFormStorageObject
}

interface TargetSessionAuthority {
  readonly id: string
  readonly workspaceId?: string
  readonly projectId: string
  readonly ownerUserId?: string
  readonly name: string
  readonly aspectRatio: string
  readonly platformTarget: string
  readonly selectedEditLevel?: string
  readonly metadata?: Record<string, unknown>
}

interface TargetBriefAuthority {
  readonly id: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly briefText: string
  readonly sourceStorageObjectRecordId?: string
  readonly sourceMediaAssetId?: string
  readonly revisionNumber: number
  readonly savedByUserId: string
  readonly updatedAt: string
}

async function resolveTargetAuthority(
  context: ServiceContext,
  editReferenceRepository: EditReferenceRepository,
  requestedScope: EditReferenceRepositoryScope,
  input: StartInput | ReadInput,
): Promise<TargetAuthority> {
  const [internalEditStateResult, briefResult, aggregate, storageResult, projectResult] = await Promise.all([
    createInternalEditStateService(context).getInternalEditState(
      input.workspaceId,
      input.projectId,
      input.editSessionId,
    ),
    createProjectEditBriefLocalService(context).getProjectEditBriefForSession({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
    }),
    editReferenceRepository.read(requestedScope),
    createUploadService(context).getStorageObjectRecord(input.sourceStorageObjectRecordId, input.workspaceId),
    createProjectService(context).getProject(input.projectId, input.workspaceId),
  ])
  const session = createTargetSessionAuthorityFromInternalEditState(
    internalEditStateResult.internalEditState,
  )
  const brief = briefResult.editBrief
  const storageObject = storageResult.storageObjectRecord
  if (!aggregate) throw new ApiError('PROJECT_NOT_FOUND', 'The selected Edit Reference workspace was not found.', 404)
  if (
    session.workspaceId !== input.workspaceId
    || session.projectId !== input.projectId
    || session.id !== input.editSessionId
    || session.ownerUserId !== context.auth?.userId
  ) throw new ApiError('PROJECT_ACCESS_DENIED', 'The target edit session does not belong to this authenticated project scope.', 403)
  if (
    brief.workspaceId !== input.workspaceId
    || brief.projectId !== input.projectId
    || brief.editSessionId !== input.editSessionId
    || brief.revisionNumber !== input.expectedEditBriefRevision
  ) throw new ApiError('VERSION_CONFLICT', 'The exact Edit Brief changed before target-video study could be bound.', 409)
  const briefDigest = calculateTargetVideoEditBriefDigest(brief)
  if (briefDigest !== input.expectedEditBriefDigestSha256) {
    throw new ApiError('VERSION_CONFLICT', 'The Edit Brief digest no longer matches the target-video study request.', 409)
  }
  if (
    brief.sourceStorageObjectRecordId !== input.sourceStorageObjectRecordId
    || brief.sourceMediaAssetId !== input.sourceMediaAssetId
  ) throw new ApiError('VERSION_CONFLICT', 'The Edit Brief is bound to a different target video.', 409)
  const reference = aggregate.references.find((candidate) => candidate.id === input.editReferenceId)
  const study = aggregate.studies.find((candidate) => candidate.id === input.studySessionId)
  if (
    !reference
    || reference.workspaceId !== input.workspaceId
    || reference.status !== 'active'
    || !study
    || study.workspaceId !== input.workspaceId
    || study.editReferenceId !== reference.id
    || ['archived', 'failed'].includes(study.status)
  ) throw new ApiError('VALIDATION_FAILED', 'The target study requires an active Edit Reference and matching Preference Study.', 409)
  if (
    storageObject.workspaceId !== input.workspaceId
    || storageObject.projectId !== input.projectId
    || storageObject.mediaAssetId !== input.sourceMediaAssetId
    || storageObject.objectPurpose !== 'source_media'
    || storageObject.status !== 'ready'
    || !storageObject.mimeType?.startsWith('video/')
    || !Number.isSafeInteger(storageObject.sizeBytes)
    || (storageObject.sizeBytes ?? 0) <= 0
    || !/^[a-f0-9]{64}$/.test(storageObject.checksumSha256 ?? '')
  ) throw new ApiError('TARGET_VIDEO_NOT_FINALIZED', 'The exact private target video must be finalized and integrity-verified before study starts.', 409)
  if ('selectedEditLevel' in input) validateDeclaredSessionContext(session, input)
  const project = projectResult.project as { name?: unknown; workspaceId?: unknown }
  if (project.workspaceId !== undefined && project.workspaceId !== input.workspaceId) {
    throw new ApiError('PROJECT_ACCESS_DENIED', 'The project does not belong to the requested workspace.', 403)
  }
  return {
    scope: requestedScope,
    aggregate,
    session,
    brief,
    projectName: typeof project.name === 'string' && project.name.trim() ? project.name.trim() : 'ReEditPro Project',
    storageObject,
  }
}

function validateDeclaredSessionContext(
  session: TargetSessionAuthority,
  input: StartInput,
): void {
  const outputFrameConfirmed = session.metadata?.outputFrameConfirmed === true
    || session.metadata?.confirmedAspectRatio === session.aspectRatio
  if (session.metadata?.preferenceMutationLocked === true) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'This edit is already approval-locked. Request the change through Chat so ReEditPro can create a fresh plan and estimate.',
      409,
    )
  }
  if (
    input.outputFrameConfirmed !== true
    || !outputFrameConfirmed
    || session.aspectRatio !== input.aspectRatio
    || session.platformTarget !== input.platformTarget
    || (session.selectedEditLevel && session.selectedEditLevel !== input.selectedEditLevel)
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'Target-video study context no longer matches the confirmed frame, platform, or Edit Level on the edit session.',
      409,
    )
  }
}

function createTargetSessionAuthorityFromInternalEditState(
  internalEditState: InternalEditStateRecord,
): TargetSessionAuthority {
  const handoff = internalEditState.handoff as {
    readonly workspaceId?: unknown
    readonly projectId?: unknown
    readonly editSessionId?: unknown
    readonly editName?: unknown
    readonly projectName?: unknown
    readonly stage?: unknown
    readonly approvedSnapshotId?: unknown
    readonly setup?: unknown
  }
  if (
    handoff.workspaceId !== internalEditState.workspaceId
    || handoff.projectId !== internalEditState.projectId
    || handoff.editSessionId !== internalEditState.editSessionId
  ) {
    throw new ApiError(
      'PROJECT_ACCESS_DENIED',
      'The exact named-edit state does not match its authenticated project scope.',
      403,
    )
  }

  const setup = isRecord(handoff.setup) ? handoff.setup : {}
  const aspectRatio = readConfirmedTargetAspectRatio(setup)
  const platformTarget = readTargetPlatform(setup, aspectRatio)
  const selectedEditLevel = readTargetEditLevel(setup)
  const editName = typeof handoff.editName === 'string' && handoff.editName.trim()
    ? handoff.editName.trim()
    : typeof handoff.projectName === 'string' && handoff.projectName.trim()
      ? handoff.projectName.trim()
      : 'Named edit'
  const stage = typeof handoff.stage === 'string' ? handoff.stage : 'created'

  return {
    id: internalEditState.editSessionId,
    workspaceId: internalEditState.workspaceId,
    projectId: internalEditState.projectId,
    ownerUserId: internalEditState.userId,
    name: editName,
    aspectRatio,
    platformTarget,
    selectedEditLevel,
    metadata: {
      exactInternalEditStateAuthority: true,
      exactInternalEditStateUpdatedAt: internalEditState.updatedAt,
      outputFrameConfirmed: true,
      confirmedAspectRatio: aspectRatio,
      confirmedPlatformTarget: platformTarget,
      internalEditStage: stage,
      approvedSnapshotId: typeof handoff.approvedSnapshotId === 'string'
        ? handoff.approvedSnapshotId
        : undefined,
      preferenceMutationLocked: isPreferenceMutationLocked(stage, handoff.approvedSnapshotId),
    },
  }
}

function readConfirmedTargetAspectRatio(setup: Record<string, unknown>): TargetSessionAuthority['aspectRatio'] {
  const aspectRatio = setup.aspectRatio
  if (
    setup.aspectRatioConfirmed !== true
    || (aspectRatio !== '9:16' && aspectRatio !== '16:9' && aspectRatio !== '1:1' && aspectRatio !== '4:5')
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'Confirm a supported output frame on this exact named edit before target-video study starts.',
      409,
    )
  }
  return aspectRatio
}

function readTargetPlatform(
  setup: Record<string, unknown>,
  aspectRatio: TargetSessionAuthority['aspectRatio'],
): TargetSessionAuthority['platformTarget'] {
  const platform = setup.targetPlatform
  if (platform === 'tiktok_reels_shorts') return 'tiktok_reel'
  if (platform === 'youtube') return aspectRatio === '9:16' ? 'youtube_shorts' : 'youtube_standard'
  if (platform === 'website' || platform === 'course_training') return 'website'
  if (platform === 'client_review') return 'internal_review'
  if (platform === 'custom') return 'custom'
  throw new ApiError(
    'VERSION_CONFLICT',
    'Confirm the target platform on this exact named edit before target-video study starts.',
    409,
  )
}

function readTargetEditLevel(setup: Record<string, unknown>): TargetSessionAuthority['selectedEditLevel'] {
  if (setup.editLevel === 'basic') return 'normal'
  if (setup.editLevel === 'pro') return 'premium'
  if (setup.editLevel === 'premium') return 'ultra_premium'
  throw new ApiError(
    'VERSION_CONFLICT',
    'Confirm the Edit Level on this exact named edit before target-video study starts.',
    409,
  )
}

function isPreferenceMutationLocked(stage: string, approvedSnapshotId: unknown): boolean {
  return typeof approvedSnapshotId === 'string' && approvedSnapshotId.trim().length > 0
    || [
      'plan_approved',
      'private_review_ready',
      'private_review_verified',
      'private_review_accepted',
      'internal_edit_complete',
      'revision_requested',
      'revision_preview_ready',
    ].includes(stage)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function declaredContextFromStart(
  authority: TargetAuthority,
  input: StartInput,
): Parameters<typeof createTargetVideoUnderstandingPackage>[0]['declaredContext'] {
  return {
    projectName: authority.projectName,
    editName: authority.session.name,
    contentType: input.contentType,
    currentUserInstruction: input.currentUserInstruction,
    selectedEditLevel: input.selectedEditLevel,
    aspectRatio: input.aspectRatio,
    outputFrameConfirmed: true,
    platformTarget: input.platformTarget,
    storyRole: input.storyRole,
    budgetPreference: input.budgetPreference,
    directives: structuredClone(input.directives),
    approvedConstraints: [...input.approvedConstraints],
    editBriefId: authority.brief.id,
    editBriefRevision: authority.brief.revisionNumber,
    editBriefDigestSha256: input.expectedEditBriefDigestSha256,
  }
}

function withoutContextDigest(
  value: TargetVideoUnderstandingPackage['declaredContext'],
): Parameters<typeof createTargetVideoUnderstandingPackage>[0]['declaredContext'] {
  const declaredContext = structuredClone(value) as Partial<TargetVideoUnderstandingPackage['declaredContext']>
  delete declaredContext.contextDigestSha256
  return declaredContext as Parameters<typeof createTargetVideoUnderstandingPackage>[0]['declaredContext']
}

async function materializePackage(input: {
  readonly packageRepository: PrivateTargetVideoUnderstandingRepository
  readonly longFormStudyRuntime: EditReferenceLongFormStudyRuntimePort
  readonly authority: TargetAuthority
  readonly plan: Parameters<typeof createTargetVideoUnderstandingPackage>[0]['plan']
  readonly run: Parameters<typeof createTargetVideoUnderstandingPackage>[0]['run']
  readonly declaredContext: Parameters<typeof createTargetVideoUnderstandingPackage>[0]['declaredContext']
  readonly createdAt: string
}): Promise<TargetVideoUnderstandingPackage> {
  const outputs = []
  for (const workItem of input.run.workItems) {
    if (
      workItem.status !== 'completed'
      || !workItem.outputDigestSha256
      || ['ingest_integrity', 'media_probe'].includes(workItem.stageId)
    ) continue
    const output = await input.longFormStudyRuntime.readWorkOutput({
      scope: input.authority.scope,
      runId: input.run.runId,
      workItemId: workItem.workItemId,
    })
    if (!output) {
      throw new ApiError('INTERNAL_ERROR', `Completed target-video ${workItem.stageId} evidence is unavailable.`, 500)
    }
    outputs.push(output)
  }
  const packageRecord = createTargetVideoUnderstandingPackage({
    workspaceId: input.authority.scope.workspaceId,
    projectId: input.authority.session.projectId,
    editSessionId: input.authority.session.id,
    editReferenceId: input.plan.editReferenceId,
    studySessionId: input.plan.studySessionId,
    storageObjectRecordId: input.authority.storageObject.id,
    mediaAssetId: input.authority.storageObject.mediaAssetId as string,
    declaredContext: input.declaredContext,
    plan: input.plan,
    run: input.run,
    outputs,
    createdAt: input.createdAt,
  })
  return (await input.packageRepository.save({
    scope: input.authority.scope,
    package: packageRecord,
  })).package
}

function validateTargetStudyCheckpoint(
  authority: TargetAuthority,
  plan: Parameters<typeof createTargetVideoUnderstandingPackage>[0]['plan'],
  run: Parameters<typeof createTargetVideoUnderstandingPackage>[0]['run'],
): void {
  try {
    validateRunAgainstPlan(run, plan)
  } catch {
    throw new ApiError('INTERNAL_ERROR', 'The retained target-video study checkpoint failed exact plan validation.', 500)
  }
  if (
    plan.workspaceId !== authority.scope.workspaceId
    || plan.source.privateMediaArtifactId !== authority.storageObject.id
    || plan.source.mediaChecksumSha256 !== authority.storageObject.checksumSha256
    || plan.source.sizeBytes !== authority.storageObject.sizeBytes
    || plan.source.mimeType !== authority.storageObject.mimeType
  ) throw new ApiError('VERSION_CONFLICT', 'The target video changed after its study checkpoint was created.', 409)
}

function serviceResult(
  packageRecord: TargetVideoUnderstandingPackage,
  schedule: EditReferenceLongFormStudyScheduleResult,
  replayed: boolean,
): EditReferenceTargetVideoUnderstandingServiceResult {
  return {
    package: packageRecord,
    schedule,
    persistence: 'backend_local_private_versioned',
    warnings: [
      BACKEND_LOCAL_WARNING,
      schedule.scheduled
        ? 'The private target-video study continues from durable checkpoints after this request returns; the browser does not need to stay open.'
        : 'The exact study remains checkpointed and will continue when the approved backend media worker runtime is available.',
      'No customer price, customer-credit mutation, provider activation, render, deployment, or remote Supabase mutation occurred.',
    ],
    replayed,
    productReady: false,
  }
}

export function calculateTargetVideoEditBriefDigest(brief: TargetBriefAuthority): string {
  return calculateProjectEditBriefLocalDigest(brief)
}

function targetUnderstandingRunId(input: {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly storageObjectRecordId: string
  readonly mediaChecksumSha256: string
}): string {
  return `target-video-run-${sha256(stableStringify(input)).slice(0, 32)}`
}

function targetStudyCreatedAt(storageObject: EditReferenceLongFormStorageObject): string {
  if (storageObject.createdAt && Number.isFinite(Date.parse(storageObject.createdAt))) {
    return new Date(storageObject.createdAt).toISOString()
  }
  // Finalized storage adapters are required to provide createdAt. This stable
  // fallback exists only for injected test adapters created before that field.
  return '2000-01-01T00:00:00.000Z'
}

function createTargetLongFormStudySourceBinding(
  authority: TargetAuthority,
): EditReferenceLongFormStudySourceBinding | undefined {
  const storage = authority.storageObject
  if (!storage.mediaAssetId || !storage.generation || !storage.etag) return undefined
  return {
    sourceAuthority: 'target_source_media',
    sourceAssetId: storage.mediaAssetId,
    sourceStorageObjectId: storage.objectPath,
    sourceStorageGeneration: storage.generation,
    sourceStorageEtag: storage.etag,
  }
}

function requireIdempotencyKey(value: string): void {
  if (!value.trim() || value.length > 240) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A bounded Idempotency-Key is required for target-video study.', 400)
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}
