#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1R-RECONCILIATION'
const dir = 'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/reconciliation.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  `${dir}/qwen-route-gate-1r-reconciliation-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-confirmed.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/qwen-runtime-persistence-staging-service-role-route-gate-record.json',
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/qwen-runtime-persistence-staging-rls-storage-readback-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1/qwen2-5-vl-product-route-readback-runtime-validation-record.json',
  'docs/external-beta/qwen2-5-vl-product-route-runtime-readiness-rollup-1/qwen2-5-vl-product-route-runtime-readiness-rollup-record.json',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json',
  'docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json',
]

const requiredText = [
  packet,
  'completed_post_1505_qwen_staging_service_role_route_gate_reconciliation',
  'completed_docs_only_post_1505_qwen_route_gate_reconciliation_no_runtime_execution',
  'satisfied_by_existing_qwen_route_readback_runtime_and_controlled_single_tester_qwen_product_flow_evidence',
  '#1505',
  '#1500',
  '#1368',
  '#1407',
  '#1410',
  '#1414',
  '#1417',
  '#1419',
  '#1428',
  '#1430',
  '#1434',
  '#577',
  'a3df32c78ad88f0f7a5fe8c1e4fe4bfe5f2ad1a8',
  '2be9148cc92e658718101f14f84f045ce50f8cde',
  'd9f214786b40acef7664c1904130f0e4ac6bfc00',
  '71fe816d96135674bb634389ae08e2358806c33f',
  'go_single_tester_only',
  'aiediting@reeditpro.com',
  'blocked_no_additional_named_tester_list',
  'RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
for (const file of [
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/source-audit.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/current-state.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/side-stack-policy.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/safety-boundary.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/validation-results.md',
  'docs/external-beta/active-lane-current-state-after-qwen-gate-1/active-lane-current-state-record.json',
  'docs/activation-phase-rp-external-beta-active-lane-current-state-after-qwen-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-issue-fix-1.md',
  'scripts/validation/rp-external-beta-active-lane-current-state-after-qwen-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-feedback-driven-fix-loop-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const forbiddenChangedFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild/,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^src\//,
  /^server\/routes\//,
  /^server\/workers\//,
  /^server\/providers\//,
  /^media\//,
  /^public\//,
  /(?:^|\/)(?:dist|node_modules)\//,
  /\.(mp4|mov|mkv|webm|srt|mp3|wav|png|jpg|jpeg)$/i,
]

const forbiddenPatterns = [
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Remote Supabase mutation|SQL execution|Migration execution|Service-role route execution in this phase|Route handler execution in this phase|QWEN runtime execution in this phase|Worker execution|Worker dispatch|Provider call in this phase|Model call in this phase|Cloud Run invocation in this phase|Cloud Run deployment|Google Cloud IAM mutation|Browser capture|Remotion execution|FFmpeg execution|FFprobe execution|Media processing|Private media processing|User media processing|Signed URL creation|Public artifact creation|Credit mutation|Credit spend|Job enqueue|Job event write|Stripe checkout\/webhook\/payment processing|Dependency mutation|Package-lock mutation|Broad external beta unlock|Paid production unlock|Production unlock|Final render\/export|Preview artifact creation)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"remoteSupabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"serviceRoleRouteExecutionInThisPhase"\s*:\s*true/i,
  /"routeHandlerExecutionInThisPhase"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
  /"providerCallInThisPhase"\s*:\s*true/i,
  /"modelCallInThisPhase"\s*:\s*true/i,
  /"qwenRuntimeExecutionInThisPhase"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"cloudRunInvocationInThisPhase"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
const packetSafetyCorpus = requiredFiles
  .filter((file) => file !== 'docs/production-beta-blocker-inventory.md')
  .map((file) => read(file))
  .join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetSafetyCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${dir}/qwen-route-gate-1r-reconciliation-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_post_1505_qwen_staging_service_role_route_gate_reconciliation') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_post_1505_qwen_route_gate_reconciliation_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'a3df32c78ad88f0f7a5fe8c1e4fe4bfe5f2ad1a8') fail('integration base mismatch')
if (record.sourceEvidence?.qwenStagingServiceRoleRouteGatePr !== 1505) fail('missing #1505 source')
if (record.sourceEvidence?.qwenStagingServiceRoleRouteGateMergeSha !== 'a3df32c78ad88f0f7a5fe8c1e4fe4bfe5f2ad1a8') fail('#1505 merge SHA mismatch')
if (record.sourceEvidence?.qwenStagingRlsStorageReadbackPr !== 1500) fail('missing #1500 source')
if (record.sourceEvidence?.qwenProductRouteReadbackRuntimeValidationPr !== 1368) fail('missing #1368 source')
if (record.sourceEvidence?.qwenProductRouteRuntimeReadinessRollupPr !== 1407) fail('missing #1407 source')
if (record.sourceEvidence?.controlledSingleTesterGoNoGoPr !== 1434) fail('missing #1434 source')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectName !== 'Reeditpro') fail('target project name mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.environment !== 'staging') fail('target environment mismatch')
if (record.reconciledStatus !== 'satisfied_by_existing_qwen_route_readback_runtime_and_controlled_single_tester_qwen_product_flow_evidence') fail('reconciled status mismatch')
if (record.currentExternalBetaStatus?.lane !== 'go_single_tester_only') fail('single tester lane mismatch')
if (record.currentExternalBetaStatus?.testerEmail !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.currentExternalBetaStatus?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('expansion blocker mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1') fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyReconciliation') {
    if (value !== true) fail('docsOnlyReconciliation must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const goNoGo = JSON.parse(read('docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json'))
if (goNoGo.decision !== 'go_controlled_single_tester_external_beta_lane_remains_open') fail('go/no-go decision mismatch')
if (goNoGo.goScope?.testerEmail !== 'aiediting@reeditpro.com') fail('go/no-go tester mismatch')
if (goNoGo.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1') fail('go/no-go next milestone mismatch')

const routeGate = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/qwen-runtime-persistence-staging-service-role-route-gate-record.json'))
if (routeGate.decision !== 'blocked_pending_explicit_qwen_runtime_persistence_staging_service_role_route_gate_confirmation') fail('#1505 route gate decision mismatch')
if (routeGate.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1-CONFIRMED') fail('#1505 route gate next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1r-reconciliation-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside 1R reconciliation scope: ${file}`)
  for (const pattern of forbiddenChangedFilePatterns) {
    if (pattern.test(file)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_post_1505_qwen_staging_service_role_route_gate_reconciliation')
console.log('Next milestone: RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1')
