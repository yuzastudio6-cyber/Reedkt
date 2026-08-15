import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/20-provision-weeditpro-private-gpu-network.sh',
  'utf8',
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly PROJECT_NUMBER='390722338345'",
  "readonly REGION='us-central1'",
  "readonly NETWORK='weeditpro-gpu-private'",
  "readonly SUBNET='weeditpro-gpu-private-us-central1'",
  "readonly CIDR='10.42.0.0/24'",
  "readonly CONFIRMATION='provision-weeditpro-private-gpu-network-v1'",
  '--subnet-mode=custom',
  '--bgp-routing-mode=regional',
  '--enable-private-ip-google-access',
  "fail 'a Cloud NAT exists on the private GPU network'",
  '--region="${REGION}"',
  'select(.network | endswith($network))',
  '"cloudNatPresent":false',
  '"gpuJobStarted":false',
] as const) assert.ok(source.includes(expected), `missing ${expected}`)

for (const forbidden of [
  /routers nats create/u,
  /addresses create/u,
  /gcloud run jobs execute/u,
  /gcloud batch jobs/u,
  /gcloud builds submit/u,
  /billing accounts/u,
  /secrets versions/u,
  /(?:curl|wget)\s/u,
] as const) assert.doesNotMatch(source, forbidden)

const deployment = readFileSync(
  'scripts/gcp/prod/19-deploy-track-all-sam31-l4-task-qa-job.sh',
  'utf8',
)
for (const expected of [
  "readonly NETWORK='weeditpro-gpu-private'",
  "readonly SUBNET='weeditpro-gpu-private-us-central1'",
  "readonly NETWORK_TAG='weeditpro-gpu-private-no-nat'",
  '--vpc-egress=all-traffic',
  '--network="${NETWORK}"',
  '--subnet="${SUBNET}"',
  '--network-tags="${NETWORK_TAG}"',
] as const) assert.ok(deployment.includes(expected), `missing ${expected}`)

console.log(JSON.stringify({
  smoke: 'weeditpro-private-gpu-network',
  isolatedNetwork: true,
  dedicatedSubnet: true,
  privateGoogleAccess: true,
  publicNatPresent: false,
  allGpuJobEgressUsesVpc: true,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
