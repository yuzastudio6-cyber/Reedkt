#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/confirmed-readback-reference-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-readback-validation-confirmed-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1.md',
  'server/smoke/qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-1-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-handler-fail-closed-runtime-validation-1-diagnostics.mjs',
  'package.json',
]

const followOnProductRouteReadbackRuntimeValidationFiles = [
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1/readback-runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1/qwen2-5-vl-product-route-readback-runtime-validation-record.json',
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-enablement-review-1.md',
  'server/smoke/qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-smoke.ts',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_product_route_readback_validation_reference_gate_confirmed',
  'completed_source_only_confirmed_product_route_readback_reference_gate_no_remote_execution',
  '20bc7f21c8793b9d2947d4bab049a970841c987a',
  '#1358',
  '#577 remains open/draft/blocked/excluded',
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true',
  'ready_for_confirmed_qwen2_5_vl_product_route_readback_validation_runtime_packet',
  'approved snapshot readback reference: `present`',
  'credit reservation readback reference: `present`',
  'queue lease readback reference: `present`',
  'private input manifest readback reference: `present`',
  'private artifact manifest readback reference: `present`',
  'private artifact checksum readback reference: `present`',
  'source sequence map readback reference: `present`',
  'compiled intent readback reference: `present`',
  'model routing policy readback reference: `present`',
  'QA policy readback reference: `present`',
  'Actual remote readback allowed now: `false`',
  'Route handler execution allowed now: `false`',
  'Supabase readback execution allowed now: `false`',
  'Service-role readback execution allowed now: `false`',
  'Provider/model call allowed now: `false`',
  'External beta unlocked in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_RUNTIME_VALIDATION_1',
]

const forbiddenPatterns = [
  /External beta unlocked in this phase:\s*`?true`?/i,
  /(?:Actual remote readback|Route handler execution|Supabase readback execution|Service-role readback execution|Provider\/model call|Worker dispatch|Media processing|Signed URL creation|Public artifact|Final render\/export|External beta unlock|Paid production unlock|Production unlock) allowed now:\s*`?true`?/i,
  /remoteRouteExecution"?\s*:\s*true/i,
  /routeHandlerExecution"?\s*:\s*true/i,
  /routeReadbackExecution"?\s*:\s*true/i,
  /supabaseReadbackExecution"?\s*:\s*true/i,
  /serviceRoleReadbackExecution"?\s*:\s*true/i,
  /remoteRuntimeExecution"?\s*:\s*true/i,
  /cloudRunServiceUpdated"?\s*:\s*true/i,
  /cloudRunJobExecuted"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
  /qwenRuntimeExecuted(?:InThisPhase)?"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch(?:AllowedNow)?"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /signedUrlCreation(?:AllowedNow)?"?\s*:\s*true/i,
  /publicArtifact(?:Creation|AllowedNow)?"?\s*:\s*true/i,
  /mediaProcessing(?:AllowedNow)?"?\s*:\s*true/i,
  /privateUserMediaProcessing"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport(?:AllowedNow)?"?\s*:\s*true/i,
  /externalBetaUnlock(?:AllowedNow|AppliedToEnvironment)?"?\s*:\s*true/i,
  /paidProductionUnlock(?:AllowedNow)?"?\s*:\s*true/i,
  /productionUnlock(?:AllowedNow)?"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const forbiddenFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
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

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-readback-validation-confirmed-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_product_route_readback_validation_reference_gate_confirmed') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_source_only_confirmed_product_route_readback_reference_gate_no_remote_execution') {
  fail('execution mismatch')
}
if (record.integrationBase !== '20bc7f21c8793b9d2947d4bab049a970841c987a') fail('integration base mismatch')
if (record.sourceEvidence?.productRouteHandlerFailClosedRuntimeValidationPr !== 1358) fail('missing #1358 evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectName !== 'Reeditpro') fail('target name mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.class !== 'staging') fail('target class mismatch')
if (record.target?.secretMetadataOnly !== true) fail('target must be non-secret metadata only')
if (record.confirmationGate?.requiredValue !== 'true') fail('confirmation value mismatch')
if (record.confirmationGate?.confirmationPresentInSmoke !== true) fail('confirmation must be present in smoke')
if (record.confirmationGate?.currentPhaseRemoteReadbackExecuted !== false) fail('remote readback must not execute')
for (const [key, value] of Object.entries(record.requiredReadbackRefs ?? {})) {
  if (value !== 'present') fail(`required readback ref missing: ${key}`)
}
for (const [key, value] of Object.entries(record.allowedReadbackUse ?? {})) {
  if (key === 'routeContractReady' || key === 'sourceOnlyReadbackValidationGate') {
    if (value !== true) fail(`${key} must be true`)
    continue
  }
  if (value !== false) fail(`allowed readback flag must be false: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'sourceOnlyConfirmedReadbackReferenceGate') {
    if (value !== true) fail('sourceOnlyConfirmedReadbackReferenceGate must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (
  record.readiness?.qwenProductRouteReadbackValidationConfirmed !==
  'ready_for_confirmed_qwen2_5_vl_product_route_readback_validation_runtime_packet'
) {
  fail('readiness status mismatch')
}
if (record.readiness?.externalBetaUnlockedInThisPhase !== false) fail('external beta must remain locked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_RUNTIME_VALIDATION_1') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const smoke = read('server/smoke/qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-smoke.ts')
for (const text of [
  "const targetRef = 'wmyyttnynmteqgcdishd'",
  'confirmation: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE',
  'assert.equal(confirmedReadbackReferenceGate.ok, true)',
  'assert.equal(confirmedReadbackReferenceGate.allowedReadbackUse.actualRemoteReadbackAllowedNow, false)',
  'assert.equal(confirmedReadbackReferenceGate.safety.supabaseReadbackExecution, false)',
  'assert.equal(confirmedReadbackReferenceGate.safety.serviceRoleReadbackExecution, false)',
  'assert.equal(confirmedReadbackReferenceGate.safety.providerCall, false)',
  'assert.equal(confirmedReadbackReferenceGate.safety.modelCall, false)',
]) {
  if (!smoke.includes(text)) fail(`smoke source missing ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-smoke.ts'
) {
  fail('missing confirmed smoke script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1-diagnostics.mjs'
) {
  fail('missing confirmed diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set(requiredFiles)
for (const file of followOnProductRouteReadbackRuntimeValidationFiles) allowedFiles.add(file)
for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenFilePatterns.some((pattern) => pattern.test(file))) fail(`forbidden file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_product_route_readback_validation_reference_gate_confirmed')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_RUNTIME_VALIDATION_1')
