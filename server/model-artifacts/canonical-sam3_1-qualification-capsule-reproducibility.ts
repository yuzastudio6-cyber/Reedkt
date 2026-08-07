import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_VERSION =
  'canonical-sam3_1-qualification-capsule-reproducibility-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const PREFIX =
  'private/image-build-inputs/sam3_1/qualification/reproducibility/' as const
const BUILDER_VERSION =
  'weeditpro-sam3_1-qualification-capsule-builder-result-v1' as const
const SCAN_VERSION =
  'weeditpro-sam3_1-qualification-capsule-malware-scan-v1' as const
const SCANNER_DIGEST =
  'sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const timestamp = z.string().datetime({ offset: true })
const uuid = z.string().uuid()
const positiveInteger = z.number().int().positive().safe()
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const entrySchema = z.object({
  path: z.string().min(1).max(255)
    .refine((value) => !value.startsWith('/') && !value.includes('\\'))
    .refine((value) => value.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..')),
  byteLength: positiveInteger,
  sha256,
}).strict()
const builderResultSchema = z.object({
  schemaVersion: z.literal(BUILDER_VERSION),
  repositoryCommit: gitSha,
  repositoryTree: gitSha,
  capsuleSha256: sha256,
  capsuleByteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
  archiveEntries: z.array(entrySchema).min(14).max(512),
  archiveEntrySetSha256: sha256,
  dependencyWheelCount: positiveInteger.max(256),
  dependencyWheelManifestSha256: sha256,
  dependencyLockSha256: sha256,
  dependencyClosureReceiptSha256: sha256,
  patchApplicationReceiptSha256: sha256,
  cudaForwardCompatIngestReceiptSha256: sha256,
  checkpointIncluded: z.literal(false),
  qualificationReceiptIncluded: z.literal(false),
  containsCredentials: z.literal(false),
  containsCustomerMedia: z.literal(false),
}).strict().superRefine((result, context) => {
  if (
    result.archiveEntrySetSha256 !==
      canonicalSam31QualificationCapsuleReproducibilityDigest(
        result.archiveEntries,
      )
    || result.archiveEntries.some((entry, index, entries) =>
      index > 0 && !(entries[index - 1].path < entry.path))
    || result.archiveEntries.some((entry) =>
      /(?:checkpoint|sam3\.1_multiplex\.pt)/iu.test(entry.path))
  ) context.addIssue({
    code: 'custom',
    message: 'Qualification capsule builder result lost exact closure.',
  })
})
const scanWithoutHashSchema = z.object({
  schemaVersion: z.literal(SCAN_VERSION),
  buildId: uuid,
  scannerImageDigest: z.literal(SCANNER_DIGEST),
  scannerVersion: z.string().regex(/^ClamAV [0-9.]+\/[0-9]+\/.+$/u),
  signatureCount: positiveInteger.min(1_000_000),
  scannedFileCount: positiveInteger,
  infectedFileCount: z.literal(0),
  capsuleSha256: sha256,
  capsuleByteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
  archiveRecursionEnabled: z.literal(true),
  scanPassed: z.literal(true),
  checkpointIncluded: z.literal(false),
  modelExecuted: z.literal(false),
  developerMachineInstallPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const scanSchema = scanWithoutHashSchema.extend({ scanReceiptHash: sha256 })
  .strict()
const coordinateSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  bucketName: z.literal(BUCKET),
  objectName: z.string().min(1).max(1_024)
    .refine((value) => value.startsWith(PREFIX))
    .refine((value) => value.endsWith('.tar.gz'))
    .refine((value) => !value.includes('..') && !value.includes('\\')),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
  sha256,
  storageContentType: z.literal('application/x-tar'),
  crc32c: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
  md5Hash: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
}).strict()
const buildEvidenceSchema = z.object({
  buildId: uuid,
  coordinate: coordinateSchema,
  builderResultRef: evidenceRefSchema,
  malwareScanRef: evidenceRefSchema,
}).strict()
const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_qualification_capsule_reproducibility_owner',
  ),
  status: z.literal('byte_for_byte_reproducible_and_scan_clean'),
  receiptId: safeId,
  receiptVersion: z.literal(1),
  repositoryCommit: gitSha,
  repositoryTree: gitSha,
  capsuleSha256: sha256,
  capsuleByteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
  archiveEntrySetSha256: sha256,
  dependencyWheelCount: positiveInteger.max(256),
  dependencyWheelManifestSha256: sha256,
  primaryBuild: buildEvidenceSchema,
  confirmationBuild: buildEvidenceSchema,
  independentBuildCount: z.literal(2),
  exactBuilderResultEqualityVerified: z.literal(true),
  exactCapsuleShaByteLengthCrc32cAndMd5EqualityVerified: z.literal(true),
  independentFullArchiveMalwareScansPassed: z.literal(true),
  repositoryCommitAndTreeEqualityVerified: z.literal(true),
  checkpointIncluded: z.literal(false),
  modelExecuted: z.literal(false),
  developerMachineInstallPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qualificationAuthorityGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  if (
    receipt.primaryBuild.buildId === receipt.confirmationBuild.buildId
    || receipt.primaryBuild.coordinate.generation ===
      receipt.confirmationBuild.coordinate.generation
    || receipt.primaryBuild.coordinate.etag ===
      receipt.confirmationBuild.coordinate.etag
    || receipt.primaryBuild.coordinate.sha256 !== receipt.capsuleSha256
    || receipt.confirmationBuild.coordinate.sha256 !== receipt.capsuleSha256
    || receipt.primaryBuild.coordinate.byteLength !== receipt.capsuleByteLength
    || receipt.confirmationBuild.coordinate.byteLength !==
      receipt.capsuleByteLength
  ) context.addIssue({
    code: 'custom',
    message: 'Qualification capsule reproducibility lineage changed.',
  })
})

