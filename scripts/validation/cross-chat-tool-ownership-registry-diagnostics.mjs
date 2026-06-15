#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const REGISTRY_PATH = 'docs/cross-chat-tool-ownership-registry.md'
const RISK_PATH = 'docs/sound-music-audio-cross-chat-duplicate-risk-register.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-sound-oss-tools-0-stack-inventory-gap-audit.md'
const PACKAGE_PATH = 'package.json'

const REQUIRED_WORKSTREAMS = [
  'SOUND_MUSIC_AUDIO',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'TOOL_ROUTE_EXECUTION',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
]

const ALLOWED_SOUND_ROLES = new Set(['own', 'reference-only', 'handoff-only', 'blocked', 'unknown'])
const ALLOWED_DUPLICATE_RISK = new Set(['none', 'low', 'medium', 'high', 'conflict'])
const RUNTIME_FALSE_KEYS = [
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'supabaseMutationAllowed',
  'sqlExecuted',
  'signedUrlsCreated',
  'publicArtifactsCreated',
  'betaReady',
  'productionReady',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
]

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function extractJsonBlock(markdown, label) {
  const start = `\`\`\`json ${label}`
  const startIndex = markdown.indexOf(start)
  assert(startIndex >= 0, `Missing json block: ${label}`)
  const bodyStart = markdown.indexOf('\n', startIndex)
  const bodyEnd = markdown.indexOf('\n```', bodyStart)
  assert(bodyStart >= 0 && bodyEnd >= 0, `Unclosed json block: ${label}`)
  return JSON.parse(markdown.slice(bodyStart + 1, bodyEnd))
}

