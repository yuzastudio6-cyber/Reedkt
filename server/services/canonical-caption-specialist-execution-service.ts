import { z } from 'zod'

import {
  CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
  type CanonicalCaptionSpecialistExecutionReceipt,
  type CanonicalCaptionIncomingSupportRequestReadPort,
  type CanonicalCaptionSpecialistWorkItemInput,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CAPTIONS_SUPPORT_JOB_TYPES,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES,
} from
  '../../src/types/captions-specialist'
import {
  CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION,
} from '../../src/types/canonical-caption-specialist-planning'
import type { CanonicalSpecialistCallResultPair } from
  '../../src/types/canonical-specialist-support-resume'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  type OrchestraSkillCall,
  type SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-contracts'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST } from
  '../captions-specialist/captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2 } from
  '../captions-specialist/captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V3 } from
  '../captions-specialist/captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V2,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V3,
} from
  '../captions-specialist/captions-specialist-integration-qualification'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { canonicalCaptionAssignmentTriggerForJob } from
  '../captions-specialist/caption-canonical-work-planning'
import {
  admitCaptionCanonicalTranscriptFromAuthenticatedRead,
  parseCaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../captions-specialist/caption-canonical-transcript-authenticated-read'
import { parseCaptionCanonicalTranscript } from
  '../captions-specialist/caption-transcript-lineage'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalCaptionTranscriptAuthenticatedReadPort } from
  '../../src/types/canonical-caption-transcript-support'
import {
  CANONICAL_CAPTION_POSTAPPROVAL_FINISH_READ_PORT_VERSION,
  type CanonicalCaptionPostapprovalFinishLookup,
  type CanonicalCaptionPostapprovalFinishReadPort,
} from
  '../../src/types/canonical-caption-postapproval-finish-binding'
import {
  CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION,
  type CanonicalCaptionCrossSystemExecutionInputReadPort,
} from '../../src/types/canonical-caption-cross-system-execution-input'
import type {
  CaptionCrossSystemCoordinationPlanContext,
  CaptionCrossSystemHandoffV2Context,
} from '../../src/types/caption-cross-system-coordination'
import {
  canonicalWorkerLeaseDependencyAuthoritySchema,
  type CanonicalWorkerLeaseDependencyAuthority,
} from '../validation/canonical-worker-lease-authority-schemas'
import type { CanonicalApprovedExecutionAuthority } from
  './edit-planning-authority-service'
import {
  createCanonicalSpecialistCallResultPair,
  rereadCanonicalSpecialistSupportResumeChain,
  type CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import {
  parseCanonicalCaptionTranscriptPlanningExpectationBinding,
} from './canonical-caption-transcript-support-service'
import {
  canonicalCaptionCrossSystemRuntimeInput,
  resolveCanonicalCaptionCrossSystemExecutionInput,
} from './canonical-caption-cross-system-execution-input-service'
import {
  resolveCanonicalCaptionIncomingSupportRequestForCall,
} from './canonical-caption-incoming-support-request-service'
import {
  canonicalCaptionProducedArtifactRefsDigest,
} from './canonical-caption-specialist-produced-artifact-contract'
import {
  isCanonicalCaptionPostapprovalFinishReadPort,
  parseCanonicalCaptionPostapprovalFinishRecord,
} from './canonical-caption-postapproval-finish-service'
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
  'canonical_transcript_planning_expectation',
  'canonical_transcript_planning_expectation_binding',
  'canonical_transcript_authenticated_read_binding',
  'canonical_caption_postapproval_finish_binding',
  'confirmed_output_frame',
  'master_timing_or_planning_timing',
  'source_skill_support_request',
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
const workItemBodySchema = z.object({
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
}).strict()
const workItemInputV1Schema = workItemBodySchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION),
}).strict()
const workItemInputV2Schema = workItemBodySchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION),
  assignmentIntentRef: refSchema.extend({
    version: z.literal(CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION),
  }).strict(),
  assignmentTrigger: z.enum([
    'approved_early_plan',
    'approved_picture_lock',
    'approved_boundary_requirement',
    'hq_mediated_support_request',
    'canonical_caption_qa_repair',
    'canonical_caption_output_recomposition',
    'canonical_caption_result_inspection',
    'canonical_caption_boundary_inspection',
  ]),
  sourceSupportRequestRef: refSchema.nullable(),
  selectionEvidenceRef: refSchema,
}).strict()
const workItemInputV3Schema = workItemInputV2Schema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION),
}).strict()
const workItemInputSchema: z.ZodType<CanonicalCaptionSpecialistWorkItemInput> =
z.discriminatedUnion('schemaVersion', [
  workItemInputV1Schema,
  workItemInputV2Schema,
  workItemInputV3Schema,
]).superRefine((input, context) => {
  const types = input.initialArtifactRefs.map((ref) => ref.artifactType)
  const sourceLedExpectation = input.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
  const hasPlanningResolutionBinding = types.includes(
    'canonical_transcript_planning_expectation_binding',
  )
  const hasAuthenticatedReadBinding = types.includes(
    'canonical_transcript_authenticated_read_binding',
  )
  if (new Set(types).size !== types.length
    || types.includes('canonical_caption_postapproval_finish_binding')
    || (sourceLedExpectation
      ? !types.includes('canonical_transcript_planning_expectation')
        || types.includes('canonical_transcript')
        || hasPlanningResolutionBinding
        || hasAuthenticatedReadBinding
      : !types.includes('canonical_transcript')
        || types.includes('canonical_transcript_planning_expectation')
        || hasPlanningResolutionBinding)
    || !types.includes('confirmed_output_frame')
    || !types.includes('master_timing_or_planning_timing')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['initialArtifactRefs'],
      message:
        'Caption initial evidence must contain one transcript or source-led expectation, frame, and MasterTiming ref without duplicate roles.',
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
  if (input.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION
    || input.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION) {
    const supportJob = (CAPTIONS_SUPPORT_JOB_TYPES as readonly string[])
      .includes(input.captionJobType)
    const incomingRequestArtifacts = input.initialArtifactRefs.filter(
      (artifact) => artifact.artifactType ===
        'source_skill_support_request')
    if (input.assignmentTrigger !==
      canonicalCaptionAssignmentTriggerForJob(input.captionJobType)
      || supportJob !== (input.sourceSupportRequestRef !== null)
      || supportJob !== (incomingRequestArtifacts.length === 1)
      || (input.sourceSupportRequestRef !== null
        && (incomingRequestArtifacts[0]?.id !==
          input.sourceSupportRequestRef.id
          || incomingRequestArtifacts[0]?.version !==
            input.sourceSupportRequestRef.version
          || incomingRequestArtifacts[0]?.contentHash !==
            input.sourceSupportRequestRef.contentHash
          || incomingRequestArtifacts[0]?.producerSkillKey !==
            'head_of_orchestra'))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Caption V2 assignment trigger or support lineage is invalid.',
      })
    }
  } else if (types.includes('source_skill_support_request')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Caption V1 work cannot claim an incoming support request.',
    })
  }
})

