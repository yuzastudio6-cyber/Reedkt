import { z } from 'zod'

import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_OBSERVATION_VERSION =
  'canonical-sam3_1-a100-qualification-foundation-observation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const SERVICE_ACCOUNT =
  'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com' as const
const PRIVATE_BUCKET =
  'reeditpro-production-sam31-qualification-private' as const
const KMS_KEY =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const
const NETWORK =
  'projects/reeditpro/global/networks/weeditpro-gpu-private' as const
const SUBNETWORK =
  'projects/reeditpro/regions/us-central1/subnetworks/weeditpro-gpu-private-us-central1' as const
const INSTANCE_TEMPLATE =
  'projects/reeditpro/global/instanceTemplates/weeditpro-sam31-qualification-a100-v1' as const
const BATCH_IMAGE =
  'projects/batch-custom-image/global/images/batch-debian-11-official-20260730-00-p01' as const
const BATCH_IMAGE_ID = '2466381682817372572' as const
const timestamp = z.string().datetime({ offset: true })
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const liveAuditSchema = z.object({
  audit: z.literal('weeditpro-visual-intelligence-live-prerequisites-v12'),
  observedAt: timestamp,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  gpuQuota: z.object({
    nvidiaA10080Gb: z.number().finite().nonnegative(),
    nvidiaL4: z.number().finite().nonnegative(),
    a100QuotaPreference: z.object({
      preferenceId: z.literal('reeditpro-a100-80gb-us-central1-1'),
      exists: z.boolean(),
      region: z.literal(REGION).nullable(),
      preferredValue: z.number().finite().nonnegative(),
      grantedValue: z.number().finite().nonnegative(),
      reconciling: z.boolean(),
      stateDetail: z.string().nullable(),
      disposition: z.enum([
        'granted', 'pending', 'denied', 'not_granted', 'not_found',
        'scope_mismatch',
      ]),
      capacityGranted: z.boolean(),
    }).strict(),
    capacityPrerequisitesReady: z.boolean(),
  }).strict(),
  a100QualificationFoundation: z.object({
    schemaVersion: z.literal(
      'weeditpro-sam31-a100-qualification-foundation-observation-v1',
    ),
    projectId: z.literal(PROJECT_ID),
    region: z.literal(REGION),
    serviceIdentity: z.object({
      email: z.literal(SERVICE_ACCOUNT),
      exists: z.literal(true),
      enabled: z.literal(true),
      ready: z.literal(true),
    }).strict(),
    exactProjectRoles: z.literal(true),
    projectRoles: z.tuple([
      z.literal('roles/batch.agentReporter'),
      z.literal('roles/logging.logWriter'),
      z.literal('roles/monitoring.metricWriter'),
    ]),
    exactApiAttachRole: z.literal(true),
    apiAttachRoles: z.tuple([z.literal('roles/iam.serviceAccountUser')]),
    privateBucket: z.object({
      bucketName: z.literal(PRIVATE_BUCKET),
      exists: z.literal(true),
      location: z.literal('US-CENTRAL1'),
      uniformBucketLevelAccess: z.literal(true),
      publicAccessPreventionEnforced: z.literal(true),
      ready: z.literal(true),
    }).strict(),
    bucketCmekAndRetentionReady: z.literal(true),
    exactWorkerBucketRoles: z.literal(true),
    exactApiBucketRoles: z.literal(true),
    exactRepositoryRole: z.literal(true),
    hsmCmekReady: z.literal(true),
    pinnedBatchImageReady: z.literal(true),
    privateNetworkReady: z.literal(true),
    exactA100TemplateReady: z.literal(true),
    activeQualificationBatchJobs: z.literal(0),
    activeQualificationInstances: z.literal(0),
    scaleFromZeroClean: z.literal(true),
    modelOrCheckpointDownloaded: z.literal(false),
    gpuJobStartedByAudit: z.literal(false),
    customerCreditsMutated: z.literal(false),
    productionAuthorityGranted: z.literal(false),
    ready: z.literal(true),
  }).strict(),
}).passthrough()

