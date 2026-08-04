import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult,
  canonicalSam31SourceCheckpointQualificationWorkerResultSchema,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100JobObservation,
  assertCanonicalSam31QualificationA100MountObservation,
  assertCanonicalSam31QualificationA100Submission,
  type CanonicalSam31QualificationA100JobObservation,
  type CanonicalSam31QualificationA100MountObservation,
  type CanonicalSam31QualificationA100Submission,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue, stableAuthorityStringify } from
  './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_RESULT_EVIDENCE_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-result-evidence-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_GCS_RESULT_PORT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-gcs-result-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BUCKET_NAME =
  'reeditpro-production-sam31-qualification-private' as const
const KMS_KEY =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const
const RESULT_NAME = 'result/result.json' as const
const EXPECTED_INPUT_NAMES = [
  'checkpoint/sam3.1_multiplex.pt',
  'fixture/probe-person.mp4',
  'request/request.json',
] as const
const MAXIMUM_RESULT_BYTES = 512 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const generation = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const resultObjectSchema = z.object({
  bucketName: z.literal(BUCKET_NAME),
  objectName: z.string().regex(
    /^private\/sam3_1\/source-checkpoint-qualification\/v1\/attempts\/[a-f0-9]{64}\/result\/result\.json$/u,
  ),
  generation,
  metageneration: generation,
  etag: z.string().trim().min(1).max(512),
  byteLength: z.number().int().min(2).max(MAXIMUM_RESULT_BYTES),
  contentType: z.enum(['application/json', 'application/octet-stream']),
  kmsKeyName: z.literal(KMS_KEY),
  contentSha256: rawSha256,
}).strict()

const evidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_RESULT_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_qualification_result_reread_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  qualificationId: safeId,
  workerRequestRef: evidenceRefSchema,
  mountObservationRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  terminalJobObservationRef: evidenceRefSchema,
  workerResultRef: evidenceRefSchema,
  resultObject: resultObjectSchema,
  workerResult: canonicalSam31SourceCheckpointQualificationWorkerResultSchema,
  batchJobResource: z.string().regex(
    /^projects\/reeditpro\/locations\/us-central1\/jobs\/weeditpro-sam31-q-[a-f0-9]{40}$/u,
  ),
  batchJobUid: safeId,
  batchJobSucceededBeforeResultRead: z.literal(true),
  exactCreateConfigurationEchoVerified: z.literal(true),
  resultAbsentBeforeLaunchAndPresentAfterTerminal: z.literal(true),
  fixedWorkerExclusiveCreateCorrelated: z.literal(true),
  exactResultGenerationEtagLengthHashAndKmsReread: z.literal(true),
  exactFourObjectAttemptSetReread: z.literal(true),
  resultRequestImageAndAttemptLineageMatched: z.literal(true),
  callerResultBytesPathUrlOrCredentialAccepted: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerBillingAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.workerResultRef.id !== value.workerResult.qualificationId
    || value.workerResultRef.contentHash !==
      `sha256:${value.workerResult.resultHash}`
    || value.workerResult.requestRef.id !== value.workerRequestRef.id
    || value.workerResult.requestRef.version !== value.workerRequestRef.version
    || value.workerResult.requestRef.contentHash !==
      value.workerRequestRef.contentHash
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 result evidence lost worker lineage.',
  })
})

export const canonicalSam31QualificationResultEvidenceSchema =
  evidenceWithoutHashSchema.extend({ evidenceHash: rawSha256 }).strict()
export type CanonicalSam31QualificationResultEvidence = z.infer<
  typeof canonicalSam31QualificationResultEvidenceSchema
>

export interface CanonicalSam31QualificationPrivateResultObjectPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_GCS_RESULT_PORT_VERSION
  rereadExactResult(input: {
    readonly remoteSubdirectory: string
  }): Promise<{
    readonly object: z.infer<typeof resultObjectSchema>
    readonly body: Buffer
    readonly attemptObjectNames: readonly string[]
  } | null>
}

