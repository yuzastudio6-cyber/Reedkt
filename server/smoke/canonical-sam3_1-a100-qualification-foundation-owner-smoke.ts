import assert from 'node:assert/strict'

import {
  assertCanonicalSam31A100QualificationFoundationObservation,
  canonicalSam31A100QualificationFoundationObservationRef,
  canonicalSam31A100QualificationFoundationResourceRefs,
  createCanonicalSam31A100QualificationFoundationOwner,
  sealCanonicalSam31A100QualificationFoundationObservation,
} from '../services/canonical-sam3_1-a100-qualification-foundation-owner'

export const foundationObservedAt = '2026-08-04T17:55:00.000Z'

export function createFoundation(input?: {
  capacityReady?: boolean
  observedAt?: string
}) {
  const capacityReady = input?.capacityReady ?? true
  return sealCanonicalSam31A100QualificationFoundationObservation({
    schemaVersion:
      'canonical-sam3_1-a100-qualification-foundation-observation-v1',
    source: 'canonical_server_google_cloud_sam3_1_a100_foundation_observer',
    evidenceClass: 'google_cloud_exact_live_reread',
    projectId: 'reeditpro',
    region: 'us-central1',
    serviceIdentity: {
      email: 'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com',
      enabled: true,
      exactProjectRoles: [
        'roles/batch.agentReporter',
        'roles/logging.logWriter',
        'roles/monitoring.metricWriter',
      ],
      exactApiAttachRoles: ['roles/iam.serviceAccountUser'],
      exactRepositoryRoles: ['roles/artifactregistry.reader'],
    },
    privateArtifactBoundary: {
      bucketName: 'reeditpro-production-sam31-qualification-private',
      location: 'US-CENTRAL1',
      uniformBucketLevelAccess: true,
      publicAccessPreventionEnforced: true,
      defaultStorageClass: 'STANDARD',
      softDeleteRetentionSeconds: 1_209_600,
      kmsKeyResource:
        'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
      kmsPurpose: 'ENCRYPT_DECRYPT',
      kmsProtectionLevel: 'HSM',
      kmsPrimaryState: 'ENABLED',
      kmsRotationSeconds: 7_776_000,
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
    },
    privateNetworkPolicy: {
      networkResource:
        'projects/reeditpro/global/networks/weeditpro-gpu-private',
      subnetworkResource:
        'projects/reeditpro/regions/us-central1/subnetworks/weeditpro-gpu-private-us-central1',
      subnetworkCidr: '10.42.0.0/24',
      autoCreateSubnetworks: false,
      routingMode: 'REGIONAL',
      mtu: 1_460,
      privateGoogleAccess: true,
      cloudRouterCount: 0,
      cloudNatPresent: false,
      externalIpAllowed: false,
      publicNetworkEgressAllowed: false,
    },
    instanceTemplate: {
      resource:
        'projects/reeditpro/global/instanceTemplates/weeditpro-sam31-qualification-a100-v1',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      gpuCount: 1,
      allocatedVcpuCount: 12,
      allocatedMemoryGiB: 170,
      serviceAccountEmail:
        'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com',
      batchOsImageResource:
        'projects/batch-custom-image/global/images/batch-debian-11-official-20260730-00-p01',
      batchOsImageId: '2466381682817372572',
      batchOsImageReadyAndNotDeprecated: true,
      bootDiskSizeGb: 200,
      bootDiskType: 'pd-balanced',
      provisioningModel: 'STANDARD',
      onHostMaintenance: 'TERMINATE',
      canIpForward: false,
      externalIpAttached: false,
      secureBoot: true,
      virtualTpm: true,
      integrityMonitoring: true,
      projectSshKeysBlocked: true,
      osLoginEnabled: true,
      batchManagedGpuDriverInstallationRequired: true,
    },
    capacity: {
      quotaMetric: 'NVIDIA_A100_80GB_GPUS',
      regionalQuotaLimit: capacityReady ? 1 : 0,
      quotaPreferenceId: 'reeditpro-a100-80gb-us-central1-1',
      quotaPreferenceExists: true,
      quotaPreferenceRegion: 'us-central1',
      quotaPreferencePreferredValue: 1,
      quotaPreferenceDisposition: capacityReady ? 'granted' : 'denied',
      quotaPreferenceGrantedValue: capacityReady ? 1 : 0,
      quotaPreferenceReconciling: false,
      capacityGranted: capacityReady,
      dispatchCapacityReady: capacityReady,
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
    observedAt: input?.observedAt ?? foundationObservedAt,
  })
}

export const foundation = createFoundation()
assertCanonicalSam31A100QualificationFoundationObservation(foundation, {
  purpose: 'a100_qualification_dispatch',
  at: '2026-08-04T18:00:00.000Z',
})
const refs = canonicalSam31A100QualificationFoundationResourceRefs(foundation)
assert.equal(refs.serviceIdentityRef.id,
  'weeditpro-sam31-a100-qualification-service-identity')
assert.equal(refs.privateNetworkPolicyRef.id,
  'weeditpro-sam31-a100-private-network-policy')
assert.equal(refs.instanceTemplateRef.id,
  'weeditpro-sam31-a100-qualification-instance-template')

const noCapacity = createFoundation({ capacityReady: false })
assertCanonicalSam31A100QualificationFoundationObservation(noCapacity, {
  purpose: 'private_artifact_staging',
  at: '2026-08-04T18:00:00.000Z',
})
assert.throws(() =>
  assertCanonicalSam31A100QualificationFoundationObservation(noCapacity, {
    purpose: 'a100_qualification_dispatch',
    at: '2026-08-04T18:00:00.000Z',
  }))

const later = createFoundation({
  observedAt: '2026-08-04T18:01:00.000Z',
})
assert.deepEqual(
  canonicalSam31A100QualificationFoundationResourceRefs(later),
  refs,
)
assert.notDeepEqual(
  canonicalSam31A100QualificationFoundationObservationRef(later),
  canonicalSam31A100QualificationFoundationObservationRef(foundation),
)
assert.throws(() =>
  assertCanonicalSam31A100QualificationFoundationObservation(foundation, {
    purpose: 'private_artifact_staging',
    at: '2026-08-04T18:11:00.001Z',
  }))

const tampered = structuredClone(foundation)
tampered.instanceTemplate.batchOsImageId = '1' as never
assert.throws(() =>
  assertCanonicalSam31A100QualificationFoundationObservation(tampered))

const liveDeniedOwner = createCanonicalSam31A100QualificationFoundationOwner({
  liveAuditReadPort: {
    async rereadExactLivePrerequisiteAudit() {
      return liveAudit(false)
    },
  },
})
const liveDeniedStaging = await liveDeniedOwner.rereadCurrentFoundation({
  purpose: 'private_artifact_staging',
  at: '2026-08-04T18:00:00.000Z',
})
assert(liveDeniedStaging)
assert.equal(
  assertCanonicalSam31A100QualificationFoundationObservation(
    liveDeniedStaging,
  ).capacity.dispatchCapacityReady,
  false,
)
await assert.rejects(liveDeniedOwner.rereadCurrentFoundation({
  purpose: 'a100_qualification_dispatch',
  at: '2026-08-04T18:00:00.000Z',
}))

const liveA100WithoutL4Owner =
  createCanonicalSam31A100QualificationFoundationOwner({
    liveAuditReadPort: {
      async rereadExactLivePrerequisiteAudit() {
        return liveAudit(true, 0)
      },
    },
  })
const liveA100WithoutL4 =
  await liveA100WithoutL4Owner.rereadCurrentFoundation({
    purpose: 'a100_qualification_dispatch',
    at: '2026-08-04T18:00:00.000Z',
  })
assert(liveA100WithoutL4)
assert.equal(
  assertCanonicalSam31A100QualificationFoundationObservation(
    liveA100WithoutL4,
  ).capacity.dispatchCapacityReady,
  true,
)

const inconsistentPreferenceAudit = liveAudit(true)
inconsistentPreferenceAudit.gpuQuota.a100QuotaPreference.exists = false
const inconsistentPreferenceOwner =
  createCanonicalSam31A100QualificationFoundationOwner({
    liveAuditReadPort: {
      async rereadExactLivePrerequisiteAudit() {
        return inconsistentPreferenceAudit
      },
    },
  })
await assert.rejects(inconsistentPreferenceOwner.rereadCurrentFoundation({
  purpose: 'a100_qualification_dispatch',
  at: '2026-08-04T18:00:00.000Z',
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-a100-qualification-foundation-owner',
  checks: 26,
  callerSuppliedFoundationRefsAccepted: false,
  resourceFoundationReady: foundation.resourceFoundationReady,
  dispatchCapacityReady: foundation.capacity.dispatchCapacityReady,
  a100QualificationIndependentOfL4Capacity: true,
  inconsistentQuotaPreferenceBlocksDispatch: true,
  deniedCapacityBlocksDispatch: true,
  userTriggeredScaleFromZero: foundation.userTriggeredScaleFromZero,
  modelOrCheckpointDownloaded: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function liveAudit(capacityReady: boolean, l4Quota = 1) {
  return {
    audit: 'weeditpro-visual-intelligence-live-prerequisites-v12',
    observedAt: foundationObservedAt,
    projectId: 'reeditpro',
    region: 'us-central1',
    gpuQuota: {
      nvidiaA10080Gb: capacityReady ? 1 : 0,
      nvidiaL4: l4Quota,
      a100QuotaPreference: {
        preferenceId: 'reeditpro-a100-80gb-us-central1-1',
        exists: true,
        region: 'us-central1',
        preferredValue: 1,
        grantedValue: capacityReady ? 1 : 0,
        reconciling: false,
        stateDetail: capacityReady ? null : 'Quota request denied',
        disposition: capacityReady ? 'granted' : 'denied',
        capacityGranted: capacityReady,
      },
      capacityPrerequisitesReady: capacityReady && l4Quota >= 1,
    },
    a100QualificationFoundation: {
      schemaVersion:
        'weeditpro-sam31-a100-qualification-foundation-observation-v1',
      projectId: 'reeditpro',
      region: 'us-central1',
      serviceIdentity: {
        email:
          'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com',
        exists: true,
        enabled: true,
        ready: true,
      },
      exactProjectRoles: true,
      projectRoles: [
        'roles/batch.agentReporter',
        'roles/logging.logWriter',
        'roles/monitoring.metricWriter',
      ],
      exactApiAttachRole: true,
      apiAttachRoles: ['roles/iam.serviceAccountUser'],
      privateBucket: {
        bucketName: 'reeditpro-production-sam31-qualification-private',
        exists: true,
        location: 'US-CENTRAL1',
        uniformBucketLevelAccess: true,
        publicAccessPreventionEnforced: true,
        ready: true,
      },
      bucketCmekAndRetentionReady: true,
      exactWorkerBucketRoles: true,
      exactApiBucketRoles: true,
      exactRepositoryRole: true,
      hsmCmekReady: true,
      pinnedBatchImageReady: true,
      privateNetworkReady: true,
      exactA100TemplateReady: true,
      activeQualificationBatchJobs: 0,
      activeQualificationInstances: 0,
      scaleFromZeroClean: true,
      modelOrCheckpointDownloaded: false,
      gpuJobStartedByAudit: false,
      customerCreditsMutated: false,
      productionAuthorityGranted: false,
      ready: true,
    },
  }
}
