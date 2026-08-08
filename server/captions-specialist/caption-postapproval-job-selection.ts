import { createHash } from 'node:crypto'

import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_READ_PORT_VERSION,
  CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_RECORD_VERSION,
  CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_REPOSITORY_VERSION,
  type CanonicalCaptionPostapprovalJobSelectionReadPort,
  type CanonicalCaptionPostapprovalJobSelectionRecord,
  type CanonicalCaptionPostapprovalJobSelectionRepository,
  type CanonicalCaptionPostapprovalSourceScope,
  type CanonicalCaptionPostapprovalTargetPlanningScope,
} from '../../src/types/canonical-caption-postapproval-job-selection'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const rangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) =>
  range.endFrameExclusive > range.startFrame)
const rangesSchema = z.array(rangeSchema).min(1).max(256)
const sourceScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
  outputId: safeKey,
  sceneId: safeKey,
  authorizedFrameRanges: rangesSchema,
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
}).strict()
const targetScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planningRequestId: safeKey,
  outputId: safeKey,
  sceneId: safeKey,
  authorizedFrameRanges: rangesSchema,
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
}).strict()
const selectedJobSchema = z.object({
  selectionId: safeKey,
  jobType: z.enum([
    'repair_caption_scene',
    'recompose_caption_output',
    'inspect_caption_specific_result',
  ]),
  trigger: z.enum([
    'canonical_caption_qa_repair',
    'canonical_caption_output_recomposition',
    'canonical_caption_result_inspection',
  ]),
  sourceEvidenceRef: refSchema,
  dependsOnSelectionId: safeKey.nullable(),
  reasonCodes: z.array(safeKey).min(1).max(16),
  smallestAffectedSceneScopeOnly: z.literal(true),
  priorArtifactPreserved: z.literal(true),
  freshApprovedExecutionPackageRequired: z.literal(true),
  callerMayCreateWork: z.literal(false),
  captionMayDispatchPeerDirectly: z.literal(false),
  captionMayExpandScope: z.literal(false),
  browserMayMarkComplete: z.literal(false),
}).strict()
const recordSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  evidenceMode: z.enum([
    'source_contract_fixture',
    'authenticated_private_caption_qa',
  ]),
  targetLifecycleKind: z.enum([
    'new_approved_internal_correction_package',
    'canonical_same_edit_session_revision',
  ]),
  sourceScope: sourceScopeSchema,
  sourceExecutionPackageRef: refSchema,
  sourceCaptionPlanningProjectionRef: refSchema,
  completeQaReportRef: refSchema,
  localRepairFallbackPlanRef: refSchema,
  accessibilityRecompositionPlanRef: refSchema,
  directInspectionReceiptRef: refSchema,
  postrenderVisualQaWorkBindingRef: refSchema,
  targetPlanningScope: targetScopeSchema,
  selections: z.tuple([
    selectedJobSchema,
    selectedJobSchema,
    selectedJobSchema,
  ]),
  priorApprovedRunLineageExactReread: z.literal(true),
  sourceContractFixtureValidated: z.boolean(),
  authenticatedCaptionQaEvidenceExactReread: z.boolean(),
  actualRepairNeedObserved: z.boolean(),
  privateQualificationEvidence: z.boolean(),
  priorApprovedSnapshotRemainsImmutable: z.literal(true),
  targetPlanEstimateAndFreshApprovalRequired: z.literal(true),
  targetApprovedSnapshotPredictedOrInjected: z.literal(false),
  sourceResultReplacedOrOverwritten: z.literal(false),
  byteFree: z.literal(true),
  rawChatIncluded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  callerSuppliedEvidenceAccepted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  timelineMutationAuthorityGrantedToCaption: z.literal(false),
  workCreationAuthorityGrantedToCaption: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const prefixSchema = z.string().trim().min(1).max(900)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//')
    && !value.endsWith('/'))

const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/postapproval-job-selection'
const MAX_RECORD_BYTES = 512 * 1024
const admittedReadPorts = new WeakSet<object>()

