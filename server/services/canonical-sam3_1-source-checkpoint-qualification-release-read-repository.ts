import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100JobObservation,
  type CanonicalSam31QualificationA100StatePort,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import type {
  CanonicalSam31QualificationPackageRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  assertCanonicalSam31QualificationResultEvidence,
} from './canonical-sam3_1-source-checkpoint-qualification-result-owner'
import {
  assertCanonicalSam31QualificationRelease,
  assertCanonicalSam31QualificationSecurityClearance,
  type CanonicalSam31QualificationReleaseObjectReadPort,
  type CanonicalSam31QualificationReleaseReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner'
import {
  assertCanonicalSam31QualificationTerminalEvidence,
} from './canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue, stableAuthorityStringify } from
  './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_RELEASE_READ_REPOSITORY_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-release-read-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const ROOT = 'private/sam3_1/source-checkpoint-qualification/v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const candidateRefSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION),
  candidateHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024

type EvidenceRef = z.infer<typeof evidenceRefSchema>

export interface CanonicalSam31AuthenticatedSecurityClearanceReadPort {
  rereadAuthenticatedSecurityComplianceClearance(input: {
    readonly clearanceRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31QualificationReleaseReadRepository
  extends CanonicalSam31QualificationReleaseReadPort,
  CanonicalSam31QualificationReleaseObjectReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_RELEASE_READ_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  importAuthenticatedSecurityComplianceClearanceCreateOnly(input: {
    readonly clearanceRef: EvidenceRef
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly clearanceRef: EvidenceRef
    readonly sourceCheckpointQualificationGranted: false
    readonly runtimeReleaseGranted: false
    readonly customerCreditsMutated: false
    readonly productionReady: false
  }>
}

/**
 * Durable adapter for the release owner. It rereads already-owned evidence;
 * it never creates legal/security decisions or release authority itself.
 */
export function createCanonicalSam31QualificationReleaseReadRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly packageRepository: CanonicalSam31QualificationPackageRepository
  readonly statePort: CanonicalSam31QualificationA100StatePort
  readonly authenticatedSecurityClearanceReadPort:
    CanonicalSam31AuthenticatedSecurityClearanceReadPort
}): CanonicalSam31QualificationReleaseReadRepository {
  assertDependencies(input)
  const repository: CanonicalSam31QualificationReleaseReadRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_RELEASE_READ_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread' as const,

    async importAuthenticatedSecurityComplianceClearanceCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_clearance_import')
      const request = z.object({ clearanceRef: evidenceRefSchema })
        .strict().parse(untrusted)
      const clearance = assertCanonicalSam31QualificationSecurityClearance(
        await input.authenticatedSecurityClearanceReadPort
          .rereadAuthenticatedSecurityComplianceClearance({
            clearanceRef: request.clearanceRef,
          }),
      )
      const clearanceRef = ref(
        clearance.clearanceId,
        clearance.clearanceHash,
      )
      if (!sameRef(clearanceRef, request.clearanceRef)) {
        throw new Error('SAM 3.1 authenticated clearance crossed reference.')
      }
      const body = serialize(clearance)
      const disposition = await input.objectPort.createOnly({
        objectPath: clearancePath(clearance.clearanceId),
        body,
        contentSha256: digest(body),
      })
      const reread = await readAndParse({
        port: input.objectPort,
        path: clearancePath(clearance.clearanceId),
        parse: assertCanonicalSam31QualificationSecurityClearance,
      })
      if (!reread || !sameRef(clearanceRef,
        ref(reread.clearanceId, reread.clearanceHash))) {
        throw new Error('SAM 3.1 security clearance exact reread changed.')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        clearanceRef,
        sourceCheckpointQualificationGranted: false as const,
        runtimeReleaseGranted: false as const,
        customerCreditsMutated: false as const,
        productionReady: false as const,
      })
    },

    rereadWorkerRequest({ ref: untrusted }) {
      return input.packageRepository.rereadExactWorkerRequest({
        workerRequestRef: evidenceRefSchema.parse(untrusted),
      })
    },

    async rereadCandidate({ ref: untrusted }) {
      const expected = candidateRefSchema.parse(untrusted)
      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      if (
        candidate.schemaVersion !== expected.schemaVersion
        || candidate.candidateHash !== expected.candidateHash
      ) throw new Error('SAM 3.1 candidate reference changed.')
      return structuredClone(candidate)
    },

    rereadIngestReceipt({ ref: untrusted }) {
      return input.packageRepository.rereadExactIngestReceipt({
        ingestReceiptRef: evidenceRefSchema.parse(untrusted),
      })
    },

    async rereadResultEvidence({ ref: untrusted }) {
      const expected = evidenceRefSchema.parse(untrusted)
      const value = await readAndParse({
        port: input.objectPort,
        path: attemptPath('results', expected.id),
        parse: assertCanonicalSam31QualificationResultEvidence,
      })
      if (!value) return null
      assertExactRef(expected, value.attemptId, value.evidenceHash)
      return value
    },

    async rereadTerminalEvidence({ ref: untrusted }) {
      const expected = evidenceRefSchema.parse(untrusted)
      const value = await readAndParse({
        port: input.objectPort,
        path: attemptPath('terminals', expected.id),
        parse: assertCanonicalSam31QualificationTerminalEvidence,
      })
      if (!value) return null
      assertExactRef(expected, value.attemptId, value.evidenceHash)
      return value
    },

    async rereadTerminalJobObservation({ ref: untrusted }) {
      const expected = evidenceRefSchema.parse(untrusted)
      const value = await input.statePort.rereadTerminalObservation({
        attemptId: expected.id,
      })
      if (!value) return null
      const observation =
        assertCanonicalSam31QualificationA100JobObservation(value)
      assertExactRef(
        expected,
        observation.attemptId,
        observation.observationHash,
      )
      return structuredClone(observation)
    },

    async rereadSecurityComplianceClearance({ ref: untrusted }) {
      const expected = evidenceRefSchema.parse(untrusted)
      const value = await readAndParse({
        port: input.objectPort,
        path: clearancePath(expected.id),
        parse: assertCanonicalSam31QualificationSecurityClearance,
      })
      if (!value) return null
      assertExactRef(expected, value.clearanceId, value.clearanceHash)
      return value
    },

    async rereadQualificationRelease(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_release_reread')
      const expected = z.object({
        sourceCheckpointQualificationRef: z.object({
          id: safeId,
          version: z.literal(1),
          schemaVersion: z.literal(
            CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
          ),
          contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
        }).strict(),
      }).strict().parse(untrusted).sourceCheckpointQualificationRef
      const release = await readAndParse({
        port: input.objectPort,
        path: releasePath(expected.id),
        parse: assertCanonicalSam31QualificationRelease,
      })
      if (!release) return null
      if (
        release.sourceCheckpointQualificationRef.id !== expected.id
        || release.sourceCheckpointQualificationRef.version !== 1
        || release.sourceCheckpointQualificationRef.schemaVersion !==
          expected.schemaVersion
        || release.sourceCheckpointQualificationRef.contentHash !==
          expected.contentHash
      ) throw new Error('SAM 3.1 qualification release crossed ref.')
      return release
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpQualificationReleaseReadRepository(
  input: {
    readonly packageRepository: CanonicalSam31QualificationPackageRepository
    readonly statePort: CanonicalSam31QualificationA100StatePort
    readonly authenticatedSecurityClearanceReadPort:
      CanonicalSam31AuthenticatedSecurityClearanceReadPort
    readonly storage?: Storage
  },
): CanonicalSam31QualificationReleaseReadRepository {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return createCanonicalSam31QualificationReleaseReadRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: CONTROL_PLANE_BUCKET,
    }),
    packageRepository: input.packageRepository,
    statePort: input.statePort,
    authenticatedSecurityClearanceReadPort:
      input.authenticatedSecurityClearanceReadPort,
  })
}