const serviceIdentitySchema = z.object({
  email: z.literal(SERVICE_ACCOUNT),
  enabled: z.literal(true),
  exactProjectRoles: z.tuple([
    z.literal('roles/batch.agentReporter'),
    z.literal('roles/logging.logWriter'),
    z.literal('roles/monitoring.metricWriter'),
  ]),
  exactApiAttachRoles: z.tuple([
    z.literal('roles/iam.serviceAccountUser'),
  ]),
  exactRepositoryRoles: z.tuple([
    z.literal('roles/artifactregistry.reader'),
  ]),
}).strict()

const privateArtifactBoundarySchema = z.object({
  bucketName: z.literal(PRIVATE_BUCKET),
  location: z.literal('US-CENTRAL1'),
  uniformBucketLevelAccess: z.literal(true),
  publicAccessPreventionEnforced: z.literal(true),
  defaultStorageClass: z.literal('STANDARD'),
  softDeleteRetentionSeconds: z.literal(1_209_600),
  kmsKeyResource: z.literal(KMS_KEY),
  kmsPurpose: z.literal('ENCRYPT_DECRYPT'),
  kmsProtectionLevel: z.literal('HSM'),
  kmsPrimaryState: z.literal('ENABLED'),
  kmsRotationSeconds: z.literal(7_776_000),
  exactWorkerBucketRoles: z.tuple([
    z.literal('roles/storage.objectCreator'),
    z.literal('roles/storage.objectViewer'),
  ]),
  exactApiBucketRoles: z.tuple([
    z.literal('roles/storage.objectCreator'),
    z.literal('roles/storage.objectViewer'),
  ]),
  exactStorageServiceAgentKmsRoles: z.tuple([
    z.literal('roles/cloudkms.cryptoKeyEncrypterDecrypter'),
  ]),
}).strict()

const privateNetworkPolicySchema = z.object({
  networkResource: z.literal(NETWORK),
  subnetworkResource: z.literal(SUBNETWORK),
  subnetworkCidr: z.literal('10.42.0.0/24'),
  autoCreateSubnetworks: z.literal(false),
  routingMode: z.literal('REGIONAL'),
  mtu: z.literal(1_460),
  privateGoogleAccess: z.literal(true),
  cloudRouterCount: z.literal(0),
  cloudNatPresent: z.literal(false),
  externalIpAllowed: z.literal(false),
  publicNetworkEgressAllowed: z.literal(false),
}).strict()

const instanceTemplateSchema = z.object({
  resource: z.literal(INSTANCE_TEMPLATE),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  gpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  serviceAccountEmail: z.literal(SERVICE_ACCOUNT),
  batchOsImageResource: z.literal(BATCH_IMAGE),
  batchOsImageId: z.literal(BATCH_IMAGE_ID),
  batchOsImageReadyAndNotDeprecated: z.literal(true),
  bootDiskSizeGb: z.literal(200),
  bootDiskType: z.literal('pd-balanced'),
  provisioningModel: z.literal('STANDARD'),
  onHostMaintenance: z.literal('TERMINATE'),
  canIpForward: z.literal(false),
  externalIpAttached: z.literal(false),
  secureBoot: z.literal(true),
  virtualTpm: z.literal(true),
  integrityMonitoring: z.literal(true),
  projectSshKeysBlocked: z.literal(true),
  osLoginEnabled: z.literal(true),
  batchManagedGpuDriverInstallationRequired: z.literal(true),
}).strict()

