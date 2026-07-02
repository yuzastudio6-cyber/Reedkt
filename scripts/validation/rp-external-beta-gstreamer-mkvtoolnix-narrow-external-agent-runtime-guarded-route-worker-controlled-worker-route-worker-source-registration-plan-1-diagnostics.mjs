#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-REGISTRATION-PLAN-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1-record.json`
const qaRollupRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-record.json'
const registeredPlanningRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-planning-1-record.json'
const routeWorkerDryRunRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-record.json'
const decision = 'satisfied_by_existing_registered_noop_source_planning_chain_no_new_registration_change'
const execution = 'completed_docs_only_source_registration_plan_reconciliation_no_route_worker_execution'
const integrationBase = 'bedd205ee37abe841795d811b3e47eb1359ef217'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-DRY-RUN-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/reconciliation.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1-results.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  'Accepted source implementation QA rollup: `#2094`',
  'Merge SHA: `bedd205ee37abe841795d811b3e47eb1359ef217`',
  'existing_registered_noop_source_chain_satisfies_registration_planning',
  'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource',
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary',
  'disabled_registered_noop_source_contract_only',
  'source_declared_not_dispatched',
  'newRouteRegistrationChange',
  'newWorkerDispatchChange',
  'newPersistentQueueWriteChange',
  'Production route file created: `false`',
  'Route registered at runtime: `false`',
  'Route execution: `false`',
  'Worker dispatch: `false`',
  'Worker execution: `false`',
  'Persistent queue write: `false`',
  'GStreamer readiness: `source_registration_planning_satisfied_by_existing_registered_noop_source_chain`',
  'MKVToolNix readiness: `source_registration_planning_satisfied_by_existing_registered_noop_source_chain`',
  'External-agent route/worker registration readiness: `ready_to_continue_existing_registered_noop_route_worker_dry_run_qa_rollup_chain`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  '#577 remains `open_draft_blocked_excluded`',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\broute execution enabled\b/i,
  /\bworker execution enabled\b/i,
  /\bworker dispatch enabled\b/i,
  /\bpersistent queue write enabled\b/i,
  /\bgstreamer execution enabled\b/i,
  /\bmkvtoolnix execution enabled\b/i,
  /\bffmpeg\/ffprobe execution enabled\b/i,
  /\bdocker execution enabled\b/i,
  /\bmedia processing enabled\b/i,
  /\bsupabase mutation enabled\b/i,
  /\bsql execution enabled\b/i,
  /\bsigned url creation enabled\b/i,
  /\bpublic artifact creation enabled\b/i,
  /\bproduction unlock enabled\b/i,
]

function fail(message) {
  console.error(`diagnostic failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function readJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid json ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).split('\n').filter(Boolean)
}

const allPacketText = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!allPacketText.includes(text)) fail(`missing required text: ${text}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-registration-plan-1-diagnostics.mjs'
) fail('package script mismatch')

const record = readJson(recordPath)
const qaRollup = readJson(qaRollupRecordPath)
const registeredPlanning = readJson(registeredPlanningRecordPath)
const routeWorkerDryRun = readJson(routeWorkerDryRunRecordPath)

if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.sourceImplementationQaRollupPr !== 2094) fail('source QA PR mismatch')
if (record.sourceChain?.sourceImplementationQaRollupMergeSha !== integrationBase) fail('source QA merge mismatch')
if (record.sourceChain?.registeredNoopSourcePlanningPacket !== registeredPlanning.packet) fail('registered planning packet mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunPacket !== routeWorkerDryRun.packet) fail('route worker dry-run packet mismatch')
if (record.sourceChain?.registeredNoopSourceRouteWorkerDryRunRunId !== routeWorkerDryRun.runId) fail('route worker dry-run run id mismatch')
if (qaRollup.nextMilestone !== packet) fail('QA rollup source next milestone mismatch')
if (record.reconciliation?.status !== 'existing_registered_noop_source_chain_satisfies_registration_planning') fail('reconciliation status mismatch')
if (record.reconciliation?.routeSourceId !== 'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource') fail('route source id mismatch')
if (record.reconciliation?.routeRuntimeMode !== 'disabled_registered_noop_source_contract_only') fail('route runtime mode mismatch')
for (const key of ['newRouteRegistrationChange', 'newWorkerDispatchChange', 'newPersistentQueueWriteChange']) {
  if (record.reconciliation?.[key] !== false) fail(`reconciliation flag must be false: ${key}`)
}
if (record.readiness?.gstreamer !== 'source_registration_planning_satisfied_by_existing_registered_noop_source_chain') fail('gstreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'source_registration_planning_satisfied_by_existing_registered_noop_source_chain') fail('mkvtoolnix readiness mismatch')
if (record.readiness?.externalAgentRouteWorkerRegistration !== 'ready_to_continue_existing_registered_noop_route_worker_dry_run_qa_rollup_chain') fail('external agent readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (!['pending_final_validation', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must be unchanged')
if (gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must not be staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'registration_reconciliation_no_route_worker_tool_media_supabase_sql_unlock_paths_not_enabled',
}, null, 2))
