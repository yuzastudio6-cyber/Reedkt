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
assert.ok(blocked.recommendedCommands.some((command) => command.includes('--field source_ref=codex/sound-music-audio-1abc-checkpoint')), 'deploy handoff must pass the workflow-required source_ref input')
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
  current17a9ApiDeployReadback: { sourceSha: currentSourceSha },
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
assert.ok(ready.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-input-template -- --status'))
assert.ok(ready.recommendedCommands.includes('npm run beta:readiness:external-beta-operator-input-template'))
assert.ok(
  ready.recommendedCommands.indexOf('npm run beta:readiness:external-beta-operator-input-template -- --status') <
    ready.recommendedCommands.indexOf('npm run beta:readiness:external-beta-operator-input-template'),
  'safe status review should precede the full operator template command',
)
assert.ok(ready.recommendedCommands.includes('npm run beta:readiness:deployed-evidence-input-manifest'))
assert.equal(ready.recommendedCommands.some((command) => command.includes('gcloud ')), false)
assert.equal(ready.blockedScopes.includes('deployed_evidence_input_manifest_until_current_source_matches_deploy_evidence'), false)
assert.ok(ready.blockedScopes.includes('external_beta_evidence_collector_until_source_freshness_owner_intake_manifest_and_operator_readback_pass'))

const metadataOnlySourceSha = '1111111111111111111111111111111111111111'
const metadataOnly = buildBetaReadinessSourceFreshnessPreflight({}, {
  currentSourceSha: metadataOnlySourceSha,
  deployedSourceSha: currentSourceSha,
  apiDeployPacketPath: deployPacketPath,
  apiDeploymentPreflightPacketPath: apiPreflightPacketPath,
  deployedEvidenceManifestPath: manifestPath,
  changedFiles: [
    'docs/beta-readiness/source-freshness-preflight/2026-06-29-769f-source-freshness-passed.json',
    'docs/production-beta-readiness-runbook.md',
    'server/smoke/beta-readiness-source-freshness-preflight-smoke.mjs',
    'server/cli/beta-readiness-owner-approval-packet.mjs',
    'server/cli/beta-readiness-owner-approval-intake-preflight.mjs',
    'server/cli/beta-readiness-owner-approval-collection-handoff.mjs',
    'server/cli/beta-readiness-deployed-evidence-input-manifest.ts',
    'server/cli/beta-readiness-deployed-evidence-input-manifest.mjs',
    'server/cli/beta-readiness-external-beta-operator-input-template.mjs',
    'server/cli/beta-tools-core-real-check-preview.ts',
    'server/cli/beta-tools-libass-synthetic-burnin-qa-preflight.ts',
    'server/cli/beta-tools-local-accepted-evidence-bundle.ts',
    'server/cli/beta-tools-local-accepted-evidence-collector.ts',
    'server/cli/beta-readiness-node-ts-register.mjs',
    'server/cli/beta-readiness-operator-status-api.ts',
    'server/cli/beta-readiness-operator-status-api.d.ts',
    'server/cli/beta-readiness-operator-status-api.mjs',
    'server/cli/beta-readiness-operator-status.ts',
    'server/cli/beta-readiness-summary.ts',
    'server/beta-readiness/platform-evidence-manifest.ts',
    'package.json',
  ],
  packageJsonChangedScriptNames: [
    'beta:readiness:deployed-evidence-input-manifest',
    'beta:readiness:api-deployment-preflight',
    'beta:readiness:blocker-ledger',
    'beta:readiness:external-beta-operator-input-template',
    'beta:readiness:external-beta-evidence-collector',
    'beta:readiness:launch-approval-evidence',
    'beta:readiness:launch-approval-evidence-preflight',
    'beta:readiness:operator-status-api',
    'beta:readiness:operator-status',
    'beta:readiness:owner-command-handoff',
    'beta:readiness:paid-production-evidence-collector',
    'beta:readiness:scope-approval-evidence',
    'beta:readiness:scope-approval-evidence-preflight',
    'beta:readiness:scope-approval-sequence',
    'beta:platform:staging-evidence-preflight',
    'beta:platform:staging-evidence-probe',
    'beta:tools:core-real-check-evidence',
    'beta:tools:core-real-check-evidence-preflight',
    'beta:tools:core-real-check-preview',
    'beta:tools:libass-container-proof-preflight',
    'beta:tools:libass-synthetic-burnin-qa-evidence',
    'beta:tools:libass-synthetic-burnin-qa-evidence-preflight',
    'beta:tools:libass-synthetic-burnin-qa-preflight',
    'prod:beta:summary',
    'prod:readiness:command-plan',
    'prod:readiness:summary',
    'smoke:beta-readiness-deployed-evidence-input-manifest',
    'smoke:beta-readiness',
    'smoke:beta-readiness-api-deployment-preflight',
    'smoke:beta-readiness-api-staging-deploy-workflow',
    'smoke:beta-readiness-api-staging-input-discovery-blocker',
    'smoke:beta-readiness-blocker-ledger',
    'smoke:beta-readiness-external-beta-operator-input-template',
    'smoke:beta-readiness-external-beta-evidence-collector',
    'smoke:beta-readiness-launch-approval-evidence-cli',
    'smoke:beta-readiness-launch-approval-evidence-preflight',
    'smoke:beta-readiness-operator-status-api',
    'smoke:beta-readiness-operator-status',
    'smoke:beta-readiness-owner-command-handoff',
    'smoke:beta-readiness-paid-production-evidence-collector',
    'smoke:beta-readiness-scope-approval-evidence-cli',
    'smoke:beta-readiness-scope-approval-evidence-preflight',
    'smoke:beta-readiness-scope-approval-sequence',
    'smoke:beta-platform-staging-evidence-collector-cli',
    'smoke:beta-platform-staging-evidence-preflight',
    'smoke:beta-platform-deployed-evidence-probes',
    'smoke:beta-platform-deployed-evidence-verifier',
    'smoke:beta-platform-evidence-manifest',
    'smoke:beta-platform-monitoring-catalog',
    'smoke:beta-platform-rls-readback:sql',
    'smoke:beta-platform-stripe-boundary',
    'smoke:beta-platform-supabase-deployed-evidence-transport',
    'smoke:beta-tools-core-real-check-evidence-cli',
    'smoke:beta-tools-core-real-check-evidence-preflight',
    'smoke:beta-tools-core-real-check-preview',
    'smoke:beta-tools-libass-container-proof-preflight',
    'smoke:beta-tools-libass-synthetic-burnin-qa-evidence-cli',
    'smoke:beta-tools-libass-synthetic-burnin-qa-evidence-preflight',
    'smoke:beta-tools-libass-synthetic-burnin-qa-preflight',
    'smoke:prod-container-readiness',
    'smoke:prod-core-tool-install',
    'smoke:prod-readiness-validation',
    'smoke:prod-tool-registry',
    'smoke:tool-beta-execution-readiness',
  ],
  resolveGit: false,
})

assert.equal(metadataOnly.readyForDeployedEvidenceInputManifest, true)
assert.equal(metadataOnly.decision, 'beta_readiness_source_freshness_preflight_passed_metadata_only_source_drift')
assert.equal(metadataOnly.sourceDriftClassification.metadataOnlySourceDriftAllowed, true)
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-owner-approval-packet.mjs'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-deployed-evidence-input-manifest.ts'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-deployed-evidence-input-manifest.mjs'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-external-beta-operator-input-template.mjs'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-node-ts-register.mjs'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-operator-status-api.ts'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-operator-status-api.d.ts'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-operator-status-api.mjs'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-operator-status.ts'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/cli/beta-readiness-summary.ts'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.includes('server/beta-readiness/platform-evidence-manifest.ts'))
assert.ok(metadataOnly.sourceDriftClassification.allowedMetadataOnlyPathPolicy.some((policy) => policy.includes('package.json scripts only')))
assert.deepEqual(metadataOnly.valueGaps, [])