export function createCanonicalSam31QualificationResultOwner(input: {
  readonly resultObjectPort: CanonicalSam31QualificationPrivateResultObjectPort
  readonly evidenceObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly now?: () => string
}) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadAndPersist(request: {
      readonly attemptId: string
      readonly workerRequest:
        CanonicalSam31SourceCheckpointQualificationWorkerRequest
      readonly mountObservation:
        CanonicalSam31QualificationA100MountObservation
      readonly submission: CanonicalSam31QualificationA100Submission
      readonly terminalJobObservation:
        CanonicalSam31QualificationA100JobObservation
    }): Promise<CanonicalSam31QualificationResultEvidence> {
      assertPlainSerializedData(request, 'sam31_result_reread_request')
      const attemptId = safeId.parse(request.attemptId)
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          request.workerRequest,
        )
      const mount = assertCanonicalSam31QualificationA100MountObservation(
        request.mountObservation,
      )
      const submission = assertCanonicalSam31QualificationA100Submission(
        request.submission,
      )
      const terminal = assertCanonicalSam31QualificationA100JobObservation(
        request.terminalJobObservation,
      )
      assertLifecycle({ attemptId, workerRequest, mount, submission, terminal })
      const reread = await input.resultObjectPort.rereadExactResult({
        remoteSubdirectory: mount.attemptRemoteSubdirectory,
      })
      if (!reread || !Buffer.isBuffer(reread.body)) {
        throw new Error('SAM 3.1 qualification result object is missing.')
      }
      const object = resultObjectSchema.parse(reread.object)
      if (
        object.objectName !==
          `${mount.attemptRemoteSubdirectory}/${mount.resultObjectName}`
        || reread.body.byteLength !== object.byteLength
        || digest(reread.body) !== object.contentSha256
      ) throw new Error('SAM 3.1 qualification result bytes changed.')
      const expectedNames = [...EXPECTED_INPUT_NAMES, RESULT_NAME]
        .map((name) => `${mount.attemptRemoteSubdirectory}/${name}`)
        .sort(utf16LexicalCompare)
      if (stableAuthorityStringify([...reread.attemptObjectNames]) !==
        stableAuthorityStringify(expectedNames)) {
        throw new Error('SAM 3.1 qualification terminal object set changed.')
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(reread.body.toString('utf8'))
      } catch {
        throw new Error('SAM 3.1 qualification result JSON is invalid.')
      }
      const workerResult =
        assertCanonicalSam31SourceCheckpointQualificationWorkerResult(parsed)
      assertResultMatchesRequest({ workerResult, workerRequest, submission })
      const observedAt = timestamp.parse(now())
      if (
        Date.parse(observedAt) < Date.parse(workerResult.completedAt)
        || Date.parse(observedAt) < Date.parse(terminal.observedAt)
      ) throw new Error('SAM 3.1 qualification result reread is stale.')
      const payload = evidenceWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_RESULT_EVIDENCE_VERSION,
        source: 'canonical_server_sam3_1_qualification_result_reread_owner',
        evidenceClass: 'canonical_private_reread',
        attemptId,
        qualificationId: workerRequest.qualificationId,
        workerRequestRef: workerRequestRef(workerRequest),
        mountObservationRef: ref(attemptId, mount.observationHash),
        submissionRef: ref(attemptId, submission.submissionHash),
        terminalJobObservationRef: ref(attemptId, terminal.observationHash),
        workerResultRef: ref(workerResult.qualificationId,
          workerResult.resultHash),
        resultObject: object,
        workerResult,
        batchJobResource: submission.batchJobResource,
        batchJobUid: submission.batchJobUid,
        batchJobSucceededBeforeResultRead: true,
        exactCreateConfigurationEchoVerified: true,
        resultAbsentBeforeLaunchAndPresentAfterTerminal: true,
        fixedWorkerExclusiveCreateCorrelated: true,
        exactResultGenerationEtagLengthHashAndKmsReread: true,
        exactFourObjectAttemptSetReread: true,
        resultRequestImageAndAttemptLineageMatched: true,
        callerResultBytesPathUrlOrCredentialAccepted: false,
        sourceCheckpointQualificationGranted: false,
        runtimeReleaseGranted: false,
        customerCreditsMutated: false,
        customerBillingAuthorityGranted: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionReady: false,
        observedAt,
      })
      const evidence = canonicalSam31QualificationResultEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
      await persistExact({ port: input.evidenceObjectPort, evidence })
      return evidence
    },
  })
}

/** Actual generation-bound, private-CMEK GCS result rereader. */
export function createCanonicalSam31QualificationGcsResultObjectPort(input?: {
  readonly storage?: Storage
}): CanonicalSam31QualificationPrivateResultObjectPort {
  const storage = input?.storage ?? new Storage({ projectId: PROJECT_ID })
  const bucket = storage.bucket(BUCKET_NAME)
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_GCS_RESULT_PORT_VERSION,
    async rereadExactResult(value: { readonly remoteSubdirectory: string }) {
      assertRemoteSubdirectory(value.remoteSubdirectory)
      const objectName = `${value.remoteSubdirectory}/${RESULT_NAME}`
      let metadata: Record<string, unknown>
      try {
        const response = await bucket.file(objectName).getMetadata()
        metadata = response[0] as unknown as Record<string, unknown>
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const generationValue = String(metadata.generation ?? '')
      const object = resultObjectSchema.parse({
        bucketName: BUCKET_NAME,
        objectName,
        generation: generationValue,
        metageneration: String(metadata.metageneration ?? ''),
        etag: String(metadata.etag ?? ''),
        byteLength: Number(metadata.size ?? -1),
        contentType: String(metadata.contentType ?? ''),
        kmsKeyName: String(metadata.kmsKeyName ?? ''),
        contentSha256: '0'.repeat(64),
      })
      const exact = bucket.file(objectName, { generation: generationValue })
      const [body] = await exact.download({ validation: 'crc32c' })
      const [stable] = await exact.getMetadata()
      if (
        body.byteLength !== object.byteLength
        || String(stable.generation ?? '') !== object.generation
        || String(stable.metageneration ?? '') !== object.metageneration
        || String(stable.etag ?? '') !== object.etag
        || Number(stable.size ?? -1) !== object.byteLength
        || String(stable.kmsKeyName ?? '') !== KMS_KEY
      ) throw new Error('SAM 3.1 qualification result changed during reread.')
      const [files] = await bucket.getFiles({
        prefix: `${value.remoteSubdirectory}/`,
        autoPaginate: false,
        maxResults: 5,
      })
      return {
        object: resultObjectSchema.parse({
          ...object,
          contentSha256: digest(body),
        }),
        body,
        attemptObjectNames: Object.freeze(files.map((file) => file.name)
          .sort(utf16LexicalCompare)),
      }
    },
  })
}

