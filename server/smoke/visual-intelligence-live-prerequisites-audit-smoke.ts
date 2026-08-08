import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/16-audit-visual-intelligence-live-prerequisites.sh',
  'utf8',
)
const accountPriceReadinessSource = readFileSync(
  'scripts/gcp/prod/read-visual-intelligence-account-price-readiness.mjs',
  'utf8',
)

assert.match(source, /PROJECT_ID='reeditpro'/u)
assert.match(source, /weeditpro-visual-intelligence-live-prerequisites-v16/u)
assert.match(source, /observed_at="\$\(date -u/u)
assert.match(source, /observedAt: \$observedAt/u)
assert.match(source, /REGION='us-central1'/u)
assert.match(source, /NVIDIA_A100_80GB_GPUS/u)
assert.match(source, /NVIDIA_L4_GPUS/u)
assert.match(source,
  /A100_QUOTA_PREFERENCE_ID='reeditpro-a100-80gb-us-central1-1'/u)
for (const candidate of [
  ['us-central1', 'reeditpro-a100-80gb-us-central1-1'],
  ['us-east4', 'weeditpro-a100-80gb-us-east4-1'],
  ['us-east5', 'weeditpro-a100-80gb-us-east5-1'],
] as const) {
  assert.match(source, new RegExp(candidate[0], 'u'))
  assert.match(source, new RegExp(candidate[1], 'u'))
}
assert.match(source, /gcloud beta quotas preferences describe/u)
assert.match(source, /a100QuotaPreference: \$a100QuotaPreference/u)
assert.match(source, /a100CapacityCandidates: \$a100CapacityCandidates/u)
assert.match(source, /a100CandidateRequestCount/u)
assert.match(source, /a100PendingReviewCount/u)
assert.match(source, /a100GrantedCandidateCount/u)
assert.match(source, /a100DispatchReadyCandidateCount/u)
assert.match(source, /resourceFoundationObserved/u)
assert.match(source, /dispatchCapacityReady/u)
assert.match(source,
  /VERTEX_A100_QUOTA_PREFERENCE_ID='weeditpro-vertex-a100-80gb-us-central1-1'/u)
assert.match(source,
  /VERTEX_A100_QUOTA_ID='CustomModelTrainingA10080GBGPUsPerProjectPerRegion'/u)
assert.match(source, /gcloud beta quotas info describe/u)
assert.match(source, /vertexA100CustomJobCapacity/u)
assert.match(source, /userTriggeredCustomJobOnly: true/u)
assert.match(source, /persistentEndpointAllowed: false/u)
assert.match(source, /restrictedImageTrainingQuotaMayBeUsed: false/u)
assert.match(source, /VERTEX_A100_ROUTE_ARCHITECTURE_SOURCE_BINDINGS/u)
assert.match(source, /sha256_file/u)
assert.match(source, /routeArchitectureQualified: \$routeArchitectureQualified/u)
assert.match(source, /routeArchitectureSourceBindingCount: \$routeArchitectureSourceBindingCount/u)
assert.match(source, /and \$routeArchitectureQualified/u)
for (const sourceHash of [
  '2ea8b90428dec4f4e06bf423fe41a84e95f1e11eab620ade8f15726fcbb9d823',
  '7c0e862d3a8a2cb6a9a0de25e866acb18a52af873c9b4763aab483eccdbb6d04',
  '86c50ad418cb8fe89b1bbb601203e8f4c16c9a5452ab236d37abe40ffd1928db',
  'a4c9a25fcb4b1a754a872e2396a7d15ff92b5e5bac2f8d9c7d7c60e1d9b67e7f',
  '416b46ceb0282dacf693214b3efcbea42469dbaa3bebcbf9f9d5a82e8800b2a0',
  '6dba9f843d62888cb48abc6294622519a1607bc4659cc0f7aa6b6eec2d50a914',
] as const) assert.match(source, new RegExp(sourceHash, 'u'))
assert.match(source, /disposition/u)
assert.match(source, /capacityGranted/u)
assert.match(source, /a100QualificationFoundation/u)
assert.match(source, /weeditpro-sam31-qualification-a100-v1/u)
assert.match(source, /a2-ultragpu-1g/u)
assert.match(source, /batch-debian-11-official-20260730-00-p01/u)
assert.match(source, /weeditpro-sam31-qual-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.match(source, /reeditpro-production-sam31-qualification-private/u)
assert.match(source, /roles\/batch\.agentReporter/u)
assert.match(source, /roles\/cloudkms\.cryptoKeyEncrypterDecrypter/u)
assert.match(source, /activeQualificationBatchJobs/u)
assert.match(source, /activeQualificationInstances/u)
assert.match(source, /scaleFromZeroClean/u)
assert.match(source, /gcloud batch jobs list/u)
assert.match(source, /gcloud compute instances list/u)
assert.match(source, /gcloud secrets versions list/u)
assert.match(source, /--filter='state=ENABLED'/u)
assert.match(source, /containerscanning\.googleapis\.com/u)
assert.match(source, /cloudbilling\.googleapis\.com/u)
assert.match(source, /cloudkms\.googleapis\.com/u)
assert.match(source, /binaryauthorization\.googleapis\.com/u)
assert.match(source, /gcloud billing projects describe/u)
assert.match(source,
  /read-visual-intelligence-account-price-readiness\.mjs/u)
assert.match(source, /gcloud run jobs list/u)
assert.match(source, /gcloud run services list/u)
assert.match(source, /retiredLegacyCpuMediaRuntime/u)
assert.match(source, /fixedAllowlistCount: 15/u)
assert.match(source, /legacyCpuMediaRuntimeJobs/u)
assert.match(source, /privateSearchControlPlaneIdentityIsolation/u)
assert.match(source, /reeditpro-private-search-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.match(source, /legacyCpuIdentitiesRetired/u)
assert.match(source, /legacyIdentityAllowlistCount: 5/u)
assert.match(source, /substantiveMediaOrModelProcessingAllowed: false/u)
assert.match(source, /allAuthenticatedUsers/u)
assert.match(source, /gcloud artifacts docker images list/u)
assert.match(source, /reeditpro-sam31-qualification/u)
assert.match(source, /immutableSam31QualificationImagesObserved/u)
assert.match(source, /reeditpro-track-all-l4-task-qa/u)
assert.match(source, /immutableTrackAllL4TaskQaImagesObserved/u)
assert.match(source, /immutableGpuWorkerImageSetReady/u)
assert.match(source, /gcloud artifacts repositories describe/u)
assert.match(source, /vulnerabilityScanningConfig\.enablementState/u)
assert.match(source, /SCANNING_ACTIVE/u)
assert.match(source, /gcloud artifacts repositories get-iam-policy/u)
assert.match(source, /roles\/artifactregistry\.writer/u)
assert.match(source, /gcloud storage buckets describe/u)
assert.match(source, /gcloud storage buckets get-iam-policy/u)
assert.match(source, /uniform_bucket_level_access/u)
assert.match(source, /public_access_prevention/u)
assert.match(source, /gcloud iam service-accounts describe/u)
assert.match(source, /gcloud iam service-accounts get-iam-policy/u)
assert.match(source, /gcloud kms keys describe/u)
assert.match(source, /gcloud kms keys versions list/u)
assert.match(source, /--filter='state=ENABLED'/u)
assert.match(source, /gcloud kms keys get-iam-policy/u)
assert.match(source, /roles\/cloudkms\.signerVerifier/u)
assert.match(source, /EC_SIGN_P256_SHA256/u)
assert.match(source, /versionTemplate\.protectionLevel == "HSM"/u)
assert.match(source, /eligibleHsmP256VersionCount/u)
assert.match(source, /cloudBuildCanUseImageSigner/u)
assert.match(source, /gpuWorkerImageReader/u)
assert.match(source, /gpuWorkerModelArtifactReader/u)
assert.match(source, /imageBuilderBuildInputReader/u)
assert.match(source, /apiBuildInputCreator/u)
assert.match(source, /apiBuildInputReader/u)
assert.match(source, /imageSignerSupplyChainEvidenceCreator/u)
assert.match(source, /imageSignerSupplyChainBucketViewer/u)
assert.match(source, /imageSignerSupplyChainEvidenceReader/u)
assert.match(source, /roles\/storage\.bucketViewer/u)
assert.match(source, /apiSupplyChainEvidenceReader/u)
assert.match(source, /apiControlPlaneCreator/u)
assert.match(source, /apiControlPlaneReader/u)
assert.match(source, /reeditpro-production-reeditpro-model-artifacts/u)
assert.match(source, /reeditpro-production-reeditpro-image-build-inputs/u)
assert.match(source, /reeditpro-production-reeditpro-image-supply-chain-evidence/u)
assert.match(source, /reeditpro-production-reeditpro-control-plane-state/u)
assert.match(source, /reeditpro-production-reeditpro-masks/u)
assert.match(source, /trackAllMaskQaPrivateObjectTransport/u)
assert.match(source, /gpuWorkerObjectReader/u)
assert.match(source, /gpuWorkerObjectCreator/u)
assert.match(source, /apiObjectReader/u)
assert.match(source, /apiObjectCreator/u)
assert.match(source, /mountPath: "\/mnt\/reeditpro"/u)
assert.match(source, /read_bounded_json_record_set/u)
assert.match(source, /gcloud storage cat/u)
assert.match(source,
  /canonical-sam3_1-private-artifact-ingest-receipt-v3/u)
assert.match(source, /officialPrivateArtifactIngest/u)
assert.match(source, /legacyModelWeightTokenSecretRequired: false/u)
assert.match(source, /freshAccessTokenCurrentlyRequired: false/u)
assert.match(source,
  /canonical-sam3_1-qualification-image-supply-chain-release-v1/u)
assert.match(source, /qualificationImageSupplyChainRelease/u)
assert.match(source, /sourceCheckpointCompatibilityReceiptObserved: false/u)
assert.match(source,
  /imageSupplyChainReleaseObserved: \$imageSupplyChainRelease\.ready/u)
assert.match(source, /liveGeminiQualificationObserved: false/u)
assert.match(source, /liveGpuQualificationObserved: false/u)
assert.match(source, /customerCreditsMutated: false/u)
assert.match(source, /productionReady: false/u)

for (const skuId of [
  'EAC4-305F-1249',
  '8308-9CED-8950',
  '2737-2D33-D986',
  'E0A5-FB5D-79F4',
  '8A47-3936-DC92',
  '3CE8-93F8-3C8F',
] as const) assert.match(accountPriceReadinessSource, new RegExp(skuId, 'u'))
assert.match(accountPriceReadinessSource,
  /cloud-billing\.readonly/u)
assert.match(accountPriceReadinessSource, /billingAccountPriceReadReady/u)
assert.match(accountPriceReadinessSource,
  /billing_account_price_permission_required/u)
assert.match(accountPriceReadinessSource,
  /exactModelSkuCompatibilityQualificationObserved: false/u)
assert.match(accountPriceReadinessSource, /maxRedirects: 0/u)
assert.match(accountPriceReadinessSource, /retry: false/u)
assert.match(accountPriceReadinessSource, /stateMutated: false/u)
assert.doesNotMatch(accountPriceReadinessSource,
  /console\.(?:log|error)\([^)]*billingAccountResourceName/u)

for (const forbidden of [
  /secrets versions access/u,
  /gcloud services enable/u,
  /gcloud iam service-accounts create/u,
  /gcloud kms (?:keyrings|keys) create/u,
  /gcloud storage buckets (?:create|update)/u,
  /gcloud artifacts repositories add-iam-policy-binding/u,
  /gcloud kms keys add-iam-policy-binding/u,
  /gcloud run jobs execute/u,
  /gcloud run jobs (?:create|deploy|delete|update)/u,
  /gcloud run services (?:create|deploy|delete|update)/u,
  /gcloud batch jobs (?:submit|delete)/u,
  /gcloud beta quotas preferences (?:create|update|delete)/u,
  /gcloud builds submit/u,
  /artifacts docker images delete/u,
  /\bcurl\b/u,
  /\bwget\b/u,
  /(?:^|\n)\s*docker(?:\s|$)/u,
  /\bpython(?:3)?\b/u,
] as const) assert.doesNotMatch(source, forbidden)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-live-prerequisites-audit',
  productName: 'WeEditPro',
  readOnlyCloudAudit: true,
  secretPayloadRead: false,
  gpuJobStarted: false,
  modelDownloaded: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
