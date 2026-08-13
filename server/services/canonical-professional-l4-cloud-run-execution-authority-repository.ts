import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  type CanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobLaunch,
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_EXECUTION_BINDING_VERSION,
  canonicalProfessionalGoogleCloudGpuExecutionBindingSchema,
  type CanonicalProfessionalGoogleCloudGpuExecutionReadPort,
} from './canonical-professional-google-cloud-gpu-terminal-observation-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_L4_CLOUD_RUN_EXECUTION_AUTHORITY_VERSION =
  'canonical-professional-l4-cloud-run-execution-authority-v1' as const
export const CANONICAL_PROFESSIONAL_L4_CLOUD_RUN_EXECUTION_AUTHORITY_PORT_VERSION =
  'canonical-professional-l4-cloud-run-execution-authority-port-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/l4-cloud-run-executions/v1'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const runtimeRegionSchema = z.enum(['us-central1', 'europe-west4'])
const routeIdSchema = z.enum(['l4_standard_primary', 'l4_heavy_fallback'])
const cloudRunJobResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
)
const cloudRunOperationResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u,
)

const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_L4_CLOUD_RUN_EXECUTION_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_l4_cloud_run_execution_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  executionEnvelopeRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  admissionConsumptionRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  cloudJobCreateRequestRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema,
  toolId: safeId,
  operationId: safeId,
  routeId: routeIdSchema,
  projectId: z.literal('reeditpro'),
  runtimeRegion: runtimeRegionSchema,
  executionTarget: z.literal('google_cloud_run_l4_job'),
  accelerator: z.literal('nvidia_l4'),
  immutableImageDigest: prefixedSha256,
  expectedCloudRunJobResource: cloudRunJobResourceSchema,
  providerOperationResource: cloudRunOperationResourceSchema,
  providerRunRequestAccepted: z.literal(true),
  providerOutcomeAtAcceptance: z.literal('unknown'),
  persistedCreateOnlyBeforeLaunchAcceptanceReturned: z.literal(true),
  exactRepositoryRereadBeforeLaunchAcceptanceReturned: z.literal(true),
  retryAfterUnknownPersistenceOutcomeAllowed: z.literal(false),
  callerProviderResourceAccepted: z.literal(false),
  browserLocalStateAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  acceptedAt: timestamp,
}).strict().superRefine((record, context) => {
  const prefix = `projects/reeditpro/locations/${record.runtimeRegion}/`
  if (!record.expectedCloudRunJobResource.startsWith(`${prefix}jobs/`)
    || !record.providerOperationResource.startsWith(`${prefix}operations/`)) {
    context.addIssue({
      code: 'custom',
      message: 'L4 Cloud Run execution authority lost exact region scope.',
    })
  }
})
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()

export type CanonicalProfessionalL4CloudRunExecutionAuthority = z.infer<
  typeof recordSchema
>

export interface CanonicalProfessionalL4CloudRunExecutionAuthorityPort {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_L4_CLOUD_RUN_EXECUTION_AUTHORITY_PORT_VERSION
  persistAcceptedExecutionCreateOnly(input: Readonly<{
    executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
    admissionRef: z.infer<typeof evidenceRefSchema>
    admissionConsumptionRef: z.infer<typeof evidenceRefSchema>
    runtimeReleaseRef: z.infer<typeof evidenceRefSchema>
    cloudJobCreateRequestRef: z.infer<typeof evidenceRefSchema>
    cloudJobExecutionRef: z.infer<typeof evidenceRefSchema>
    toolId: string
    operationId: string
    routeId: 'l4_standard_primary' | 'l4_heavy_fallback'
    runtimeRegion: 'us-central1' | 'europe-west4'
    immutableImageDigest: string
    expectedCloudRunJobResource: string
    providerOperationResource: string
    acceptedAt: string
  }>): Promise<CanonicalProfessionalL4CloudRunExecutionAuthority>
  rereadAcceptedExecution(input: Readonly<{
    executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  }>): Promise<CanonicalProfessionalL4CloudRunExecutionAuthority | null>
}

