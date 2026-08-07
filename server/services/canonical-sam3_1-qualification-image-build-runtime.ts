import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  type CanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
  createCanonicalSam31QualificationImageBuildPhase,
  type CanonicalSam31QualificationImageBuildSubmission,
  type CanonicalSam31QualificationImageBuildTerminal,
} from './canonical-sam3_1-qualification-image-build-phase'
import {
  createCanonicalSam31QualificationImageAuthorityRepository,
} from './canonical-sam3_1-qualification-image-authority-runtime'
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

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RUNTIME_VERSION =
  'canonical-sam3_1-qualification-image-build-runtime-v1' as const

const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const STATE_PREFIX =
  'private/sam3_1/qualification-image-build-phase/v1' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-qualification-image-build-consumption-v1',
  ),
  authorityRef: refSchema,
  buildRequestHash: rawSha256,
  consumedAt: z.string().datetime({ offset: true }),
  createOnly: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  checkpointIncludedInImage: z.literal(false),
  developerMachineModelInstallPerformed: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict()

export function createCanonicalSam31QualificationImageBuildRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
}) {
  const authorityRepository =
    createCanonicalSam31QualificationImageAuthorityRepository(input)
  return Object.freeze({
    async rereadQualificationImageBuildAuthority(request: {
      readonly authorityRef: z.infer<typeof refSchema>
    }) {
      return authorityRepository.rereadBuildAuthority(request)
    },
    async consumeQualificationAuthorityCreateOnly(untrusted: {
      readonly authorityRef: z.infer<typeof refSchema>
      readonly buildRequestHash: string
      readonly consumedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'sam31_qualification_image_consumption')
      const inputValue = z.object({
        authorityRef: refSchema,
        buildRequestHash: rawSha256,
        consumedAt: z.string().datetime({ offset: true }),
      }).strict().parse(untrusted)
      const payload = consumptionWithoutHashSchema.parse({
        schemaVersion:
          'canonical-sam3_1-qualification-image-build-consumption-v1',
        ...inputValue,
        createOnly: true,
        automaticRetryAllowed: false,
        checkpointIncludedInImage: false,
        developerMachineModelInstallPerformed: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        runtimeReleaseGranted: false,
        productionAuthorityGranted: false,
      })
      const record = consumptionSchema.parse({
        ...payload,
        consumptionHash: sha256AuthorityValue(payload),
      })
      const body = recordBody(record)
      const path = recordPath('consumptions', inputValue.authorityRef)
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: sha256(body),
      })
      if (disposition === 'already_exists') return false
      const reread = await input.objectPort.readExact(path)
      if (!reread || !reread.equals(body)) {
        throw new Error('SAM 3.1 qualification consumption reread changed.')
      }
      return true
    },
    async persistQualificationSubmissionCreateOnly(request: {
      readonly submission: CanonicalSam31QualificationImageBuildSubmission
    }) {
      const submission = assertCanonicalSam31QualificationImageBuildSubmission(
        request.submission,
      )
      await persistExact(
        input.objectPort,
        recordPath('submissions', submissionRef(submission)),
        submission,
      )
      return true
    },
    async persistQualificationTerminalCreateOnly(request: {
      readonly observation: CanonicalSam31QualificationImageBuildTerminal
    }) {
      const observation = assertCanonicalSam31QualificationImageBuildTerminal(
        request.observation,
      )
      await persistExact(
        input.objectPort,
        recordPath('terminal-observations', terminalRef(observation)),
        observation,
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
        assertCanonicalSam31QualificationImageBuildSubmission,
      )
      if (submission && !sameRef(submissionRef(submission), ref)) {
        throw new Error('SAM 3.1 qualification submission ref changed.')
      }
      return submission
    },
    async rereadTerminal(request: {
      readonly terminalRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(request.terminalRef)
      const terminal = await readExact(
        input.objectPort,
        recordPath('terminal-observations', ref),
        assertCanonicalSam31QualificationImageBuildTerminal,
      )
      if (terminal && !sameRef(terminalRef(terminal), ref)) {
        throw new Error('SAM 3.1 qualification terminal ref changed.')
      }
      return terminal
    },
  })
}

