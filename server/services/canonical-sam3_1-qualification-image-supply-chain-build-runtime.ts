import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageSupplyChainAdmission,
  assertCanonicalSam31QualificationImageSupplyChainObservation,
  assertCanonicalSam31QualificationImageSupplyChainSubmission,
  createCanonicalSam31QualificationImageSupplyChainBuildPhase,
  qualificationImageSupplyChainAdmissionReference,
  qualificationImageSupplyChainSubmissionReference,
  type CanonicalSam31QualificationImageSupplyChainBuildAdmission,
  type CanonicalSam31QualificationImageSupplyChainBuildObservation,
  type CanonicalSam31QualificationImageSupplyChainBuildSubmission,
} from './canonical-sam3_1-qualification-image-supply-chain-build-phase'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GoogleCloudBuildAuthenticatedTransport,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_RUNTIME_VERSION =
  'canonical-sam3_1-qualification-image-supply-chain-build-runtime-v1' as const

const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const STATE_PREFIX =
  'private/sam3_1/qualification-image-supply-chain-build/v1' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-qualification-image-supply-chain-consumption-v1',
  ),
  admissionRef: refSchema,
  buildRequestHash: rawSha256,
  consumedAt: z.string().datetime({ offset: true }),
  createOnly: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  checkpointIncluded: z.literal(false),
  gpuQualificationJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict()

export function
createCanonicalSam31QualificationImageSupplyChainBuildRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
}) {
  return Object.freeze({
    async persistAdmissionCreateOnly(request: {
      readonly admission:
        CanonicalSam31QualificationImageSupplyChainBuildAdmission
    }) {
      const admission =
        assertCanonicalSam31QualificationImageSupplyChainAdmission(
          request.admission,
        )
      const ref = qualificationImageSupplyChainAdmissionReference(admission)
      await persistExact(
        input.objectPort,
        recordPath('admissions', ref),
        admission,
      )
      return ref
    },
    async rereadQualificationImageSupplyChainAdmission(request: {
      readonly admissionRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(request.admissionRef)
      const admission = await readExact(
        input.objectPort,
        recordPath('admissions', ref),
        assertCanonicalSam31QualificationImageSupplyChainAdmission,
      )
      if (
        admission
        && !sameRef(
          qualificationImageSupplyChainAdmissionReference(admission),
          ref,
        )
      ) throw new Error('SAM 3.1 supply-chain admission ref changed.')
      return admission
    },
    async consumeQualificationImageSupplyChainAdmissionCreateOnly(
      untrusted: {
        readonly admissionRef: z.infer<typeof refSchema>
        readonly buildRequestHash: string
        readonly consumedAt: string
      },
    ) {
      assertPlainSerializedData(untrusted, 'sam31_supply_chain_consumption')
      const inputValue = z.object({
        admissionRef: refSchema,
        buildRequestHash: rawSha256,
        consumedAt: z.string().datetime({ offset: true }),
      }).strict().parse(untrusted)
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion:
          'canonical-sam3_1-qualification-image-supply-chain-consumption-v1',
        ...inputValue,
        createOnly: true,
        automaticRetryAllowed: false,
        checkpointIncluded: false,
        gpuQualificationJobDispatched: false,
        customerCreditsMutated: false,
        runtimeReleaseGranted: false,
        productionAuthorityGranted: false,
      })
      const record = consumptionSchema.parse({
        ...payload,
        consumptionHash: sha256AuthorityValue(payload),
      })
      const body = recordBody(record)
      const path = recordPath('consumptions', inputValue.admissionRef)
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: sha256(body),
      })
      if (disposition === 'already_exists') return false
      const reread = await input.objectPort.readExact(path)
      if (!reread || !reread.equals(body)) {
        throw new Error('SAM 3.1 supply-chain consumption reread changed.')
      }
      return true
    },
    async persistQualificationImageSupplyChainSubmissionCreateOnly(
      request: {
        readonly submission:
          CanonicalSam31QualificationImageSupplyChainBuildSubmission
      },
    ) {
      const submission =
        assertCanonicalSam31QualificationImageSupplyChainSubmission(
          request.submission,
        )
      await persistExact(
        input.objectPort,
        recordPath(
          'submissions',
          qualificationImageSupplyChainSubmissionReference(submission),
        ),
        submission,
      )
      return true
    },
    async rereadSubmission(request: {
      readonly submissionRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(request.submissionRef)
      const submission = await readExact(
        input.objectPort,
        recordPath('submissions', ref),
        assertCanonicalSam31QualificationImageSupplyChainSubmission,
      )
      if (
        submission
        && !sameRef(
          qualificationImageSupplyChainSubmissionReference(submission),
          ref,
        )
      ) throw new Error('SAM 3.1 supply-chain submission ref changed.')
      return submission
    },
    async persistQualificationImageSupplyChainObservationCreateOnly(
      request: {
        readonly observation:
          CanonicalSam31QualificationImageSupplyChainBuildObservation
      },
    ) {
      const observation =
        assertCanonicalSam31QualificationImageSupplyChainObservation(
          request.observation,
        )
      await persistExact(
        input.objectPort,
        recordPath(
          'terminal-observations-by-submission',
          observation.submissionRef,
        ),
        observation,
      )
      return true
    },
    async rereadTerminalForSubmission(request: {
      readonly submissionRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(request.submissionRef)
      const observation = await readExact(
        input.objectPort,
        recordPath('terminal-observations-by-submission', ref),
        assertCanonicalSam31QualificationImageSupplyChainObservation,
      )
      if (observation && !sameRef(observation.submissionRef, ref)) {
        throw new Error('SAM 3.1 supply-chain observation ref changed.')
      }
      return observation
    },
  })
}

