import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_READ_PORT_VERSION,
  CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_REPOSITORY_VERSION,
  CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION,
  CANONICAL_CAPTION_CROSS_SYSTEM_SOURCE_READ_PORT_VERSION,
  type CanonicalCaptionCrossSystemExecutionAuthorityBindings,
  type CanonicalCaptionCrossSystemExecutionInput,
  type CanonicalCaptionCrossSystemExecutionInputReadPort,
  type CanonicalCaptionCrossSystemExecutionInputRepository,
  type CanonicalCaptionCrossSystemSourceInput,
  type CanonicalCaptionCrossSystemSourceReadPort,
} from '../../src/types/canonical-caption-cross-system-execution-input'
import type {
  CaptionCrossSystemCoordinationPlanContext,
  CaptionCrossSystemHandoffV2Context,
} from '../../src/types/caption-cross-system-coordination'
import {
  CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE,
  CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES,
  type CaptionsCrossSystemOutputJobType,
} from '../../src/types/captions-specialist'
import type {
  OrchestraSkillCall,
  SkillCanonicalScope,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionCrossSystemCoordinationPlan,
  parseCaptionCrossSystemHandoffV2,
  parseCaptionCrossSystemOutboundPayloadV2,
} from '../captions-specialist/caption-cross-system-coordination'
import {
  CAPTIONS_CROSS_SYSTEM_RECEIVERS_BY_JOB,
} from '../captions-specialist/captions-specialist-runtime'
import { parseCaptionLivingFrameRequestV2 } from
  '../captions-specialist/caption-living-frame-boundary'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4 } from
  '../captions-specialist/captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V4 } from
  '../captions-specialist/captions-specialist-integration-qualification'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import { stableAuthorityStringify } from './private-edit-authority-store'

const DEFAULT_PREFIX =
  'private/orchestra/v1/caption-cross-system-execution-input'
const MAXIMUM_RECORD_BYTES = 32 * 1024 * 1024
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const refSchema: z.ZodType<SkillContractRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: 'custom', message: 'Frame range is empty.' })
  }
})
const scopeSchema: z.ZodType<SkillCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
}).strict().superRefine((scope, context) => {
  let priorEnd = -1
  for (const range of scope.authorizedFrameRanges) {
    if (range.startFrame < priorEnd) {
      context.addIssue({
        code: 'custom',
        message: 'Frame ranges must be ordered and non-overlapping.',
      })
      return
    }
    priorEnd = range.endFrameExclusive
  }
})
const authorityBindingsSchema:
z.ZodType<CanonicalCaptionCrossSystemExecutionAuthorityBindings> = z.object({
  executionPackageRef: refSchema,
  approvedSnapshotRef: refSchema,
  approvedWorkItemRef: refSchema,
  canonicalJobRef: refSchema,
  plannedManifestEntryRef: refSchema,
  estimateRef: refSchema,
  reservationRef: refSchema,
}).strict()
const sourceInputEnvelopeSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('aggregate_coordination_plan'),
    coordinationPlan: z.unknown(),
    coordinationContext: z.unknown(),
  }).strict(),
  z.object({
    mode: z.literal('single_outbound_handoff'),
    outboundHandoff: z.unknown(),
    outboundHandoffContext: z.unknown(),
  }).strict(),
])
const inputWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION),
  inputId: safeKey,
  originCaptionCallRef: refSchema,
  captionJobType: z.enum(CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES),
  canonicalScope: scopeSchema,
  authorityBindings: authorityBindingsSchema,
  sourceInput: sourceInputEnvelopeSchema,
  exactApprovedSnapshotWorkJobManifestEstimateAndReservationBound:
    z.literal(true),
  exactCaptionCallScopeAndCanonicalInputsBound: z.literal(true),
  sourceArtifactsPersistedCreateOnlyAndReread: z.literal(true),
  receiverExecutionClaimed: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  mediaRuntimePerformed: z.literal(false),
  assetMutationPerformed: z.literal(false),
  costOrBillingMutationPerformed: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const inputSchema = inputWithoutDigestSchema.extend({
  inputDigestSha256: rawSha256,
}).strict()
const admittedRepositories = new WeakSet<object>()
const admittedSourceReadPorts = new WeakSet<object>()
const admittedExecutionInputReadPorts = new WeakSet<object>()