const runtimeDrift = buildBetaReadinessSourceFreshnessPreflight({}, {
  currentSourceSha: metadataOnlySourceSha,
  deployedSourceSha: currentSourceSha,
  apiDeployPacketPath: deployPacketPath,
  apiDeploymentPreflightPacketPath: apiPreflightPacketPath,
  deployedEvidenceManifestPath: manifestPath,
  changedFiles: [
    'server/index.ts',
  ],
  resolveGit: false,
})

assert.equal(runtimeDrift.readyForDeployedEvidenceInputManifest, false)
assert.equal(runtimeDrift.decision, 'beta_readiness_source_freshness_preflight_blocked_deploy_evidence_source_stale')
assert.deepEqual(runtimeDrift.sourceDriftClassification.blockingChangedFiles, ['server/index.ts'])

const packageJsonRuntimeDrift = buildBetaReadinessSourceFreshnessPreflight({}, {
  currentSourceSha: metadataOnlySourceSha,
  deployedSourceSha: currentSourceSha,
  apiDeployPacketPath: deployPacketPath,
  apiDeploymentPreflightPacketPath: apiPreflightPacketPath,
  deployedEvidenceManifestPath: manifestPath,
  changedFiles: [
    'package.json',
  ],
  packageJsonChangedScriptNames: [
    'dependencies',
  ],
  resolveGit: false,
})

