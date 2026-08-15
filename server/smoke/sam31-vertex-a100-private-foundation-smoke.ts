import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/27-provision-sam31-vertex-a100-private-foundation.sh',
  'utf8',
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly PROJECT_NUMBER='390722338345'",
  "readonly REGION='us-central1'",
  "readonly NETWORK='weeditpro-gpu-private'",
  "readonly ALLOCATED_RANGE='weeditpro-vertex-training-private-range'",
  "readonly ALLOCATED_RANGE_ADDRESS='10.43.0.0'",
  "readonly ALLOCATED_RANGE_PREFIX_LENGTH='16'",
  "readonly SERVICE='servicenetworking.googleapis.com'",
  "readonly PEERING='servicenetworking-googleapis-com'",
  "readonly CONFIRMATION='provision-weeditpro-sam31-vertex-a100-private-foundation-v1'",
  '--purpose=VPC_PEERING',
  '--network="${NETWORK}"',
  '--addresses="${ALLOCATED_RANGE_ADDRESS}"',
  '--prefix-length="${ALLOCATED_RANGE_PREFIX_LENGTH}"',
  'gcloud services vpc-peerings connect',
  '--service="${SERVICE}"',
  '--ranges="${ALLOCATED_RANGE}"',
  'gcloud beta services identity create',
  "fail 'Vertex AI service identity changed'",
  'roles/aiplatform.user',
  'roles/iam.serviceAccountUser',
  'roles/cloudkms.cryptoKeyEncrypterDecrypter',
  'any(.peerings[]?; .name == $peering and .state == "ACTIVE")',
  "fail 'private GPU network gained a router or Cloud NAT'",
  'customJobStarted:false',
  'checkpointDownloaded:false',
  'customerCreditsMutated:false',
  'productionAuthorityGranted:false',
] as const) assert.ok(source.includes(expected), `missing ${expected}`)

for (const forbidden of [
  /custom-jobs create/u,
  /gcloud ai custom-jobs/u,
  /gcloud batch jobs/u,
  /gcloud run jobs execute/u,
  /gcloud builds submit/u,
  /secrets versions access/u,
  /billing accounts/u,
  /(?:curl|wget)\s/u,
  /(?:^|\n)\s*(?:docker|python3?|ffmpeg|ffprobe)(?:\s|$)/u,
] as const) assert.doesNotMatch(source, forbidden)

console.log(JSON.stringify({
  smoke: 'sam31-vertex-a100-private-foundation',
  privateServiceAccessProvisionedByOperator: true,
  exactActivePeeringRereadRequired: true,
  allocatedRange: '10.43.0.0/16',
  privateGpuNetworkHasNoNat: true,
  customJobStarted: false,
  checkpointDownloaded: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
