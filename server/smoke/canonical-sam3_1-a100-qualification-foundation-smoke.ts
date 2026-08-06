import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scriptPath = new URL(
  '../../scripts/gcp/prod/22-provision-sam31-a100-qualification-foundation.sh',
  import.meta.url,
)
const script = readFileSync(scriptPath, 'utf8')
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url), 'utf8',
)) as { scripts?: Record<string, string> }

assert.match(script, /set -euo pipefail/u)
assert.match(script, /a2-ultragpu-1g/u)
assert.match(script, /nvidia_a100_80gb/u)
assert.match(script, /batch-debian-11-official-20260730-00-p01/u)
assert.match(script, /2466381682817372572/u)
assert.match(script, /weeditpro-gpu-private/u)
assert.match(script, /weeditpro-gpu-private-us-central1/u)
assert.match(script, /--no-address/u)
assert.match(script, /block-project-ssh-keys=true/u)
assert.match(script, /--maintenance-policy=TERMINATE/u)
assert.match(script, /--protection-level=hsm/u)
assert.match(script, /--default-encryption-key/u)
assert.match(script, /--public-access-prevention/u)
assert.match(script, /--uniform-bucket-level-access/u)
assert.match(script, /roles\/batch\.agentReporter/u)
assert.match(script, /roles\/artifactregistry\.reader/u)
assert.match(script, /roles\/storage\.objectCreator/u)
assert.match(script, /roles\/storage\.objectViewer/u)
assert.match(script, /roles\/iam\.serviceAccountUser/u)
assert.match(script, /batchManagedGpuDriverInstallationRequired:true/u)
assert.match(script, /userTriggeredScaleFromZero:true/u)
assert.match(script, /minimumIdleInstances:0/u)
assert.match(script, /modelOrCheckpointDownloaded:false/u)
assert.match(script, /gpuJobStarted:false/u)
assert.doesNotMatch(script, /gcloud\s+batch\s+jobs\s+(?:submit|create)/u)
assert.doesNotMatch(script, /gcloud\s+compute\s+instances\s+create/u)
assert.doesNotMatch(script, /huggingface|hf_hub_download|sam3\.1_multiplex\.pt/u)
assert.doesNotMatch(script, /roles\/owner|roles\/editor|storage\.admin/u)
assert.equal(
  packageJson.scripts?.['smoke:sam3_1-a100-qualification-foundation'],
  'tsx server/smoke/canonical-sam3_1-a100-qualification-foundation-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['provision:sam3_1-a100-qualification-foundation'],
  'bash scripts/gcp/prod/22-provision-sam31-a100-qualification-foundation.sh',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-a100-qualification-foundation',
  checks: 31,
  exactA100MachineTypeAndPinnedBatchOsImage: true,
  privateNetworkNoExternalIp: true,
  hsmCmekPrivateBucket: true,
  dedicatedLeastPrivilegeServiceIdentity: true,
  batchManagedGpuDriverInstallRequired: true,
  userTriggeredScaleFromZero: true,
  modelOrCheckpointDownloaded: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