type PersistAcceptedExecutionInput = Parameters<
  CanonicalProfessionalL4CloudRunExecutionAuthorityPort[
    'persistAcceptedExecutionCreateOnly'
  ]
>[0]
type RereadAcceptedExecutionInput = Parameters<
  CanonicalProfessionalL4CloudRunExecutionAuthorityPort[
    'rereadAcceptedExecution'
  ]
>[0]
type RereadExecutionBindingInput = Parameters<
  CanonicalProfessionalGoogleCloudGpuExecutionReadPort[
    'rereadPrivateExecutionBinding'
  ]
>[0]

export function createCanonicalProfessionalL4CloudRunExecutionAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalProfessionalL4CloudRunExecutionAuthorityPort {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_PROFESSIONAL_L4_CLOUD_RUN_EXECUTION_AUTHORITY_PORT_VERSION,
    async persistAcceptedExecutionCreateOnly(
      untrusted: PersistAcceptedExecutionInput,
    ) {
      assertPlainSerializedData(untrusted, 'l4_execution_authority_input')
      const payload = recordWithoutHashSchema.parse({
        ...structuredClone(untrusted),
        schemaVersion:
          CANONICAL_PROFESSIONAL_L4_CLOUD_RUN_EXECUTION_AUTHORITY_VERSION,
        source:
          'canonical_server_professional_l4_cloud_run_execution_repository',
        evidenceClass: 'canonical_private_reread',
        projectId: 'reeditpro',
        executionTarget: 'google_cloud_run_l4_job',
        accelerator: 'nvidia_l4',
        providerRunRequestAccepted: true,
        providerOutcomeAtAcceptance: 'unknown',
        persistedCreateOnlyBeforeLaunchAcceptanceReturned: true,
        exactRepositoryRereadBeforeLaunchAcceptanceReturned: true,
        retryAfterUnknownPersistenceOutcomeAllowed: false,
        callerProviderResourceAccepted: false,
        browserLocalStateAccepted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, record.executionEnvelopeRef),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      if (disposition !== 'created' && disposition !== 'already_exists') {
        throw new TypeError('L4 execution authority persistence failed.')
      }
      const reread = await readRecord({
        objectPort: input.objectPort,
        objectPath: recordPath(prefix, record.executionEnvelopeRef),
      })
      if (!reread || reread.recordHash !== record.recordHash) {
        throw new TypeError('L4 execution authority exact reread changed.')
      }
      return structuredClone(reread)
    },
    async rereadAcceptedExecution(untrusted: RereadAcceptedExecutionInput) {
      assertPlainSerializedData(untrusted, 'l4_execution_authority_read')
      const query = z.object({ executionEnvelopeRef: evidenceRefSchema })
        .strict().parse(untrusted)
      const record = await readRecord({
        objectPort: input.objectPort,
        objectPath: recordPath(prefix, query.executionEnvelopeRef),
      })
      if (!record) return null
      if (!sameRef(record.executionEnvelopeRef, query.executionEnvelopeRef)) {
        throw new TypeError('L4 execution authority query changed.')
      }
      return structuredClone(record)
    },
  })
}