export interface CanonicalCaptionCrossSystemExecutionInputPrivateComposition {
  readonly repository: CanonicalCaptionCrossSystemExecutionInputRepository
  readonly readPort: CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly sourceReadPort: CanonicalCaptionCrossSystemSourceReadPort
  readonly receiverDispatchMounted: false
  readonly runtimeAuthorityGranted: false
  readonly assetMutationAuthorityGranted: false
  readonly finalQaApprovalGranted: false
  readonly billingAuthorityGranted: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

export function createCanonicalCaptionCrossSystemExecutionInputPrivateComposition(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly sourceReadPort: CanonicalCaptionCrossSystemSourceReadPort
    readonly prefix?: string
  },
): CanonicalCaptionCrossSystemExecutionInputPrivateComposition {
  const repository =
    createCanonicalCaptionCrossSystemExecutionInputRepository({
      objectPort: input.objectPort,
      prefix: input.prefix,
    })
  const readPort = createCanonicalCaptionCrossSystemExecutionInputReadPort({
    repository,
    sourceReadPort: input.sourceReadPort,
  })
  return Object.freeze({
    repository,
    readPort,
    sourceReadPort: input.sourceReadPort,
    receiverDispatchMounted: false,
    runtimeAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
}

export function createCanonicalCaptionCrossSystemSourceReadPort(
  readExact: CanonicalCaptionCrossSystemSourceReadPort['readExact'],
): CanonicalCaptionCrossSystemSourceReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption cross-system source reader is required.')
  }
  const port: CanonicalCaptionCrossSystemSourceReadPort = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_CROSS_SYSTEM_SOURCE_READ_PORT_VERSION,
    sourceAuthority: 'canonical_caption_domain_artifact_owner',
    callerSuppliedSourceInputAccepted: false,
    readExact: readExact.bind(undefined),
  })
  admittedSourceReadPorts.add(port)
  return port
}

export function createCanonicalCaptionCrossSystemExecutionInputRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionCrossSystemExecutionInputRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalCaptionCrossSystemExecutionInputRepository =
  Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_REPOSITORY_VERSION,
    async persistCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption cross-system execution-input write')
      const write = z.object({ executionInput: z.unknown() })
        .strict().parse(untrusted)
      const executionInput =
        parseCanonicalCaptionCrossSystemExecutionInput(write.executionInput)
      const body = Buffer.from(stableAuthorityStringify(executionInput), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error(
          'Canonical Caption cross-system execution input exceeds its private bound.',
        )
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, executionInput.originCaptionCallRef),
        body,
        contentSha256: sha256(body),
      })
      const reread = await readRecord(
        input.objectPort,
        recordPath(prefix, executionInput.originCaptionCallRef),
      )
      if (!reread || !sameCanonical(reread, executionInput)) {
        throw new Error(
          'Canonical Caption cross-system execution-input persistence conflict.',
        )
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadExact(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption cross-system execution-input read')
      const read = z.object({ originCaptionCallRef: refSchema })
        .strict().parse(untrusted)
      const value = await readRecord(
        input.objectPort,
        recordPath(prefix, read.originCaptionCallRef),
      )
      if (!value) return null
      if (!sameRef(value.originCaptionCallRef, read.originCaptionCallRef)) {
        throw new Error(
          'Canonical Caption cross-system execution input crossed its call.',
        )
      }
      return value
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function createCanonicalCaptionCrossSystemExecutionInputReadPort(input: {
  readonly repository: CanonicalCaptionCrossSystemExecutionInputRepository
  readonly sourceReadPort: CanonicalCaptionCrossSystemSourceReadPort
}): CanonicalCaptionCrossSystemExecutionInputReadPort {
  assertRepository(input.repository)
  assertSourceReadPort(input.sourceReadPort)
  const port: CanonicalCaptionCrossSystemExecutionInputReadPort = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_persisted_caption_cross_system_execution_input',
    callerSuppliedExecutionInputAccepted: false,
    async readExact(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption cross-system execution-input projection read')
      const envelope = z.object({
        call: z.unknown(),
        authorityBindings: authorityBindingsSchema.nullable(),
      }).strict().parse(untrusted)
      const call = parseOrchestraSkillCall(envelope.call)
      if (!isCurrentCrossSystemCall(call)) return null
      const originRef = originCallRef(call)
      let executionInput = await input.repository.rereadExact({
        originCaptionCallRef: originRef,
      })
      if (!executionInput && envelope.authorityBindings !== null) {
        if (call.resumeOriginCallRef !== null) {
          throw new Error(
            'A resumed Caption call cannot create missing cross-system source input.',
          )
        }
        const sourceRead = {
          call: structuredClone(call),
          authorityBindings: structuredClone(envelope.authorityBindings),
        }
        const first = await input.sourceReadPort.readExact(sourceRead)
        const second = await input.sourceReadPort.readExact(sourceRead)
        if (!first || !second || !sameCanonical(first, second)) {
          throw new Error(
            'Canonical Caption cross-system source artifacts changed between rereads.',
          )
        }
        executionInput = createExecutionInput({
          call,
          authorityBindings: envelope.authorityBindings,
          sourceInput: first,
        })
        await input.repository.persistCreateOnly({ executionInput })
        executionInput = await input.repository.rereadExact({
          originCaptionCallRef: originRef,
        })
      }
      if (!executionInput) return null
      assertExecutionInputMatchesCall({
        executionInput,
        call,
        expectedAuthorityBindings: envelope.authorityBindings,
      })
      return executionInput
    },
  })
  admittedExecutionInputReadPorts.add(port)
  return port
}