const capacitySchema = z.object({
  quotaMetric: z.literal('NVIDIA_A100_80GB_GPUS'),
  regionalQuotaLimit: z.number().finite().nonnegative(),
  quotaPreferenceId: z.literal('reeditpro-a100-80gb-us-central1-1'),
  quotaPreferenceExists: z.boolean(),
  quotaPreferenceRegion: z.literal(REGION).nullable(),
  quotaPreferencePreferredValue: z.number().finite().nonnegative(),
  quotaPreferenceDisposition: z.enum([
    'granted', 'pending', 'denied', 'not_granted', 'not_found',
  ]),
  quotaPreferenceGrantedValue: z.number().finite().nonnegative(),
  quotaPreferenceReconciling: z.boolean(),
  capacityGranted: z.boolean(),
  dispatchCapacityReady: z.boolean(),
}).strict().superRefine((value, context) => {
  const exact = value.regionalQuotaLimit >= 1
    && value.quotaPreferenceExists
    && value.quotaPreferenceRegion === REGION
    && value.quotaPreferencePreferredValue >= 1
    && value.quotaPreferenceDisposition === 'granted'
    && value.quotaPreferenceGrantedValue >= 1
    && !value.quotaPreferenceReconciling
    && value.capacityGranted
  if (value.dispatchCapacityReady !== exact) context.addIssue({
    code: 'custom',
    message: 'A100 capacity readiness is not derived from current quota.',
  })
})

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_A100_QUALIFICATION_FOUNDATION_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_google_cloud_sam3_1_a100_foundation_observer',
  ),
  evidenceClass: z.literal('google_cloud_exact_live_reread'),
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  serviceIdentity: serviceIdentitySchema,
  privateArtifactBoundary: privateArtifactBoundarySchema,
  privateNetworkPolicy: privateNetworkPolicySchema,
  instanceTemplate: instanceTemplateSchema,
  capacity: capacitySchema,
  activeQualificationBatchJobs: z.literal(0),
  activeQualificationInstances: z.literal(0),
  resourceFoundationReady: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  scaleFromZeroClean: z.literal(true),
  modelOrCheckpointDownloadedByObservation: z.literal(false),
  gpuJobStartedByObservation: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()

export const canonicalSam31A100QualificationFoundationObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: rawSha256 }).strict()
export type CanonicalSam31A100QualificationFoundationObservation = z.infer<
  typeof canonicalSam31A100QualificationFoundationObservationSchema
>

export type CanonicalSam31A100QualificationFoundationPurpose =
  | 'private_artifact_staging'
  | 'a100_qualification_dispatch'

export interface CanonicalSam31A100QualificationFoundationReadPort {
  rereadCurrentFoundation(input: {
    readonly purpose: CanonicalSam31A100QualificationFoundationPurpose
    readonly at: string
  }): Promise<unknown | null>
}

export interface CanonicalSam31A100QualificationLiveAuditReadPort {
  rereadExactLivePrerequisiteAudit(): Promise<unknown | null>
}

export function createCanonicalSam31A100QualificationFoundationOwner(input: {
  readonly liveAuditReadPort:
    CanonicalSam31A100QualificationLiveAuditReadPort
}): CanonicalSam31A100QualificationFoundationReadPort {
  if (typeof input.liveAuditReadPort?.rereadExactLivePrerequisiteAudit !==
    'function') {
    throw new Error('SAM 3.1 A100 live foundation audit port is invalid.')
  }
  return Object.freeze({
    async rereadCurrentFoundation(scope: {
      readonly purpose: CanonicalSam31A100QualificationFoundationPurpose
      readonly at: string
    }) {
      assertPlainSerializedData(scope, 'sam31_a100_foundation_read_scope')
      const parsedScope = z.object({
        purpose: z.enum([
          'private_artifact_staging', 'a100_qualification_dispatch',
        ]),
        at: timestamp,
      }).strict().parse(scope)
      const untrusted =
        await input.liveAuditReadPort.rereadExactLivePrerequisiteAudit()
      if (!untrusted) return null
      assertPlainSerializedData(untrusted, 'sam31_a100_live_foundation_audit')
      const audit = liveAuditSchema.parse(untrusted)
      const capacityDisposition = audit.gpuQuota.a100QuotaPreference.disposition
      const normalizedDisposition = capacityDisposition === 'scope_mismatch'
        ? 'not_granted' as const
        : capacityDisposition
      const foundation =
        sealCanonicalSam31A100QualificationFoundationObservation({
          schemaVersion:
            'canonical-sam3_1-a100-qualification-foundation-observation-v1',
          source:
            'canonical_server_google_cloud_sam3_1_a100_foundation_observer',
          evidenceClass: 'google_cloud_exact_live_reread',
          projectId: PROJECT_ID,
          region: REGION,
          serviceIdentity: {
            email: SERVICE_ACCOUNT,
            enabled: true,
            exactProjectRoles: audit.a100QualificationFoundation.projectRoles,
            exactApiAttachRoles:
              audit.a100QualificationFoundation.apiAttachRoles,
            exactRepositoryRoles: ['roles/artifactregistry.reader'],
          },
          privateArtifactBoundary: exactPrivateArtifactBoundary(),
          privateNetworkPolicy: exactPrivateNetworkPolicy(),
          instanceTemplate: exactInstanceTemplate(),
          capacity: {
            quotaMetric: 'NVIDIA_A100_80GB_GPUS',
            regionalQuotaLimit: audit.gpuQuota.nvidiaA10080Gb,
            quotaPreferenceId: 'reeditpro-a100-80gb-us-central1-1',
            quotaPreferenceExists:
              audit.gpuQuota.a100QuotaPreference.exists,
            quotaPreferenceRegion:
              audit.gpuQuota.a100QuotaPreference.region,
            quotaPreferencePreferredValue:
              audit.gpuQuota.a100QuotaPreference.preferredValue,
            quotaPreferenceDisposition: normalizedDisposition,
            quotaPreferenceGrantedValue:
              audit.gpuQuota.a100QuotaPreference.grantedValue,
            quotaPreferenceReconciling:
              audit.gpuQuota.a100QuotaPreference.reconciling,
            capacityGranted:
              audit.gpuQuota.a100QuotaPreference.capacityGranted,
            dispatchCapacityReady:
              audit.gpuQuota.nvidiaA10080Gb >= 1
              && audit.gpuQuota.a100QuotaPreference.exists
              && audit.gpuQuota.a100QuotaPreference.region === REGION
              && audit.gpuQuota.a100QuotaPreference.preferredValue >= 1
              && normalizedDisposition === 'granted'
              && audit.gpuQuota.a100QuotaPreference.grantedValue >= 1
              && !audit.gpuQuota.a100QuotaPreference.reconciling
              && audit.gpuQuota.a100QuotaPreference.capacityGranted,
          },
          activeQualificationBatchJobs: 0,
          activeQualificationInstances: 0,
          resourceFoundationReady: true,
          userTriggeredScaleFromZero: true,
          minimumIdleInstances: 0,
          scaleFromZeroClean: true,
          modelOrCheckpointDownloadedByObservation: false,
          gpuJobStartedByObservation: false,
          customerCreditsMutated: false,
          publicDeliveryAuthorized: false,
          productionAuthorityGranted: false,
          observedAt: audit.observedAt,
        })
      return assertCanonicalSam31A100QualificationFoundationObservation(
        foundation,
        parsedScope,
      )
    },
  })
}

