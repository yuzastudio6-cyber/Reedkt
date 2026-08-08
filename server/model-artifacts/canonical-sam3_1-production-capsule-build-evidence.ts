import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
} from './canonical-sam3_1-source-checkpoint-qualification'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILDER_RESULT_VERSION =
  'weeditpro-sam3_1-production-capsule-builder-result-v1' as const
export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_SECURITY_REVIEW_VERSION =
  'weeditpro-sam3_1-production-capsule-security-review-v1' as const
export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_REPRODUCIBILITY_VERSION =
  'canonical-sam3_1-production-capsule-reproducibility-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const PREFIX =
  'private/image-build-inputs/sam3_1/production/reproducibility/' as const
const SCANNER_DIGEST =
  'sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20' as const
// Pinned ClamAV accepts at most 4,095 MiB for the complete archive scan. The
// evidence contract must never admit a capsule larger than the scanner can
// actually inspect.
const MAXIMUM_CAPSULE_BYTES = 4_095 * 1024 * 1024

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })
const buildId = z.string().uuid()
const positiveInteger = z.number().int().positive().safe()
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const qualificationRefSchema = evidenceRefSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
  ),
}).strict()
const archiveEntrySchema = z.object({
  path: z.string().min(1).max(255).refine(isSafeArchivePath),
  byteLength: positiveInteger,
  sha256,
}).strict()
const coordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(BUCKET),
  objectName: z.string().min(1).max(1_024)
    .refine((value) => value.startsWith(PREFIX))
    .refine((value) => value.endsWith('.tar.gz'))
    .refine((value) => !value.includes('..') && !value.includes('\\')),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: positiveInteger.max(MAXIMUM_CAPSULE_BYTES),
  sha256,
  storageContentType: z.literal('application/gzip'),
  crc32c: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
  md5Hash: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
}).strict()

const builderWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILDER_RESULT_VERSION,
  ),
  source: z.literal('weeditpro_sam3_1_production_capsule_builder'),
  evidenceClass: z.literal('canonical_private_cloud_build'),
  buildId,
  repositoryCommit: gitSha,
  repositoryTree: gitSha,
  sourceBundleRef: evidenceRefSchema,
  sourcePublished: z.literal(true),
  sourceClean: z.literal(true),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  artifactBindingRef: evidenceRefSchema,
  sourceQualificationCapsuleRef: evidenceRefSchema,
  sourceQualificationCapsuleExactlyReread: z.literal(true),
  dockerfileSha256: sha256,
  runnerSha256: sha256,
  entrypointSha256: sha256,
  sourceProvenanceLockSha256: sha256,
  gpuDecodePatchSha256: z.literal(
    'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
  ),
  multiplexSessionGpuForwardingPatchSha256: z.literal(
    'fb5c047013629d27d7b8f2aecbf8343a402d2e36de3e24dc1be4347f83d9c86b',
  ).optional(),
  capsuleSha256: sha256,
  capsuleByteLength: positiveInteger.max(MAXIMUM_CAPSULE_BYTES),
  archiveEntries: z.array(archiveEntrySchema).min(16).max(512),
  archiveEntrySetSha256: sha256,
  dependencyWheelCount: positiveInteger.max(256),
  dependencyWheelManifestSha256: sha256,
  dependencyLockSha256: sha256,
  dependencyClosureReceiptSha256: sha256,
  patchApplicationReceiptSha256: sha256,
  cudaForwardCompatIngestReceiptSha256: sha256,
  artifactBuildBindingRecordHash: sha256,
  artifactBuildBindingFileSha256: sha256,
  sourceCheckpointQualificationRecordHash: sha256,
  sourceCheckpointCompatibilityReceiptSha256: sha256,
  checkpointIncluded: z.literal(false),
  sourceCheckpointQualificationReceiptIncluded: z.literal(true),
  containsCredentials: z.literal(false),
  containsCustomerMedia: z.literal(false),
  networkDependencyInstallRequired: z.literal(false),
  callerPathUrlCommandImageTagOrBuildArgumentAccepted: z.literal(false),
}).strict().superRefine((value, context) => {
  const entries = value.archiveEntries
  if (
    value.archiveEntrySetSha256 !== sha256AuthorityValue(entries)
    || entries.some((entry, index) => index > 0
      && !(entries[index - 1].path < entry.path))
    || entries.some((entry) => isProhibitedCheckpointArchiveEntry(entry.path))
    || value.artifactBindingRef.contentHash !==
      `sha256:${value.artifactBuildBindingRecordHash}`
    || value.sourceCheckpointQualificationRef.contentHash !==
      `sha256:${value.sourceCheckpointQualificationRecordHash}`
  ) context.addIssue({
    code: 'custom',
    message: 'Production capsule builder result lost exact closure.',
  })
})

