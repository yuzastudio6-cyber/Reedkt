import { z } from 'zod'

import {
  CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
  type CanonicalCaptionSpecialistExecutionReceipt,
  type CanonicalCaptionSpecialistWorkItemInput,
} from '../../src/types/canonical-caption-specialist-execution'
import { CAPTIONS_SUPPORTED_JOB_TYPES } from
  '../../src/types/captions-specialist'
import type { CanonicalSpecialistCallResultPair } from
  '../../src/types/canonical-specialist-support-resume'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  type OrchestraSkillCall,
  type SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-contracts'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST } from
  '../captions-specialist/captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT } from
  '../captions-specialist/captions-specialist-integration-qualification'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalApprovedExecutionAuthority } from
  './edit-planning-authority-service'
import {
  createCanonicalSpecialistCallResultPair,
  type CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

const safeKey = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Caption frame ranges must be non-empty.',
    })
  }
})
const initialArtifactTypeSchema = z.enum([
  'canonical_transcript',
  'canonical_transcript_authenticated_read_binding',
  'confirmed_output_frame',
  'master_timing_or_planning_timing',
])
const initialArtifactSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
  artifactType: initialArtifactTypeSchema,
  producerSkillKey: safeKey,
  privateArtifact: z.literal(true),
  byteFreeRef: z.literal(true),
  sourceSupportRequestRef: z.null(),
}).strict()
const workItemInputSchema: z.ZodType<CanonicalCaptionSpecialistWorkItemInput> =
z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION),
  operation: z.literal(CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION),
  captionJobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  requestedMode: z.literal('planning'),
  scopeLevel: z.enum(['video', 'scene', 'boundary']),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
  initialArtifactRefs: z.array(initialArtifactSchema).min(3).max(8),
  rawChatIncluded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchRequested: z.literal(false),
  providerCallRequested: z.literal(false),
  timelineMutationRequested: z.literal(false),
  assetMutationRequested: z.literal(false),
  qaApprovalRequested: z.literal(false),
  billingAuthorityRequested: z.literal(false),
  publicDeliveryRequested: z.literal(false),
  productionAuthorityRequested: z.literal(false),
}).strict().superRefine((input, context) => {
  const types = input.initialArtifactRefs.map((ref) => ref.artifactType)
  if (new Set(types).size !== types.length
    || !types.includes('canonical_transcript')
    || !types.includes('confirmed_output_frame')
    || !types.includes('master_timing_or_planning_timing')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['initialArtifactRefs'],
      message:
        'Caption initial evidence must contain one transcript, frame, and MasterTiming ref without duplicate roles.',
    })
  }
  let lastEnd = -1
  for (const range of input.authorizedFrameRanges) {
    if (range.startFrame < lastEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['authorizedFrameRanges'],
        message: 'Caption frame ranges must be ordered and non-overlapping.',
      })
      break
    }
    lastEnd = range.endFrameExclusive
  }
  if ((input.scopeLevel === 'video' && (
    input.sceneId !== null || input.boundaryId !== null))
    || (input.scopeLevel === 'scene' && (
      input.sceneId === null || input.boundaryId !== null))
    || (input.scopeLevel === 'boundary' && input.boundaryId === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Caption scope identifiers do not match the declared scope level.',
    })
  }
})

const receiptWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION),
  receiptId: safeKey,
  executionPackageRef: refSchema,
  approvedSnapshotRef: refSchema,
  approvedWorkItemRef: refSchema,
  canonicalJobRef: refSchema,
  plannedManifestEntryRef: refSchema,
  estimateRef: refSchema,
  reservationRef: refSchema,
  captionCallRef: refSchema,
  captionResultRef: refSchema,
  captionJobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  resultDisposition: z.enum([
    'completed', 'needs_followup', 'blocked', 'unsupported', 'failed',
  ]),
  persistedAt: z.string().datetime({ offset: true }),
  exactApprovedSnapshotReread: z.literal(true),
  exactExecutionPackageReread: z.literal(true),
  exactWorkItemAndJobReread: z.literal(true),
  exactConfirmedFrameAndMasterTimingRefsBound: z.literal(true),
  exactPlannedManifestEntryBound: z.literal(true),
  exactEstimateAndReservationBound: z.literal(true),
  callResultPersistedCreateOnlyAndReread: z.literal(true),
  supportRequestsRemainHqMediated: z.literal(true),
  browserLocalCompletionAccepted: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  mediaRuntimePerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  assetMutationPerformed: z.literal(false),
  costOrBillingMutationPerformed: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const receiptSchema: z.ZodType<CanonicalCaptionSpecialistExecutionReceipt> =
  receiptWithoutDigestSchema.extend({ receiptDigestSha256: rawSha256 }).strict()

