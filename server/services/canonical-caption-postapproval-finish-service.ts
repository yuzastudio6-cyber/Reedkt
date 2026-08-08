import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_POSTAPPROVAL_FINISH_BINDING_VERSION,
  CANONICAL_CAPTION_POSTAPPROVAL_FINISH_READ_PORT_VERSION,
  CANONICAL_CAPTION_POSTAPPROVAL_FINISH_RECORD_VERSION,
  CANONICAL_CAPTION_POSTAPPROVAL_FINISH_REPOSITORY_VERSION,
  type CanonicalCaptionPostapprovalFinishBinding,
  type CanonicalCaptionPostapprovalFinishLookup,
  type CanonicalCaptionPostapprovalFinishReadPort,
  type CanonicalCaptionPostapprovalFinishRecord,
  type CanonicalCaptionPostapprovalFinishRepository,
} from '../../src/types/canonical-caption-postapproval-finish-binding'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionDependencyManifest,
  parseCaptionFinishReadiness,
} from '../captions-specialist/caption-finish-readiness'
import { parseCanonicalPictureLockManifest } from
  '../edit-architecture/canonical-picture-lock-manifest'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

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
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
  outputId: safeKey,
  sceneId: safeKey,
  authorizedFrameRanges: z.array(rangeSchema).min(1).max(256),
}).strict()
const lookupSchema = z.object({
  canonicalScope: scopeSchema,
  executionPackageRef: refSchema,
  captionPlanningProjectionRef: refSchema,
}).strict()
const bindingSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTAPPROVAL_FINISH_BINDING_VERSION),
  bindingId: safeKey,
  bindingDigestSha256: sha256,
  canonicalScope: scopeSchema,
  executionPackageRef: refSchema,
  captionPlanningProjectionRef: refSchema,
  earlyPlanningBundleRef: refSchema,
  pictureLockRef: refSchema,
  dependencyManifestRef: refSchema,
  finishReadinessRef: refSchema,
  sceneDisposition: z.enum(['ready', 'ready_with_fallback']),
  selectedFallbackIds: z.array(safeKey).max(64),
  originalTreatmentReady: z.boolean(),
  pictureLockImmutableAndSharedOwnerVerified: z.literal(true),
  exactApprovedSnapshotOutputAndSceneVerified: z.literal(true),
  exactExecutionPackageAndPlanningProjectionVerified: z.literal(true),
  exactDependencyManifestAndFinishReadinessReread: z.literal(true),
  unrelatedBlockedScenesDoNotBlockThisScene: z.literal(true),
  byteFree: z.literal(true),
  callerSuppliedEvidenceAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  timelineMutationAuthorityGrantedToCaption: z.literal(false),
  pictureLockAuthorityGrantedToCaption: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalRenderAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const recordSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTAPPROVAL_FINISH_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  binding: bindingSchema,
  pictureLock: z.unknown(),
  dependencyManifest: z.unknown(),
  finishReadiness: z.unknown(),
  persistedAsPrivateArtifact: z.literal(true),
  createOnly: z.literal(true),
  exactRereadRequired: z.literal(true),
  rawChatIncluded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  publicDeliveryAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()
const prefixSchema = z.string().trim().min(1).max(900)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//')
    && !value.endsWith('/'))

const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/postapproval-finish'
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const admittedReadPorts = new WeakSet<object>()

export function isCanonicalCaptionPostapprovalFinishReadPort(
  value: unknown,
): value is CanonicalCaptionPostapprovalFinishReadPort {
  return typeof value === 'object' && value !== null
    && admittedReadPorts.has(value)
}

export function parseCanonicalCaptionPostapprovalFinishLookup(
  value: unknown,
): CanonicalCaptionPostapprovalFinishLookup {
  assertClosedContractTree(value,
    'Canonical Caption postapproval finish lookup')
  return structuredClone(lookupSchema.parse(value)) as
    CanonicalCaptionPostapprovalFinishLookup
}

export function parseCanonicalCaptionPostapprovalFinishBinding(
  value: unknown,
): CanonicalCaptionPostapprovalFinishBinding {
  assertClosedContractTree(value,
    'Canonical Caption postapproval finish binding')
  const parsed = bindingSchema.parse(value) as
    CanonicalCaptionPostapprovalFinishBinding
  const expectedId = bindingId({
    canonicalScope: parsed.canonicalScope,
    executionPackageRef: parsed.executionPackageRef,
    captionPlanningProjectionRef: parsed.captionPlanningProjectionRef,
  })
  if (parsed.bindingId !== expectedId
    || parsed.bindingDigestSha256 !== calculateSkillContractDigest(
      parsed as unknown as Record<string, unknown>,
      'bindingDigestSha256')
    || parsed.originalTreatmentReady !==
      (parsed.sceneDisposition === 'ready')
    || new Set(parsed.selectedFallbackIds).size !==
      parsed.selectedFallbackIds.length
    || [...parsed.selectedFallbackIds].sort().join('|') !==
      parsed.selectedFallbackIds.join('|')
    || !rangesAreCanonical(parsed.canonicalScope.authorizedFrameRanges)) {
    throw new Error(
      'Canonical Caption postapproval finish binding is inconsistent.')
  }
  return structuredClone(parsed)
}

