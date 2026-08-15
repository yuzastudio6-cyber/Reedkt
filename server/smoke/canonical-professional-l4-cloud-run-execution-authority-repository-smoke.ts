import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
  canonicalProfessionalGpuJobLaunchSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalL4CloudRunExecutionAuthority,
  createCanonicalProfessionalL4CloudRunExecutionAuthorityRepository,
  createCanonicalProfessionalL4CloudRunExecutionReadPort,
} from '../services/canonical-professional-l4-cloud-run-execution-authority-repository'
import {
  assertExecutionBinding,
} from '../services/canonical-professional-google-cloud-gpu-terminal-observation-port'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const objects = new Map<string, Buffer>()
const objectPort = {
  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }) {
    assert.equal(
      createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256,
    )
    const existing = objects.get(input.objectPath)
    if (existing) {
      if (!existing.equals(input.body)) {
        throw new Error('synthetic_create_only_collision')
      }
      return 'already_exists' as const
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created' as const
  },
  async readExact(objectPath: string) {
    const value = objects.get(objectPath)
    return value ? Buffer.from(value) : null
  },
}
const repository =
  createCanonicalProfessionalL4CloudRunExecutionAuthorityRepository({
    objectPort,
  })

const executionEnvelopeRef = ref('l4-envelope', 'l4-envelope')
const admissionRef = ref('l4-admission', 'l4-admission')
const admissionConsumptionRef = ref('l4-consumption', 'l4-consumption')
const runtimeReleaseRef = ref('l4-release', 'l4-release')
const cloudJobCreateRequestRef = ref('l4-create', 'l4-create')
const cloudJobExecutionRef = ref('l4-operation', 'l4-operation')
const acceptedAt = '2026-08-13T13:00:00.000Z'
const persisted = await repository.persistAcceptedExecutionCreateOnly({
  executionEnvelopeRef,
  admissionRef,
  admissionConsumptionRef,
  runtimeReleaseRef,
  cloudJobCreateRequestRef,
  cloudJobExecutionRef,
  toolId: 'kornia',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary',
  runtimeRegion: 'us-central1',
  immutableImageDigest: `sha256:${sha('l4-image')}`,
  expectedCloudRunJobResource:
    'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-l4-qa',
  providerOperationResource:
    'projects/reeditpro/locations/us-central1/operations/l4-op-1',
  acceptedAt,
})
assert.equal(persisted.providerRunRequestAccepted, true)
assert.equal(persisted.providerOutcomeAtAcceptance, 'unknown')
assert.equal(
  persisted.persistedCreateOnlyBeforeLaunchAcceptanceReturned,
  true,
)
assert.equal(persisted.customerCreditsMutated, false)

const replay = await repository.persistAcceptedExecutionCreateOnly({
  executionEnvelopeRef,
  admissionRef,
  admissionConsumptionRef,
  runtimeReleaseRef,
  cloudJobCreateRequestRef,
  cloudJobExecutionRef,
  toolId: 'kornia',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary',
  runtimeRegion: 'us-central1',
  immutableImageDigest: `sha256:${sha('l4-image')}`,
  expectedCloudRunJobResource:
    'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-l4-qa',
  providerOperationResource:
    'projects/reeditpro/locations/us-central1/operations/l4-op-1',
  acceptedAt,
})
assert.equal(replay.recordHash, persisted.recordHash)

const reread = assertCanonicalProfessionalL4CloudRunExecutionAuthority(
  await repository.rereadAcceptedExecution({ executionEnvelopeRef }),
)
assert.equal(reread.recordHash, persisted.recordHash)

const launchPayload = {
  schemaVersion: CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  launchRecordId: 'l4-launch',
  admissionRef,
  admissionConsumptionRef,
  runtimeReleaseRef,
  executionEnvelopeRef,
  toolId: 'kornia',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary' as const,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_run_l4_job' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageDigest: `sha256:${sha('l4-image')}`,
  cloudJobCreateRequestRef,
  cloudJobExecutionRef,
  launchDisposition: 'job_created' as const,
  providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed' as const,
  createOnlyAdmissionConsumedBeforeLaunch: true as const,
  duplicateLaunchAllowed: false as const,
  unknownOutcomeRetryAllowed: false as const,
  noApprovedAdmissionMeansZeroGpuJobs: true as const,
  minimumIdleInstances: 0 as const,
  prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  launchedAt: acceptedAt,
}
const launch = canonicalProfessionalGpuJobLaunchSchema.parse({
  ...launchPayload,
  launchHash: sha256AuthorityValue(launchPayload),
})
const executionReadPort =
  createCanonicalProfessionalL4CloudRunExecutionReadPort({ repository })
