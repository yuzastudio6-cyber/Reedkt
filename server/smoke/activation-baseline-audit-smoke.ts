import { existsSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { buildActivationBaselineAuditReport, activationPhaseRoadmap } from '../activation'
import { getProductionToolProfile } from '../tool-registry'
import { assertRevideoReadinessBlocked, getProductionReadinessSpec } from '../workers/production-readiness'

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function repoFileExists(path: string): boolean {
  return existsSync(new URL(`../../${path}`, import.meta.url))
}

function assertIncludes(text: string, expected: string, message: string): void {
  assert.ok(text.includes(expected), message)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts: Record<string, string> }
const scripts = packageJson.scripts

const requiredProductionSmokeScripts = [
  'smoke:prod-runtime-contracts',
  'smoke:prod-tool-registry',
  'smoke:gcp-foundation',
  'smoke:prod-worker-orchestration',
  'smoke:prod-container-readiness',
  'smoke:prod-media-foundation',
  'smoke:prod-speech-caption',
  'smoke:prod-smart-cut-timeline',
  'smoke:prod-audio-sound',
  'smoke:prod-core-tool-install',
  'smoke:prod-gpu-ai-install',
  'smoke:prod-readiness-validation',
  'smoke:prod-real-speech-caption',
  'smoke:prod-real-smart-cut-timeline',
  'smoke:prod-real-audio',
  'smoke:prod-real-color',
  'smoke:prod-real-mask-background',
  'smoke:prod-real-enhancement-slowmotion',
  'smoke:prod-final-render-export',
  'smoke:prod-full-e2e-workflow',
  'smoke:prod-full-e2e-blockers',
  'smoke:prod-hardening',
  'smoke:prod-security-privacy',
  'smoke:prod-cost-controls',
  'smoke:beta-readiness',
  'smoke:activation-baseline-audit',
]

const requiredProductionSummaryScripts = [
  'prod:readiness:summary',
  'prod:readiness:command-plan',
  'prod:e2e:summary',
  'prod:hardening:summary',
  'prod:security:summary',
  'prod:cost:summary',
  'prod:beta:summary',
]

for (const scriptName of requiredProductionSmokeScripts) {
  assert.ok(scripts[scriptName], `package.json missing ${scriptName}`)
}

for (const scriptName of requiredProductionSummaryScripts) {
  assert.ok(scripts[scriptName], `package.json missing ${scriptName}`)
}

const roadmapDoc = readRepoFile('docs/production-tool-runtime-roadmap.md')
assertIncludes(roadmapDoc, 'human-run approval phase', 'Runtime roadmap must mention the human-run approval phase.')
assertIncludes(roadmapDoc, 'Phase 18-37 Activation Roadmap', 'Runtime roadmap must mention activation Phases 18-37.')

const milestoneIndex = readRepoFile('docs/production-milestone-index.md')
assertIncludes(milestoneIndex, 'Milestone 17 - Current: Production Hardening And Beta Readiness', 'Milestone index must mark M17 hardening/beta readiness.')
assertIncludes(milestoneIndex, 'Phase 18 - Current: Activation Baseline Audit', 'Milestone index must mention Phase 18 activation.')

const betaScorecard = readRepoFile('docs/production-beta-readiness-scorecard.md')
assertIncludes(betaScorecard, 'External beta, real user media beta, and paid production remain blocked.', 'Beta scorecard must keep external beta blocked.')

const goNoGo = readRepoFile('docs/production-go-no-go-checklist.md')
for (const requiredPhrase of ['approved deployment and rollback plan', 'model-weight and license approvals', 'security review approval', 'cost budgets', 'final delivery/share policy approval']) {
  assertIncludes(goNoGo, requiredPhrase, `Go/no-go checklist missing ${requiredPhrase}`)
}

const gcpReadme = readRepoFile('scripts/gcp/prod/README.md')
assertIncludes(gcpReadme, 'human-run templates', 'GCP README must say scripts are human-run templates.')
assertIncludes(gcpReadme, 'REEDITPRO_CONFIRM_PROD_SETUP=true', 'GCP README must mention confirmation gate.')

const dockerReadme = readRepoFile('scripts/docker/prod/README.md')
assertIncludes(dockerReadme, 'examples for a later human-run image milestone', 'Docker README must say scripts are examples/human-run.')
assertIncludes(dockerReadme, 'REEDITPRO_CONFIRM_CONTAINER_READINESS=true', 'Docker README must mention container readiness confirmation.')

for (const path of [
  'scripts/gcp/prod/01-enable-apis.sh',
  'scripts/gcp/prod/02-create-artifact-registry.sh',
  'scripts/gcp/prod/03-create-gcs-buckets.sh',
  'scripts/gcp/prod/04-create-service-accounts.sh',
  'scripts/gcp/prod/05-create-secret-placeholders.sh',
  'scripts/gcp/prod/06-configure-iam.sh',
]) {
  assertIncludes(readRepoFile(path), 'confirm_prod_action', `${path} must require REEDITPRO_CONFIRM_PROD_SETUP=true.`)
}

for (const path of [
  'scripts/docker/prod/09-run-container-readiness-cpu.example.sh',
  'scripts/docker/prod/10-run-container-readiness-render.example.sh',
  'scripts/docker/prod/11-run-container-readiness-qa.example.sh',
  'scripts/docker/prod/12-run-container-readiness-gpu.example.sh',
  'scripts/docker/prod/13-run-all-container-readiness.example.sh',
]) {
  assertIncludes(readRepoFile(path), 'REEDITPRO_CONFIRM_CONTAINER_READINESS', `${path} must require container readiness confirmation.`)
}

assertRevideoReadinessBlocked()
assert.equal(getProductionToolProfile('revideo')?.productionStatus, 'evaluation_only', 'Revideo must remain evaluation-only.')
assert.equal(getProductionReadinessSpec('revideo')?.readinessStatusWhenMissing, 'evaluation_only', 'Revideo readiness state must remain evaluation-only.')

const expectedPhaseIds = Array.from({ length: 20 }, (_value, index) => index + 18)
assert.deepEqual(activationPhaseRoadmap.map((phase) => phase.id), expectedPhaseIds, 'Activation roadmap must include exactly Phases 18-37.')

const report = buildActivationBaselineAuditReport()
assert.equal(report.productionReadyAllowed, false, 'Activation baseline must not allow production readiness.')
assert.equal(report.externalBetaAllowed, false, 'Activation baseline must not allow external beta.')
assert.equal(report.realUserMediaTestingAllowed, false, 'Activation baseline must not allow real user media testing.')
assert.ok(report.readinessStates.some((state) => state.area === 'docker_build' && state.state === 'human_run_required'), 'Container build must be human-run required.')
assert.ok(report.readinessStates.some((state) => state.area === 'gcp_setup' && state.state === 'human_run_required'), 'GCP staging setup must be human-run required.')
assert.ok(report.readinessStates.some((state) => state.area === 'model_weights' && ['blocked', 'not_started'].includes(state.state)), 'Model-weight/license approval must be blocked or not started.')
assert.ok(report.readinessStates.some((state) => state.area === 'first_real_video_speech_caption' && state.state === 'blocked'), 'First real video testing must be blocked until prerequisites pass.')

const activationText = [
  readRepoFile('docs/activation-phase-roadmap.md'),
  readRepoFile('docs/activation-baseline-audit.md'),
  readRepoFile('docs/activation-readiness-state.md'),
  readRepoFile('docs/activation-next-phase-runbook.md'),
  readRepoFile('server/activation/activation-baseline-audit-report.ts'),
  readRepoFile('server/activation/activation-phase-roadmap.ts'),
  JSON.stringify(scripts),
].join('\n')

assert.ok(!/productionReadyAllowed\s*[:=]\s*true/.test(activationText), 'No production launch approval flag should be introduced.')
assert.ok(!/externalBetaAllowed\s*[:=]\s*true/.test(activationText), 'No external beta approval flag should be introduced.')
assert.ok(!/realUserMediaTestingAllowed\s*[:=]\s*true/.test(activationText), 'No real user media approval flag should be introduced.')
assert.ok(!/scripts\/gcp\/prod|scripts\/docker\/prod/.test(JSON.stringify(scripts)), 'package.json must not introduce production Docker/GCP automation scripts.')

for (const path of [
  'docs/activation-phase-roadmap.md',
  'docs/activation-baseline-audit.md',
  'docs/activation-readiness-state.md',
  'docs/activation-next-phase-runbook.md',
]) {
  assert.ok(repoFileExists(path), `Missing activation doc ${path}`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'm0_m17_smoke_scripts_present',
    'production_summary_scripts_present',
    'activation_roadmap_phases_18_37_present',
    'production_ready_false',
    'external_beta_false',
    'real_user_media_false',
    'container_build_human_run_required',
    'gcp_staging_human_run_required',
    'model_license_not_started_or_blocked',
    'first_real_video_blocked',
    'revideo_evaluation_only',
    'no_launch_flag_introduced',
  ],
}))