const jobs = [
  'repair_caption_scene',
  'recompose_caption_output',
  'inspect_caption_specific_result',
] as const
const triggers = [
  'canonical_caption_qa_repair',
  'canonical_caption_output_recomposition',
  'canonical_caption_result_inspection',
] as const

export function isCanonicalCaptionPostapprovalJobSelectionReadPort(
  value: unknown,
): value is CanonicalCaptionPostapprovalJobSelectionReadPort {
  return typeof value === 'object' && value !== null
    && admittedReadPorts.has(value)
}

export function parseCanonicalCaptionPostapprovalJobSelectionRecord(
  value: unknown,
): CanonicalCaptionPostapprovalJobSelectionRecord {
  assertClosedContractTree(
    value,
    'Canonical Caption postapproval job-selection record',
  )
  const parsed = recordSchema.parse(value) as
    CanonicalCaptionPostapprovalJobSelectionRecord
  const expectedRecordId = recordId({
    sourceScope: parsed.sourceScope,
    targetPlanningScope: parsed.targetPlanningScope,
  })
  const refs = [
    parsed.sourceExecutionPackageRef,
    parsed.sourceCaptionPlanningProjectionRef,
    parsed.completeQaReportRef,
    parsed.localRepairFallbackPlanRef,
    parsed.accessibilityRecompositionPlanRef,
    parsed.directInspectionReceiptRef,
    parsed.postrenderVisualQaWorkBindingRef,
  ]
  const refKeys = refs.map(refKey)
  const sourceEvidenceRefs = [
    parsed.localRepairFallbackPlanRef,
    parsed.accessibilityRecompositionPlanRef,
    parsed.directInspectionReceiptRef,
  ]
  const fixtureMode = parsed.evidenceMode === 'source_contract_fixture'
  if (parsed.recordId !== expectedRecordId
    || parsed.recordDigestSha256 !== calculateSkillContractDigest(
      parsed as unknown as Record<string, unknown>,
      'recordDigestSha256',
    )
    || !canonicalRanges(parsed.sourceScope.authorizedFrameRanges)
    || !canonicalRanges(parsed.targetPlanningScope.authorizedFrameRanges)
    || !sameVersionedContent(parsed.sourceScope.confirmedOutputFrameRef,
      parsed.targetPlanningScope.confirmedOutputFrameRef)
    || parsed.sourceScope.masterTimingRef.version !==
      parsed.targetPlanningScope.masterTimingRef.version
    || parsed.sourceScope.ownerUserId !==
      parsed.targetPlanningScope.ownerUserId
    || parsed.sourceScope.workspaceId !==
      parsed.targetPlanningScope.workspaceId
    || parsed.sourceScope.projectId !==
      parsed.targetPlanningScope.projectId
    || parsed.sourceScope.outputId !== parsed.targetPlanningScope.outputId
    || stableAuthorityStringify(parsed.sourceScope.authorizedFrameRanges) !==
      stableAuthorityStringify(
        parsed.targetPlanningScope.authorizedFrameRanges)
    || new Set(refKeys).size !== refKeys.length
    || !selectionChainIsExact(parsed, sourceEvidenceRefs)
    || (fixtureMode && (
      parsed.targetLifecycleKind !==
        'new_approved_internal_correction_package'
      || parsed.sourceScope.editSessionId ===
        parsed.targetPlanningScope.editSessionId
      || !parsed.sourceContractFixtureValidated
      || parsed.authenticatedCaptionQaEvidenceExactReread
      || parsed.actualRepairNeedObserved
      || parsed.privateQualificationEvidence
    ))
    || (!fixtureMode && (
      parsed.targetLifecycleKind !==
        'canonical_same_edit_session_revision'
      || parsed.sourceScope.editSessionId !==
        parsed.targetPlanningScope.editSessionId
      || parsed.sourceScope.sceneId !== parsed.targetPlanningScope.sceneId
      || !sameVersionedContent(parsed.sourceScope.masterTimingRef,
        parsed.targetPlanningScope.masterTimingRef)
      || parsed.sourceContractFixtureValidated
      || !parsed.authenticatedCaptionQaEvidenceExactReread
      || !parsed.actualRepairNeedObserved
      || !parsed.privateQualificationEvidence
    ))) {
    throw new Error(
      'Canonical Caption postapproval job-selection record is inconsistent.',
    )
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionPostapprovalJobSelectionRecord(input: {
  readonly evidenceMode:
    | 'source_contract_fixture'
    | 'authenticated_private_caption_qa'
  readonly sourceScope: CanonicalCaptionPostapprovalSourceScope
  readonly sourceExecutionPackageRef: CaptionDomainRef
  readonly sourceCaptionPlanningProjectionRef: CaptionDomainRef
  readonly completeQaReportRef: CaptionDomainRef
  readonly localRepairFallbackPlanRef: CaptionDomainRef
  readonly accessibilityRecompositionPlanRef: CaptionDomainRef
  readonly directInspectionReceiptRef: CaptionDomainRef
  readonly postrenderVisualQaWorkBindingRef: CaptionDomainRef
  readonly targetPlanningScope:
    CanonicalCaptionPostapprovalTargetPlanningScope
}): CanonicalCaptionPostapprovalJobSelectionRecord {
  assertClosedContractTree(
    input,
    'Canonical Caption postapproval job-selection input',
  )
  const sourceScope = sourceScopeSchema.parse(input.sourceScope) as
    CanonicalCaptionPostapprovalSourceScope
  const targetPlanningScope = targetScopeSchema.parse(
    input.targetPlanningScope,
  ) as CanonicalCaptionPostapprovalTargetPlanningScope
  const selectedRefs = [
    refSchema.parse(input.localRepairFallbackPlanRef),
    refSchema.parse(input.accessibilityRecompositionPlanRef),
    refSchema.parse(input.directInspectionReceiptRef),
  ] as const
  const id = recordId({ sourceScope, targetPlanningScope })
  const selections = jobs.map((jobType, index) => ({
    selectionId: `${id}.selection.${index + 1}`,
    jobType,
    trigger: triggers[index],
    sourceEvidenceRef: structuredClone(selectedRefs[index]!),
    dependsOnSelectionId: index === 0
      ? null : `${id}.selection.${index}`,
    reasonCodes: [
      'selected_from_exact_postapproval_caption_evidence',
      index === 0
        ? 'smallest_scope_repair_required'
        : index === 1
          ? 'recompose_only_after_selected_repair'
          : 'inspect_only_after_selected_recomposition',
    ],
    smallestAffectedSceneScopeOnly: true as const,
    priorArtifactPreserved: true as const,
    freshApprovedExecutionPackageRequired: true as const,
    callerMayCreateWork: false as const,
    captionMayDispatchPeerDirectly: false as const,
    captionMayExpandScope: false as const,
    browserMayMarkComplete: false as const,
  })) as CanonicalCaptionPostapprovalJobSelectionRecord['selections']
  const fixtureMode = input.evidenceMode === 'source_contract_fixture'
  const withoutDigest: Omit<
    CanonicalCaptionPostapprovalJobSelectionRecord,
    'recordDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_RECORD_VERSION,
    recordId: id,
    evidenceMode: input.evidenceMode,
    targetLifecycleKind: fixtureMode
      ? 'new_approved_internal_correction_package'
      : 'canonical_same_edit_session_revision',
    sourceScope: structuredClone(sourceScope),
    sourceExecutionPackageRef:
      structuredClone(input.sourceExecutionPackageRef),
    sourceCaptionPlanningProjectionRef:
      structuredClone(input.sourceCaptionPlanningProjectionRef),
    completeQaReportRef: structuredClone(input.completeQaReportRef),
    localRepairFallbackPlanRef:
      structuredClone(input.localRepairFallbackPlanRef),
    accessibilityRecompositionPlanRef:
      structuredClone(input.accessibilityRecompositionPlanRef),
    directInspectionReceiptRef:
      structuredClone(input.directInspectionReceiptRef),
    postrenderVisualQaWorkBindingRef:
      structuredClone(input.postrenderVisualQaWorkBindingRef),
    targetPlanningScope: structuredClone(targetPlanningScope),
    selections,
    priorApprovedRunLineageExactReread: true,
    sourceContractFixtureValidated: fixtureMode,
    authenticatedCaptionQaEvidenceExactReread: !fixtureMode,
    actualRepairNeedObserved: !fixtureMode,
    privateQualificationEvidence: !fixtureMode,
    priorApprovedSnapshotRemainsImmutable: true,
    targetPlanEstimateAndFreshApprovalRequired: true,
    targetApprovedSnapshotPredictedOrInjected: false,
    sourceResultReplacedOrOverwritten: false,
    byteFree: true,
    rawChatIncluded: false,
    transcriptTextIncluded: false,
    mediaBytesIncluded: false,
    pathsUrlsOrCredentialsIncluded: false,
    callerSuppliedEvidenceAccepted: false,
    directPeerDispatchGranted: false,
    timelineMutationAuthorityGrantedToCaption: false,
    workCreationAuthorityGrantedToCaption: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }
  return parseCanonicalCaptionPostapprovalJobSelectionRecord({
    ...withoutDigest,
    recordDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, recordDigestSha256: '' },
      'recordDigestSha256',
    ),
  })
}