const binding = assertExecutionBinding(
  await executionReadPort.rereadPrivateExecutionBinding({ launch }),
)
if (binding.executionTarget !== 'google_cloud_run_l4_job') {
  throw new Error('Expected the L4 Cloud Run execution binding.')
}
assert.equal(binding.providerExecutionPersistedBeforeTerminalRead, true)
assert.equal(binding.providerOperationResource,
  persisted.providerOperationResource)
assert.equal(binding.expectedCloudRunJobResource,
  persisted.expectedCloudRunJobResource)
assert.equal(binding.callerProviderResourceAccepted, false)

await assert.rejects(
  repository.persistAcceptedExecutionCreateOnly({
    executionEnvelopeRef,
    admissionRef,
    admissionConsumptionRef,
    runtimeReleaseRef,
    cloudJobCreateRequestRef,
    cloudJobExecutionRef: ref('other-operation', 'other-operation'),
    toolId: 'kornia',
    operationId: 'tool.kornia.refine_mask.v1',
    routeId: 'l4_standard_primary',
    runtimeRegion: 'us-central1',
    immutableImageDigest: `sha256:${sha('l4-image')}`,
    expectedCloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-l4-qa',
    providerOperationResource:
      'projects/reeditpro/locations/us-central1/operations/l4-op-2',
    acceptedAt,
  }),
  /collision/u,
)

await assert.rejects(
  repository.persistAcceptedExecutionCreateOnly({
    executionEnvelopeRef: ref('cross-region-envelope', 'cross-region'),
    admissionRef,
    admissionConsumptionRef,
    runtimeReleaseRef,
    cloudJobCreateRequestRef,
    cloudJobExecutionRef,
    toolId: 'kornia',
    operationId: 'tool.kornia.refine_mask.v1',
    routeId: 'l4_standard_primary',
    runtimeRegion: 'us-central1',
    immutableImageDigest: `sha256:${sha('l4-image')}`,
    expectedCloudRunJobResource:
      'projects/reeditpro/locations/europe-west4/jobs/weeditpro-sam31-l4-qa',
    providerOperationResource:
      'projects/reeditpro/locations/us-central1/operations/l4-op-cross',
    acceptedAt,
  }),
)

const mismatchedLaunchPayload = {
  ...launchPayload,
  cloudJobExecutionRef: ref('different-operation', 'different-operation'),
}
const mismatchedLaunch = canonicalProfessionalGpuJobLaunchSchema.parse({
  ...mismatchedLaunchPayload,
  launchHash: sha256AuthorityValue(mismatchedLaunchPayload),
})
await assert.rejects(
  executionReadPort.rereadPrivateExecutionBinding({
    launch: mismatchedLaunch,
  }),
  /differs from launch/u,
)

let accessorInvoked = false
const hostile: Record<string, unknown> = {}
Object.defineProperty(hostile, 'executionEnvelopeRef', {
  enumerable: true,
  get() {
    accessorInvoked = true
    return executionEnvelopeRef
  },
})
await assert.rejects(
  repository.persistAcceptedExecutionCreateOnly(hostile as never),
)
assert.equal(accessorInvoked, false)

console.log(JSON.stringify({
  smoke:
    'canonical-professional-l4-cloud-run-execution-authority-repository',
  checks: 24,
  providerOperationPersistedCreateOnly: true,
  exactRereadBeforeLaunchAcceptance: true,
  terminalBindingProjectedOnlyAfterLaunch: true,
  crossRegionAuthorityAccepted: false,
  collisionAccepted: false,
  callerProviderResourceAccepted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function ref(id: string, value: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha(value)}`,
  }
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