export function parseCanonicalCaptionPostapprovalFinishRecord(
  value: unknown,
): CanonicalCaptionPostapprovalFinishRecord {
  assertClosedContractTree(value,
    'Canonical Caption postapproval finish record')
  const raw = recordSchema.parse(value)
  const binding = parseCanonicalCaptionPostapprovalFinishBinding(raw.binding)
  const pictureLock = parseCanonicalPictureLockManifest(raw.pictureLock)
  const dependencyManifest = parseCaptionDependencyManifest(
    raw.dependencyManifest, pictureLock)
  const finishReadiness = parseCaptionFinishReadiness(raw.finishReadiness)
  const sceneReadiness = finishReadiness.sceneReadiness.find((scene) =>
    scene.sceneId === binding.canonicalScope.sceneId)
  const expectedFallbackIds = [...(sceneReadiness?.selectedFallbackIds ?? [])]
    .sort()
  if (!sceneReadiness || sceneReadiness.disposition === 'blocked'
    || raw.recordId !== `${binding.bindingId}.record`
    || raw.recordDigestSha256 !== calculateSkillContractDigest(
      raw as unknown as Record<string, unknown>, 'recordDigestSha256')
    || !exactRef(binding.pictureLockRef, pictureLockRef(pictureLock))
    || !exactRef(binding.dependencyManifestRef,
      dependencyManifestRef(dependencyManifest))
    || !exactRef(binding.finishReadinessRef,
      finishReadinessRef(finishReadiness))
    || !exactRef(dependencyManifest.pictureLockRef,
      binding.pictureLockRef)
    || !exactRef(finishReadiness.pictureLockRef,
      binding.pictureLockRef)
    || !exactRef(finishReadiness.dependencyManifestRef,
      binding.dependencyManifestRef)
    || !exactRef(binding.earlyPlanningBundleRef,
      dependencyManifest.earlyPlanningBundleRef)
    || !exactScope(binding.canonicalScope, pictureLock)
    || !exactScope(binding.canonicalScope, dependencyManifest)
    || !exactScope(binding.canonicalScope, finishReadiness)
    || !rangesContainedBy(
      binding.canonicalScope.authorizedFrameRanges,
      dependencyManifest.canonicalScope.authorizedFrameRanges)
    || binding.sceneDisposition !== sceneReadiness.disposition
    || binding.originalTreatmentReady !==
      sceneReadiness.originalTreatmentReady
    || binding.selectedFallbackIds.join('|') !==
      expectedFallbackIds.join('|')) {
    throw new Error(
      'Canonical Caption postapproval finish record crossed authority.')
  }
  return structuredClone({
    ...raw,
    binding,
    pictureLock,
    dependencyManifest,
    finishReadiness,
  }) as CanonicalCaptionPostapprovalFinishRecord
}