export function assertCanonicalSam31QualificationResultEvidence(
  value: unknown,
): CanonicalSam31QualificationResultEvidence {
  assertPlainSerializedData(value, 'sam31_qualification_result_evidence')
  const evidence = canonicalSam31QualificationResultEvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = evidence
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification result evidence hash is invalid.')
  }
  return evidence
}

function assertLifecycle(input: {
  attemptId: string
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  mount: CanonicalSam31QualificationA100MountObservation
  submission: CanonicalSam31QualificationA100Submission
  terminal: CanonicalSam31QualificationA100JobObservation
}): void {
  if (
    input.mount.attemptId !== input.attemptId
    || input.submission.attemptId !== input.attemptId
    || input.terminal.attemptId !== input.attemptId
    || input.mount.qualificationId !== input.workerRequest.qualificationId
    || input.mount.workerRequestRef.contentHash !==
      `sha256:${input.workerRequest.requestHash}`
    || input.submission.disposition !== 'submitted'
    || input.submission.providerOutcome !== 'executed'
    || input.submission.batchJobUid === null
    || input.terminal.disposition !== 'job_succeeded_pending_result_reread'
    || input.terminal.batchState !== 'SUCCEEDED'
    || input.terminal.batchJobUid !== input.submission.batchJobUid
    || input.terminal.batchJobResource !== input.submission.batchJobResource
    || !input.terminal.exactCreateConfigurationEchoVerified
    || !input.terminal.terminalObservationPersistedCreateOnly
    || !input.mount.resultObjectAbsentBeforeLaunch
  ) throw new Error('SAM 3.1 qualification result lifecycle is incomplete.')
}

function assertResultMatchesRequest(input: {
  workerResult: ReturnType<
    typeof assertCanonicalSam31SourceCheckpointQualificationWorkerResult
  >
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  submission: CanonicalSam31QualificationA100Submission
}): void {
  if (
    input.workerResult.qualificationId !== input.workerRequest.qualificationId
    || input.workerResult.requestRef.contentHash !==
      `sha256:${input.workerRequest.requestHash}`
    || input.workerResult.candidateRef.candidateHash !==
      input.workerRequest.candidateRef.candidateHash
    || input.workerResult.ingestReceiptRef.contentHash !==
      input.workerRequest.ingestReceiptRef.contentHash
    || input.workerResult.qualificationImage.immutableImageDigest !==
      input.submission.immutableImageDigest
    || input.workerResult.qualificationImage.immutableImageDigest !==
      input.workerRequest.qualificationImage.immutableImageDigest
  ) throw new Error('SAM 3.1 qualification result crossed its request.')
}

async function persistExact(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  evidence: CanonicalSam31QualificationResultEvidence
}): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(input.evidence), 'utf8')
  const path = 'private/sam3_1/source-checkpoint-qualification/v1/results/'
    + `${sha256AuthorityValue(input.evidence.attemptId)}.json`
  await input.port.createOnly({
    objectPath: path,
    body,
    contentSha256: digest(body),
  })
  const reread = await input.port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('SAM 3.1 qualification result evidence reread changed.')
  }
  assertCanonicalSam31QualificationResultEvidence(
    JSON.parse(reread.toString('utf8')),
  )
}

function workerRequestRef(
  request: CanonicalSam31SourceCheckpointQualificationWorkerRequest,
) {
  return ref(request.qualificationId, request.requestHash)
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function assertDependencies(input: {
  resultObjectPort: CanonicalSam31QualificationPrivateResultObjectPort
  evidenceObjectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  if (
    input.resultObjectPort?.schemaVersion !==
      CANONICAL_SAM3_1_QUALIFICATION_GCS_RESULT_PORT_VERSION
    || typeof input.resultObjectPort?.rereadExactResult !== 'function'
    || typeof input.evidenceObjectPort?.createOnly !== 'function'
    || typeof input.evidenceObjectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification result dependencies invalid.')
}

function assertRemoteSubdirectory(value: string): void {
  if (!/^private\/sam3_1\/source-checkpoint-qualification\/v1\/attempts\/[a-f0-9]{64}$/u
    .test(value)) {
    throw new Error('SAM 3.1 qualification result prefix is invalid.')
  }
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function utf16LexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const code = Reflect.get(error, 'code')
  return typeof code === 'number' ? code : undefined
}