export function createCanonicalProfessionalL4CloudRunExecutionReadPort(
  input: {
    readonly repository: Pick<
      CanonicalProfessionalL4CloudRunExecutionAuthorityPort,
      'rereadAcceptedExecution'
    >
  },
): CanonicalProfessionalGoogleCloudGpuExecutionReadPort {
  return Object.freeze({
    async rereadPrivateExecutionBinding({
      launch: untrustedLaunch,
    }: RereadExecutionBindingInput) {
      const launch = assertCanonicalProfessionalGpuJobLaunch(untrustedLaunch)
      if (launch.executionTarget !== 'google_cloud_run_l4_job'
        || launch.cloudJobExecutionRef === null) {
        throw new TypeError('L4 execution read requires one L4 launch.')
      }
      const record = await input.repository.rereadAcceptedExecution({
        executionEnvelopeRef: launch.executionEnvelopeRef,
      })
      if (!record) return null
      assertRecordMatchesLaunch(record, launch)
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_EXECUTION_BINDING_VERSION,
        source: 'canonical_server_professional_gpu_cloud_execution_repository' as const,
        evidenceClass: 'canonical_private_reread' as const,
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        cloudJobExecutionRef: record.cloudJobExecutionRef,
        projectId: 'reeditpro' as const,
        runtimeRegion: record.runtimeRegion,
        routeId: record.routeId,
        executionTarget: 'google_cloud_run_l4_job' as const,
        accelerator: 'nvidia_l4' as const,
        providerOperationResource: record.providerOperationResource,
        expectedCloudRunJobResource: record.expectedCloudRunJobResource,
        providerExecutionPersistedBeforeTerminalRead: true as const,
        callerProviderResourceAccepted: false as const,
        browserLocalStateAccepted: false as const,
      }
      return canonicalProfessionalGoogleCloudGpuExecutionBindingSchema.parse({
        ...payload,
        bindingHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertCanonicalProfessionalL4CloudRunExecutionAuthority(
  value: unknown,
): CanonicalProfessionalL4CloudRunExecutionAuthority {
  assertPlainSerializedData(value, 'l4_cloud_run_execution_authority')
  const record = recordSchema.parse(value)
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('L4 Cloud Run execution authority hash changed.')
  }
  return structuredClone(record)
}

function assertRecordMatchesLaunch(
  record: CanonicalProfessionalL4CloudRunExecutionAuthority,
  launch: CanonicalProfessionalGpuJobLaunch,
): void {
  if (!sameRef(record.executionEnvelopeRef, launch.executionEnvelopeRef)
    || !sameRef(record.admissionRef, launch.admissionRef)
    || !sameRef(record.admissionConsumptionRef,
      launch.admissionConsumptionRef)
    || !sameRef(record.runtimeReleaseRef, launch.runtimeReleaseRef)
    || !sameRef(record.cloudJobCreateRequestRef,
      launch.cloudJobCreateRequestRef)
    || launch.cloudJobExecutionRef === null
    || !sameRef(record.cloudJobExecutionRef, launch.cloudJobExecutionRef)
    || record.toolId !== launch.toolId
    || record.operationId !== launch.operationId
    || record.routeId !== launch.routeId
    || record.runtimeRegion !== launch.runtimeRegion
    || record.immutableImageDigest !== launch.immutableImageDigest
    || Date.parse(record.acceptedAt) !== Date.parse(launch.launchedAt)) {
    throw new TypeError('L4 execution authority differs from launch.')
  }
}

async function readRecord(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
}): Promise<CanonicalProfessionalL4CloudRunExecutionAuthority | null> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (body === null) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > 1024 * 1024) {
    throw new TypeError('L4 execution authority body is invalid.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new TypeError('L4 execution authority JSON is invalid.')
  }
  return assertCanonicalProfessionalL4CloudRunExecutionAuthority(parsed)
}

function recordPath(
  prefix: string,
  executionEnvelopeRef: z.infer<typeof evidenceRefSchema>,
): string {
  const digest = sha256AuthorityValue({
    domain: 'canonical_professional_l4_execution_authority_lookup_v1',
    executionEnvelopeRef,
  })
  return `${prefix}/${digest}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, '')
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,900}$/u.test(normalized)
    || normalized.includes('..') || normalized.includes('//')) {
    throw new TypeError('L4 execution authority prefix is invalid.')
  }
  return normalized
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new TypeError('L4 execution authority object port is unavailable.')
  }
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}
