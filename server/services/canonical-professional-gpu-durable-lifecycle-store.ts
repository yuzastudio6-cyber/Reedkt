import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuAdmissionConsumption,
  assertCanonicalProfessionalGpuExecutionEnvelope,
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  type CanonicalProfessionalGpuAdmissionConsumption,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobLifecycleStore,
  type CanonicalProfessionalGpuJobTerminal,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalGpuFundedLaunchBinding,
  assertCanonicalProfessionalGpuFundedPrelaunch,
  assertCanonicalProfessionalGpuFundedTerminalBinding,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_DURABLE_LIFECYCLE_STORE_VERSION =
  'canonical-professional-gpu-durable-lifecycle-store-v1' as const

const DEFAULT_PREFIX = 'private/canonical-professional-gpu/v1/lifecycle'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024

export type CanonicalProfessionalGpuDurableLifecycleStore =
  CanonicalProfessionalGpuJobLifecycleStore
  & CanonicalProfessionalGpuFundedJobLifecycleStore
  & {
    readonly schemaVersion:
      typeof CANONICAL_PROFESSIONAL_GPU_DURABLE_LIFECYCLE_STORE_VERSION
    readonly evidenceClass:
      'create_only_exact_reread_professional_gpu_lifecycle'
    rereadAdmissionConsumption(input: {
      readonly admissionId: string
    }): Promise<CanonicalProfessionalGpuAdmissionConsumption | null>
    rereadLaunchRecord(input: {
      readonly launchRecordId: string
    }): Promise<CanonicalProfessionalGpuJobLaunch | null>
    rereadTerminalRecord(input: {
      readonly terminalRecordId: string
    }): Promise<CanonicalProfessionalGpuJobTerminal | null>
  }

/**
 * Restart-safe store for the complete customer-funded GPU attempt chain.
 * Every transition is create-only and then independently reread through the
 * same immutable object port before it can be used by a later transition.
 */
export function createCanonicalProfessionalGpuDurableLifecycleStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalProfessionalGpuDurableLifecycleStore {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const store: CanonicalProfessionalGpuDurableLifecycleStore = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_DURABLE_LIFECYCLE_STORE_VERSION,
    evidenceClass: 'create_only_exact_reread_professional_gpu_lifecycle',

    consumeAdmissionCreateOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(prefix, 'admission-consumptions', record.admissionRef.id),
      record: assertCanonicalProfessionalGpuAdmissionConsumption(record),
      parse: assertCanonicalProfessionalGpuAdmissionConsumption,
    }),

    createExecutionEnvelopeOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(prefix, 'execution-envelopes', record.envelopeId),
      record: assertCanonicalProfessionalGpuExecutionEnvelope(record),
      parse: assertCanonicalProfessionalGpuExecutionEnvelope,
    }),

    rereadExecutionEnvelope: ({ envelopeId }) => readValidated({
      port: input.objectPort,
      path: recordPath(prefix, 'execution-envelopes', envelopeId),
      parse: assertCanonicalProfessionalGpuExecutionEnvelope,
    }),

    createLaunchRecordOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(prefix, 'launches', record.launchRecordId),
      record: assertCanonicalProfessionalGpuJobLaunch(record),
      parse: assertCanonicalProfessionalGpuJobLaunch,
    }),

    createTerminalRecordOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(prefix, 'terminals', record.terminalRecordId),
      record: assertCanonicalProfessionalGpuJobTerminal(record),
      parse: assertCanonicalProfessionalGpuJobTerminal,
    }),

    createPrelaunchAuthorizationOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(
        prefix,
        'funded-prelaunch-authorizations',
        record.prelaunchAuthorizationId,
      ),
      record: assertCanonicalProfessionalGpuFundedPrelaunch(record),
      parse: assertCanonicalProfessionalGpuFundedPrelaunch,
    }),

    rereadPrelaunchAuthorization: ({ prelaunchAuthorizationId }) =>
      readValidated({
        port: input.objectPort,
        path: recordPath(
          prefix,
          'funded-prelaunch-authorizations',
          prelaunchAuthorizationId,
        ),
        parse: assertCanonicalProfessionalGpuFundedPrelaunch,
      }),

    createLaunchBindingOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(prefix, 'funded-launch-bindings', record.launchBindingId),
      record: assertCanonicalProfessionalGpuFundedLaunchBinding(record),
      parse: assertCanonicalProfessionalGpuFundedLaunchBinding,
    }),

    rereadLaunchBinding: ({ launchBindingId }) => readValidated({
      port: input.objectPort,
      path: recordPath(prefix, 'funded-launch-bindings', launchBindingId),
      parse: assertCanonicalProfessionalGpuFundedLaunchBinding,
    }),

    createTerminalBindingOnly: ({ record }) => createAndVerify({
      port: input.objectPort,
      path: recordPath(
        prefix,
        'funded-terminal-bindings',
        record.terminalBindingId,
      ),
      record: assertCanonicalProfessionalGpuFundedTerminalBinding(record),
      parse: assertCanonicalProfessionalGpuFundedTerminalBinding,
    }),

    rereadTerminalBinding: ({ terminalBindingId }) => readValidated({
      port: input.objectPort,
      path: recordPath(
        prefix,
        'funded-terminal-bindings',
        terminalBindingId,
      ),
      parse: assertCanonicalProfessionalGpuFundedTerminalBinding,
    }),

    rereadAdmissionConsumption: ({ admissionId }) => readValidated({
      port: input.objectPort,
      path: recordPath(prefix, 'admission-consumptions', admissionId),
      parse: assertCanonicalProfessionalGpuAdmissionConsumption,
    }),

    rereadLaunchRecord: ({ launchRecordId }) => readValidated({
      port: input.objectPort,
      path: recordPath(prefix, 'launches', launchRecordId),
      parse: assertCanonicalProfessionalGpuJobLaunch,
    }),

    rereadTerminalRecord: ({ terminalRecordId }) => readValidated({
      port: input.objectPort,
      path: recordPath(prefix, 'terminals', terminalRecordId),
      parse: assertCanonicalProfessionalGpuJobTerminal,
    }),
  }
  return Object.freeze(store)
}

async function createAndVerify<T>(input: {
  readonly port: CanonicalCreateOnlyJsonObjectPort
  readonly path: string
  readonly record: T
  readonly parse: (value: unknown) => T
}): Promise<'created' | 'already_exists'> {
  const body = serialize(input.record)
  const status = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: sha256(body),
  })
  const reread = await readValidated({
    port: input.port,
    path: input.path,
    parse: input.parse,
  })
  if (!reread || stableAuthorityStringify(reread)
    !== stableAuthorityStringify(input.record)) {
    throw new Error('Professional GPU lifecycle create-only reread changed.')
  }
  return status
}

async function readValidated<T>(input: {
  readonly port: CanonicalCreateOnlyJsonObjectPort
  readonly path: string
  readonly parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Professional GPU lifecycle record size is invalid.')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Professional GPU lifecycle record JSON is invalid.')
  }
  return input.parse(untrusted)
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Professional GPU lifecycle record size is invalid.')
  }
  return body
}

function recordPath(
  prefix: string,
  kind: string,
  id: string,
): string {
  requireSafeId(id)
  return `${prefix}/${kind}/${sha256(Buffer.from(id, 'utf8'))}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw new Error('Professional GPU lifecycle store prefix is invalid.')
  return normalized
}

function requireSafeId(value: string): void {
  if (!SAFE_ID.test(value) || value.includes('..')) {
    throw new Error('Professional GPU lifecycle record ID is invalid.')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw new Error('Professional GPU lifecycle object port is unavailable.')
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