assert.equal(packageJsonRuntimeDrift.readyForDeployedEvidenceInputManifest, false)
assert.deepEqual(packageJsonRuntimeDrift.sourceDriftClassification.blockingChangedFiles, ['package.json'])

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

const passReportPath = 'docs/beta-readiness/source-freshness-preflight/2026-06-29-769f-source-freshness-passed.json'
const passReport = JSON.parse(readFileSync(passReportPath, 'utf8'))
assert.equal(passReport.decision, 'beta_readiness_source_freshness_preflight_passed_current_source_matches_deploy_evidence')
assert.equal(passReport.currentSourceSha, '769fc2d922b37a9eebb8b0ca29fa2447a6f8f127')
assert.equal(passReport.deployedSourceSha, '769fc2d922b37a9eebb8b0ca29fa2447a6f8f127')
assert.equal(passReport.readyForDeployedEvidenceInputManifest, true)
assert.deepEqual(passReport.valueGaps, [])
assert.equal(passReport.sourceTruth.manifestRecordedDeployedSourceSha, '769fc2d922b37a9eebb8b0ca29fa2447a6f8f127')

const passMarkdown = readFileSync('docs/beta-readiness/source-freshness-preflight/2026-06-29-769f-source-freshness-passed.md', 'utf8')
assert.ok(passMarkdown.includes(passReport.decision))
assert.ok(passMarkdown.includes('769fc2d922b37a9eebb8b0ca29fa2447a6f8f127'))
assert.ok(passMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'))

const currentBlockedReportPath = 'docs/beta-readiness/source-freshness-preflight/2026-06-29-cbb6-source-freshness-blocked.json'
const currentBlockedReport = JSON.parse(readFileSync(currentBlockedReportPath, 'utf8'))
assert.equal(currentBlockedReport.decision, 'beta_readiness_source_freshness_preflight_blocked_deploy_evidence_source_stale')
assert.equal(currentBlockedReport.currentSourceSha, 'cbb6cfa814c231b8770f5f7c39299789acf63a47')
assert.equal(currentBlockedReport.deployedSourceSha, '769fc2d922b37a9eebb8b0ca29fa2447a6f8f127')
assert.ok(currentBlockedReport.recommendedCommands.some((command) => command.includes('--field source_ref=codex/sound-music-audio-1abc-checkpoint')), 'current blocker packet must include workflow source_ref')

const currentBlockedMarkdown = readFileSync('docs/beta-readiness/source-freshness-preflight/2026-06-29-cbb6-source-freshness-blocked.md', 'utf8')
assert.ok(currentBlockedMarkdown.includes('cbb6cfa814c231b8770f5f7c39299789acf63a47'))
assert.ok(currentBlockedMarkdown.includes('--field source_ref=codex/sound-music-audio-1abc-checkpoint'))
assert.ok(currentBlockedMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'))

console.log(JSON.stringify({
  ok: true,
  blockedDecision: blocked.decision,
  readyDecision: ready.decision,
  blockedValueGaps: blocked.valueGaps.length,
  reportPath,
  passReportPath,
}, null, 2))
