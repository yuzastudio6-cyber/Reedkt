import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildBetaReadinessSourceFreshnessPreflight } from '../cli/beta-readiness-source-freshness-preflight.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

assert.equal(
  packageJson.scripts['beta:readiness:source-freshness-preflight'],
  'node server/cli/beta-readiness-source-freshness-preflight.mjs',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-source-freshness-preflight'],
  'node server/smoke/beta-readiness-source-freshness-preflight-smoke.mjs',
)

const currentSourceSha = 'e6fa65329dc91b42458261bb224df14c2ffbab3c'
const deployedSourceSha = 'd997d567d40853f59741763c8e9ca8b2c361148a'
const blocked = buildBetaReadinessSourceFreshnessPreflight({}, {
  currentSourceSha,
  deployedSourceSha,
  resolveGit: false,
})

assert.equal(blocked.readyForDeployedEvidenceInputManifest, false)
assert.equal(blocked.readyForOwnerApprovalIntake, false)
assert.equal(blocked.decision, 'beta_readiness_source_freshness_preflight_blocked_deploy_evidence_source_stale')
assert.ok(blocked.valueGaps.some((gap) => gap.includes(currentSourceSha) && gap.includes(deployedSourceSha)))
assert.ok(blocked.recommendedCommands.some((command) => command.includes('beta-readiness-api-staging-deploy.yml')))
assert.ok(blocked.recommendedCommands.some((command) => command.includes('source-freshness-preflight')))
assert.ok(blocked.blockedScopes.includes('deployed_evidence_input_manifest_until_current_source_matches_deploy_evidence'))
assert.equal(JSON.stringify(blocked).includes('SERVICE_ROLE_KEY'), false)
assert.equal(JSON.stringify(blocked).includes('Bearer '), false)
assert.equal(JSON.stringify(blocked).includes('x-goog-signature='), false)

const fixtureRoot = mkdtempSync(join(tmpdir(), 'reeditpro-source-freshness-smoke-'))
const deployPacketPath = join(fixtureRoot, 'deploy.json')
const apiPreflightPacketPath = join(fixtureRoot, 'api-preflight.json')
const manifestPath = join(fixtureRoot, 'manifest.json')
writeFileSync(deployPacketPath, JSON.stringify({ sourceTruth: { sourceSha: currentSourceSha }, deployInputs: { sourceSha: currentSourceSha } }))
writeFileSync(apiPreflightPacketPath, JSON.stringify({ sourceSha: currentSourceSha }))
writeFileSync(manifestPath, JSON.stringify({
  sourceShaPolicy: 'operator_supplied_current_deployed_source_sha_required',
  currentD997ApiDeployReadback: { sourceSha: currentSourceSha },
}))

const ready = buildBetaReadinessSourceFreshnessPreflight({}, {
  currentSourceSha,
  deployedSourceSha: currentSourceSha,
  apiDeployPacketPath: deployPacketPath,
  apiDeploymentPreflightPacketPath: apiPreflightPacketPath,
  deployedEvidenceManifestPath: manifestPath,
  resolveGit: false,
})

assert.equal(ready.readyForDeployedEvidenceInputManifest, true)
assert.equal(ready.readyForOwnerApprovalIntake, true)
assert.equal(ready.decision, 'beta_readiness_source_freshness_preflight_passed_current_source_matches_deploy_evidence')
assert.deepEqual(ready.valueGaps, [])
assert.ok(ready.recommendedCommands.includes('npm run beta:readiness:owner-approval-env-template'))
assert.ok(ready.recommendedCommands.includes('npm run beta:readiness:deployed-evidence-input-manifest'))
assert.equal(ready.recommendedCommands.some((command) => command.includes('gcloud ')), false)

const missingCurrent = buildBetaReadinessSourceFreshnessPreflight({}, {
  currentSourceSha: '',
  deployedSourceSha,
  resolveGit: false,
})

assert.equal(missingCurrent.readyForDeployedEvidenceInputManifest, false)
assert.ok(missingCurrent.valueGaps.some((gap) => gap.includes('Current source SHA')))

const reportPath = 'docs/beta-readiness/source-freshness-preflight/2026-06-29-e6fa-source-freshness-blocked.json'
const report = JSON.parse(readFileSync(reportPath, 'utf8'))
assert.equal(report.decision, blocked.decision)
assert.equal(report.currentSourceSha, currentSourceSha)
assert.equal(report.deployedSourceSha, deployedSourceSha)
assert.equal(report.readyForDeployedEvidenceInputManifest, false)

const markdown = readFileSync('docs/beta-readiness/source-freshness-preflight/2026-06-29-e6fa-source-freshness-blocked.md', 'utf8')
assert.ok(markdown.includes(blocked.decision))
assert.ok(markdown.includes('d997d567d40853f59741763c8e9ca8b2c361148a'))
assert.ok(markdown.includes('e6fa65329dc91b42458261bb224df14c2ffbab3c'))
assert.ok(markdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'))

console.log(JSON.stringify({
  ok: true,
  blockedDecision: blocked.decision,
  readyDecision: ready.decision,
  blockedValueGaps: blocked.valueGaps.length,
  reportPath,
}, null, 2))