export function
createCanonicalSam31QualificationImageSupplyChainBuildRuntime(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly authenticatedTransport?: ReturnType<
    typeof createCanonicalSam31GoogleCloudBuildAuthenticatedTransport
  >
  readonly now?: () => string
}) {
  const repository =
    createCanonicalSam31QualificationImageSupplyChainBuildRepository({
      objectPort: input.objectPort,
    })
  const phase = createCanonicalSam31QualificationImageSupplyChainBuildPhase({
    admissionReadPort: repository,
    statePort: repository,
    authenticatedTransport: input.authenticatedTransport
      ?? createCanonicalSam31GoogleCloudBuildAuthenticatedTransport(),
    now: input.now,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_BUILD_RUNTIME_VERSION,
    cloudSupplyChainBuildOnly: true as const,
    developerMachineModelCheckpointCudaOrGpuRuntimeInstallAllowed:
      false as const,
    repository,
    persistAdmissionCreateOnly: repository.persistAdmissionCreateOnly,
    startOneSupplyChainBuild: phase.startOneSupplyChainBuild,
    async observeOnePersistedSupplyChainBuild(request: {
      readonly admissionRef: z.infer<typeof refSchema>
      readonly submissionRef: z.infer<typeof refSchema>
    }) {
      const admission = await repository
        .rereadQualificationImageSupplyChainAdmission({
          admissionRef: request.admissionRef,
        })
      const submission = await repository.rereadSubmission({
        submissionRef: request.submissionRef,
      })
      if (!admission || !submission) {
        throw new Error('SAM 3.1 supply-chain lineage is absent.')
      }
      if (
        !sameRef(
          qualificationImageSupplyChainAdmissionReference(admission),
          request.admissionRef,
        )
        || !sameRef(
          qualificationImageSupplyChainSubmissionReference(submission),
          request.submissionRef,
        )
        || !sameRef(submission.admissionRef, request.admissionRef)
      ) throw new Error('SAM 3.1 supply-chain lineage crossed.')
      const existing = await repository.rereadTerminalForSubmission({
        submissionRef: request.submissionRef,
      })
      if (existing) return existing
      const observation = await phase.observeOneSupplyChainBuild({
        admission,
        submission,
      })
      if (!observation.durableTerminalObservationCreated) return observation
      const reread = await repository.rereadTerminalForSubmission({
        submissionRef: request.submissionRef,
      })
      if (!reread || reread.observationHash !== observation.observationHash) {
        throw new Error('SAM 3.1 supply-chain terminal was not reread.')
      }
      return reread
    },
  })
}

export function
createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime(input: {
  readonly storage?: Storage
  readonly authenticatedTransport?: ReturnType<
    typeof createCanonicalSam31GoogleCloudBuildAuthenticatedTransport
  >
  readonly now?: () => string
} = {}) {
  const storage = input.storage ?? new Storage({ projectId: 'reeditpro' })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  return Object.freeze({
    ...createCanonicalSam31QualificationImageSupplyChainBuildRuntime({
      objectPort,
      authenticatedTransport: input.authenticatedTransport,
      now: input.now,
    }),
    projectId: 'reeditpro' as const,
    controlPlaneStateBucketName: CONTROL_BUCKET,
    persistenceMode: 'private_gcs_create_only_exact_reread' as const,
  })
}

function recordPath(kind: string, ref: z.infer<typeof refSchema>): string {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return `${STATE_PREFIX}/${kind}/${idHash}/${ref.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = recordBody(value)
  const disposition = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: sha256(body),
  })
  const reread = await port.readExact(path)
  if (
    !reread
    || !reread.equals(body)
    || !['created', 'already_exists'].includes(disposition)
  ) throw new Error('SAM 3.1 supply-chain record reread changed.')
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  assertValue: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 supply-chain record JSON is invalid.')
  }
  const parsed = assertValue(value)
  if (!recordBody(parsed).equals(body)) {
    throw new Error('SAM 3.1 supply-chain record bytes changed.')
  }
  return parsed
}

function recordBody(value: unknown): Buffer {
  assertPlainSerializedData(value, 'sam31_supply_chain_record')
  return Buffer.from(stableAuthorityStringify(value), 'utf8')
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
