import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageBuildReconciliation,
  canonicalSam31QualificationImageBuildListEndpoint,
  canonicalSam31QualificationImageBuildReconciliationRef,
  createCanonicalSam31QualificationImageBuildReconciler,
  type CanonicalSam31QualificationImageBuildReconciliation,
} from './canonical-sam3_1-qualification-image-build-reconciliation'
import {
  createCanonicalSam31QualificationImageBuildRepository,
} from './canonical-sam3_1-qualification-image-build-runtime'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILIATION_RUNTIME_VERSION =
  'canonical-sam3_1-qualification-image-build-reconciliation-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PREFIX =
  'private/sam3_1/qualification-image-build-phase/v1/reconciliations' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const MAXIMUM_RECORD_BYTES = 1024 * 1024
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('://')),
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

type EvidenceRef = z.infer<typeof evidenceRefSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalSam31QualificationImageBuildReconciliationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
) {
  return Object.freeze({
    async persistReconciliationCreateOnly(request: {
      readonly reconciliation:
        CanonicalSam31QualificationImageBuildReconciliation
    }) {
      const record = assertCanonicalSam31QualificationImageBuildReconciliation(
        request.reconciliation,
      )
      const ref = canonicalSam31QualificationImageBuildReconciliationRef(record)
      const body = recordBody(record)
      const objectPath = `${PREFIX}/${ref.contentHash.slice(7)}.json`
      const result = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: sha256(body),
      })
      const reread = await input.objectPort.readExact(objectPath)
      if (!reread || !reread.equals(body)) {
        throw new Error('SAM 3.1 reconciliation was not exactly reread.')
      }
      return result
    },
    async rereadReconciliation(request: {
      readonly reconciliationRef: EvidenceRef
    }) {
      const ref = evidenceRefSchema.parse(request.reconciliationRef)
      const objectPath = `${PREFIX}/${ref.contentHash.slice(7)}.json`
      const body = await input.objectPort.readExact(objectPath)
      if (!body) return null
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error('SAM 3.1 reconciliation record size is invalid.')
      }
      let value: unknown
      try {
        value = JSON.parse(body.toString('utf8'))
      } catch {
        throw new Error('SAM 3.1 reconciliation record JSON is invalid.')
      }
      const record = assertCanonicalSam31QualificationImageBuildReconciliation(
        value,
      )
      if (
        !sameRef(
          ref,
          canonicalSam31QualificationImageBuildReconciliationRef(record),
        )
        || !recordBody(record).equals(body)
      ) throw new Error('SAM 3.1 reconciliation record changed.')
      return record
    },
  })
}

export function createCanonicalSam31QualificationImageBuildListTransport(
  input: {
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  } = {},
) {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input.requestTimeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('SAM 3.1 reconciliation timeout is invalid.')
  }
  return Object.freeze({
    async request(request: {
      readonly method: 'GET'
      readonly url: typeof canonicalSam31QualificationImageBuildListEndpoint
    }) {
      if (
        request.method !== 'GET'
        || request.url !==
          canonicalSam31QualificationImageBuildListEndpoint
      ) throw new Error('SAM 3.1 reconciliation URL is not allowlisted.')
      const response = await auth.request<unknown>({
        url: request.url,
        method: 'GET',
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        validateStatus: () => true,
      })
      if (
        !Number.isInteger(response.status)
        || response.status < 100
        || response.status > 599
      ) throw new Error('SAM 3.1 reconciliation status is invalid.')
      assertPlainSerializedData(response.data, 'sam31_cloud_build_list_response')
      return {
        status: response.status,
        json: structuredClone(response.data),
      }
    },
  })
}

export function createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime(
  input: {
    readonly storage?: Storage
    readonly auth?: GoogleAuthRequest
    readonly now?: () => string
  } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  const buildRepository = createCanonicalSam31QualificationImageBuildRepository({
    objectPort,
  })
  const reconciliationRepository =
    createCanonicalSam31QualificationImageBuildReconciliationRepository({
      objectPort,
    })
  const reconciler = createCanonicalSam31QualificationImageBuildReconciler({
    readPort: buildRepository,
    transport: createCanonicalSam31QualificationImageBuildListTransport({
      auth: input.auth,
    }),
    now: input.now,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RECONCILIATION_RUNTIME_VERSION,
    projectId: PROJECT_ID,
    persistenceMode: 'private_gcs_create_only_exact_reread' as const,
    automaticRetryAllowed: false as const,
    async reconcileAndPersistOne(request: {
      readonly reconciliationId: string
      readonly submissionRef: EvidenceRef
    }) {
      const reconciliation = await reconciler.reconcileUnknownSubmission(
        request,
      )
      await reconciliationRepository.persistReconciliationCreateOnly({
        reconciliation,
      })
      const reconciliationRef =
        canonicalSam31QualificationImageBuildReconciliationRef(reconciliation)
      const reread = await reconciliationRepository.rereadReconciliation({
        reconciliationRef,
      })
      if (!reread || reread.reconciliationHash !==
        reconciliation.reconciliationHash) {
        throw new Error('SAM 3.1 reconciliation durable reread failed.')
      }
      return Object.freeze({ reconciliation: reread, reconciliationRef })
    },
    rereadReconciliation:
      reconciliationRepository.rereadReconciliation,
  })
}

function recordBody(value: unknown): Buffer {
  assertPlainSerializedData(value, 'sam31_qualification_reconciliation_record')
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 reconciliation record size is invalid.')
  }
  return body
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
