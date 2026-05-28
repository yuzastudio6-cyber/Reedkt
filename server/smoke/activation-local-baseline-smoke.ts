import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  activationSmokeScripts,
  buildCheckScripts,
  buildLocalBaselineReport,
  evaluateLocalBaselineCommandText,
  localBaselineCommandCatalog,
  parseLocalBaselineCommandResult,
  productionSmokeScripts,
  productionSummaryScripts,
  runLocalBaseline,
} from '../activation/local-baseline'
import { getProductionToolProfile } from '../tool-registry'
import { assertRevideoReadinessBlocked, getProductionReadinessSpec } from '../workers/production-readiness'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function repoFileExists(path: string): boolean {
  return existsSync(new URL(`../../${path}`, import.meta.url))
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts: Record<string, string> }
const scripts = packageJson.scripts

const requiredProductionSmokes = [
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
]

const requiredActivationSmokes = [
  'smoke:activation-baseline-audit',
  'smoke:activation-local-baseline',
]

const requiredSummaryCommands = [
  'prod:readiness:summary',
  'prod:readiness:command-plan',
  'prod:e2e:summary',
  'prod:hardening:summary',
  'prod:security:summary',
  'prod:cost:summary',
  'prod:beta:summary',
]

const requiredBuildChecks = [
  'lint',
  'build',
  'build:server',
]

assert.deepEqual([...productionSmokeScripts], requiredProductionSmokes, 'Catalog must include all production smokes through M17.')
assert.deepEqual([...activationSmokeScripts], requiredActivationSmokes, 'Catalog must include Phase 18 and Phase 19 activation smokes.')
assert.deepEqual([...productionSummaryScripts], requiredSummaryCommands, 'Catalog must include all production summary commands.')
assert.deepEqual([...buildCheckScripts], requiredBuildChecks, 'Catalog must include lint/build/build:server.')

const requiredCatalogScripts = [
  ...requiredProductionSmokes,
  ...requiredActivationSmokes,
  ...requiredSummaryCommands,
  ...requiredBuildChecks,
].sort()
assert.deepEqual(localBaselineCommandCatalog.map((entry) => entry.npmScript).sort(), requiredCatalogScripts, 'Local baseline catalog must contain exactly the required commands.')

for (const script of requiredCatalogScripts) {
  assert.ok(scripts[script], `package.json missing local baseline script ${script}`)
}
assert.ok(scripts['activation:local-baseline'], 'package.json missing activation:local-baseline.')

const catalogCommandText = localBaselineCommandCatalog
  .map((entry) => `${entry.commandId} ${entry.npmScript}`)
  .join('\n')
assert.ok(!/docker\s+(build|push|run)|\bdocker\b/i.test(catalogCommandText), 'Catalog must not include Docker commands.')
assert.ok(!/\bgcloud\b/i.test(catalogCommandText), 'Catalog must not include gcloud commands.')
assert.ok(!/huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download|provider\s+call/i.test(catalogCommandText), 'Catalog must not include provider or model-download commands.')

const staticReport = await runLocalBaseline({ cwd: repoRoot, mode: 'static_only' })
assert.equal(staticReport.mode, 'static_only', 'Static local baseline report must use static_only mode.')
assert.ok(staticReport.commandResults.every((result) => result.status === 'not_run'), 'Static local baseline must not execute commands.')

const commandPlanReport = await runLocalBaseline({ cwd: repoRoot, mode: 'command_plan' })
assert.equal(commandPlanReport.mode, 'command_plan', 'Command-plan report must use command_plan mode.')
assert.ok(commandPlanReport.commandResults.every((result) => result.status === 'not_run'), 'Command-plan mode must not execute commands.')

const unconfirmedEnv: NodeJS.ProcessEnv = { ...process.env }
delete unconfirmedEnv.REEDITPRO_CONFIRM_LOCAL_BASELINE
await assert.rejects(
  () => runLocalBaseline({ cwd: repoRoot, mode: 'execute_confirmed', env: unconfirmedEnv }),
  /REEDITPRO_CONFIRM_LOCAL_BASELINE=true/,
  'Execute mode must refuse to run without explicit confirmation.',
)

for (const forbidden of [
  'docker build -f docker/prod/api/Dockerfile .',
  'docker push example',
  'gcloud run deploy reeditpro',
  'provider call runway',
  'huggingface-cli download model',
  'python -c "from_pretrained()"',
  'worker:probe-media --input /tmp/user-video.mp4',
  'production Revideo render',
]) {
  assert.equal(evaluateLocalBaselineCommandText(forbidden).allowed, false, `Policy must block forbidden command: ${forbidden}`)
}

const report = buildLocalBaselineReport({
  mode: 'static_only',
  packageScripts: scripts,
  activationBaselineAuditExists: true,
  createdAt: '2026-05-27T00:00:00.000Z',
})
assert.equal(report.productionReadyAllowed, false, 'Local baseline must not allow production readiness.')
assert.equal(report.externalBetaAllowed, false, 'Local baseline must not allow external beta.')
assert.equal(report.realUserMediaTestingAllowed, false, 'Local baseline must not allow real user media testing.')
assert.equal(report.dockerBuildAllowed, false, 'Local baseline must not allow Docker build by default.')
assert.equal(report.phase20Readiness.readyForContainerBuildPreparation, true, 'Phase 20 readiness should be preparation-only ready when scripts and policies exist.')
assert.ok(report.phase20Readiness.warnings.some((warning) => warning.includes('preparation only')), 'Phase 20 readiness must be preparation-only, not automatic build.')

