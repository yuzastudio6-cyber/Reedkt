import { z } from 'zod'

import {
  CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION,
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
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportJobType,
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
import { parseSkillSupportRequestV2 } from
  '../orchestra/orchestra-skill-support-request-v2'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST } from
  '../captions-specialist/captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2 } from
  '../captions-specialist/captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V2,
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
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

const safeKey = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const admittedIncomingSupportReadPorts = new WeakSet<object>()
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
  execute(input: {
    readonly call: OrchestraSkillCall
    readonly canonicalTranscript?: unknown
    readonly canonicalTranscriptAuthenticatedReadBinding?: unknown
    readonly incomingSupportRequest?: SkillSupportRequestV2
  }): Promise<unknown>
}

export function createCanonicalCaptionIncomingSupportRequestReadPort(
  readExact: CanonicalCaptionIncomingSupportRequestReadPort['readExact'],
): CanonicalCaptionIncomingSupportRequestReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption incoming-support reader is required.')
  }
  const port: CanonicalCaptionIncomingSupportRequestReadPort = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_persisted_specialist_support_request',
    callerSuppliedRequestAccepted: false,
    readExact,
  })
  admittedIncomingSupportReadPorts.add(port)
  return port
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
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
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
  const initialArtifactRefs = resolveInitialArtifactRefs({
    workInput,
    postApprovalTranscriptRef: input.canonicalTranscriptRef,
    postApprovalBindingRef:
      input.canonicalTranscriptAuthenticatedReadBindingRef,
    postApprovalExpectationBindingRef:
      input.canonicalTranscriptPlanningExpectationBindingRef,
  })

  const call = createCaptionCall({
    authority,
    workItem,
    job,
    workInput,
    initialArtifactRefs,
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
    const incomingSupportRequest = await readIncomingSupportRequest({
      call,
      workInput,
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
    })
  },
}

function resolveInitialArtifactRefs(input: {
  workInput: CanonicalCaptionSpecialistWorkItemInput
  postApprovalTranscriptRef?: SkillContractRef
  postApprovalBindingRef?: SkillContractRef
  postApprovalExpectationBindingRef?: SkillContractRef
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
  const resolved = [
    ...structuredClone(input.workInput.initialArtifactRefs).filter(
      (artifact) => artifact.artifactType !==
        'canonical_transcript_planning_expectation'),
    ...(transcriptArtifact === null ? [] : [transcriptArtifact]),
    bindingArtifact,
    ...(expectationBindingArtifact === null
      ? [] : [expectationBindingArtifact]),
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

async function readIncomingSupportRequest(input: {
  call: OrchestraSkillCall
  workInput: CanonicalCaptionSpecialistWorkItemInput
  readPort?: CanonicalCaptionIncomingSupportRequestReadPort
}): Promise<SkillSupportRequestV2 | null> {
  if ((input.workInput.schemaVersion !==
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION
    && input.workInput.schemaVersion !==
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION)
    || input.workInput.sourceSupportRequestRef === null) return null
  if (!input.readPort
    || !admittedIncomingSupportReadPorts.has(input.readPort)
    || input.readPort.schemaVersion !==
      CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION
    || input.readPort.sourceAuthority !==
      'canonical_backend_persisted_specialist_support_request'
    || input.readPort.callerSuppliedRequestAccepted) {
    throw new Error(
      'Canonical Caption incoming-support request reader is unavailable.',
    )
  }
  const requestRef = structuredClone(input.workInput.sourceSupportRequestRef)
  const firstValue = await input.readPort.readExact({ requestRef })
  const secondValue = await input.readPort.readExact({ requestRef })
  if (!firstValue || !secondValue
    || stableAuthorityStringify(firstValue)
      !== stableAuthorityStringify(secondValue)) {
    throw new Error(
      'Canonical Caption incoming-support request changed between rereads.',
    )
  }
  const request = parseSkillSupportRequestV2(firstValue.request)
  const originalCall = parseOrchestraSkillCall(firstValue.originalCall)
  const exactRequestRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  const expectedArtifactType = CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[
    input.workInput.captionJobType as CaptionsSupportJobType]
  if (stableAuthorityStringify(exactRequestRef)
      !== stableAuthorityStringify(requestRef)
    || request.targetSkillKey !== 'captions'
    || request.requestingSkillKey === 'captions'
    || originalCall.assigneeSkillKey !== request.requestingSkillKey
    || stableAuthorityStringify(request.originalCallRef)
      !== stableAuthorityStringify({
        id: originalCall.callId,
        version: originalCall.schemaVersion,
        contentHash: originalCall.callDigestSha256,
      })
    || stableAuthorityStringify(originalCall.canonicalScope)
      !== stableAuthorityStringify(input.call.canonicalScope)
    || request.requestedJobType !== input.workInput.captionJobType
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0] !== expectedArtifactType
    || stableAuthorityStringify(request.canonicalScope)
      !== stableAuthorityStringify(input.call.canonicalScope)
    || stableAuthorityStringify(request.originalCallRef)
      === stableAuthorityStringify({
        id: input.call.callId,
        version: input.call.schemaVersion,
        contentHash: input.call.callDigestSha256,
      })) {
    throw new Error(
      'Canonical Caption incoming-support request crossed its assignment.',
    )
  }
  return structuredClone(request)
}

function createCaptionCall(input: {
  authority: CanonicalApprovedExecutionAuthority
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  workInput: CanonicalCaptionSpecialistWorkItemInput
  initialArtifactRefs:
    CanonicalCaptionSpecialistWorkItemInput['initialArtifactRefs']
}): OrchestraSkillCall {
  const assignmentInput = input.workInput.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION
    || input.workInput.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
  const integrationManifest = assignmentInput
    ? CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2
    : CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST
  const integrationQualification = assignmentInput
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
