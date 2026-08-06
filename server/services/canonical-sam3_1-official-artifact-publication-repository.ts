import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  assertCanonicalSam31OfficialArtifactPublicationReceipt,
  canonicalSam31OfficialArtifactPublicationRef,
  type CanonicalSam31OfficialArtifactPublicationReceipt,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION =
  'canonical-sam3_1-official-artifact-publication-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PREFIX = 'private/sam3_1/official-artifact-publication/v1/' as const
const safeId = z.string().trim().min(1).max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const publicationRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  ),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const MAXIMUM_RECEIPT_BYTES = 2 * 1024 * 1024

export interface CanonicalSam31OfficialArtifactPublicationRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_generation_reread'
  rereadOfficialArtifactPublication(input: {
    readonly publicationRef: z.infer<typeof publicationRefSchema>
  }): Promise<CanonicalSam31OfficialArtifactPublicationReceipt | null>
}

/** Exact-generation reread of the receipt emitted by the cloud-only ingest. */
export function createCanonicalSam31GcsOfficialArtifactPublicationRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: typeof PROJECT_ID
    readonly bucketName?: typeof CONTROL_PLANE_BUCKET
  } = {},
): CanonicalSam31OfficialArtifactPublicationRepository {
  const projectId = input.projectId ?? PROJECT_ID
  const bucketName = input.bucketName ?? CONTROL_PLANE_BUCKET
  if (projectId !== PROJECT_ID || bucketName !== CONTROL_PLANE_BUCKET) {
    throw new Error('SAM 3.1 publication receipt scope is not canonical.')
  }
  const storage = input.storage ?? new Storage({ projectId })
  const repository: CanonicalSam31OfficialArtifactPublicationRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_generation_reread' as const,
    async rereadOfficialArtifactPublication(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_publication_receipt_read')
      const { publicationRef } = z.object({
        publicationRef: publicationRefSchema,
      }).strict().parse(untrusted)
      const publicationHash = publicationRef.contentHash.slice('sha256:'.length)
      const objectName = `${PREFIX}${publicationRef.id}-${
        publicationHash.slice(0, 24)
      }.json`
      const live = storage.bucket(bucketName).file(objectName)
      let before: Record<string, unknown>
      try {
        const response = await live.getMetadata()
        before = response[0] as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const generation = String(before.generation ?? '')
      const etag = String(before.etag ?? '')
      const byteLength = Number(before.size ?? -1)
      if (
        !/^[1-9][0-9]{0,30}$/u.test(generation)
        || !etag
        || byteLength < 2
        || byteLength > MAXIMUM_RECEIPT_BYTES
        || String(before.contentType ?? '') !== 'application/json'
      ) throw new Error('SAM 3.1 publication receipt metadata is invalid.')
      const exact = storage.bucket(bucketName).file(objectName, { generation })
      const [body] = await exact.download({ validation: 'crc32c' })
      const [after] = await exact.getMetadata()
      if (
        !Buffer.isBuffer(body)
        || body.byteLength !== byteLength
        || String(after.generation ?? '') !== generation
        || String(after.etag ?? '') !== etag
        || Number(after.size ?? -1) !== byteLength
        || String(after.contentType ?? '') !== 'application/json'
      ) throw new Error('SAM 3.1 publication receipt changed during reread.')
      let decoded: unknown
      try {
        decoded = JSON.parse(body.toString('utf8'))
      } catch {
        throw new Error('SAM 3.1 publication receipt JSON is invalid.')
      }
      const receipt = assertCanonicalSam31OfficialArtifactPublicationReceipt(
        decoded,
      )
      if (
        stableAuthorityStringify(receipt) !== body.toString('utf8')
        || stableAuthorityStringify(
          canonicalSam31OfficialArtifactPublicationRef(receipt),
        ) !== stableAuthorityStringify(publicationRef)
      ) throw new Error('SAM 3.1 publication receipt reference changed.')
      return structuredClone(receipt)
    },
  }
  return Object.freeze(repository)
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return
  const code = Reflect.get(error, 'code')
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^[0-9]{3}$/u.test(code)) {
    return Number.parseInt(code, 10)
  }
}