export function parseCanonicalCaptionCrossSystemExecutionInput(
  value: unknown,
): CanonicalCaptionCrossSystemExecutionInput {
  assertClosedContractTree(value,
    'Canonical Caption cross-system execution input')
  rejectUnsafeText(value,
    'Canonical Caption cross-system execution input')
  const envelope = inputSchema.parse(value)
  const sourceInput = parseSourceInput(
    envelope.captionJobType,
    envelope.sourceInput,
  )
  const parsed: CanonicalCaptionCrossSystemExecutionInput = {
    ...envelope,
    sourceInput,
  }
  if (parsed.inputDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'inputDigestSha256',
  ) || parsed.canonicalScope.approvedSnapshotRef === null
    || !sameRef(parsed.canonicalScope.approvedSnapshotRef,
      parsed.authorityBindings.approvedSnapshotRef)) {
    throw new Error(
      'Canonical Caption cross-system execution-input digest or snapshot binding failed.',
    )
  }
  return structuredClone(parsed)
}

export async function resolveCanonicalCaptionCrossSystemExecutionInput(input: {
  readonly call: OrchestraSkillCall
  readonly readPort?: CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly authorityBindings?:
    CanonicalCaptionCrossSystemExecutionAuthorityBindings
}): Promise<CanonicalCaptionCrossSystemExecutionInput | null> {
  const call = parseOrchestraSkillCall(input.call)
  if (!isCurrentCrossSystemCall(call)) return null
  if (!input.readPort
    || !admittedExecutionInputReadPorts.has(input.readPort)
    || input.readPort.schemaVersion !==
      CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_READ_PORT_VERSION
    || input.readPort.sourceAuthority !==
      'canonical_backend_persisted_caption_cross_system_execution_input'
    || input.readPort.callerSuppliedExecutionInputAccepted) {
    throw new Error(
      'Canonical Caption cross-system execution-input reader is unavailable.',
    )
  }
  const read = {
    call: structuredClone(call),
    authorityBindings: input.authorityBindings === undefined
      ? null : structuredClone(input.authorityBindings),
  }
  const first = await input.readPort.readExact(read)
  const second = await input.readPort.readExact(read)
  if (!first || !second || !sameCanonical(first, second)) {
    throw new Error(
      'Canonical Caption cross-system execution input changed between rereads.',
    )
  }
  const parsed = parseCanonicalCaptionCrossSystemExecutionInput(first)
  assertExecutionInputMatchesCall({
    executionInput: parsed,
    call,
    expectedAuthorityBindings: input.authorityBindings ?? null,
  })
  return parsed
}