const viteWarningResult = parseLocalBaselineCommandResult({
  commandId: 'build',
  npmScript: 'build',
  exitCode: 0,
  stdout: '(!) Some chunks are larger than 500 kB after minification.',
  stderr: '',
  startedAt: '2026-05-27T00:00:00.000Z',
  completedAt: '2026-05-27T00:00:01.000Z',
  durationMs: 1000,
})
assert.equal(viteWarningResult.status, 'warning', 'Successful Vite large chunk output should be warning-only.')

const viteFailureResult = parseLocalBaselineCommandResult({
  commandId: 'build',
  npmScript: 'build',
  exitCode: 1,
  stdout: '(!) Some chunks are larger than 500 kB after minification.',
  stderr: 'build failed',
  startedAt: '2026-05-27T00:00:00.000Z',
  completedAt: '2026-05-27T00:00:01.000Z',
  durationMs: 1000,
})
assert.equal(viteFailureResult.status, 'failed', 'Failed build must remain failed even with Vite large chunk output.')

assertRevideoReadinessBlocked()
assert.equal(getProductionToolProfile('revideo')?.productionStatus, 'evaluation_only', 'Revideo must remain evaluation-only.')
assert.equal(getProductionReadinessSpec('revideo')?.readinessStatusWhenMissing, 'evaluation_only', 'Revideo readiness must remain evaluation-only.')

assert.ok(localBaselineCommandCatalog.some((entry) => entry.npmScript === 'smoke:prod-full-e2e-workflow' && entry.mayUseGeneratedFixtures), 'Generated-fixture local smokes must be allowed.')
assert.ok(localBaselineCommandCatalog.some((entry) => entry.npmScript === 'smoke:prod-media-foundation' && entry.maySkipIfToolUnavailable), 'FFmpeg skip-safe local smokes must be allowed.')

for (const path of [
  'docs/activation-local-baseline-runbook.md',
  'docs/activation-local-baseline-report-policy.md',
  'docs/activation-phase-19-readiness-baseline.md',
  'server/activation/local-baseline/local-baseline-types.ts',
  'server/activation/local-baseline/local-baseline-command-catalog.ts',
  'server/activation/local-baseline/local-baseline-policy.ts',
  'server/activation/local-baseline/local-baseline-runner.ts',
  'server/activation/local-baseline/local-baseline-report-builder.ts',
  'server/activation/local-baseline/local-baseline-result-parser.ts',
]) {
  assert.ok(repoFileExists(path), `Missing Phase 19 file ${path}`)
}

const localBaselineScripts = [
  scripts['smoke:activation-local-baseline'],
  scripts['activation:local-baseline'],
].join('\n')
assert.ok(!/docker|gcloud|provider|huggingface|snapshot_download|from_pretrained/i.test(localBaselineScripts), 'Phase 19 npm scripts must not introduce Docker/GCP/provider/model execution.')

const activationText = [
  readRepoFile('docs/activation-phase-roadmap.md'),
  readRepoFile('docs/activation-next-phase-runbook.md'),
  readRepoFile('docs/activation-readiness-state.md'),
  readRepoFile('docs/activation-local-baseline-runbook.md'),
  readRepoFile('docs/activation-local-baseline-report-policy.md'),
  readRepoFile('docs/activation-phase-19-readiness-baseline.md'),
  readRepoFile('server/activation/local-baseline/local-baseline-report-builder.ts'),
  readRepoFile('server/activation/local-baseline/local-baseline-policy.ts'),
  JSON.stringify(scripts),
].join('\n')
assert.ok(!/productionReadyAllowed\s*[:=]\s*true/.test(activationText), 'No production launch flag should be introduced.')
assert.ok(!/externalBetaAllowed\s*[:=]\s*true/.test(activationText), 'No external beta approval flag should be introduced.')
assert.ok(!/realUserMediaTestingAllowed\s*[:=]\s*true/.test(activationText), 'No real media approval flag should be introduced.')
assert.ok(!/dockerBuildAllowed\s*[:=]\s*true/.test(activationText), 'No Docker build approval flag should be introduced.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'catalog_production_smokes_present',
    'catalog_activation_smokes_present',
    'catalog_summary_commands_present',
    'catalog_build_checks_present',
    'catalog_forbidden_commands_absent',
    'static_mode_not_run',
    'command_plan_not_run',
    'execute_requires_confirmation',
    'policy_blocks_forbidden_commands',
    'production_ready_false',
    'external_beta_false',
    'real_user_media_false',
    'docker_build_false',
    'phase20_preparation_only',
    'vite_large_chunk_warning_classified',
    'revideo_evaluation_only',
    'generated_fixture_skip_safe_allowed',
    'no_launch_flag_introduced',
  ],
}))