const receiptCommonWithoutDigestSchema = z.object({
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
const receiptV1WithoutDigestSchema = receiptCommonWithoutDigestSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION),
}).strict()
const receiptV2WithoutDigestSchema = receiptCommonWithoutDigestSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION),
  producedArtifactCount: z.number().int().nonnegative().max(64),
  producedArtifactRefsDigestSha256: rawSha256,
  exactProducedArtifactRefsBound: z.literal(true),
  crossSystemExecutionInputRef: refSchema.extend({
    version: z.literal(
      CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION),
  }).strict().nullable(),
  crossSystemExecutionInputPersistedCreateOnlyAndReread: z.boolean(),
}).strict()
const receiptSchema: z.ZodType<CanonicalCaptionSpecialistExecutionReceipt> =
  z.discriminatedUnion('schemaVersion', [
    receiptV1WithoutDigestSchema.extend({
      receiptDigestSha256: rawSha256,
    }).strict(),
    receiptV2WithoutDigestSchema.extend({
      receiptDigestSha256: rawSha256,
    }).strict(),
  ]).superRefine((receipt, context) => {
    if (receipt.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION
      && receipt.crossSystemExecutionInputPersistedCreateOnlyAndReread !==
        (receipt.crossSystemExecutionInputRef !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['crossSystemExecutionInputPersistedCreateOnlyAndReread'],
        message:
          'Caption cross-system persistence claim must match its exact input ref.',
      })
    }
  })

export interface CanonicalCaptionSpecialistExecutionPort {
  execute(input: {
    readonly call: OrchestraSkillCall
    readonly canonicalTranscript?: unknown
    readonly canonicalTranscriptAuthenticatedReadBinding?: unknown
    readonly incomingSupportRequest?: SkillSupportRequestV2
    readonly crossSystemCoordinationPlan?: unknown
    readonly crossSystemCoordinationContext?:
      CaptionCrossSystemCoordinationPlanContext
    readonly crossSystemOutboundHandoff?: unknown
    readonly crossSystemOutboundHandoffContext?:
      CaptionCrossSystemHandoffV2Context
  }): Promise<unknown>
}