export const canonicalSam31ProductionCapsuleBuilderResultSchema =
  builderWithoutHashSchema.extend({ builderResultHash: sha256 }).strict()
export type CanonicalSam31ProductionCapsuleBuilderResult = z.infer<
  typeof canonicalSam31ProductionCapsuleBuilderResultSchema
>

const securityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_CAPSULE_SECURITY_REVIEW_VERSION,
  ),
  source: z.literal('weeditpro_sam3_1_production_capsule_security_owner'),
  evidenceClass: z.literal('canonical_private_cloud_scan'),
  buildId,
  builderResultRef: evidenceRefSchema,
  scannerImageDigest: z.literal(SCANNER_DIGEST),
  scannerVersion: z.string().regex(/^ClamAV [0-9.]+\/[0-9]+\/.+$/u),
  signatureCount: positiveInteger.min(1_000_000),
  scannedFileCount: positiveInteger,
  infectedFileCount: z.literal(0),
  capsuleSha256: sha256,
  capsuleByteLength: positiveInteger.max(MAXIMUM_CAPSULE_BYTES),
  archiveEntrySetSha256: sha256,
  archiveRecursionEnabled: z.literal(true),
  scanPassed: z.literal(true),
  prohibitedEntryScanPassed: z.literal(true),
  absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent: z.literal(true),
  checkpointIncluded: z.literal(false),
  qualificationReceiptIncluded: z.literal(true),
  modelExecuted: z.literal(false),
  developerMachineInstallPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reviewedAt: timestamp,
}).strict()

export const canonicalSam31ProductionCapsuleSecurityReviewSchema =
  securityWithoutHashSchema.extend({ securityReviewHash: sha256 }).strict()
export type CanonicalSam31ProductionCapsuleSecurityReview = z.infer<
  typeof canonicalSam31ProductionCapsuleSecurityReviewSchema
>

const buildEvidenceSchema = z.object({
  buildId,
  builderResultRef: evidenceRefSchema,
  securityReviewRef: evidenceRefSchema,
  coordinate: coordinateSchema,
}).strict()

const reproducibilityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_CAPSULE_REPRODUCIBILITY_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_production_capsule_reproducibility_owner',
  ),
  status: z.literal('byte_for_byte_reproducible_and_scan_clean'),
  receiptId: safeId,
  receiptVersion: z.literal(1),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  artifactBindingRef: evidenceRefSchema,
  repositoryCommit: gitSha,
  repositoryTree: gitSha,
  capsuleSha256: sha256,
  capsuleByteLength: positiveInteger.max(MAXIMUM_CAPSULE_BYTES),
  archiveEntrySetSha256: sha256,
  primaryBuild: buildEvidenceSchema,
  confirmationBuild: buildEvidenceSchema,
  independentBuildCount: z.literal(2),
  exactBuilderClosureEqualityVerified: z.literal(true),
  exactCapsuleShaByteLengthCrc32cAndMd5EqualityVerified: z.literal(true),
  independentFullArchiveSecurityReviewsPassed: z.literal(true),
  sourceQualificationCapsuleAndFinalQualificationReread: z.literal(true),
  checkpointIncluded: z.literal(false),
  modelExecuted: z.literal(false),
  developerMachineInstallPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  imageBuildStarted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.primaryBuild.buildId === value.confirmationBuild.buildId
    || value.primaryBuild.coordinate.generation ===
      value.confirmationBuild.coordinate.generation
    || value.primaryBuild.coordinate.etag ===
      value.confirmationBuild.coordinate.etag
    || value.primaryBuild.coordinate.sha256 !== value.capsuleSha256
    || value.confirmationBuild.coordinate.sha256 !== value.capsuleSha256
    || value.primaryBuild.coordinate.byteLength !== value.capsuleByteLength
    || value.confirmationBuild.coordinate.byteLength !== value.capsuleByteLength
  ) context.addIssue({
    code: 'custom',
    message: 'Production capsule reproducibility lineage changed.',
  })
})