export function sealCanonicalSam31A100QualificationFoundationObservation(
  value: z.input<typeof observationWithoutHashSchema>,
): CanonicalSam31A100QualificationFoundationObservation {
  assertPlainSerializedData(value, 'sam31_a100_foundation_observation_input')
  const payload = observationWithoutHashSchema.parse(value)
  return canonicalSam31A100QualificationFoundationObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31A100QualificationFoundationObservation(
  value: unknown,
  input?: {
    readonly at: string
    readonly purpose: CanonicalSam31A100QualificationFoundationPurpose
  },
): CanonicalSam31A100QualificationFoundationObservation {
  assertPlainSerializedData(value, 'sam31_a100_foundation_observation')
  const parsed = canonicalSam31A100QualificationFoundationObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 A100 foundation observation hash changed.')
  }
  if (input) {
    const atMs = Date.parse(timestamp.parse(input.at))
    const observedMs = Date.parse(parsed.observedAt)
    if (observedMs > atMs + 60_000 || atMs - observedMs > 15 * 60_000) {
      throw new Error('SAM 3.1 A100 foundation observation is stale.')
    }
    if (
      input.purpose === 'a100_qualification_dispatch'
      && !parsed.capacity.dispatchCapacityReady
    ) throw new Error('SAM 3.1 A100 dispatch capacity is unavailable.')
  }
  return parsed
}