export { createCanonicalCaptionIncomingSupportRequestReadPort } from
  './canonical-caption-incoming-support-request-service'

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
  readonly canonicalTranscriptReadPort?:
    CanonicalCaptionTranscriptAuthenticatedReadPort
  /**
   * The authenticated transcript binding is snapshot-scoped and therefore
   * cannot exist when the immutable planning work item is published. The
   * canonical postapproval owner supplies its exact ref at execution time;
   * this service binds it into the immutable call and refuses mismatches.
   */
  readonly canonicalTranscriptAuthenticatedReadBindingRef?: SkillContractRef
  /** Exact postapproval transcript resolved from a V3 planning expectation. */
  readonly canonicalTranscriptRef?: SkillContractRef
  /** Exact immutable expectation-to-authenticated-transcript resolution. */
  readonly canonicalTranscriptPlanningExpectationBindingRef?: SkillContractRef
  /**
   * Canonical private read-only gate for V3 work that is intentionally late
   * bound after shared PictureLock and Caption finish-readiness resolution.
   */
  readonly postapprovalFinishReadPort?:
    CanonicalCaptionPostapprovalFinishReadPort
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
  readonly crossSystemExecutionInputReadPort?:
    CanonicalCaptionCrossSystemExecutionInputReadPort
  /**
   * Exact read-only dependency proof derived by the canonical worker-lease
   * owner. Required for jobs whose immutable graph label is `blocked`; that
   * label records original dependency topology, not current readiness.
   */
  readonly canonicalJobDependencyAuthority?:
    CanonicalWorkerLeaseDependencyAuthority
  readonly executionPort?: CanonicalCaptionSpecialistExecutionPort
  readonly now?: () => Date
}): Promise<{
  readonly pair: CanonicalSpecialistCallResultPair
  readonly receipt: CanonicalCaptionSpecialistExecutionReceipt
  readonly crossSystemExecutionInputRef: SkillContractRef | null
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
    || workItem.workItemType !== 'custom'
    || workItem.workerClass !== CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS
    || workItem.approvedToolIds.length !== 0
    || workItem.providerExecutionMode !== 'none'
    || workItem.approvedProviderRoute !== undefined) {
    throw new Error('Canonical Caption work-item/job authority is invalid.')
  }
  assertCanonicalCaptionJobDependencyAdmission({
    authority,
    job,
    dependencyAuthority: input.canonicalJobDependencyAuthority,
  })
  if (sha256AuthorityValue(workItem.executionInput)
    !== workItem.executionInputRef.sha256
    || workItem.executionInputHash !== workItem.executionInputRef.sha256) {
    throw new Error('Canonical Caption execution input changed after approval.')
  }
  const workInput = parseCanonicalCaptionSpecialistWorkItemInput(
    workItem.executionInput)
  assertExpectedOutputAndManifest(authority, workItem)
  const postapprovalFinishRecord =
    await readCanonicalCaptionPostapprovalFinishRecord({
      authority,
      executionPackage,
      workInput,
      readPort: input.postapprovalFinishReadPort,
    })
  const initialArtifactRefs = resolveInitialArtifactRefs({
    workInput,
    postApprovalTranscriptRef: input.canonicalTranscriptRef,
    postApprovalBindingRef:
      input.canonicalTranscriptAuthenticatedReadBindingRef,
    postApprovalExpectationBindingRef:
      input.canonicalTranscriptPlanningExpectationBindingRef,
    postApprovalFinishBindingRef:
      postapprovalFinishRecord === null ? undefined : {
        id: postapprovalFinishRecord.binding.bindingId,
        version: postapprovalFinishRecord.binding.schemaVersion,
        contentHash:
          postapprovalFinishRecord.binding.bindingDigestSha256,
      },
  })

  const call = createCaptionCall({
    authority,
    workItem,
    job,
    workInput,
    initialArtifactRefs,
  })
  const crossSystemAuthority = workInput.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
    && (CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES as readonly string[])
      .includes(workInput.captionJobType)
    ? crossSystemAuthorityBindings({
        authority,
        executionPackage,
        workItem,
        job,
      })
    : undefined
  const crossSystemExecutionInput =
    await resolveCanonicalCaptionCrossSystemExecutionInput({
      call,
      readPort: input.crossSystemExecutionInputReadPort,
      ...(crossSystemAuthority === undefined ? {} : {
        authorityBindings: crossSystemAuthority,
      }),
    })
  const captionCallRef = callRef(call)
  const replay = await input.repository.rereadCallResultPair({
    callRef: captionCallRef,
  })
  if (replay) {
    if (stableAuthorityStringify(replay.call)
      !== stableAuthorityStringify(call)) {
      throw new Error('Canonical Caption call replay crossed approved authority.')
    }
  } else {
    const transcriptEvidence = await readCanonicalTranscriptEvidence({
      authority,
      workInput,
      initialArtifactRefs,
      readPort: input.canonicalTranscriptReadPort,
    })
    const incomingSupportRequest =
      await resolveCanonicalCaptionIncomingSupportRequestForCall({
      call,
      readPort: input.incomingSupportRequestReadPort,
    })
    const rawResult = await (input.executionPort ?? defaultExecutionPort)
      .execute({
        call: structuredClone(call),
        ...(transcriptEvidence === null ? {} : {
          canonicalTranscript:
            structuredClone(transcriptEvidence.canonicalTranscript),
          canonicalTranscriptAuthenticatedReadBinding: structuredClone(
            transcriptEvidence.authenticatedReadBinding),
        }),
        ...(incomingSupportRequest === null ? {} : {
          incomingSupportRequest: structuredClone(incomingSupportRequest),
        }),
        ...canonicalCaptionCrossSystemRuntimeInput(
          crossSystemExecutionInput),
      })
    const result = parseOrchestraSkillJobResult(rawResult)
    const pair = createCanonicalSpecialistCallResultPair({
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
  }
  const resumeChain = await rereadCanonicalSpecialistSupportResumeChain({
    initialCallRef: captionCallRef,
    repository: input.repository,
  })
  if (!resumeChain) {
    throw new Error('Canonical Caption call/result chain reread failed.')
  }
  const pair = resumeChain.currentPair
  const crossSystemExecutionInputRef = crossSystemExecutionInput === null
    ? null : {
        id: crossSystemExecutionInput.inputId,
        version: crossSystemExecutionInput.schemaVersion,
        contentHash: crossSystemExecutionInput.inputDigestSha256,
      }
  return {
    pair,
    receipt: createReceipt({
      authority,
      executionPackage,
      workItem,
      job,
      pair,
      crossSystemExecutionInputRef,
    }),
    crossSystemExecutionInputRef,
  }
}

const defaultExecutionPort: CanonicalCaptionSpecialistExecutionPort = {
  async execute(input) {
    return runCaptionsSpecialistJob({
      call: input.call,
      ...(input.canonicalTranscript === undefined ? {} : {
        canonicalTranscript: input.canonicalTranscript,
      }),
      ...(input.canonicalTranscriptAuthenticatedReadBinding === undefined
        ? {} : {
            canonicalTranscriptAuthenticatedReadBinding:
              input.canonicalTranscriptAuthenticatedReadBinding,
          }),
      ...(input.incomingSupportRequest === undefined ? {} : {
        incomingSupportRequest: input.incomingSupportRequest,
      }),
      ...(input.crossSystemCoordinationPlan === undefined ? {} : {
        crossSystemCoordinationPlan: input.crossSystemCoordinationPlan,
      }),
      ...(input.crossSystemCoordinationContext === undefined ? {} : {
        crossSystemCoordinationContext: input.crossSystemCoordinationContext,
      }),
      ...(input.crossSystemOutboundHandoff === undefined ? {} : {
        crossSystemOutboundHandoff: input.crossSystemOutboundHandoff,
      }),
      ...(input.crossSystemOutboundHandoffContext === undefined ? {} : {
        crossSystemOutboundHandoffContext:
          input.crossSystemOutboundHandoffContext,
      }),
    })
  },
}

const POSTAPPROVAL_FINISH_TRIGGERS = new Set([
  'approved_picture_lock',
  'approved_boundary_requirement',
  'canonical_caption_qa_repair',
  'canonical_caption_output_recomposition',
  'canonical_caption_result_inspection',
  'canonical_caption_boundary_inspection',
])

/**
 * Exact resumable dependency signal for late V3 Caption work. It carries only
 * the byte-free server-derived lookup; it is not a caller evidence channel.
 */
export class CanonicalCaptionPostapprovalFinishUnavailableError
  extends Error {
  readonly lookup: CanonicalCaptionPostapprovalFinishLookup

  constructor(lookup: CanonicalCaptionPostapprovalFinishLookup) {
    super(
      'Canonical Caption postapproval finish evidence is not available yet.',
    )
    this.name = 'CanonicalCaptionPostapprovalFinishUnavailableError'
    this.lookup = structuredClone(lookup)
  }
}

async function readCanonicalCaptionPostapprovalFinishRecord(input: {
  authority: CanonicalApprovedExecutionAuthority
  executionPackage: CanonicalApprovedEditExecutionPackage
  workInput: CanonicalCaptionSpecialistWorkItemInput
  readPort?: CanonicalCaptionPostapprovalFinishReadPort
}) {
  let required = false
  if (input.workInput.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION) {
    required = POSTAPPROVAL_FINISH_TRIGGERS.has(
      input.workInput.assignmentTrigger)
  }
  if (!required) return null
  const projection = input.authority.captionPlanningProjection
  const snapshot = input.authority.snapshot
  if (!projection || input.workInput.outputId === null
    || input.workInput.sceneId === null
    || !isCanonicalCaptionPostapprovalFinishReadPort(input.readPort)
    || input.readPort.schemaVersion !==
      CANONICAL_CAPTION_POSTAPPROVAL_FINISH_READ_PORT_VERSION
    || input.readPort.sourceAuthority !==
      'canonical_caption_postapproval_finish_repository'
    || input.readPort.callerSuppliedEvidenceAccepted) {
    throw new Error(
      'Canonical Caption late work requires its admitted postapproval finish reader.',
    )
  }
  const lookup = {
    canonicalScope: {
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: {
        id: snapshot.snapshotId,
        version: snapshot.schemaVersion,
        contentHash: snapshot.snapshotHash,
      },
      outputId: input.workInput.outputId,
      sceneId: input.workInput.sceneId,
      authorizedFrameRanges:
        structuredClone(input.workInput.authorizedFrameRanges),
    },
    executionPackageRef: {
      id: input.executionPackage.packageRecordId,
      version: input.executionPackage.schemaVersion,
      contentHash: input.executionPackage.packageHash,
    },
    captionPlanningProjectionRef: {
      id: projection.projectionId,
      version: projection.schemaVersion,
      contentHash: projection.projectionDigestSha256,
    },
  }
  const first = await input.readPort.readExact(lookup)
  const second = await input.readPort.readExact(lookup)
  if (first === null && second === null) {
    throw new CanonicalCaptionPostapprovalFinishUnavailableError(lookup)
  }
  if (!first || !second
    || stableAuthorityStringify(first) !== stableAuthorityStringify(second)) {
    throw new Error(
      'Canonical Caption postapproval finish evidence changed between exact rereads.',
    )
  }
  const record = parseCanonicalCaptionPostapprovalFinishRecord(first)
  const frameRef = input.workInput.initialArtifactRefs.find((artifact) =>
    artifact.artifactType === 'confirmed_output_frame')
  const timingRef = input.workInput.initialArtifactRefs.find((artifact) =>
    artifact.artifactType === 'master_timing_or_planning_timing')
  const pictureLock = record.pictureLock
  if (stableAuthorityStringify(record.binding.canonicalScope) !==
      stableAuthorityStringify(lookup.canonicalScope)
    || !sameRef(record.binding.executionPackageRef,
      lookup.executionPackageRef)
    || !sameRef(record.binding.captionPlanningProjectionRef,
      lookup.captionPlanningProjectionRef)
    || !sameRef(record.binding.earlyPlanningBundleRef,
      projection.earlyPlanningBundleRef)
    || !frameRef || frameRef.contentHash !==
      pictureLock.confirmedOutputFrame.confirmedOutputFrameDigestSha256
    || !timingRef || !sameRef(timingRef,
      pictureLock.timelineBindings.masterTimingRef)) {
    throw new Error(
      'Canonical Caption postapproval finish evidence crossed approved frame, timing, planning, or package authority.',
    )
  }
  return record
}

function sameRef(
  left: SkillContractRef,
  right: SkillContractRef,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function resolveInitialArtifactRefs(input: {
  workInput: CanonicalCaptionSpecialistWorkItemInput
  postApprovalTranscriptRef?: SkillContractRef
  postApprovalBindingRef?: SkillContractRef
  postApprovalExpectationBindingRef?: SkillContractRef
  postApprovalFinishBindingRef?: SkillContractRef
}): CanonicalCaptionSpecialistWorkItemInput['initialArtifactRefs'] {
  const expectation = input.workInput.initialArtifactRefs.find((artifact) =>
    artifact.artifactType === 'canonical_transcript_planning_expectation')
  const existingTranscript = input.workInput.initialArtifactRefs.find(
    (artifact) => artifact.artifactType === 'canonical_transcript')
  const existing = input.workInput.initialArtifactRefs.find((artifact) =>
    artifact.artifactType ===
      'canonical_transcript_authenticated_read_binding')
  const existingExpectationBinding = input.workInput.initialArtifactRefs.find(
    (artifact) => artifact.artifactType ===
      'canonical_transcript_planning_expectation_binding')
  const existingFinishBinding = input.workInput.initialArtifactRefs.find(
    (artifact) => artifact.artifactType ===
      'canonical_caption_postapproval_finish_binding')
  const sourceLedExpectation = input.workInput.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
  if (sourceLedExpectation && (!expectation
    || !input.postApprovalTranscriptRef
    || !input.postApprovalBindingRef
    || !input.postApprovalExpectationBindingRef)) {
    throw new Error(
      'Canonical Caption source-led work requires an exact postapproval transcript resolution.',
    )
  }
  if (!sourceLedExpectation && input.postApprovalExpectationBindingRef) {
    throw new Error(
      'Canonical Caption V1/V2 work cannot receive a planning-expectation binding.',
    )
  }
  if (existingExpectationBinding) {
    throw new Error(
      'Canonical Caption immutable work cannot pre-inject transcript expectation resolution.',
    )
  }
  if (existingFinishBinding) {
    throw new Error(
      'Canonical Caption immutable work cannot pre-inject postapproval finish evidence.',
    )
  }
  if (!sourceLedExpectation && input.postApprovalTranscriptRef
    && (!existingTranscript
      || existingTranscript.id !== input.postApprovalTranscriptRef.id
      || existingTranscript.version !== input.postApprovalTranscriptRef.version
      || existingTranscript.contentHash !==
        input.postApprovalTranscriptRef.contentHash)) {
    throw new Error(
      'Canonical Caption postapproval transcript conflicts with the approved input.',
    )
  }
  if (!input.postApprovalBindingRef) {
    return structuredClone(input.workInput.initialArtifactRefs)
  }
  const transcriptRef = input.postApprovalTranscriptRef === undefined
    ? null : refSchema.parse(input.postApprovalTranscriptRef)
  const ref = refSchema.parse(input.postApprovalBindingRef)
  const expectationBindingRef = input.postApprovalExpectationBindingRef ===
    undefined ? null : refSchema.parse(
      input.postApprovalExpectationBindingRef,
    )
  if (existing && (
    existing.id !== ref.id
    || existing.version !== ref.version
    || existing.contentHash !== ref.contentHash
  )) {
    throw new Error(
      'Canonical Caption postapproval transcript binding conflicts with the approved input.',
    )
  }
  if (existing && !sourceLedExpectation) {
    return structuredClone(input.workInput.initialArtifactRefs)
  }
  const transcriptArtifact = transcriptRef === null ? null
    : initialArtifactSchema.parse({
        ...transcriptRef,
        artifactType: 'canonical_transcript',
        producerSkillKey: 'canonical_transcript',
        privateArtifact: true,
        byteFreeRef: true,
        sourceSupportRequestRef: null,
      })
  const bindingArtifact = initialArtifactSchema.parse({
    ...ref,
    artifactType: 'canonical_transcript_authenticated_read_binding',
    producerSkillKey: 'canonical_transcript',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  })
  const expectationBindingArtifact = expectationBindingRef === null ? null
    : initialArtifactSchema.parse({
        ...expectationBindingRef,
        artifactType: 'canonical_transcript_planning_expectation_binding',
        producerSkillKey: 'canonical_transcript',
        privateArtifact: true,
        byteFreeRef: true,
        sourceSupportRequestRef: null,
      })
  const finishBindingArtifact =
    input.postApprovalFinishBindingRef === undefined ? null
      : initialArtifactSchema.parse({
          ...refSchema.parse(input.postApprovalFinishBindingRef),
          artifactType: 'canonical_caption_postapproval_finish_binding',
          producerSkillKey: 'caption_finish_readiness',
          privateArtifact: true,
          byteFreeRef: true,
          sourceSupportRequestRef: null,
        })
  const resolved = [
    ...structuredClone(input.workInput.initialArtifactRefs).filter(
      (artifact) => artifact.artifactType !==
        'canonical_transcript_planning_expectation'),
    ...(transcriptArtifact === null ? [] : [transcriptArtifact]),
    bindingArtifact,
    ...(expectationBindingArtifact === null
      ? [] : [expectationBindingArtifact]),
    ...(finishBindingArtifact === null ? [] : [finishBindingArtifact]),
  ]
  if (resolved.length > 8) {
    throw new Error(
      'Canonical Caption postapproval transcript binding exceeds the evidence limit.',
    )
  }
  return resolved
}

async function readCanonicalTranscriptEvidence(input: {
  authority: CanonicalApprovedExecutionAuthority
  workInput: CanonicalCaptionSpecialistWorkItemInput
  initialArtifactRefs:
    CanonicalCaptionSpecialistWorkItemInput['initialArtifactRefs']
  readPort?: CanonicalCaptionTranscriptAuthenticatedReadPort
}) {
  const transcriptRef = input.initialArtifactRefs.find(
    (artifact) => artifact.artifactType === 'canonical_transcript')
  const bindingRef = input.initialArtifactRefs.find(
    (artifact) => artifact.artifactType ===
      'canonical_transcript_authenticated_read_binding')
  const expectationRef = input.workInput.initialArtifactRefs.find(
    (artifact) => artifact.artifactType ===
      'canonical_transcript_planning_expectation')
  const expectationBindingRef = input.initialArtifactRefs.find(
    (artifact) => artifact.artifactType ===
      'canonical_transcript_planning_expectation_binding')
  if (!transcriptRef) {
    throw new Error('Canonical Caption transcript ref is missing.')
  }
  if (!bindingRef) return null
  if (input.readPort?.schemaVersion !==
    'canonical-caption-transcript-authenticated-read-port-v1'
    || typeof input.readPort.readExact !== 'function') {
    throw new Error(
      'Canonical Caption authenticated transcript reader is unavailable.',
    )
  }
  const snapshot = input.authority.snapshot
  const evidence = await input.readPort.readExact({
    canonicalReadScope: {
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: {
        id: snapshot.snapshotId,
        version: snapshot.schemaVersion,
        contentHash: snapshot.snapshotHash,
      },
    },
    canonicalTranscriptRef: {
      id: transcriptRef.id,
      version: transcriptRef.version,
      contentHash: transcriptRef.contentHash,
    },
    authenticatedReadBindingRef: {
      id: bindingRef.id,
      version: bindingRef.version,
      contentHash: bindingRef.contentHash,
    },
  })
  if (!evidence) {
    throw new Error('Canonical Caption authenticated transcript is unavailable.')
  }
  const transcript = parseCaptionCanonicalTranscript(
    evidence.canonicalTranscript)
  const binding = parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
    evidence.authenticatedReadBinding)
  if (transcript.transcriptId !== transcriptRef.id
    || transcript.schemaVersion !== transcriptRef.version
    || transcript.transcriptDigestSha256 !== transcriptRef.contentHash
    || binding.bindingId !== bindingRef.id
    || binding.schemaVersion !== bindingRef.version
    || binding.bindingDigestSha256 !== bindingRef.contentHash
    || input.workInput.outputId === null) {
    throw new Error('Canonical Caption authenticated transcript refs mismatch.')
  }
  if (input.workInput.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION) {
    if (!expectationRef || !expectationBindingRef
      || typeof input.readPort.readPlanningExpectationExact !== 'function') {
      throw new Error(
        'Canonical Caption transcript expectation reread is unavailable.',
      )
    }
    const expectationLookup = {
      canonicalReadScope: {
        ownerUserId: snapshot.approvedByUserId,
        workspaceId: snapshot.workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
        approvedSnapshotRef: {
          id: snapshot.snapshotId,
          version: snapshot.schemaVersion,
          contentHash: snapshot.snapshotHash,
        },
      },
      planningExpectationRef: {
        id: expectationRef.id,
        version: expectationRef.version,
        contentHash: expectationRef.contentHash,
      },
    }
    const firstExpectationBinding =
      await input.readPort.readPlanningExpectationExact(expectationLookup)
    const secondExpectationBinding =
      await input.readPort.readPlanningExpectationExact(expectationLookup)
    if (!firstExpectationBinding || !secondExpectationBinding
      || stableAuthorityStringify(firstExpectationBinding) !==
        stableAuthorityStringify(secondExpectationBinding)) {
      throw new Error(
        'Canonical Caption transcript expectation changed between rereads.',
      )
    }
    const expectationBinding =
      parseCanonicalCaptionTranscriptPlanningExpectationBinding(
        firstExpectationBinding,
      )
    if (stableAuthorityStringify(expectationBinding.canonicalReadScope) !==
        stableAuthorityStringify(expectationLookup.canonicalReadScope)
      || stableAuthorityStringify(expectationBinding.planningExpectationRef)
        !== stableAuthorityStringify(expectationLookup.planningExpectationRef)
      || expectationBinding.bindingId !== expectationBindingRef.id
      || expectationBinding.schemaVersion !== expectationBindingRef.version
      || expectationBinding.bindingDigestSha256 !==
        expectationBindingRef.contentHash
      || expectationBinding.canonicalTranscriptRef.id !== transcriptRef.id
      || expectationBinding.canonicalTranscriptRef.version !==
        transcriptRef.version
      || expectationBinding.canonicalTranscriptRef.contentHash !==
        transcriptRef.contentHash
      || expectationBinding.authenticatedReadBindingRef.id !== bindingRef.id
      || expectationBinding.authenticatedReadBindingRef.version !==
        bindingRef.version
      || expectationBinding.authenticatedReadBindingRef.contentHash !==
        bindingRef.contentHash) {
      throw new Error(
        'Canonical Caption transcript expectation mapping crossed approved authority.',
      )
    }
  }
  admitCaptionCanonicalTranscriptFromAuthenticatedRead({
    binding,
    canonicalTranscript: transcript,
    expectedCanonicalScope: {
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: {
        id: snapshot.snapshotId,
        version: snapshot.schemaVersion,
        contentHash: snapshot.snapshotHash,
      },
      outputId: input.workInput.outputId,
      sceneId: input.workInput.sceneId,
      authorizedFrameRanges:
        structuredClone(input.workInput.authorizedFrameRanges),
    },
  })
  return {
    canonicalTranscript: transcript,
    authenticatedReadBinding: binding,
  }
}

function createCaptionCall(input: {
  authority: CanonicalApprovedExecutionAuthority
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  workInput: CanonicalCaptionSpecialistWorkItemInput
  initialArtifactRefs:
    CanonicalCaptionSpecialistWorkItemInput['initialArtifactRefs']
}): OrchestraSkillCall {
  const sourceLedInput = input.workInput.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
  const assignmentInput = sourceLedInput
    || input.workInput.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION
  const integrationManifest = sourceLedInput
    ? CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V3
    : assignmentInput
      ? CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2
      : CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST
  const integrationQualification = sourceLedInput
    ? CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V3
    : assignmentInput
      ? CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V2
      : CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
  const manifestRef: SkillContractRef = {
    id: integrationManifest.manifestId,
    version: integrationManifest.manifestSchemaVersion,
    contentHash: integrationManifest.manifestHash,
  }
  const qualificationRef: SkillContractRef = {
    id: integrationQualification.snapshotId,
    version: integrationQualification.schemaVersion,
    contentHash: integrationQualification.snapshotDigestSha256,
  }
  const identity = sha256AuthorityValue({
    snapshotHash: input.authority.snapshot.snapshotHash,
    approvedWorkItemId: input.workItem.id,
    canonicalJobId: input.job.id,
    executionInputHash: input.workItem.executionInputHash,
    captionJobType: input.workInput.captionJobType,
    initialArtifactRefs: input.initialArtifactRefs,
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
      structuredClone(input.initialArtifactRefs),
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

function assertCanonicalCaptionJobDependencyAdmission(input: {
  authority: CanonicalApprovedExecutionAuthority
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  dependencyAuthority?: CanonicalWorkerLeaseDependencyAuthority
}): void {
  const workItem = input.authority.workItems.find((candidate) =>
    candidate.id === input.job.approvedWorkItemId)
  const jobIdsByWorkItemKey = new Map(input.authority.jobs.map((candidate) =>
    [candidate.workItemKey, candidate.id]))
  const expectedDependencyJobIds = workItem?.dependencyKeys.map((key) =>
    jobIdsByWorkItemKey.get(key))
  if (
    !workItem ||
    expectedDependencyJobIds?.some((jobId) => !jobId) ||
    stableAuthorityStringify(expectedDependencyJobIds) !==
      stableAuthorityStringify(input.job.dependencyJobIds)
  ) {
    throw new Error(
      'Canonical Caption dependency job lineage is incomplete.',
    )
  }
  const rootJob = input.job.dependencyJobIds.length === 0
  if (rootJob) {
    if (input.job.status !== 'ready') {
      throw new Error('Canonical Caption work-item/job authority is invalid.')
    }
    if (input.dependencyAuthority === undefined) return
  } else if (
    input.job.status !== 'blocked' ||
    input.dependencyAuthority === undefined
  ) {
    throw new Error(
      'Canonical Caption dependent job lacks verified dependency authority.',
    )
  }

  const parsed = canonicalWorkerLeaseDependencyAuthoritySchema.parse(
    input.dependencyAuthority,
  )
  const { authorityHash, ...withoutHash } = parsed
  if (authorityHash !== sha256AuthorityValue(withoutHash)) {
    throw new Error(
      'Canonical Caption dependency authority digest is invalid.',
    )
  }
  if (rootJob) {
    if (
      parsed.state !== 'not_required_for_root_job' ||
      parsed.selectedArtifacts.length !== 0
    ) {
      throw new Error(
        'Canonical Caption root job dependency authority is invalid.',
      )
    }
    return
  }

  if (parsed.state !== 'private_test_dependencies_verified') {
    throw new Error(
      'Canonical Caption dependent job lacks verified dependency authority.',
    )
  }
  const dependencyJobIds = new Set(input.job.dependencyJobIds)
  const expectedSelectionKeys: string[] = []
  for (const dependencyJobId of input.job.dependencyJobIds) {
    const dependencyJob = input.authority.jobs.find((candidate) =>
      candidate.id === dependencyJobId)
    const dependencyWorkItem = input.authority.workItems.find((candidate) =>
      candidate.id === dependencyJob?.approvedWorkItemId)
    if (!dependencyJob || !dependencyWorkItem) {
      throw new Error(
        'Canonical Caption dependency job lineage is incomplete.',
      )
    }
    if (!dependencyWorkItem.required) continue
    for (const expectedAssetId of dependencyJob.expectedAssetIds) {
      const manifestEntry = input.authority.assetManifest.entries.find(
        (candidate) => candidate.id === expectedAssetId &&
          candidate.approvedWorkItemId === dependencyWorkItem.id,
      )
      if (!manifestEntry) {
        throw new Error(
          'Canonical Caption dependency asset lineage is incomplete.',
        )
      }
      if (manifestEntry.required) {
        expectedSelectionKeys.push(`${dependencyJobId}\u0000${expectedAssetId}`)
      }
    }
  }
  const actualSelectionKeys = parsed.selectedArtifacts.map((selection) => {
    if (!dependencyJobIds.has(selection.dependencyJobId)) {
      throw new Error(
        'Canonical Caption dependency authority crossed its approved graph.',
      )
    }
    return `${selection.dependencyJobId}\u0000${selection.expectedAssetId}`
  })
  if (
    stableAuthorityStringify([...actualSelectionKeys].sort()) !==
    stableAuthorityStringify([...expectedSelectionKeys].sort())
  ) {
    throw new Error(
      'Canonical Caption dependency authority does not cover exact required assets.',
    )
  }
}

function createReceipt(input: {
  authority: CanonicalApprovedExecutionAuthority
  executionPackage: CanonicalApprovedEditExecutionPackage
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  pair: CanonicalSpecialistCallResultPair
  crossSystemExecutionInputRef: SkillContractRef | null
}): CanonicalCaptionSpecialistExecutionReceipt {
  const manifestEntry = input.authority.assetManifest.entries.find((entry) =>
    entry.approvedWorkItemId === input.workItem.id)!
  const result = parseOrchestraSkillJobResult(input.pair.result)
  const commonPayload = receiptCommonWithoutDigestSchema.parse({
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
  const useV2 = input.crossSystemExecutionInputRef !== null
    || result.producedArtifactRefs.length !== 1
  const payload = useV2
    ? receiptV2WithoutDigestSchema.parse({
        ...commonPayload,
        schemaVersion:
          CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION,
        producedArtifactCount: result.producedArtifactRefs.length,
        producedArtifactRefsDigestSha256:
          canonicalCaptionProducedArtifactRefsDigest(
            result.producedArtifactRefs),
        exactProducedArtifactRefsBound: true,
        crossSystemExecutionInputRef:
          structuredClone(input.crossSystemExecutionInputRef),
        crossSystemExecutionInputPersistedCreateOnlyAndReread:
          input.crossSystemExecutionInputRef !== null,
      })
    : receiptV1WithoutDigestSchema.parse({
        ...commonPayload,
        schemaVersion: CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION,
      })
  return parseCanonicalCaptionSpecialistExecutionReceipt({
    ...payload,
    receiptDigestSha256: digest(payload, 'receiptDigestSha256'),
  })
}

function crossSystemAuthorityBindings(input: {
  authority: CanonicalApprovedExecutionAuthority
  executionPackage: CanonicalApprovedEditExecutionPackage
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
}) {
  const manifestEntries = input.authority.assetManifest.entries.filter(
    (entry) => entry.approvedWorkItemId === input.workItem.id,
  )
  if (manifestEntries.length !== 1) {
    throw new Error(
      'Canonical Caption cross-system work lacks one planned manifest entry.',
    )
  }
  return {
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
      manifestEntries[0]!.id,
      'private-edit-asset-manifest-entry-v1',
      manifestEntries[0],
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
  }
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