export function createCanonicalCaptionPostapprovalJobSelectionRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionPostapprovalJobSelectionRepository {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error(
      'Canonical Caption postapproval job-selection object port is unavailable.',
    )
  }
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const readPort: CanonicalCaptionPostapprovalJobSelectionReadPort =
    Object.freeze({
      schemaVersion:
        CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_READ_PORT_VERSION,
      sourceAuthority:
        'canonical_caption_postapproval_job_selection_repository' as const,
      callerSuppliedEvidenceAccepted: false as const,
      async readExact(inputValue: { readonly recordRef: CaptionDomainRef }) {
        assertClosedContractTree(
          inputValue,
          'Canonical Caption postapproval job-selection lookup',
        )
        const recordRef = refSchema.parse(inputValue.recordRef)
        const body = await input.objectPort.readExact(
          objectPath(prefix, recordRef),
        )
        if (!body) return null
        if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
          throw new Error(
            'Canonical Caption postapproval job-selection bytes are invalid.',
          )
        }
        let value: unknown
        try {
          value = JSON.parse(body.toString('utf8'))
        } catch {
          throw new Error(
            'Canonical Caption postapproval job-selection JSON is invalid.',
          )
        }
        const record = parseCanonicalCaptionPostapprovalJobSelectionRecord(
          value,
        )
        if (!sameRef(recordRef, recordRefFor(record))) {
          throw new Error(
            'Canonical Caption postapproval job-selection lookup crossed its record.',
          )
        }
        return record
      },
    })
  admittedReadPorts.add(readPort)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_REPOSITORY_VERSION,
    readPort,
    async persistCreateOnly({ record: value }: {
      readonly record: CanonicalCaptionPostapprovalJobSelectionRecord
    }) {
      const record = parseCanonicalCaptionPostapprovalJobSelectionRecord(
        value,
      )
      const recordRef = recordRefFor(record)
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
        throw new Error(
          'Canonical Caption postapproval job-selection record is too large.',
        )
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: objectPath(prefix, recordRef),
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await readPort.readExact({ recordRef })
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(record)) {
        throw new Error(
          'Canonical Caption postapproval job-selection create-only reread failed.',
        )
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
  })
}