export function createCanonicalCaptionPostapprovalFinishRecord(input: {
  lookup: CanonicalCaptionPostapprovalFinishLookup
  pictureLock: unknown
  dependencyManifest: unknown
  finishReadiness: unknown
}): CanonicalCaptionPostapprovalFinishRecord {
  assertClosedContractTree(input,
    'Canonical Caption postapproval finish record input')
  const lookup = lookupSchema.parse(input.lookup) as
    CanonicalCaptionPostapprovalFinishLookup
  const pictureLock = parseCanonicalPictureLockManifest(input.pictureLock)
  const dependencyManifest = parseCaptionDependencyManifest(
    input.dependencyManifest, pictureLock)
  const finishReadiness = parseCaptionFinishReadiness(input.finishReadiness)
  const sceneReadiness = finishReadiness.sceneReadiness.find((scene) =>
    scene.sceneId === lookup.canonicalScope.sceneId)
  if (!sceneReadiness || sceneReadiness.disposition === 'blocked'
    || !exactScope(lookup.canonicalScope, pictureLock)
    || !exactScope(lookup.canonicalScope, dependencyManifest)
    || !exactScope(lookup.canonicalScope, finishReadiness)
    || !rangesContainedBy(
      lookup.canonicalScope.authorizedFrameRanges,
      dependencyManifest.canonicalScope.authorizedFrameRanges)) {
    throw new Error(
      'Canonical Caption scene is not admitted for late resolution.')
  }
  const withoutBindingDigest: Omit<
    CanonicalCaptionPostapprovalFinishBinding,
    'bindingDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_POSTAPPROVAL_FINISH_BINDING_VERSION,
    bindingId: bindingId(lookup),
    canonicalScope: structuredClone(lookup.canonicalScope),
    executionPackageRef: structuredClone(lookup.executionPackageRef),
    captionPlanningProjectionRef:
      structuredClone(lookup.captionPlanningProjectionRef),
    earlyPlanningBundleRef:
      structuredClone(dependencyManifest.earlyPlanningBundleRef),
    pictureLockRef: pictureLockRef(pictureLock),
    dependencyManifestRef: dependencyManifestRef(dependencyManifest),
    finishReadinessRef: finishReadinessRef(finishReadiness),
    sceneDisposition: sceneReadiness.disposition,
    selectedFallbackIds: [...sceneReadiness.selectedFallbackIds].sort(),
    originalTreatmentReady: sceneReadiness.originalTreatmentReady,
    pictureLockImmutableAndSharedOwnerVerified: true,
    exactApprovedSnapshotOutputAndSceneVerified: true,
    exactExecutionPackageAndPlanningProjectionVerified: true,
    exactDependencyManifestAndFinishReadinessReread: true,
    unrelatedBlockedScenesDoNotBlockThisScene: true,
    byteFree: true,
    callerSuppliedEvidenceAccepted: false,
    browserLocalCompletionAccepted: false,
    directPeerDispatchGranted: false,
    timelineMutationAuthorityGrantedToCaption: false,
    pictureLockAuthorityGrantedToCaption: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalRenderAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }
  const binding = parseCanonicalCaptionPostapprovalFinishBinding({
    ...withoutBindingDigest,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...withoutBindingDigest, bindingDigestSha256: '' },
      'bindingDigestSha256'),
  })
  const withoutRecordDigest: Omit<
    CanonicalCaptionPostapprovalFinishRecord,
    'recordDigestSha256'
  > = {
    schemaVersion: CANONICAL_CAPTION_POSTAPPROVAL_FINISH_RECORD_VERSION,
    recordId: `${binding.bindingId}.record`,
    binding,
    pictureLock,
    dependencyManifest,
    finishReadiness,
    persistedAsPrivateArtifact: true,
    createOnly: true,
    exactRereadRequired: true,
    rawChatIncluded: false,
    transcriptTextIncluded: false,
    mediaBytesIncluded: false,
    pathsUrlsOrCredentialsIncluded: false,
    publicDeliveryAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  }
  return parseCanonicalCaptionPostapprovalFinishRecord({
    ...withoutRecordDigest,
    recordDigestSha256: calculateSkillContractDigest(
      { ...withoutRecordDigest, recordDigestSha256: '' },
      'recordDigestSha256'),
  })
}

export function createCanonicalCaptionPostapprovalFinishRepository(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  prefix?: string
}): CanonicalCaptionPostapprovalFinishRepository {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error(
      'Canonical Caption postapproval finish object port is unavailable.')
  }
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const readPort: CanonicalCaptionPostapprovalFinishReadPort = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_POSTAPPROVAL_FINISH_READ_PORT_VERSION,
    sourceAuthority: 'canonical_caption_postapproval_finish_repository',
    callerSuppliedEvidenceAccepted: false,
    async readExact(
      lookupValue: CanonicalCaptionPostapprovalFinishLookup,
    ) {
      const lookup = parseCanonicalCaptionPostapprovalFinishLookup(
        lookupValue,
      )
      const body = await input.objectPort.readExact(objectPath(prefix, lookup))
      if (!body) return null
      if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
        throw new Error(
          'Canonical Caption postapproval finish bytes are invalid.')
      }
      let value: unknown
      try {
        value = JSON.parse(body.toString('utf8'))
      } catch {
        throw new Error(
          'Canonical Caption postapproval finish JSON is invalid.')
      }
      const record = parseCanonicalCaptionPostapprovalFinishRecord(value)
      assertLookup(record.binding, lookup)
      return record
    },
  })
  admittedReadPorts.add(readPort)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_POSTAPPROVAL_FINISH_REPOSITORY_VERSION,
    readPort,
    async persistCreateOnly({ record: value }: {
      record: CanonicalCaptionPostapprovalFinishRecord
    }) {
      const record = parseCanonicalCaptionPostapprovalFinishRecord(value)
      const lookup = lookupFromBinding(record.binding)
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
        throw new Error(
          'Canonical Caption postapproval finish record is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: objectPath(prefix, lookup),
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await readPort.readExact(lookup)
      if (!reread || reread.recordDigestSha256 !==
        record.recordDigestSha256
        || stableAuthorityStringify(reread) !==
          stableAuthorityStringify(record)) {
        throw new Error(
          'Canonical Caption postapproval finish create-only reread failed.')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
  })
}