export const canonicalSam31ProductionCapsuleReproducibilitySchema =
  reproducibilityWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31ProductionCapsuleReproducibility = z.infer<
  typeof canonicalSam31ProductionCapsuleReproducibilitySchema
>
export type CanonicalSam31ProductionCapsuleCoordinate = z.infer<
  typeof coordinateSchema
>

export function assertCanonicalSam31ProductionCapsuleCoordinate(
  value: unknown,
): CanonicalSam31ProductionCapsuleCoordinate {
  assertPlainSerializedData(value, 'sam31_production_capsule_coordinate')
  return coordinateSchema.parse(value)
}

export function sealCanonicalSam31ProductionCapsuleBuilderResult(
  value: z.input<typeof builderWithoutHashSchema>,
): CanonicalSam31ProductionCapsuleBuilderResult {
  assertPlainSerializedData(value, 'sam31_production_capsule_builder_input')
  const payload = builderWithoutHashSchema.parse(value)
  return canonicalSam31ProductionCapsuleBuilderResultSchema.parse({
    ...payload,
    builderResultHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31ProductionCapsuleBuilderResult(
  value: unknown,
): CanonicalSam31ProductionCapsuleBuilderResult {
  assertPlainSerializedData(value, 'sam31_production_capsule_builder_result')
  const parsed = canonicalSam31ProductionCapsuleBuilderResultSchema.parse(value)
  const { builderResultHash, ...payload } = parsed
  if (builderResultHash !== sha256AuthorityValue(payload)) {
    throw new Error('Production capsule builder-result hash is invalid.')
  }
  return parsed
}

export function sealCanonicalSam31ProductionCapsuleSecurityReview(
  value: z.input<typeof securityWithoutHashSchema>,
): CanonicalSam31ProductionCapsuleSecurityReview {
  assertPlainSerializedData(value, 'sam31_production_capsule_security_input')
  const payload = securityWithoutHashSchema.parse(value)
  return canonicalSam31ProductionCapsuleSecurityReviewSchema.parse({
    ...payload,
    securityReviewHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31ProductionCapsuleSecurityReview(
  value: unknown,
): CanonicalSam31ProductionCapsuleSecurityReview {
  assertPlainSerializedData(value, 'sam31_production_capsule_security_review')
  const parsed = canonicalSam31ProductionCapsuleSecurityReviewSchema.parse(
    value,
  )
  const { securityReviewHash, ...payload } = parsed
  if (securityReviewHash !== sha256AuthorityValue(payload)) {
    throw new Error('Production capsule security-review hash is invalid.')
  }
  return parsed
}

export function createCanonicalSam31ProductionCapsuleReproducibility(input: {
  readonly primary: {
    readonly builderResult: CanonicalSam31ProductionCapsuleBuilderResult
    readonly securityReview: CanonicalSam31ProductionCapsuleSecurityReview
    readonly coordinate: CanonicalSam31ProductionCapsuleCoordinate
  }
  readonly confirmation: {
    readonly builderResult: CanonicalSam31ProductionCapsuleBuilderResult
    readonly securityReview: CanonicalSam31ProductionCapsuleSecurityReview
    readonly coordinate: CanonicalSam31ProductionCapsuleCoordinate
  }
  readonly observedAt: string
}): CanonicalSam31ProductionCapsuleReproducibility {
  assertPlainSerializedData(input, 'sam31_production_capsule_reproducibility')
  const primary = parseBuild(input.primary)
  const confirmation = parseBuild(input.confirmation)
  if (
    primary.builder.buildId === confirmation.builder.buildId
    || normalizedBuilder(primary.builder) !== normalizedBuilder(
      confirmation.builder,
    )
    || normalizedSecurity(primary.security) !== normalizedSecurity(
      confirmation.security,
    )
    || primary.coordinate.sha256 !== confirmation.coordinate.sha256
    || primary.coordinate.byteLength !== confirmation.coordinate.byteLength
    || primary.coordinate.crc32c !== confirmation.coordinate.crc32c
    || primary.coordinate.md5Hash !== confirmation.coordinate.md5Hash
  ) throw new Error('Production capsule builds are not reproducible.')
  const payload = reproducibilityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_CAPSULE_REPRODUCIBILITY_VERSION,
    source: 'canonical_sam3_1_production_capsule_reproducibility_owner',
    status: 'byte_for_byte_reproducible_and_scan_clean',
    receiptId:
      `sam31-production-capsule-reproducibility-${primary.builder.capsuleSha256.slice(0, 24)}`,
    receiptVersion: 1,
    sourceCheckpointQualificationRef:
      primary.builder.sourceCheckpointQualificationRef,
    artifactBindingRef: primary.builder.artifactBindingRef,
    repositoryCommit: primary.builder.repositoryCommit,
    repositoryTree: primary.builder.repositoryTree,
    capsuleSha256: primary.builder.capsuleSha256,
    capsuleByteLength: primary.builder.capsuleByteLength,
    archiveEntrySetSha256: primary.builder.archiveEntrySetSha256,
    primaryBuild: buildEvidence(primary),
    confirmationBuild: buildEvidence(confirmation),
    independentBuildCount: 2,
    exactBuilderClosureEqualityVerified: true,
    exactCapsuleShaByteLengthCrc32cAndMd5EqualityVerified: true,
    independentFullArchiveSecurityReviewsPassed: true,
    sourceQualificationCapsuleAndFinalQualificationReread: true,
    checkpointIncluded: false,
    modelExecuted: false,
    developerMachineInstallPerformed: false,
    customerCreditsMutated: false,
    imageBuildStarted: false,
    runtimeReleaseGranted: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31ProductionCapsuleReproducibilitySchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31ProductionCapsuleReproducibility(
  value: unknown,
): CanonicalSam31ProductionCapsuleReproducibility {
  assertPlainSerializedData(value, 'sam31_production_capsule_reproducibility')
  const parsed = canonicalSam31ProductionCapsuleReproducibilitySchema.parse(
    value,
  )
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Production capsule reproducibility hash is invalid.')
  }
  return parsed
}

export function canonicalSam31ProductionCapsuleBuilderResultRef(
  value: CanonicalSam31ProductionCapsuleBuilderResult,
) {
  const parsed = assertCanonicalSam31ProductionCapsuleBuilderResult(value)
  return Object.freeze({
    id: `sam31-production-capsule-builder.${parsed.buildId}`,
    version: 1 as const,
    contentHash: `sha256:${parsed.builderResultHash}` as const,
  })
}

export function canonicalSam31ProductionCapsuleSecurityReviewRef(
  value: CanonicalSam31ProductionCapsuleSecurityReview,
) {
  const parsed = assertCanonicalSam31ProductionCapsuleSecurityReview(value)
  return Object.freeze({
    id: `sam31-production-capsule-security.${parsed.buildId}`,
    version: 1 as const,
    contentHash: `sha256:${parsed.securityReviewHash}` as const,
  })
}

export function canonicalSam31ProductionCapsuleReproducibilityRef(
  value: CanonicalSam31ProductionCapsuleReproducibility,
) {
  const parsed = assertCanonicalSam31ProductionCapsuleReproducibility(value)
  return Object.freeze({
    id: parsed.receiptId,
    version: parsed.receiptVersion,
    contentHash: `sha256:${parsed.receiptHash}` as const,
  })
}

export function canonicalSam31ProductionCapsuleStringify(
  value: unknown,
): string {
  return stableAuthorityStringify(value)
}

export function canonicalSam31ProductionCapsuleFileSha256(
  value: Uint8Array,
): string {
  return createHash('sha256').update(value).digest('hex')
}

function parseBuild(input: {
  readonly builderResult: CanonicalSam31ProductionCapsuleBuilderResult
  readonly securityReview: CanonicalSam31ProductionCapsuleSecurityReview
  readonly coordinate: CanonicalSam31ProductionCapsuleCoordinate
}) {
  const builder = assertCanonicalSam31ProductionCapsuleBuilderResult(
    input.builderResult,
  )
  const security = assertCanonicalSam31ProductionCapsuleSecurityReview(
    input.securityReview,
  )
  const coordinate = assertCanonicalSam31ProductionCapsuleCoordinate(
    input.coordinate,
  )
  if (
    security.buildId !== builder.buildId
    || canonicalSam31ProductionCapsuleStringify(security.builderResultRef)
      !== canonicalSam31ProductionCapsuleStringify(
        canonicalSam31ProductionCapsuleBuilderResultRef(builder),
      )
    || security.capsuleSha256 !== builder.capsuleSha256
    || security.capsuleByteLength !== builder.capsuleByteLength
    || security.archiveEntrySetSha256 !== builder.archiveEntrySetSha256
    || coordinate.objectName !==
      `${PREFIX}${builder.buildId}/${builder.capsuleSha256}.tar.gz`
    || coordinate.sha256 !== builder.capsuleSha256
    || coordinate.byteLength !== builder.capsuleByteLength
  ) throw new Error('Production capsule build evidence crossed objects.')
  return { builder, security, coordinate }
}

function normalizedBuilder(
  value: CanonicalSam31ProductionCapsuleBuilderResult,
): string {
  const clone = structuredClone(value) as Partial<typeof value>
  Reflect.deleteProperty(clone, 'buildId')
  Reflect.deleteProperty(clone, 'builderResultHash')
  return canonicalSam31ProductionCapsuleStringify(clone)
}

function normalizedSecurity(
  value: CanonicalSam31ProductionCapsuleSecurityReview,
): string {
  const clone = structuredClone(value) as Partial<typeof value>
  Reflect.deleteProperty(clone, 'buildId')
  Reflect.deleteProperty(clone, 'builderResultRef')
  Reflect.deleteProperty(clone, 'reviewedAt')
  Reflect.deleteProperty(clone, 'securityReviewHash')
  return canonicalSam31ProductionCapsuleStringify(clone)
}

function buildEvidence(value: ReturnType<typeof parseBuild>) {
  return {
    buildId: value.builder.buildId,
    builderResultRef:
      canonicalSam31ProductionCapsuleBuilderResultRef(value.builder),
    securityReviewRef:
      canonicalSam31ProductionCapsuleSecurityReviewRef(value.security),
    coordinate: value.coordinate,
  }
}

function isSafeArchivePath(value: string): boolean {
  return !value.startsWith('/')
    && !value.includes('\\')
    && value.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')
}

function isProhibitedCheckpointArchiveEntry(value: string): boolean {
  const parts = value.toLowerCase().split('/')
  const fileName = parts.at(-1) ?? ''
  return parts.slice(0, -1).some((part) =>
    part === 'checkpoint'
    || part === 'checkpoints'
    || part === 'weights')
    || /\.(?:bin|ckpt|onnx|pt|pth|safetensors)$/u.test(fileName)
}