export async function rereadCanonicalCaptionPostapprovalJobSelection(input: {
  readonly readPort: CanonicalCaptionPostapprovalJobSelectionReadPort
  readonly recordRef: CaptionDomainRef
  readonly expectedTargetPlanningScope:
    CanonicalCaptionPostapprovalTargetPlanningScope
}): Promise<CanonicalCaptionPostapprovalJobSelectionRecord | null> {
  if (!isCanonicalCaptionPostapprovalJobSelectionReadPort(input.readPort)
    || input.readPort.schemaVersion !==
      CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_READ_PORT_VERSION
    || input.readPort.sourceAuthority !==
      'canonical_caption_postapproval_job_selection_repository'
    || input.readPort.callerSuppliedEvidenceAccepted) {
    throw new Error(
      'Canonical Caption postapproval job-selection read port is not admitted.',
    )
  }
  const recordRef = refSchema.parse(input.recordRef) as CaptionDomainRef
  const expectedTarget = targetScopeSchema.parse(
    input.expectedTargetPlanningScope,
  ) as CanonicalCaptionPostapprovalTargetPlanningScope
  const first = await input.readPort.readExact({ recordRef })
  const second = await input.readPort.readExact({ recordRef })
  if (first === null && second === null) return null
  if (!first || !second || stableAuthorityStringify(first) !==
    stableAuthorityStringify(second)) {
    throw new Error(
      'Canonical Caption postapproval job-selection changed between rereads.',
    )
  }
  const record = parseCanonicalCaptionPostapprovalJobSelectionRecord(first)
  if (!sameRef(recordRef, recordRefFor(record))
    || stableAuthorityStringify(record.targetPlanningScope) !==
      stableAuthorityStringify(expectedTarget)) {
    throw new Error(
      'Canonical Caption postapproval job-selection crossed target planning authority.',
    )
  }
  return record
}