function lookupFromBinding(
  binding: CanonicalCaptionPostapprovalFinishBinding,
): CanonicalCaptionPostapprovalFinishLookup {
  return {
    canonicalScope: structuredClone(binding.canonicalScope),
    executionPackageRef: structuredClone(binding.executionPackageRef),
    captionPlanningProjectionRef:
      structuredClone(binding.captionPlanningProjectionRef),
  }
}

function bindingId(lookup: CanonicalCaptionPostapprovalFinishLookup): string {
  const parsed = lookupSchema.parse(lookup)
  const identity = rawDigest(Buffer.from(
    stableAuthorityStringify(parsed), 'utf8'))
  return `caption.postapproval-finish.${identity.slice(0, 40)}`
}

function objectPath(
  prefix: string,
  lookup: CanonicalCaptionPostapprovalFinishLookup,
): string {
  const identity = rawDigest(Buffer.from(
    stableAuthorityStringify(lookupSchema.parse(lookup)), 'utf8'))
  return `${prefix}/${identity}.json`
}

function assertLookup(
  binding: CanonicalCaptionPostapprovalFinishBinding,
  lookup: CanonicalCaptionPostapprovalFinishLookup,
): void {
  if (stableAuthorityStringify(lookupFromBinding(binding)) !==
    stableAuthorityStringify(lookupSchema.parse(lookup))) {
    throw new Error(
      'Canonical Caption postapproval finish lookup crossed authority.')
  }
}

function pictureLockRef(
  value: ReturnType<typeof parseCanonicalPictureLockManifest>,
): CaptionDomainRef {
  return {
    id: value.manifestId,
    version: value.schemaVersion,
    contentHash: value.manifestDigestSha256,
  }
}

function dependencyManifestRef(
  value: ReturnType<typeof parseCaptionDependencyManifest>,
): CaptionDomainRef {
  return {
    id: value.manifestId,
    version: value.schemaVersion,
    contentHash: value.manifestDigestSha256,
  }
}

function finishReadinessRef(
  value: ReturnType<typeof parseCaptionFinishReadiness>,
): CaptionDomainRef {
  return {
    id: value.readinessId,
    version: value.schemaVersion,
    contentHash: value.readinessDigestSha256,
  }
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function exactScope(
  scope: CanonicalCaptionPostapprovalFinishLookup['canonicalScope'],
  value: {
    canonicalScope: {
      ownerUserId: string
      workspaceId: string
      projectId: string
      editSessionId: string
      planVersionId: string
      approvedSnapshotRef: CaptionDomainRef | null
      outputId?: string
      sceneId?: string | null
    }
  } | ReturnType<typeof parseCanonicalPictureLockManifest>,
): boolean {
  const target = value.canonicalScope
  const targetScope = target as typeof target & {
    outputId?: string
    sceneId?: string | null
  }
  return target.approvedSnapshotRef !== null
    && scope.ownerUserId === target.ownerUserId
    && scope.workspaceId === target.workspaceId
    && scope.projectId === target.projectId
    && scope.editSessionId === target.editSessionId
    && scope.planVersionId === target.planVersionId
    && exactRef(scope.approvedSnapshotRef, target.approvedSnapshotRef)
    && (targetScope.outputId === undefined
      || scope.outputId === targetScope.outputId)
    && (targetScope.sceneId === undefined || targetScope.sceneId === null
      || scope.sceneId === targetScope.sceneId)
    && ('confirmedOutputFrame' in value
      ? scope.outputId === value.confirmedOutputFrame.outputId
        && value.lockedSceneIds.includes(scope.sceneId)
        && scope.authorizedFrameRanges.every((range) =>
          range.endFrameExclusive <= value.confirmedOutputFrame.totalFrames)
      : true)
}

function rangesAreCanonical(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
): boolean {
  let priorEnd = -1
  for (const range of ranges) {
    if (range.startFrame < priorEnd
      || range.endFrameExclusive <= range.startFrame) return false
    priorEnd = range.endFrameExclusive
  }
  return true
}

function rangesContainedBy(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
  containers: readonly { startFrame: number; endFrameExclusive: number }[],
): boolean {
  return rangesAreCanonical(ranges) && ranges.every((range) =>
    containers.some((container) =>
      range.startFrame >= container.startFrame
      && range.endFrameExclusive <= container.endFrameExclusive))
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
