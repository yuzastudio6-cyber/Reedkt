import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/17-provision-visual-intelligence-sam31-foundation.sh',
  'utf8',
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly PROJECT_NUMBER='390722338345'",
  "readonly REGION='us-central1'",
  "readonly REPOSITORY='reeditpro-workers'",
  "readonly CONFIRMATION='provision-weeditpro-sam31-foundation-v1'",
  "readonly IMAGE_BUILDER_SA='reeditpro-image-builder-sa'",
  "readonly IMAGE_SIGNER_SA='reeditpro-image-signer-sa'",
  "readonly GPU_WORKER_SA='reeditpro-gpu-worker-sa'",
  "readonly MODEL_ARTIFACT_BUCKET='reeditpro-production-reeditpro-model-artifacts'",
  "readonly IMAGE_BUILD_INPUT_BUCKET='reeditpro-production-reeditpro-image-build-inputs'",
  "readonly IMAGE_EVIDENCE_BUCKET='reeditpro-production-reeditpro-image-supply-chain-evidence'",
  "readonly CONTROL_PLANE_BUCKET='reeditpro-production-reeditpro-control-plane-state'",
  "readonly MASK_BUCKET='reeditpro-production-reeditpro-masks'",
  'cloudkms.googleapis.com',
  'binaryauthorization.googleapis.com',
  '--purpose=asymmetric-signing',
  '--default-algorithm=ec-sign-p256-sha256',
  '--protection-level=hsm',
  'roles/cloudkms.signerVerifier',
  'roles/artifactregistry.writer',
  'roles/artifactregistry.reader',
  'roles/storage.objectCreator',
  'roles/storage.objectViewer',
  'roles/iam.serviceAccountUser',
  'roles/iam.serviceAccountTokenCreator',
  'roles/batch.jobsEditor',
  'roles/cloudbuild.builds.editor',
  'roles/containeranalysis.occurrences.viewer',
  '--uniform-bucket-level-access',
  '--public-access-prevention',
  'create_secret_placeholder HUGGINGFACE_TOKEN',
  'create_secret_placeholder MODEL_WEIGHT_ACCESS_TOKEN',
  '"secretVersionCreated":false',
  '"metaTermsAccepted":false',
  '"imageBuilt":false',
  '"gpuJobStarted":false',
  '"customerCreditsMutated":false',
  '"productionAuthorityGranted":false',
] as const) assert.ok(source.includes(expected), `missing ${expected}`)

assert.equal(
  [...source.matchAll(/create_service_account \\\n+\s+"\$\{[A-Z_]+_SA\}"/gu)].length,
  3,
)
assert.equal(
  [...source.matchAll(/create_protected_bucket "\$\{[A-Z_]+_BUCKET\}"/gu)]
    .length,
  5,
)

for (const forbidden of [
  /reeditpro-cpu-worker-sa/u,
  /reeditpro-render-worker-sa/u,
  /reeditpro-qa-worker-sa/u,
  /reeditpro-tool-readiness-sa/u,
  /source-media/u,
  /proxy-media/u,
  /final-exports/u,
  /qa-artifacts/u,
  /generated-assets/u,
  /secrets versions add/u,
  /secrets versions access/u,
  /gcloud builds submit/u,
  /gcloud batch jobs submit/u,
  /gcloud run jobs (?:create|deploy|execute|update|delete)/u,
  /gcloud run services (?:create|deploy|update|delete)/u,
  /artifacts docker images delete/u,
  /gcloud .* delete/u,
  /REEDITPRO_CONFIRM_PROD_SETUP/u,
  /(?:^|\n)\s*(?:docker|python3?|ffmpeg|ffprobe)(?:\s|$)/u,
  /(?:curl|wget)\s/u,
  /--data-file/u,
  /printf[^\n]*(?:HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)/u,
] as const) assert.doesNotMatch(source, forbidden)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-sam31-foundation-provisioning',
  productName: 'WeEditPro',
  exactServiceIdentityCount: 3,
  exactPrivateBucketCount: 5,
  secretPlaceholdersOnly: true,
  secretVersionCreated: false,
  modelDownloaded: false,
  imageBuilt: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
