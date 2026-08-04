import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  prepareCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31ImageSecurityReview,
  type CanonicalSam31ImageSecurityReview,
  type CanonicalSam31ImageSecurityReviewReadPort,
} from './canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_RELEASE_REPOSITORY_VERSION =
  'canonical-sam3_1-image-supply-chain-release-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/sam3_1/image-supply-chain-release/v1'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..')
    && !value.includes('//')
    && !value.endsWith('/'))
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const severityCountsSchema = z.object({
  criticalCount: z.number().int().nonnegative().safe(),
  highCount: z.number().int().nonnegative().safe(),
  mediumCount: z.number().int().nonnegative().safe(),
  lowCount: z.number().int().nonnegative().safe(),
  unknownSeverityCount: z.number().int().nonnegative().safe(),
}).strict()
const securityReviewReadRequestSchema = z.object({
  immutableImageDigest: prefixedSha256,
  vulnerabilityScanRef: evidenceRefSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severityCountsSchema,
}).strict()
const releaseReadRequestSchema = z.object({
  releaseRef: evidenceRefSchema,
}).strict()

export interface CanonicalSam31ImageSupplyChainReleaseRepository
  extends CanonicalSam31ImageSecurityReviewReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_RELEASE_REPOSITORY_VERSION
  readonly evidenceClass: 'private_gcs_create_only_exact_reread'
  persistApprovedSecurityReviewCreateOnly(input: {
    readonly review: CanonicalSam31ImageSecurityReview
  }): Promise<z.infer<typeof evidenceRefSchema>>
  persistQualifiedReleaseCreateOnly(input: {
    readonly release: CanonicalSam31CloudImageSupplyChainRelease
  }): Promise<z.infer<typeof evidenceRefSchema>>
  rereadQualifiedRelease(input: {
    readonly releaseRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalSam31CloudImageSupplyChainRelease | null>
}

export function createCanonicalSam31ImageSupplyChainReleaseRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31ImageSupplyChainReleaseRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31ImageSupplyChainReleaseRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_RELEASE_REPOSITORY_VERSION,
    evidenceClass: 'private_gcs_create_only_exact_reread',

    async persistApprovedSecurityReviewCreateOnly({ review }) {
      const parsed = assertCanonicalSam31ImageSecurityReview(review)
      const path = securityReviewPath(prefix, {
        immutableImageDigest: parsed.immutableImageDigest,
        vulnerabilityScanRef: parsed.vulnerabilityScanRef,
      })
      await persistExact(input.objectPort, path, parsed)
      return securityReviewRef(parsed)
    },

    async rereadApprovedReview(untrusted) {
      assertClosedPlainData(
        untrusted,
        'sam3_1_image_security_review_read_request',
      )
      const request = securityReviewReadRequestSchema.parse(untrusted)
      const value = await readExact(
        input.objectPort,
        securityReviewPath(prefix, request),
        assertCanonicalSam31ImageSecurityReview,
      )
      if (!value) return null
      if (
        value.immutableImageDigest !== request.immutableImageDigest
        || !sameRef(value.vulnerabilityScanRef, request.vulnerabilityScanRef)
        || value.scanCompletedAt !== request.scanCompletedAt
        || value.occurrenceSnapshotUpdatedAt !==
          request.occurrenceSnapshotUpdatedAt
        || !sameJson(value.severityCounts, request.severityCounts)
      ) throw conflict('sam3_1_image_security_review_reread_mismatch')
      return value
    },

    async persistQualifiedReleaseCreateOnly({ release }) {
      const parsed = assertCanonicalSam31CloudImageSupplyChainRelease(release)
      assertQualifiedRelease(parsed)
      const ref = releaseRef(parsed)
      await persistExact(
        input.objectPort,
        releasePath(prefix, ref),
        parsed,
      )
      return ref
    },

    async rereadQualifiedRelease(untrusted) {
      assertClosedPlainData(
        untrusted,
        'sam3_1_image_supply_chain_release_read_request',
      )
      const request = releaseReadRequestSchema.parse(untrusted)
      const value = await readExact(
        input.objectPort,
        releasePath(prefix, request.releaseRef),
        assertCanonicalSam31CloudImageSupplyChainRelease,
      )
      if (!value) return null
      assertQualifiedRelease(value)
      if (!sameRef(request.releaseRef, releaseRef(value))) {
        throw conflict('sam3_1_image_supply_chain_release_reread_mismatch')
      }
      return value
    },
  }
  return Object.freeze(repository)
}

