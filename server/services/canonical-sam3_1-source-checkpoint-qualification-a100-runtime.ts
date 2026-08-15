import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100Admission,
  assertCanonicalSam31QualificationA100JobObservation,
  assertCanonicalSam31QualificationA100Submission,
  type CanonicalSam31QualificationA100Admission,
  type CanonicalSam31QualificationA100JobObservation,
  type CanonicalSam31QualificationA100StatePort,
  type CanonicalSam31QualificationA100Submission,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_A100_STATE_REPOSITORY_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-a100-state-repository-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/source-checkpoint-qualification/v1/a100-lifecycle'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024

export type CanonicalSam31QualificationA100StateRepository =
  CanonicalSam31QualificationA100StatePort & {
    readonly schemaVersion:
      typeof CANONICAL_SAM3_1_QUALIFICATION_A100_STATE_REPOSITORY_VERSION
    readonly evidenceClass: 'private_gcs_create_only_exact_reread'
  }

/** Restart-safe create-only lifecycle store for one platform qualification. */
export function createCanonicalSam31QualificationA100StateRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31QualificationA100StateRepository {
  assertPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_A100_STATE_REPOSITORY_VERSION,
    evidenceClass: 'private_gcs_create_only_exact_reread',

    consumeAdmissionCreateOnly: ({ admission }: {
      readonly admission: CanonicalSam31QualificationA100Admission
    }) => persist({
      port: input.objectPort,
      path: pathFor(prefix, 'admissions', admission.attemptId),
      value: assertCanonicalSam31QualificationA100Admission(admission),
      parse: assertCanonicalSam31QualificationA100Admission,
    }),

    rereadAdmission: ({ attemptId }: { readonly attemptId: string }) => read({
      port: input.objectPort,
      path: pathFor(prefix, 'admissions', attemptId),
      parse: assertCanonicalSam31QualificationA100Admission,
    }),

    persistSubmissionCreateOnly: ({ submission }: {
      readonly submission: CanonicalSam31QualificationA100Submission
    }) => persist({
      port: input.objectPort,
      path: pathFor(prefix, 'submissions', submission.attemptId),
      value: assertCanonicalSam31QualificationA100Submission(submission),
      parse: assertCanonicalSam31QualificationA100Submission,
    }),

    rereadSubmission: ({ attemptId }: { readonly attemptId: string }) => read({
      port: input.objectPort,
      path: pathFor(prefix, 'submissions', attemptId),
      parse: assertCanonicalSam31QualificationA100Submission,
    }),

    persistTerminalObservationCreateOnly: ({ observation }: {
      readonly observation: CanonicalSam31QualificationA100JobObservation
    }) => persist({
      port: input.objectPort,
      path: pathFor(prefix, 'terminals', observation.attemptId),
      value: assertCanonicalSam31QualificationA100JobObservation(observation),
      parse: assertCanonicalSam31QualificationA100JobObservation,
    }),

    rereadTerminalObservation: ({ attemptId }: {
      readonly attemptId: string
    }) => read({
      port: input.objectPort,
      path: pathFor(prefix, 'terminals', attemptId),
      parse: assertCanonicalSam31QualificationA100JobObservation,
    }),
  })
}

async function persist<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  value: T
  parse: (value: unknown) => T
}): Promise<'created' | 'already_exists'> {
  const body = serialize(input.value)
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: sha256(body),
  })
  const reread = await read({
    port: input.port,
    path: input.path,
    parse: input.parse,
  })
  if (!reread || stableAuthorityStringify(reread) !==
    stableAuthorityStringify(input.value)) {
    throw new Error('SAM 3.1 qualification state exact reread changed.')
  }
  return disposition
}

async function read<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 qualification state record size is invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 qualification state JSON is invalid.')
  }
  return input.parse(value)
}

function pathFor(prefix: string, kind: string, attemptId: string): string {
  if (!SAFE_ID.test(attemptId) || attemptId.includes('..')) {
    throw new Error('SAM 3.1 qualification attempt ID is invalid.')
  }
  return `${prefix}/${kind}/${sha256(Buffer.from(attemptId, 'utf8'))}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw new Error('SAM 3.1 qualification state prefix is invalid.')
  return normalized
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 qualification state record size is invalid.')
  }
  return body
}

function assertPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification state object port unavailable.')
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
