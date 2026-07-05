import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

const packageJson = read('package.json')
const unlock = read('server/cli/qwen-beta-unlock.ts')
const doctor = read('server/cli/qwen-beta-doctor.ts')
const provider = read('server/smoke/qwen-live-provider-smoke.ts')
const marker = read('server/smoke/qwen-marker-chat-live-smoke.ts')
const owner = read('server/smoke/qwen-live-owner-config-smoke.ts')
const workflow = read('.github/workflows/qwen-live-beta-verification.yml')
const activationDoc = read('docs/qwen-live-beta-activation.md')

for (const script of [
  'unlock:qwen-beta',
  'unlock:qwen-beta:strict',
  'unlock:qwen-beta:example',
  'doctor:qwen-beta',
  'doctor:qwen-beta:strict',
  'smoke:qwen-live-provider',
  'smoke:qwen-marker-chat-live',
  'smoke:qwen-live-owner-config',
  'smoke:qwen-live-command-contract',
]) {
  assert.match(packageJson, new RegExp(`"${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`))
}

assert.match(unlock, /providerCallMade: false/)
assert.match(unlock, /secretValueAccessed: false/)
assert.match(doctor, /createQwenLiveBetaDoctorReport/)
assert.match(provider, /blocked_live_beta_configuration/)
assert.match(provider, /runQwenMarkerChatBridge/)
assert.match(marker, /\/v1\/project-edit-brief\/marker-messages/)
assert.match(marker, /replayed === true/)
assert.match(owner, /qwen-live-owner-config/)
assert.match(workflow, /workflow_dispatch/)
assert.match(workflow, /smoke:qwen-live-owner-config/)
assert.match(workflow, /QWEN_REASONING_API_KEY_SECRET/)
assert.doesNotMatch(workflow, /DASHSCOPE_API_KEY|QWEN_API_KEY:/)
assert.match(activationDoc, /doctor:qwen-beta/)
assert.match(activationDoc, /smoke:qwen-live-provider/)

console.log(JSON.stringify({
  smoke: 'qwen-live-command-contract',
  ok: true,
  commands: 9,
  providerCallMadeDuringSmoke: false,
  secretValueAccessedDuringSmoke: false,
}, null, 2))