export function canonicalCaptionPostapprovalJobSelectionRecordRef(
  record: CanonicalCaptionPostapprovalJobSelectionRecord,
): CaptionDomainRef {
  return recordRefFor(parseCanonicalCaptionPostapprovalJobSelectionRecord(
    record,
  ))
}

function selectionChainIsExact(
  record: CanonicalCaptionPostapprovalJobSelectionRecord,
  sourceEvidenceRefs: readonly CaptionDomainRef[],
): boolean {
  return record.selections.every((selection, index) => {
    const expectedId = `${record.recordId}.selection.${index + 1}`
    const expectedDependency = index === 0
      ? null : `${record.recordId}.selection.${index}`
    return selection.selectionId === expectedId
      && selection.jobType === jobs[index]
      && selection.trigger === triggers[index]
      && sameRef(selection.sourceEvidenceRef, sourceEvidenceRefs[index]!)
      && selection.dependsOnSelectionId === expectedDependency
      && new Set(selection.reasonCodes).size ===
        selection.reasonCodes.length
  })
}

function recordId(input: {
  sourceScope: CanonicalCaptionPostapprovalSourceScope
  targetPlanningScope: CanonicalCaptionPostapprovalTargetPlanningScope
}): string {
  return `caption.postapproval-selection.${rawDigest(Buffer.from(
    stableAuthorityStringify(input),
    'utf8',
  )).slice(0, 40)}`
}

function recordRefFor(
  record: CanonicalCaptionPostapprovalJobSelectionRecord,
): CaptionDomainRef {
  return {
    id: record.recordId,
    version: record.schemaVersion,
    contentHash: record.recordDigestSha256,
  }
}

function objectPath(prefix: string, ref: CaptionDomainRef): string {
  return `${prefix}/${rawDigest(Buffer.from(
    stableAuthorityStringify(refSchema.parse(ref)),
    'utf8',
  ))}.json`
}

function canonicalRanges(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
): boolean {
  let lastEnd = -1
  for (const range of ranges) {
    if (range.startFrame < lastEnd
      || range.endFrameExclusive <= range.startFrame) return false
    lastEnd = range.endFrameExclusive
  }
  return true
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameVersionedContent(
  left: CaptionDomainRef,
  right: CaptionDomainRef,
): boolean {
  return left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