export async function prepareAndPersistCanonicalSam31CloudImageSupplyChainRelease(
  input: Parameters<typeof prepareCanonicalSam31CloudImageSupplyChainRelease>[0]
    & { readonly repository: CanonicalSam31ImageSupplyChainReleaseRepository },
): Promise<CanonicalSam31CloudImageSupplyChainRelease> {
  const release = await prepareCanonicalSam31CloudImageSupplyChainRelease({
    releaseId: input.releaseId,
    authority: input.authority,
    submission: input.submission,
    terminalObservation: input.terminalObservation,
    evidenceReadPort: input.evidenceReadPort,
    qualifiedAt: input.qualifiedAt,
  })
  assertQualifiedRelease(release)
  const ref = await input.repository.persistQualifiedReleaseCreateOnly({
    release,
  })
  const reread = await input.repository.rereadQualifiedRelease({
    releaseRef: ref,
  })
  if (!reread || reread.releaseHash !== release.releaseHash) {
    throw conflict('sam3_1_image_supply_chain_release_persistence_mismatch')
  }
  return reread
}

export function createCanonicalSam31GcpImageSupplyChainReleaseRepository(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31ImageSupplyChainReleaseRepository {
  return createCanonicalSam31ImageSupplyChainReleaseRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
      bucketName: CONTROL_PLANE_STATE_BUCKET,
    }),
  })
}

function assertQualifiedRelease(
  release: CanonicalSam31CloudImageSupplyChainRelease,
): void {
  if (
    release.evidenceClass !== 'canonical_private_reread'
    || release.status !== 'image_supply_chain_qualified'
    || !release.authority.imageSupplyChainQualified
    || release.authority.a100RuntimeQualified
    || release.authority.l4RuntimeQualified
    || release.authority.runtimeReleaseGranted
    || release.authority.gpuJobDispatched
    || release.authority.customerCreditMutationAllowed
    || release.authority.publicDeliveryAuthorized
    || release.authority.productionReady
  ) throw conflict('sam3_1_image_supply_chain_release_not_qualified')
}

function securityReviewPath(
  prefix: string,
  input: {
    immutableImageDigest: string
    vulnerabilityScanRef: z.infer<typeof evidenceRefSchema>
  },
): string {
  const imageHash = prefixedSha256.parse(input.immutableImageDigest).slice(7)
  const scanHash = evidenceRefSchema.parse(input.vulnerabilityScanRef)
    .contentHash.slice(7)
  return `${prefix}/security-reviews/${imageHash}/${scanHash}.json`
}

function releasePath(
  prefix: string,
  ref: z.infer<typeof evidenceRefSchema>,
): string {
  const parsed = evidenceRefSchema.parse(ref)
  const idHash = createHash('sha256').update(parsed.id, 'utf8').digest('hex')
  return `${prefix}/qualified-releases/${idHash}/`
    + `${parsed.contentHash.slice(7)}.json`
}

function securityReviewRef(review: CanonicalSam31ImageSecurityReview) {
  return evidenceRefSchema.parse({
    id: review.reviewId,
    version: review.reviewVersion,
    contentHash: `sha256:${review.reviewHash}`,
  })
}

function releaseRef(release: CanonicalSam31CloudImageSupplyChainRelease) {
  return evidenceRefSchema.parse({
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  })
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = recordBody(value)
  const result = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: sha256(body),
  })
  if (result === 'already_exists') {
    const existing = await port.readExact(path)
    if (!existing || !existing.equals(body)) {
      throw conflict('sam3_1_image_supply_chain_create_only_collision')
    }
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw conflict('sam3_1_image_supply_chain_exact_reread_mismatch')
  }
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  assertValue: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('sam3_1_image_supply_chain_record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('sam3_1_image_supply_chain_record_json_invalid')
  }
  const parsed = assertValue(value)
  if (!recordBody(parsed).equals(body)) {
    throw conflict('sam3_1_image_supply_chain_record_not_canonical')
  }
  return parsed
}

function recordBody(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('sam3_1_image_supply_chain_record_size_invalid')
  }
  return body
}

function assertObjectPort(value: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !value
    || typeof value.createOnly !== 'function'
    || typeof value.readExact !== 'function'
  ) throw conflict('sam3_1_image_supply_chain_object_port_invalid')
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  let nodes = 0
  const visit = (item: unknown, depth: number): void => {
    nodes += 1
    if (nodes > 20_000 || depth > 64) {
      throw conflict(`${label}_structure_bound_exceeded`)
    }
    if (
      item === undefined
      || typeof item === 'function'
      || typeof item === 'symbol'
      || typeof item === 'bigint'
      || (typeof item === 'number' && !Number.isFinite(item))
    ) throw conflict(`${label}_non_json_value`)
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw conflict(`${label}_cycle`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw conflict(`${label}_not_plain_data`)
    }
    seen.add(item)
    if (Array.isArray(item)) {
      for (let index = 0; index < item.length; index += 1) {
        if (!Object.hasOwn(item, index)) {
          throw conflict(`${label}_sparse_array`)
        }
      }
    }
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') throw conflict(`${label}_symbol_key`)
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw conflict(`${label}_accessor`)
      }
      visit(descriptor.value, depth + 1)
    }
    seen.delete(item)
  }
  visit(value, 0)
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameJson(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(requiredGate: string): Error {
  return new Error(
    `SAM 3.1 image supply-chain release repository rejected ${requiredGate}.`,
  )
}