export function canonicalCaptionCrossSystemRuntimeInput(
  executionInput: CanonicalCaptionCrossSystemExecutionInput | null,
): {
  readonly livingFrameRequest?: unknown
  readonly crossSystemCoordinationPlan?: unknown
  readonly crossSystemCoordinationContext?:
    CaptionCrossSystemCoordinationPlanContext
  readonly crossSystemOutboundHandoff?: unknown
  readonly crossSystemOutboundHandoffContext?:
    CaptionCrossSystemHandoffV2Context
} {
  if (executionInput === null) return {}
  if (executionInput.sourceInput.mode === 'aggregate_coordination_plan') {
    const context = executionInput.sourceInput.coordinationContext
    const livingFrameBundles = context.outboundBundles.filter((bundle) => {
        const payload = parseCaptionCrossSystemOutboundPayloadV2(
          bundle.outboundPayload, context,
        )
        return payload.receiver === 'living_frame'
      })
    if (livingFrameBundles.length > 1) {
      throw new Error(
        'Canonical Caption coordination input contains duplicate Living Frame requests.',
      )
    }
    const livingFrameSupportRequest = livingFrameBundles[0]?.supportRequest
    const livingFrameRequest = livingFrameSupportRequest === undefined
      ? undefined
      : parseCaptionLivingFrameRequestV2(
          livingFrameSupportRequest.typedPayload)
    return {
      ...(livingFrameRequest === undefined ? {} : {
        livingFrameRequest: structuredClone(livingFrameRequest),
      }),
      crossSystemCoordinationPlan:
        structuredClone(executionInput.sourceInput.coordinationPlan),
      crossSystemCoordinationContext:
        structuredClone(executionInput.sourceInput.coordinationContext),
    }
  }
  const context = executionInput.sourceInput.outboundHandoffContext
  const payload = parseCaptionCrossSystemOutboundPayloadV2(
    context.outboundPayload, context)
  const livingFrameRequest = payload.receiver !== 'living_frame'
    || context.supportRequest === undefined
    ? undefined
    : parseCaptionLivingFrameRequestV2(context.supportRequest.typedPayload)
  return {
    ...(livingFrameRequest === undefined ? {} : {
      livingFrameRequest: structuredClone(livingFrameRequest),
    }),
    crossSystemOutboundHandoff:
      structuredClone(executionInput.sourceInput.outboundHandoff),
    crossSystemOutboundHandoffContext:
      structuredClone(executionInput.sourceInput.outboundHandoffContext),
  }
}

function createExecutionInput(input: {
  call: OrchestraSkillCall
  authorityBindings: CanonicalCaptionCrossSystemExecutionAuthorityBindings
  sourceInput: CanonicalCaptionCrossSystemSourceInput
}): CanonicalCaptionCrossSystemExecutionInput {
  const call = parseOrchestraSkillCall(input.call)
  if (!isCurrentCrossSystemCall(call)
    || call.resumeOriginCallRef !== null) {
    throw new Error(
      'Canonical Caption cross-system input requires one original cross-system call.',
    )
  }
  const captionJobType = call.job.jobType as CaptionsCrossSystemOutputJobType
  const sourceInput = parseSourceInput(captionJobType, input.sourceInput)
  const identity = calculateSkillContractDigest({
    callRef: originCallRef(call),
    authorityBindings: input.authorityBindings,
    sourceInput,
    digest: '',
  }, 'digest')
  const withoutDigest: Omit<
    CanonicalCaptionCrossSystemExecutionInput,
    'inputDigestSha256'
  > = {
    schemaVersion: CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION,
    inputId: `caption.cross-system.execution.${identity.slice(0, 40)}`,
    originCaptionCallRef: originCallRef(call),
    captionJobType,
    canonicalScope: structuredClone(call.canonicalScope),
    authorityBindings: structuredClone(input.authorityBindings),
    sourceInput,
    exactApprovedSnapshotWorkJobManifestEstimateAndReservationBound: true,
    exactCaptionCallScopeAndCanonicalInputsBound: true,
    sourceArtifactsPersistedCreateOnlyAndReread: true,
    receiverExecutionClaimed: false,
    directPeerDispatchPerformed: false,
    timelineMutationPerformed: false,
    providerCallPerformed: false,
    mediaRuntimePerformed: false,
    assetMutationPerformed: false,
    costOrBillingMutationPerformed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const parsed = parseCanonicalCaptionCrossSystemExecutionInput({
    ...withoutDigest,
    inputDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, inputDigestSha256: '' },
      'inputDigestSha256',
    ),
  })
  assertExecutionInputMatchesCall({
    executionInput: parsed,
    call,
    expectedAuthorityBindings: input.authorityBindings,
  })
  return parsed
}

