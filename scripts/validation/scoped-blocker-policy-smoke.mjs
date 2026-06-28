import assert from 'node:assert/strict'
import fs from 'node:fs'

const requiredFiles = [
  'AGENTS.md',
  'docs/production-readiness-blocker-policy.md',
  '.github/workflows/beta-readiness-api-staging-owner-prerequisite-audit.yml',
  '.github/workflows/beta-readiness-api-staging-owner-remediation.yml',
  'package.json',
]

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(file), `${file} must exist`)
}

const agents = fs.readFileSync('AGENTS.md', 'utf8')
const policy = fs.readFileSync('docs/production-readiness-blocker-policy.md', 'utf8')
const ownerRemediationWorkflow = fs.readFileSync(
  '.github/workflows/beta-readiness-api-staging-owner-remediation.yml',
  'utf8',
)
const ownerPrerequisiteAuditWorkflow = fs.readFileSync(
  '.github/workflows/beta-readiness-api-staging-owner-prerequisite-audit.yml',
  'utf8',
)
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

for (const [label, text] of [
  ['AGENTS.md', agents],
  ['production blocker policy', policy],
]) {
  assert.match(text, /intentional blanket blockers are not allowed/i, `${label} must ban intentional blanket blockers`)
  assert.match(text, /scoped guardrails?, not global stop signs?/i, `${label} must require scoped blockers instead of global stops`)
  assert.match(text, /freeze unrelated safe work/i, `${label} must forbid freezing unrelated safe work`)
  assert.match(text, /unsafe action/i, `${label} must require blocked unsafe-action scope`)
  assert.match(text, /missing proof|missing proof, approval|missing proof or approval/i, `${label} must require missing evidence`)
  assert.match(text, /next smallest safe|next safe action|safe lane/i, `${label} must require safe forward progress`)
  assert.match(text, /blocked.*does not mean|blocked.*not that all|not a reason to stop all safe work/is, `${label} must state blocked does not stop all safe work`)
  assert.match(text, /approval/i, `${label} must preserve approval gates`)
  assert.match(text, /credit/i, `${label} must preserve credit gates`)
  assert.match(text, /Supabase/i, `${label} must preserve Supabase gates`)
  assert.match(text, /production/i, `${label} must preserve production gates`)
}

for (const token of [
  'intentionalBlanketBlocksAllowed: false',
  'safeBlockerReductionAllowed: true',
  'blockerScopeType: "unsafe_action_only"',
  'mustContinueSafeProgressWhenAvailable: true',
  'blockedDoesNotMeanStopAllWork: true',
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

assert.doesNotMatch(
  ownerRemediationWorkflow,
  /cloud_run_admin_binding|roles\/run\.admin/,
  'owner remediation workflow must not add Cloud Run admin when read-only audit already proves deploy permissions',
)
assert.match(
  ownerRemediationWorkflow,
  /FIXED_STAGING_API_SECRET_NAMES_CSV: \$\{\{ secrets\.REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV \}\}/,
  'owner remediation workflow must read fixed staging secret names from the staging environment secret',
)
assert.match(
  ownerRemediationWorkflow,
  /--role=roles\/secretmanager\.viewer/,
  'deployer fixed secret access must use metadata-only Secret Manager viewer role',
)
assert.match(
  ownerRemediationWorkflow,
  /deployer_secret_metadata_viewer_\$\{secret_index\}/,
  'owner remediation workflow must report deployer metadata bindings as redacted fixed secret entries',
)
assert.match(
  ownerRemediationWorkflow,
  /runtime_secret_accessor_\$\{secret_index\}/,
  'owner remediation workflow must report runtime accessor bindings as redacted fixed secret entries',
)
assert.match(
  ownerRemediationWorkflow,
  /--role=roles\/secretmanager\.secretAccessor/,
  'runtime fixed secret payload access must use Secret Manager secretAccessor',
)
assert.match(
  ownerRemediationWorkflow,
  /APPLY_STAGING_BETA_API_OWNER_REMEDIATION/,
  'owner remediation workflow must require the exact owner-remediation confirmation',
)
assert.match(
  ownerRemediationWorkflow,
  /MUTATE_STAGING_IAM_ONLY/,
  'owner remediation workflow must require the exact staging-only IAM mutation confirmation',
)
assert.match(
  ownerRemediationWorkflow,
  /No Cloud Run deploy, Cloud Run role mutation/,
  'owner remediation workflow summary must state Cloud Run role mutation did not run',
)
assert.match(
  ownerRemediationWorkflow,
  /::add-mask::\$\{secret_name\}/,
  'owner remediation workflow must mask owner-provided fixed secret names before gcloud calls',
)
assert.match(
  ownerRemediationWorkflow,
  /reported only as redacted numbered entries/,
  'owner remediation workflow summary must keep fixed secret names out of durable logs',
)

assert.match(
  ownerPrerequisiteAuditWorkflow,
  /FIXED_STAGING_API_SECRET_NAMES_CSV: \$\{\{ secrets\.REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV \}\}/,
  'owner prerequisite audit must read fixed staging secret names from the staging environment secret',
)
assert.match(
  ownerPrerequisiteAuditWorkflow,
  /fixed_staging_secret_entry_\$\{secret_index\}/,
  'owner prerequisite audit must report Secret Manager checks as redacted fixed secret entries',
)
assert.match(
  ownerPrerequisiteAuditWorkflow,
  /::add-mask::\$\{secret_name\}/,
  'owner prerequisite audit must mask owner-provided fixed secret names before gcloud calls',
)
assert.match(
  ownerPrerequisiteAuditWorkflow,
  /Secret Manager checks are fixed-entry existence-only/,
  'owner prerequisite audit summary must describe fixed-entry existence-only checks',
)

for (const [label, workflow] of [
  ['owner remediation workflow', ownerRemediationWorkflow],
  ['owner prerequisite audit workflow', ownerPrerequisiteAuditWorkflow],
]) {
  for (const legacySecretName of [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PROVIDER_GATEWAY_SHARED_SECRET',
    'WORKER_WEBHOOK_SECRET',
  ]) {
    assert.ok(
      !workflow.includes(legacySecretName),
      `${label} must not hardcode legacy secret name ${legacySecretName}`,
    )
  }
  assert.doesNotMatch(
    workflow,
    /secret_entry_exists_\$\{secret_name\}/,
    `${label} must not report fixed secret checks by owner-provided name`,
  )
}

console.log(JSON.stringify({
  ok: true,
  policy: 'intentional_blanket_blockers_disallowed',
  blockerScopeType: 'unsafe_action_only',
  blockedDoesNotMeanStopAllWork: true,
  mustContinueSafeProgressWhenAvailable: true,
  ownerPrerequisiteAuditWorkflow: 'fixed_secret_inputs_masked_and_redacted',
  ownerRemediationWorkflow: 'fixed_secret_inputs_masked_and_redacted',
  safeBlockerReductionAllowed: true,
  protectedGates: ['approval', 'credit', 'privacy', 'provider', 'worker', 'supabase', 'storage', 'beta', 'production'],
}, null, 2))