async function readAndParse<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 release evidence bytes are invalid.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 release evidence JSON is invalid.')
  }
  const value = input.parse(decoded)
  if (stableAuthorityStringify(value) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 release evidence bytes are not canonical.')
  }
  return structuredClone(value)
}

function attemptPath(kind: 'results' | 'terminals', attemptId: string): string {
  return `${ROOT}/${kind}/${sha256AuthorityValue(safeId.parse(attemptId))}.json`
}

function clearancePath(clearanceId: string): string {
  return `${ROOT}/security-clearances/${
    sha256AuthorityValue(safeId.parse(clearanceId))
  }.json`
}

function releasePath(qualificationId: string): string {
  return `${ROOT}/releases/${
    sha256AuthorityValue(safeId.parse(qualificationId))
  }.json`
}

function assertExactRef(value: EvidenceRef, id: string, hash: string): void {
  if (!sameRef(value, ref(id, hash))) {
    throw new Error('SAM 3.1 release evidence reference changed.')
  }
}

function ref(id: string, hash: string): EvidenceRef {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 release evidence record is oversized.')
  }
  return body
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertDependencies(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  packageRepository: CanonicalSam31QualificationPackageRepository
  statePort: CanonicalSam31QualificationA100StatePort
  authenticatedSecurityClearanceReadPort:
    CanonicalSam31AuthenticatedSecurityClearanceReadPort
}): void {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
    || typeof input.packageRepository?.rereadExactWorkerRequest !== 'function'
    || typeof input.packageRepository?.rereadExactIngestReceipt !== 'function'
    || typeof input.statePort?.rereadTerminalObservation !== 'function'
    || typeof input.authenticatedSecurityClearanceReadPort
      ?.rereadAuthenticatedSecurityComplianceClearance !== 'function'
  ) throw new Error('SAM 3.1 qualification release reads are not configured.')
}
