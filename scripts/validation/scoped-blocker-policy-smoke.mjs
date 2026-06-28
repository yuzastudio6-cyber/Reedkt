import assert from 'node:assert/strict'
import fs from 'node:fs'

const requiredFiles = [
  'AGENTS.md',
  'docs/production-readiness-blocker-policy.md',
  'package.json',
]

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(file), `${file} must exist`)
}

const agents = fs.readFileSync('AGENTS.md', 'utf8')
const policy = fs.readFileSync('docs/production-readiness-blocker-policy.md', 'utf8')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

for (const [label, text] of [
  ['AGENTS.md', agents],
  ['production blocker policy', policy],
]) {
  assert.match(text, /intentional blanket blockers are not allowed/i, `${label} must ban intentional blanket blockers`)
  assert.match(text, /unsafe action/i, `${label} must require blocked unsafe-action scope`)
  assert.match(text, /missing proof|missing proof, approval|missing proof or approval/i, `${label} must require missing evidence`)
  assert.match(text, /next smallest safe|next safe action|safe lane/i, `${label} must require safe forward progress`)
  assert.match(text, /approval/i, `${label} must preserve approval gates`)
  assert.match(text, /credit/i, `${label} must preserve credit gates`)
  assert.match(text, /Supabase/i, `${label} must preserve Supabase gates`)
  assert.match(text, /production/i, `${label} must preserve production gates`)
}

for (const token of [
  'intentionalBlanketBlocksAllowed: false',
  'safeBlockerReductionAllowed: true',
  'blockedActionScope',
  'allowedForwardProgressScopes',
]) {
  assert.ok(policy.includes(token), `policy must include ${token}`)
  assert.ok(agents.includes(token), `AGENTS.md must include ${token}`)
}

assert.equal(
  packageJson.scripts?.['smoke:scoped-blocker-policy'],
  'node scripts/validation/scoped-blocker-policy-smoke.mjs',
  'package script must run the scoped blocker policy smoke',
)

console.log(JSON.stringify({
  ok: true,
  policy: 'intentional_blanket_blockers_disallowed',
  safeBlockerReductionAllowed: true,
  protectedGates: ['approval', 'credit', 'privacy', 'provider', 'worker', 'supabase', 'storage', 'beta', 'production'],
}, null, 2))