export interface CanonicalCaptionSpecialistExecutionPort {
  execute(input: { readonly call: OrchestraSkillCall }): Promise<unknown>
}

export function parseCanonicalCaptionSpecialistWorkItemInput(
  value: unknown,
): CanonicalCaptionSpecialistWorkItemInput {
  assertClosedContractTree(value, 'Canonical Caption work-item input')
  rejectUnsafeText(value, 'Canonical Caption work-item input')
  return structuredClone(workItemInputSchema.parse(value))
}

export function parseCanonicalCaptionSpecialistExecutionReceipt(
  value: unknown,
): CanonicalCaptionSpecialistExecutionReceipt {
  assertClosedContractTree(value, 'Canonical Caption execution receipt')
  rejectUnsafeText(value, 'Canonical Caption execution receipt')
  const parsed = receiptSchema.parse(value)
  if (parsed.receiptDigestSha256 !== digest(
    parsed,
    'receiptDigestSha256',
  )) throw new Error('Canonical Caption execution receipt digest failed.')
  return structuredClone(parsed)
}

export async function executeCanonicalCaptionSpecialistWorkItem(input: {
  readonly authority: CanonicalApprovedExecutionAuthority
  readonly executionPackage: CanonicalApprovedEditExecutionPackage
  readonly jobId: string
  readonly repository: CanonicalSpecialistSupportResumeRepository
  readonly executionPort?: CanonicalCaptionSpecialistExecutionPort
  readonly now?: () => Date
}): Promise<{
  readonly pair: CanonicalSpecialistCallResultPair
  readonly receipt: CanonicalCaptionSpecialistExecutionReceipt
}> {
  assertRepository(input.repository)
  const authority = structuredClone(input.authority)
  const executionPackage = structuredClone(input.executionPackage)
  assertPackageMatchesAuthority(executionPackage, authority)
  const job = authority.jobs.find((candidate) => candidate.id === input.jobId)
  if (!job) throw new Error('Canonical Caption job is unavailable.')
  const workItem = authority.workItems.find((candidate) =>
    candidate.id === job.approvedWorkItemId)
  if (!workItem
    || job.workItemKey !== workItem.workItemKey
    || job.jobType !== workItem.workItemType
    || job.workerClass !== workItem.workerClass
    || job.executionInputRef.sha256 !== workItem.executionInputRef.sha256
    || job.status !== 'ready'
    || workItem.workItemType !== 'custom'
    || workItem.workerClass !== CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS
    || workItem.approvedToolIds.length !== 0
    || workItem.providerExecutionMode !== 'none'
    || workItem.approvedProviderRoute !== undefined) {
    throw new Error('Canonical Caption work-item/job authority is invalid.')
  }
  if (sha256AuthorityValue(workItem.executionInput)
    !== workItem.executionInputRef.sha256
    || workItem.executionInputHash !== workItem.executionInputRef.sha256) {
    throw new Error('Canonical Caption execution input changed after approval.')
  }
  const workInput = parseCanonicalCaptionSpecialistWorkItemInput(
    workItem.executionInput)
  assertExpectedOutputAndManifest(authority, workItem)

  const call = createCaptionCall({ authority, workItem, job, workInput })
  const captionCallRef = callRef(call)
  const replay = await input.repository.rereadCallResultPair({
    callRef: captionCallRef,
  })
  let pair: CanonicalSpecialistCallResultPair
  if (replay) {
    if (stableAuthorityStringify(replay.call)
      !== stableAuthorityStringify(call)) {
      throw new Error('Canonical Caption call replay crossed approved authority.')
    }
    pair = replay
  } else {
    const rawResult = await (input.executionPort ?? defaultExecutionPort)
      .execute({ call: structuredClone(call) })
    const result = parseOrchestraSkillJobResult(rawResult)
    pair = createCanonicalSpecialistCallResultPair({
      call,
      result,
      persistedAt: (input.now ?? (() => new Date()))().toISOString(),
    })
    await input.repository.persistCallResultPairCreateOnly({ pair })
    const reread = await input.repository.rereadCallResultPair({
      callRef: captionCallRef,
    })
    if (!reread || reread.pairDigestSha256 !== pair.pairDigestSha256) {
      throw new Error('Canonical Caption call/result reread failed.')
    }
    pair = reread
  }
  return {
    pair,
    receipt: createReceipt({
      authority,
      executionPackage,
      workItem,
      job,
      pair,
    }),
  }
}

const defaultExecutionPort: CanonicalCaptionSpecialistExecutionPort = {
  async execute({ call }) {
    return runCaptionsSpecialistJob({ call })
  },
}

