#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-SCAFFOLD-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold'
const decisionText = 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation'
const executionText = 'blocked_confirmation_absent_no_route_worker_or_tool_execution'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-SCAFFOLD-CONFIRMED-1'
const gateName = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.md`,
  `${packetDir}/fail-closed-scaffold.json`,
  `${packetDir}/fail-closed-scaffold.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/validation-results.md`,
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-enablement-plan/gpac-mp4box-guarded-runtime-dispatch-enablement-plan-decision.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
  'package.json',
]

const followOnExternalReadinessFiles = [
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/source-audit.md',
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/readiness-reconciliation.md',
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-matrix.md',
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/validation-results.md',
  'docs/external-beta/tool-readiness-after-gpac-dispatch-1/tool-readiness-after-gpac-dispatch-record.json',
  'docs/activation-phase-rp-external-product-tool-readiness-after-gpac-dispatch-1-results.md',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-status-reconciliation-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, ...followOnExternalReadinessFiles])

function fail(message) {
  console.error(`${lane} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of requiredFiles) read(file)
for (const file of packetFiles.filter((file) => file.endsWith('.json'))) json(file)

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-dispatch-scaffold:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs') fail('missing package diagnostics script')

const decision = json(`${packetDir}/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.confirmationGate?.name !== gateName) fail('gate name drift')
if (decision.confirmationGate?.observed !== 'absent') fail('gate observed drift')
if (decision.confirmationGate?.runtimeDispatchAllowed !== false) fail('dispatch allowance drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(decision.runtimeAuthorization ?? {})) {
  if (value !== false) fail(`runtime authorization ${key} enabled`)
}

const failClosed = json(`${packetDir}/fail-closed-scaffold.json`)
if (failClosed.scaffoldMode !== 'fail_closed_confirmation_absent') fail('scaffold mode drift')
if (failClosed.requiredConfirmationGate !== `${gateName}=true`) fail('required gate drift')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'gpacMp4boxExecution', 'mediaProcessing', 'storageTransfer']) {
  if (failClosed[key] !== 'not_run_confirmation_absent') fail(`${key} drift`)
}

const source = json(`${packetDir}/source-of-truth-audit.json`)
if (!source.sourceChain?.includes('TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ENABLEMENT-PLAN-1')) fail('missing dispatch enablement source')
if (source.productReadyLocalOssTools !== 0) fail('source product-ready drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.readyForConfirmedScaffoldRetry !== true) fail('confirmed retry readiness drift')
for (const key of [
  'readyForRouteExecution',
  'readyForWorkerDispatch',
  'readyForWorkerExecution',
  'readyForGpacMp4boxExecution',
  'readyForMediaProcessing',
  'readyForStorageTransfer',
  'readyForSignedUrlCreation',
  'readyForPublicArtifactCreation',
  'readyForExternalBetaProductUse',
  'readyForProduction',
  'readyForFinalDeliveryExport',
]) {
  if (readiness[key] !== false) fail(`${key} drift`)
}

const docsCorpus = requiredFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n')
for (const text of [
  lane,
  decisionText,
  executionText,
  `${gateName}=true`,
  'observed',
  'absent',
  nextPrompt,
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]) {
  if (!docsCorpus.includes(text)) fail(`missing required text ${text}`)
}

for (const pattern of [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /"productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalDeliveryExport"\s*:\s*true/i,
]) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim ${pattern}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^public\/|^src\/|^server\/|\.dockerignore$|requirements/i.test(file)) fail(`forbidden changed path ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`generated or media artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log(`Execution: ${executionText}`)
console.log(`Next prompt: ${nextPrompt}`)