export const canonicalSam31QualificationCapsuleReproducibilitySchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31QualificationCapsuleReproducibility = z.infer<
  typeof canonicalSam31QualificationCapsuleReproducibilitySchema
>
export type CanonicalSam31QualificationCapsuleBuilderResult = z.infer<
  typeof builderResultSchema
>
export type CanonicalSam31QualificationCapsuleMalwareScan = z.infer<
  typeof scanSchema
>
export type CanonicalSam31QualificationCapsuleCoordinate = z.infer<
  typeof coordinateSchema
>

export function assertCanonicalSam31QualificationCapsuleBuilderResult(
  value: unknown,
): CanonicalSam31QualificationCapsuleBuilderResult {
  assertPlainSerializedData(value, 'sam31_capsule_builder_result')
  return builderResultSchema.parse(value)
}

export function assertCanonicalSam31QualificationCapsuleMalwareScan(
  value: unknown,
): CanonicalSam31QualificationCapsuleMalwareScan {
  assertPlainSerializedData(value, 'sam31_capsule_malware_scan')
  const scan = scanSchema.parse(value)
  const { scanReceiptHash, ...payload } = scan
  if (
    scanReceiptHash !==
      canonicalSam31QualificationCapsuleReproducibilityDigest(payload)
  ) throw new Error('SAM 3.1 capsule scan hash is invalid.')
  return scan
}

export function assertCanonicalSam31QualificationCapsuleCoordinate(
  value: unknown,
): CanonicalSam31QualificationCapsuleCoordinate {
  assertPlainSerializedData(value, 'sam31_capsule_coordinate')
  return coordinateSchema.parse(value)
}

export function createCanonicalSam31QualificationCapsuleReproducibility(
  input: {
    readonly receiptId: string
    readonly primary: {
      readonly builderResult: unknown
      readonly builderResultFileSha256: string
      readonly malwareScan: unknown
      readonly malwareScanFileSha256: string
      readonly coordinate: unknown
    }
    readonly confirmation: {
      readonly builderResult: unknown
      readonly builderResultFileSha256: string
      readonly malwareScan: unknown
      readonly malwareScanFileSha256: string
      readonly coordinate: unknown
    }
    readonly observedAt: string
  },
): CanonicalSam31QualificationCapsuleReproducibility {
  assertPlainSerializedData(input, 'sam31_capsule_reproducibility_input')
  const primary = parseBuild(input.primary)
  const confirmation = parseBuild(input.confirmation)
  if (
    primary.scan.buildId === confirmation.scan.buildId
    || canonicalSam31QualificationCapsuleReproducibilityStringify(
      primary.builder,
    ) !== canonicalSam31QualificationCapsuleReproducibilityStringify(
      confirmation.builder,
    )
    || sha256.parse(input.primary.builderResultFileSha256) !==
      sha256.parse(input.confirmation.builderResultFileSha256)
    || !sameScan(primary.scan, confirmation.scan)
    || primary.coordinate.sha256 !== confirmation.coordinate.sha256
    || primary.coordinate.byteLength !== confirmation.coordinate.byteLength
    || primary.coordinate.crc32c !== confirmation.coordinate.crc32c
    || primary.coordinate.md5Hash !== confirmation.coordinate.md5Hash
    || primary.builder.capsuleSha256 !== primary.coordinate.sha256
    || primary.builder.capsuleByteLength !== primary.coordinate.byteLength
  ) throw new Error('SAM 3.1 qualification capsule is not reproducible.')
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_CAPSULE_REPRODUCIBILITY_VERSION,
    source: 'canonical_sam3_1_qualification_capsule_reproducibility_owner',
    status: 'byte_for_byte_reproducible_and_scan_clean',
    receiptId: input.receiptId,
    receiptVersion: 1,
    repositoryCommit: primary.builder.repositoryCommit,
    repositoryTree: primary.builder.repositoryTree,
    capsuleSha256: primary.builder.capsuleSha256,
    capsuleByteLength: primary.builder.capsuleByteLength,
    archiveEntrySetSha256: primary.builder.archiveEntrySetSha256,
    dependencyWheelCount: primary.builder.dependencyWheelCount,
    dependencyWheelManifestSha256:
      primary.builder.dependencyWheelManifestSha256,
    primaryBuild: buildEvidence(primary, input.primary),
    confirmationBuild: buildEvidence(confirmation, input.confirmation),
    independentBuildCount: 2,
    exactBuilderResultEqualityVerified: true,
    exactCapsuleShaByteLengthCrc32cAndMd5EqualityVerified: true,
    independentFullArchiveMalwareScansPassed: true,
    repositoryCommitAndTreeEqualityVerified: true,
    checkpointIncluded: false,
    modelExecuted: false,
    developerMachineInstallPerformed: false,
    customerCreditsMutated: false,
    qualificationAuthorityGranted: false,
    runtimeReleaseGranted: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31QualificationCapsuleReproducibilitySchema.parse({
    ...payload,
    receiptHash:
      canonicalSam31QualificationCapsuleReproducibilityDigest(payload),
  })
}