export function canonicalSam31A100QualificationFoundationRef(
  value: CanonicalSam31A100QualificationFoundationObservation,
) {
  const parsed = assertCanonicalSam31A100QualificationFoundationObservation(
    value,
  )
  return evidenceRefSchema.parse({
    id: 'weeditpro-sam31-a100-qualification-resource-foundation',
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({
      projectId: parsed.projectId,
      region: parsed.region,
      serviceIdentity: parsed.serviceIdentity,
      privateArtifactBoundary: parsed.privateArtifactBoundary,
      privateNetworkPolicy: parsed.privateNetworkPolicy,
      instanceTemplate: parsed.instanceTemplate,
    })}`,
  })
}

export function canonicalSam31A100QualificationFoundationObservationRef(
  value: CanonicalSam31A100QualificationFoundationObservation,
) {
  return evidenceRefSchema.parse({
    id: 'weeditpro-sam31-a100-qualification-foundation-observation',
    version: 1,
    contentHash: `sha256:${value.observationHash}`,
  })
}

export function canonicalSam31A100QualificationFoundationResourceRefs(
  value: CanonicalSam31A100QualificationFoundationObservation,
) {
  const parsed = assertCanonicalSam31A100QualificationFoundationObservation(
    value,
  )
  const ref = (id: string, source: unknown) => evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(source)}`,
  })
  return Object.freeze({
    foundationResourceRef:
      canonicalSam31A100QualificationFoundationRef(parsed),
    stagingAuthorityRef: ref(
      'weeditpro-sam31-a100-private-staging-authority',
      {
        serviceIdentity: parsed.serviceIdentity,
        privateArtifactBoundary: parsed.privateArtifactBoundary,
      },
    ),
    serviceIdentityRef: ref(
      'weeditpro-sam31-a100-qualification-service-identity',
      parsed.serviceIdentity,
    ),
    privateNetworkPolicyRef: ref(
      'weeditpro-sam31-a100-private-network-policy',
      parsed.privateNetworkPolicy,
    ),
    instanceTemplateRef: ref(
      'weeditpro-sam31-a100-qualification-instance-template',
      parsed.instanceTemplate,
    ),
  })
}

function exactPrivateArtifactBoundary():
  z.input<typeof privateArtifactBoundarySchema> {
  return {
    bucketName: PRIVATE_BUCKET,
    location: 'US-CENTRAL1' as const,
    uniformBucketLevelAccess: true as const,
    publicAccessPreventionEnforced: true as const,
    defaultStorageClass: 'STANDARD' as const,
    softDeleteRetentionSeconds: 1_209_600 as const,
    kmsKeyResource: KMS_KEY,
    kmsPurpose: 'ENCRYPT_DECRYPT' as const,
    kmsProtectionLevel: 'HSM' as const,
    kmsPrimaryState: 'ENABLED' as const,
    kmsRotationSeconds: 7_776_000 as const,
    exactWorkerBucketRoles: [
      'roles/storage.objectCreator',
      'roles/storage.objectViewer',
    ],
    exactApiBucketRoles: [
      'roles/storage.objectCreator',
      'roles/storage.objectViewer',
    ],
    exactStorageServiceAgentKmsRoles: [
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
    ],
  }
}

function exactPrivateNetworkPolicy():
  z.input<typeof privateNetworkPolicySchema> {
  return {
    networkResource: NETWORK,
    subnetworkResource: SUBNETWORK,
    subnetworkCidr: '10.42.0.0/24' as const,
    autoCreateSubnetworks: false as const,
    routingMode: 'REGIONAL' as const,
    mtu: 1_460 as const,
    privateGoogleAccess: true as const,
    cloudRouterCount: 0 as const,
    cloudNatPresent: false as const,
    externalIpAllowed: false as const,
    publicNetworkEgressAllowed: false as const,
  }
}

function exactInstanceTemplate(): z.input<typeof instanceTemplateSchema> {
  return {
    resource: INSTANCE_TEMPLATE,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    gpuCount: 1 as const,
    allocatedVcpuCount: 12 as const,
    allocatedMemoryGiB: 170 as const,
    serviceAccountEmail: SERVICE_ACCOUNT,
    batchOsImageResource: BATCH_IMAGE,
    batchOsImageId: BATCH_IMAGE_ID,
    batchOsImageReadyAndNotDeprecated: true as const,
    bootDiskSizeGb: 200 as const,
    bootDiskType: 'pd-balanced' as const,
    provisioningModel: 'STANDARD' as const,
    onHostMaintenance: 'TERMINATE' as const,
    canIpForward: false as const,
    externalIpAttached: false as const,
    secureBoot: true as const,
    virtualTpm: true as const,
    integrityMonitoring: true as const,
    projectSshKeysBlocked: true as const,
    osLoginEnabled: true as const,
    batchManagedGpuDriverInstallationRequired: true as const,
  }
}