function parseSourceInput(
  captionJobType: CaptionsCrossSystemOutputJobType,
  value: unknown,
): CanonicalCaptionCrossSystemSourceInput {
  assertClosedContractTree(value,
    'Canonical Caption cross-system source input')
  rejectUnsafeText(value, 'Canonical Caption cross-system source input')
  const envelope = sourceInputEnvelopeSchema.parse(value)
  if (envelope.mode === 'aggregate_coordination_plan') {
    if (captionJobType !== CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE) {
      throw new Error(
        'Only the aggregate Caption handoff job can consume a coordination plan.',
      )
    }
    const context = structuredClone(
      envelope.coordinationContext) as CaptionCrossSystemCoordinationPlanContext
    const coordinationPlan = parseCaptionCrossSystemCoordinationPlan(
      envelope.coordinationPlan,
      context,
    )
    return { mode: envelope.mode, coordinationPlan, coordinationContext: context }
  }
  if (captionJobType === CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE) {
    throw new Error(
      'The aggregate Caption handoff job cannot consume one outbound handoff.',
    )
  }
  const context = structuredClone(
    envelope.outboundHandoffContext) as CaptionCrossSystemHandoffV2Context
  const outboundPayload = parseCaptionCrossSystemOutboundPayloadV2(
    context.outboundPayload,
    context,
  )
  const outboundHandoff = parseCaptionCrossSystemHandoffV2(
    envelope.outboundHandoff,
    { ...context, outboundPayload },
  )
  const allowed = CAPTIONS_CROSS_SYSTEM_RECEIVERS_BY_JOB[captionJobType]
  if (!allowed.includes(outboundPayload.receiver)) {
    throw new Error(
      'Canonical Caption cross-system source receiver is not admitted for the job.',
    )
  }
  return {
    mode: envelope.mode,
    outboundHandoff,
    outboundHandoffContext: { ...context, outboundPayload },
  }
}

function assertExecutionInputMatchesCall(input: {
  executionInput: CanonicalCaptionCrossSystemExecutionInput
  call: OrchestraSkillCall
  expectedAuthorityBindings:
    CanonicalCaptionCrossSystemExecutionAuthorityBindings | null
}): void {
  const call = parseOrchestraSkillCall(input.call)
  const originRef = originCallRef(call)
  const value = input.executionInput
  if (!isCurrentCrossSystemCall(call)
    || !sameRef(value.originCaptionCallRef, originRef)
    || value.captionJobType !== call.job.jobType
    || !sameCanonical(value.canonicalScope, call.canonicalScope)
    || (input.expectedAuthorityBindings !== null
      && !sameCanonical(value.authorityBindings,
        input.expectedAuthorityBindings))
    || call.canonicalScope.approvedSnapshotRef === null
    || !sameRef(value.authorityBindings.approvedSnapshotRef,
      call.canonicalScope.approvedSnapshotRef)) {
    throw new Error(
      'Canonical Caption cross-system execution input crossed its call or authority.',
    )
  }
  const sourceInput = value.sourceInput
  const payloads = sourceInput.mode === 'aggregate_coordination_plan'
    ? sourceInput.coordinationContext.outboundBundles.map((bundle) =>
        parseCaptionCrossSystemOutboundPayloadV2(
          bundle.outboundPayload,
          sourceInput.coordinationContext,
        ))
    : [parseCaptionCrossSystemOutboundPayloadV2(
        sourceInput.outboundHandoffContext.outboundPayload,
        sourceInput.outboundHandoffContext,
      )]
  if (payloads.some((payload) =>
    !sameRef(payload.originCaptionCallRef, originRef)
      || !domainScopeMatchesCall(payload.canonicalScope, call.canonicalScope)
      || !exactInputArtifact(call, 'canonical_transcript',
        payload.canonicalTranscriptRef)
      || !exactInputArtifact(call, 'confirmed_output_frame',
        payload.confirmedOutputFrameRef)
      || !exactInputArtifact(call, 'master_timing_or_planning_timing',
        payload.masterTimingRef))) {
    throw new Error(
      'Canonical Caption cross-system source lineage crossed canonical inputs.',
    )
  }
}