export function createCanonicalSam31GcpQualificationImageBuildRuntime(input: {
  readonly storage?: Storage
  readonly observeCreateResponse?: Parameters<
    typeof createCanonicalSam31QualificationImageBuildPhase
  >[0]['observeCreateResponse']
  readonly now?: () => string
} = {}) {
  const storage = input.storage ?? new Storage({ projectId: 'reeditpro' })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  const repository = createCanonicalSam31QualificationImageBuildRepository({
    objectPort,
  })
  const phase = createCanonicalSam31QualificationImageBuildPhase({
    authorityReadPort: repository,
    statePort: repository,
    authenticatedTransport:
      createCanonicalSam31GoogleCloudBuildAuthenticatedTransport(),
    observeCreateResponse: input.observeCreateResponse,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_IMAGE_BUILD_RUNTIME_VERSION,
    projectId: 'reeditpro' as const,
    persistenceMode: 'private_gcs_create_only_exact_reread' as const,
    developerMachineModelInstallPerformed: false as const,
    repository,
    startOneQualificationImageBuild:
      phase.startOneQualificationImageBuild,
    async observeOneQualificationImageBuild(request: {
      readonly authorityRef: z.infer<typeof refSchema>
      readonly submissionRef: z.infer<typeof refSchema>
    }) {
      const authority = await repository
        .rereadQualificationImageBuildAuthority({
          authorityRef: request.authorityRef,
        })
      const submission = await repository.rereadSubmission({
        submissionRef: request.submissionRef,
      })
      if (!authority || !submission) {
        throw new Error('SAM 3.1 qualification build lineage is absent.')
      }
      if (
        !sameRef(authorityRef(authority), request.authorityRef)
        || !sameRef(submissionRef(submission), request.submissionRef)
      ) throw new Error('SAM 3.1 qualification build lineage crossed.')
      const observation = await phase.observeOneQualificationImageBuild({
        authority,
        submission,
      })
      if (!observation.durableTerminalObservationCreated) return observation
      const reread = await repository.rereadTerminal({
        terminalRef: terminalRef(observation),
      })
      if (!reread || reread.observationHash !== observation.observationHash) {
        throw new Error('SAM 3.1 qualification terminal was not reread.')
      }
      return reread
    },
  })
}

export function canonicalSam31QualificationImageSubmissionRef(
  submission: CanonicalSam31QualificationImageBuildSubmission,
) {
  return submissionRef(
    assertCanonicalSam31QualificationImageBuildSubmission(submission),
  )
}

function authorityRef(authority: CanonicalSam31QualificationImageBuildAuthority) {
  return {
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function submissionRef(
  submission: CanonicalSam31QualificationImageBuildSubmission,
) {
  return {
    id: `sam31-qualification-image-submission-${submission.submissionHash.slice(0, 20)}`,
    version: 1 as const,
    contentHash: `sha256:${submission.submissionHash}` as const,
  }
}

function terminalRef(terminal: CanonicalSam31QualificationImageBuildTerminal) {
  return {
    id: `sam31-qualification-image-terminal-${terminal.observationHash.slice(0, 20)}`,
    version: 1 as const,
    contentHash: `sha256:${terminal.observationHash}` as const,
  }
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
  await port.createOnly({
    objectPath: path,
    body,
    contentSha256: sha256(body),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('SAM 3.1 qualification build record reread changed.')
  }
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
    throw new Error('SAM 3.1 qualification build record JSON is invalid.')
  }
  const parsed = assertValue(value)
  if (!recordBody(parsed).equals(body)) {
    throw new Error('SAM 3.1 qualification build record bytes changed.')
  }
  return parsed
}

function recordBody(value: unknown): Buffer {
  assertPlainSerializedData(value, 'sam31_qualification_build_record')
  return Buffer.from(stableAuthorityStringify(value), 'utf8')
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