function verifyNoUnsafeClaims(label, text) {
  const forbidden = [
    [/toolExecutionAllowed\s*[:=]\s*true/i, 'tool execution allowed'],
    [/routeExecutionAllowed\s*[:=]\s*true/i, 'route execution allowed'],
    [/workerExecutionAllowed\s*[:=]\s*true/i, 'worker execution allowed'],
    [/providerExecutionAllowed\s*[:=]\s*true/i, 'provider execution allowed'],
    [/supabaseMutationAllowed\s*[:=]\s*true/i, 'Supabase mutation allowed'],
    [/sqlExecuted\s*[:=]\s*true/i, 'SQL executed'],
    [/signedUrlsCreated\s*[:=]\s*true/i, 'signed URL created'],
    [/publicArtifactsCreated\s*[:=]\s*true/i, 'public artifact created'],
    [/betaReady\s*[:=]\s*true/i, 'beta ready'],
    [/productionReady\s*[:=]\s*true/i, 'production ready'],
    [/dryRunPassedClaimed\s*[:=]\s*true/i, 'dry-run pass claimed'],
    [/generatedLocalFixturePassedClaimed\s*[:=]\s*true/i, 'generated local fixture pass claimed'],
    [/generated_local_fixture_passed\s*[:=]\s*true/i, 'generated local fixture snake claim'],
    [/dry_run_passed\s*[:=]\s*true/i, 'dry run snake claim'],
    [/https?:\/\/[a-z0-9-]+\.supabase\.co\b/i, 'Supabase project URL'],
    [/\bpostgres(?:ql)?:\/\//i, 'database URL'],
    [/\bBearer\s+[A-Za-z0-9._~+/-]{24,}/, 'Bearer token'],
    [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'JWT'],
    [/X-(?:Amz|Goog)-(?:Algorithm|Credential|Signature|Expires)=/i, 'signed URL marker'],
    [/\bsk-[A-Za-z0-9]{20,}\b/, 'provider key shape'],
  ]

  for (const [pattern, reason] of forbidden) {
    assert(!pattern.test(text), `${label} contains unsafe claim or secret marker: ${reason}`)
  }
}

function verifyRuntimeFalse(record, label) {
  for (const key of RUNTIME_FALSE_KEYS) {
    assert(record[key] === false, `${label}.${key} must be false`)
  }
}

function main() {
  for (const requiredPath of [REGISTRY_PATH, RISK_PATH, PROMPT_PATH, PACKAGE_PATH]) {
    assert(fs.existsSync(path.join(ROOT, requiredPath)), `Missing required file: ${requiredPath}`)
  }

  const registryText = readText(REGISTRY_PATH)
  const riskText = readText(RISK_PATH)
  const promptText = readText(PROMPT_PATH)
  const packageJson = JSON.parse(readText(PACKAGE_PATH))

  verifyNoUnsafeClaims(REGISTRY_PATH, registryText)
  verifyNoUnsafeClaims(RISK_PATH, riskText)
  verifyNoUnsafeClaims(PROMPT_PATH, promptText)

  const registry = extractJsonBlock(registryText, 'ownership-registry')
  const riskRegister = extractJsonBlock(riskText, 'duplicate-risk-register')

  assert(packageJson.scripts?.['cross-chat-tool-ownership:diagnostics'] === 'node scripts/validation/cross-chat-tool-ownership-registry-diagnostics.mjs', 'Missing package script cross-chat-tool-ownership:diagnostics')
  assert(registry.schemaVersion === 'cross_chat_tool_ownership_registry_v1', 'Unexpected ownership registry schema')
  assert(riskRegister.schemaVersion === 'sound_duplicate_risk_register_v1', 'Unexpected duplicate-risk schema')
  assert(Array.isArray(registry.tools) && registry.tools.length >= 55, 'Registry must include discovered production tools plus SOUND/provider candidates')
  assert(Array.isArray(riskRegister.risks) && riskRegister.risks.length >= 10, 'Duplicate risk register must include shared-risk tools')

  verifyRuntimeFalse(registry.runtimeClaims, 'registry.runtimeClaims')
  verifyRuntimeFalse(riskRegister.runtimeClaims, 'riskRegister.runtimeClaims')

  for (const workstream of REQUIRED_WORKSTREAMS) {
    assert(registry.workstreamsRepresented?.includes(workstream), `Missing represented workstream: ${workstream}`)
  }

  const ids = new Set()
  let soundOwned = 0
  let referenceOnly = 0
  let handoffOnly = 0
  let blocked = 0
  let conflicts = 0

  for (const tool of registry.tools) {
    assert(tool.toolId && typeof tool.toolId === 'string', 'Every tool needs toolId')
    assert(!ids.has(tool.toolId), `Duplicate toolId: ${tool.toolId}`)
    ids.add(tool.toolId)
    assert(ALLOWED_SOUND_ROLES.has(tool.soundRole), `${tool.toolId} has invalid soundRole`)
    assert(ALLOWED_DUPLICATE_RISK.has(tool.duplicateRisk), `${tool.toolId} has invalid duplicateRisk`)
    assert(['yes', 'no', 'unknown'].includes(tool.installed), `${tool.toolId} installed must be yes/no/unknown`)
    assert(['yes', 'no', 'unknown'].includes(tool.runtimeProven), `${tool.toolId} runtimeProven must be yes/no/unknown`)
    assert(['yes', 'no', 'unknown'].includes(tool.licenseApproved), `${tool.toolId} licenseApproved must be yes/no/unknown`)
    assert(tool.soundMayDo && tool.soundMayNotDo && tool.nextOwner && tool.nextPrompt, `${tool.toolId} needs SOUND permissions and next owner/prompt`)

    if (tool.ownershipStatus === 'ownership_conflict') {
      conflicts += 1
      assert(tool.primaryOwner === 'ownership_conflict', `${tool.toolId} conflict must use ownership_conflict primary owner marker`)
      assert(tool.duplicateRisk === 'conflict', `${tool.toolId} conflict must use duplicateRisk conflict`)
    } else {
      assert(tool.ownershipStatus === 'assigned', `${tool.toolId} must be assigned or ownership_conflict`)
      assert(typeof tool.primaryOwner === 'string' && tool.primaryOwner.length > 0 && tool.primaryOwner !== 'ownership_conflict', `${tool.toolId} needs exactly one primary owner`)
    }

    if (Array.isArray(tool.secondaryOwners) && tool.secondaryOwners.length > 0) {
      assert(tool.handoffNotes && tool.handoffNotes.length > 0, `${tool.toolId} shared tool needs handoff notes`)
    }

    if (tool.soundRole === 'own') soundOwned += 1
    if (tool.soundRole === 'reference-only') referenceOnly += 1
    if (tool.soundRole === 'handoff-only') handoffOnly += 1
    if (tool.soundRole === 'blocked') blocked += 1
  }

  const demucs = registry.tools.find((tool) => tool.toolId === 'demucs')
  assert(demucs?.soundRole === 'blocked', 'Demucs must remain blocked')
  assert(/provenance|model-weight/i.test(`${demucs?.soundMayDo} ${demucs?.soundMayNotDo} ${demucs?.handoffNotes}`), 'Demucs blocker must mention provenance/model-weight review')

  const rnnoise = registry.tools.find((tool) => tool.toolId === 'rnnoise')
  assert(rnnoise?.soundRole === 'blocked', 'RNNoise must remain blocked/inactive')
  assert(/inactive/i.test(`${rnnoise?.soundMayDo} ${rnnoise?.soundMayNotDo} ${rnnoise?.handoffNotes}`), 'RNNoise must mention inactive status')

  for (const providerTool of ['lyria', 'mirelo_sfx_v1_5', 'mmaudio_v2']) {
    const tool = registry.tools.find((entry) => entry.toolId === providerTool)
    assert(tool?.primaryOwner === 'PROVIDER_GATEWAY_MODELS', `${providerTool} must be Provider Gateway primary`)
    assert(tool.soundRole === 'handoff-only', `${providerTool} must be SOUND handoff-only`)
  }

  for (const forbiddenStudy of ['docs/tool-studies/web-search-capture-tool-study.md', 'docs/tool-studies/map-geospatial-tool-study.md']) {
    assert(!fs.existsSync(path.join(ROOT, forbiddenStudy)), `Completed-owner replacement study must not be created: ${forbiddenStudy}`)
  }

  assert(promptText.includes('docs/cross-chat-tool-ownership-registry.md'), 'SOUND-OSS prompt must require registry first')
  assert(promptText.includes('ownership_conflict'), 'SOUND-OSS prompt must stop on ownership conflict')
  assert(promptText.includes('no installation') || promptText.includes('No installation'), 'SOUND-OSS prompt must keep installation blocked')
  assert(promptText.includes('no execution') || promptText.includes('No installation, dependency mutation'), 'SOUND-OSS prompt must keep execution blocked')

  const result = {
    status: 'passed',
    phase: 'SOUND-OWNERSHIP-0',
    decision: registry.decision,
    toolsChecked: registry.tools.length,
    workstreamsChecked: REQUIRED_WORKSTREAMS.length,
    soundOwned,
    referenceOnly,
    handoffOnly,
    blocked,
    ownershipConflicts: conflicts,
    duplicateRisksChecked: riskRegister.risks.length,
    demucsBlocked: demucs.soundRole === 'blocked',
    rnnoiseInactive: rnnoise.soundRole === 'blocked',
    runtimeClaimsClosed: true,
    supabaseUpdateRequired: false,
    nextPrompt: registry.nextPrompt,
  }

  console.log(JSON.stringify(result, null, 2))
}

try {
  main()
} catch (error) {
  console.error(JSON.stringify({
    status: 'failed',
    phase: 'SOUND-OWNERSHIP-0',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exit(1)
}