function createCaptionCall(input: {
  authority: CanonicalApprovedExecutionAuthority
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  workInput: CanonicalCaptionSpecialistWorkItemInput
}): OrchestraSkillCall {
  const manifestRef: SkillContractRef = {
    id: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
    version:
      CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
    contentHash: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
  }
  const qualificationRef: SkillContractRef = {
    id: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
    version:
      CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
    contentHash:
      CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
        .snapshotDigestSha256,
  }
  const identity = sha256AuthorityValue({
    snapshotHash: input.authority.snapshot.snapshotHash,
    approvedWorkItemId: input.workItem.id,
    canonicalJobId: input.job.id,
    executionInputHash: input.workItem.executionInputHash,
    captionJobType: input.workInput.captionJobType,
  })
  const withoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: `caption.call.${identity.slice(0, 40)}`,
    idempotencyKey: `caption:${identity}`.slice(0, 180),
    caller: {
      callerKind: 'head_of_orchestra',
      callerId: 'canonical-approved-edit-workflow',
    },
    assigneeSkillKey: 'captions',
    job: {
      jobId: `caption.job.${identity.slice(0, 40)}`,
      jobType: input.workInput.captionJobType,
      requestedMode: input.workInput.requestedMode,
      scopeLevel: input.workInput.scopeLevel,
    },
    canonicalScope: {
      ownerUserId: input.authority.snapshot.approvedByUserId,
      workspaceId: input.authority.snapshot.workspaceId,
      projectId: input.authority.snapshot.projectId,
      editSessionId: input.authority.snapshot.editSessionId,
      approvedSnapshotRef: {
        id: input.authority.snapshot.snapshotId,
        version: input.authority.snapshot.schemaVersion,
        contentHash: input.authority.snapshot.snapshotHash,
      },
      outputId: input.workInput.outputId,
      sceneId: input.workInput.sceneId,
      boundaryId: input.workInput.boundaryId,
      authorizedFrameRanges:
        structuredClone(input.workInput.authorizedFrameRanges),
    },
    manifestRef,
    qualificationSnapshotRef: qualificationRef,
    inputArtifactRefs:
      structuredClone(input.workInput.initialArtifactRefs),
    injectedSupportArtifactRefs: [],
    resumeOfSupportRequestRef: null,
    resumeOriginCallRef: null,
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
    privateArtifactPolicy: {
      tenantScoped: true,
      byteFreeCoordinationOnly: true,
      rawChatAllowed: false,
      mediaBytesAllowed: false,
      urlOrPathAllowed: false,
    },
  }
  return parseOrchestraSkillCall({
    ...withoutDigest,
    callDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, callDigestSha256: '' },
      'callDigestSha256',
    ),
  })
}

function assertPackageMatchesAuthority(
  pkg: CanonicalApprovedEditExecutionPackage,
  authority: CanonicalApprovedExecutionAuthority,
): void {
  const snapshot = authority.snapshot
  const packageWorkItems = new Map(pkg.approvedWorkItems.map((item) =>
    [item.id, item]))
  const packageJobs = new Map(pkg.jobs.map((job) => [job.id, job]))
  if (pkg.approvedPlanSnapshotId !== snapshot.snapshotId
    || pkg.workspaceId !== snapshot.workspaceId
    || pkg.projectId !== snapshot.projectId
    || pkg.editSessionId !== snapshot.editSessionId
    || pkg.snapshotHash !== snapshot.snapshotHash
    || pkg.planHash !== snapshot.planHash
    || pkg.estimateHash !== snapshot.estimateHash
    || pkg.workGraphHash !== snapshot.workGraphHash
    || pkg.timingHash !== snapshot.timingHash
    || pkg.approvedAssetManifestHash !== snapshot.approvedAssetManifestHash
    || stableAuthorityStringify(pkg.componentRefs)
      !== stableAuthorityStringify(snapshot.componentRefs)
    || authority.workItems.some((workItem) => {
      const candidate = packageWorkItems.get(workItem.id)
      return !candidate
        || candidate.workItemKey !== workItem.workItemKey
        || candidate.executionInputHash !== workItem.executionInputHash
    })
    || authority.jobs.some((job) => {
      const candidate = packageJobs.get(job.id)
      return !candidate
        || candidate.approvedWorkItemId !== job.approvedWorkItemId
        || candidate.executionInputRef.sha256 !== job.executionInputRef.sha256
        || candidate.dispatchState !== 'not_authorized'
    })) {
    throw new Error(
      'Canonical Caption execution package does not match approved authority.',
    )
  }
}