export function assertCanonicalSam31QualificationCapsuleReproducibility(
  value: unknown,
): CanonicalSam31QualificationCapsuleReproducibility {
  assertPlainSerializedData(value, 'sam31_capsule_reproducibility')
  const parsed = canonicalSam31QualificationCapsuleReproducibilitySchema
    .parse(value)
  const { receiptHash, ...payload } = parsed
  if (
    receiptHash !==
      canonicalSam31QualificationCapsuleReproducibilityDigest(payload)
  ) {
    throw new Error('SAM 3.1 capsule reproducibility hash is invalid.')
  }
  return parsed
}

export function canonicalSam31QualificationCapsuleReproducibilityRef(
  value: CanonicalSam31QualificationCapsuleReproducibility,
) {
  const receipt = assertCanonicalSam31QualificationCapsuleReproducibility(value)
  return Object.freeze({
    id: receipt.receiptId,
    version: receipt.receiptVersion,
    contentHash: `sha256:${receipt.receiptHash}` as const,
  })
}

export function canonicalSam31QualificationCapsuleReproducibilityStringify(
  value: unknown,
): string {
  return JSON.stringify(canonicalValue(value))
}

export function canonicalSam31QualificationCapsuleReproducibilityDigest(
  value: unknown,
): string {
  return createHash('sha256').update(
    canonicalSam31QualificationCapsuleReproducibilityStringify(value),
    'utf8',
  ).digest('hex')
}

function parseBuild(input: {
  readonly builderResult: unknown
  readonly malwareScan: unknown
  readonly coordinate: unknown
}) {
  const builder = assertCanonicalSam31QualificationCapsuleBuilderResult(
    input.builderResult,
  )
  const scan = assertCanonicalSam31QualificationCapsuleMalwareScan(
    input.malwareScan,
  )
  const coordinate = assertCanonicalSam31QualificationCapsuleCoordinate(
    input.coordinate,
  )
  const expectedObject =
    `${PREFIX}${scan.buildId}/${builder.capsuleSha256}.tar.gz`
  if (
    coordinate.objectName !== expectedObject
    || scan.capsuleSha256 !== builder.capsuleSha256
    || scan.capsuleByteLength !== builder.capsuleByteLength
  ) throw new Error('SAM 3.1 capsule build evidence crossed objects.')
  return { builder, scan, coordinate }
}

function sameScan(
  left: CanonicalSam31QualificationCapsuleMalwareScan,
  right: CanonicalSam31QualificationCapsuleMalwareScan,
): boolean {
  const leftPayload = structuredClone(left) as Partial<typeof left>
  const rightPayload = structuredClone(right) as Partial<typeof right>
  Reflect.deleteProperty(leftPayload, 'buildId')
  Reflect.deleteProperty(leftPayload, 'scanReceiptHash')
  Reflect.deleteProperty(rightPayload, 'buildId')
  Reflect.deleteProperty(rightPayload, 'scanReceiptHash')
  return canonicalSam31QualificationCapsuleReproducibilityStringify(
    leftPayload,
  ) === canonicalSam31QualificationCapsuleReproducibilityStringify(
    rightPayload,
  )
}

function buildEvidence(
  parsed: ReturnType<typeof parseBuild>,
  raw: {
    readonly builderResultFileSha256: string
    readonly malwareScanFileSha256: string
  },
) {
  return {
    buildId: parsed.scan.buildId,
    coordinate: parsed.coordinate,
    builderResultRef: {
      id: `sam31-capsule-builder.${parsed.scan.buildId}`,
      version: 1 as const,
      contentHash: `sha256:${sha256.parse(raw.builderResultFileSha256)}` as const,
    },
    malwareScanRef: {
      id: `sam31-capsule-scan.${parsed.scan.buildId}`,
      version: 1 as const,
      contentHash: `sha256:${sha256.parse(raw.malwareScanFileSha256)}` as const,
    },
  }
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, nested]) => [key, canonicalValue(nested)]),
    )
  }
  return value
}