function exactInputArtifact(
  call: OrchestraSkillCall,
  artifactType: string,
  expected: SkillContractRef,
): boolean {
  const matches = call.inputArtifactRefs.filter((artifact) =>
    artifact.artifactType === artifactType)
  return matches.length === 1 && sameRef(matches[0]!, expected)
}

function domainScopeMatchesCall(
  domainScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotRef: SkillContractRef | null
    outputId: string
    sceneId: string | null
    authorizedFrameRanges: Array<{
      startFrame: number
      endFrameExclusive: number
    }>
  },
  callScope: SkillCanonicalScope,
): boolean {
  return domainScope.ownerUserId === callScope.ownerUserId
    && domainScope.workspaceId === callScope.workspaceId
    && domainScope.projectId === callScope.projectId
    && domainScope.editSessionId === callScope.editSessionId
    && domainScope.outputId === callScope.outputId
    && domainScope.sceneId === callScope.sceneId
    && sameCanonical(domainScope.authorizedFrameRanges,
      callScope.authorizedFrameRanges)
    && domainScope.approvedSnapshotRef !== null
    && callScope.approvedSnapshotRef !== null
    && sameRef(domainScope.approvedSnapshotRef,
      callScope.approvedSnapshotRef)
}

function originCallRef(call: OrchestraSkillCall): SkillContractRef {
  return structuredClone(call.resumeOriginCallRef ?? {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  })
}

function isCrossSystemJob(
  jobType: string,
): jobType is CaptionsCrossSystemOutputJobType {
  return (CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES as readonly string[])
    .includes(jobType)
}

function isCurrentCrossSystemCall(call: OrchestraSkillCall): boolean {
  return isCrossSystemJob(call.job.jobType)
    && call.manifestRef.id ===
      CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4.manifestId
    && call.manifestRef.version ===
      CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4.manifestSchemaVersion
    && call.manifestRef.contentHash ===
      CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4.manifestHash
    && call.qualificationSnapshotRef.id ===
      CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V4.snapshotId
    && call.qualificationSnapshotRef.version ===
      CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V4.schemaVersion
    && call.qualificationSnapshotRef.contentHash ===
      CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V4
        .snapshotDigestSha256
}

function recordPath(prefix: string, callRef: SkillContractRef): string {
  return `${prefix}/${callRef.contentHash.slice(0, 2)}/${callRef.contentHash}.json`
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<CanonicalCaptionCrossSystemExecutionInput | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption cross-system execution-input object is oversized.',
    )
  }
  return parseCanonicalCaptionCrossSystemExecutionInput(
    JSON.parse(body.toString('utf8')),
  )
}

function sameRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertRepository(
  repository: CanonicalCaptionCrossSystemExecutionInputRepository,
): void {
  if (!repository
    || !admittedRepositories.has(repository)
    || repository.schemaVersion !==
      CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_REPOSITORY_VERSION
    || typeof repository.persistCreateOnly !== 'function'
    || typeof repository.rereadExact !== 'function') {
    throw new Error(
      'Canonical Caption cross-system execution-input repository is unavailable.',
    )
  }
}

function assertSourceReadPort(
  port: CanonicalCaptionCrossSystemSourceReadPort,
): void {
  if (!port
    || !admittedSourceReadPorts.has(port)
    || port.schemaVersion !==
      CANONICAL_CAPTION_CROSS_SYSTEM_SOURCE_READ_PORT_VERSION
    || port.sourceAuthority !== 'canonical_caption_domain_artifact_owner'
    || port.callerSuppliedSourceInputAccepted
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption cross-system source reader is unavailable.',
    )
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption cross-system private object port is unavailable.',
    )
  }
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