function assertExpectedOutputAndManifest(
  authority: CanonicalApprovedExecutionAuthority,
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number],
): void {
  const output = workItem.expectedOutputs[0]
  const entries = authority.assetManifest.entries.filter((entry) =>
    entry.approvedWorkItemId === workItem.id)
  if (workItem.expectedOutputs.length !== 1
    || !output
    || output.artifactType !== 'caption_specialist_job_receipt'
    || output.assetRole !== 'qa'
    || output.required !== true
    || output.previewPlaceholderAllowed !== false
    || output.contentType !== 'application/json'
    || entries.length !== 1
    || stableAuthorityStringify({
      outputKey: entries[0]!.outputKey,
      artifactType: entries[0]!.artifactType,
      assetRole: entries[0]!.assetRole,
      required: entries[0]!.required,
      previewPlaceholderAllowed: entries[0]!.previewPlaceholderAllowed,
      contentType: entries[0]!.contentType,
      segmentIds: entries[0]!.segmentIds,
      timingIds: entries[0]!.timingIds,
      rendererLayerIds: entries[0]!.rendererLayerIds,
    }) !== stableAuthorityStringify(output)) {
    throw new Error(
      'Canonical Caption planned receipt output or manifest entry is invalid.',
    )
  }
}

function createReceipt(input: {
  authority: CanonicalApprovedExecutionAuthority
  executionPackage: CanonicalApprovedEditExecutionPackage
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  pair: CanonicalSpecialistCallResultPair
}): CanonicalCaptionSpecialistExecutionReceipt {
  const manifestEntry = input.authority.assetManifest.entries.find((entry) =>
    entry.approvedWorkItemId === input.workItem.id)!
  const result = parseOrchestraSkillJobResult(input.pair.result)
  const payload = receiptWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION,
    receiptId: `caption.execution.${input.pair.pairDigestSha256.slice(0, 40)}`,
    executionPackageRef: {
      id: input.executionPackage.packageRecordId,
      version: input.executionPackage.schemaVersion,
      contentHash: input.executionPackage.packageHash,
    },
    approvedSnapshotRef: {
      id: input.authority.snapshot.snapshotId,
      version: input.authority.snapshot.schemaVersion,
      contentHash: input.authority.snapshot.snapshotHash,
    },
    approvedWorkItemRef: authorityRef(
      input.workItem.id,
      'private-edit-authority-approved-work-item-v1',
      input.workItem,
    ),
    canonicalJobRef: authorityRef(
      input.job.id,
      'private-edit-authority-derived-job-v1',
      input.job,
    ),
    plannedManifestEntryRef: authorityRef(
      manifestEntry.id,
      'private-edit-asset-manifest-entry-v1',
      manifestEntry,
    ),
    estimateRef: {
      id: input.authority.estimate.id,
      version: 'private-edit-authority-credit-estimate-v1',
      contentHash: input.authority.estimate.estimateHash,
    },
    reservationRef: authorityRef(
      input.authority.reservation.id,
      'private-edit-authority-credit-reservation-v1',
      input.authority.reservation,
    ),
    captionCallRef: callRef(input.pair.call),
    captionResultRef: {
      id: result.resultId,
      version: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
      contentHash: result.resultDigestSha256,
    },
    captionJobType: input.workItem.executionInput.captionJobType,
    resultDisposition: result.disposition,
    persistedAt: input.pair.persistedAt,
    exactApprovedSnapshotReread: true,
    exactExecutionPackageReread: true,
    exactWorkItemAndJobReread: true,
    exactConfirmedFrameAndMasterTimingRefsBound: true,
    exactPlannedManifestEntryBound: true,
    exactEstimateAndReservationBound: true,
    callResultPersistedCreateOnlyAndReread: true,
    supportRequestsRemainHqMediated: true,
    browserLocalCompletionAccepted: false,
    directPeerDispatchPerformed: false,
    providerCallPerformed: false,
    mediaRuntimePerformed: false,
    timelineMutationPerformed: false,
    assetMutationPerformed: false,
    costOrBillingMutationPerformed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  return parseCanonicalCaptionSpecialistExecutionReceipt({
    ...payload,
    receiptDigestSha256: digest(payload, 'receiptDigestSha256'),
  })
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function authorityRef(
  id: string,
  version: string,
  value: unknown,
): SkillContractRef {
  return { id, version, contentHash: sha256AuthorityValue(value) }
}

function digest(value: unknown, field: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    field,
  )
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(`${label} contains unsafe serialized text.`)
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function assertRepository(
  repository: CanonicalSpecialistSupportResumeRepository,
): void {
  if (!repository
    || typeof repository.rereadCallResultPair !== 'function'
    || typeof repository.persistCallResultPairCreateOnly !== 'function') {
    throw new Error('Canonical specialist resume repository is unavailable.')
  }
}
