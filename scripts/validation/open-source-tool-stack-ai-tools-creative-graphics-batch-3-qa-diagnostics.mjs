import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const expectedDecision = 'ai_graphics_batch_3_qa_passed_with_warnings'
const allowedDecisions = new Set([
  'ai_graphics_batch_3_qa_passed',
  expectedDecision,
  'blocked_pending_ai_graphics_batch_3_qa_fixes',
  'blocked_pending_package_diff_review',
  'blocked_pending_validation_rerun',
  'blocked_pending_browser_webgl_canvas_boundary_review',
  'ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings',
  'approved_with_warnings_for_ai_graphics_batch_3',
])
const tools = ['animejs', 'three', 'pixi.js', 'konva', 'babylonjs']
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-qa-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-acceptance-matrix.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-warning-blocker-register.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-package-diff-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-proof-status-update.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-runtime-boundary-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-recommendation.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-qa-decision.md',
  'docs/prompt-ai-tools-creative-graphics-batch-3-qa-review-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-3-qa-review.md',
]
const requiredEvidenceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-execution.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-readiness-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-install-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-import-smoke-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-synthetic-fixture-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-runtime-boundary-evidence.md',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-anime-timing-manifest.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-three-scene-manifest.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-pixi-sprite-manifest.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-konva-layer-manifest.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-babylon-scene-manifest.json',
]
const requiredTrueBooleans = [
  'batch3Accepted',
  'batch3AcceptedWithWarnings',
  'readyForBatch4Approval',
  'dependencyInstallAlreadyPerformedInBatch3',
  'importSmokeAlreadyPassedInBatch3',
  'manifestFixtureAlreadyPassedInBatch3',
]
const requiredFalseBooleans = [
  'browserRuntimeExecuted',
  'webglRuntimeExecuted',
  'canvasRuntimeExecuted',
  'e2eProductionProofClaimed',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'mediaRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
  'canvasRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]
const requiredEvidenceTokens = [
  'PR #441',
  '92c1a52b53c4836a642ab6be8885aa8fb994e9c8',
  'animejs: `import_api_shape_passed`',
  'three: `import_api_shape_passed`',
  'pixi.js: `import_api_shape_passed`',
  'konva: `import_api_shape_passed`',
  'babylonjs: `import_api_shape_passed_with_node_localstorage_warning`',
  'ai-graphics-batch-3-anime-timing-manifest.json',
  'ai-graphics-batch-3-three-scene-manifest.json',
  'ai-graphics-batch-3-pixi-sprite-manifest.json',
  'ai-graphics-batch-3-konva-layer-manifest.json',
  'ai-graphics-batch-3-babylon-scene-manifest.json',
  '@resvg/resvg-js',
  'Remotion',
]
const forbiddenPatterns = [
  ['e2e_production_claim', /\bE2E production proof\b[^.\n]*(?:claimed|completed|passed|true|enabled)\b/i],
  ['runtime_ready_claim', /\bruntime[- ](?:route|tool)[- ]ready\b[^.\n]*(?:claimed|approved|enabled|true)\b/i],
  ['tool_execution_enabled', /\bactual tool execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['worker_execution_enabled', /\bworker execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['provider_enabled', /\bprovider\/?model (?:calls?|execution|runtime)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['browser_runtime_enabled', /\b(?:browser|WebGL|canvas|DOM) runtime\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['anime_runtime_enabled', /\bAnime browser animation execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['three_runtime_enabled', /\bThree WebGL (?:renderer|context)\b[^.\n]*(?:enabled|approved now|allowed now|created|executed|true)\b/i],
  ['pixi_runtime_enabled', /\bPixi (?:Application|renderer|canvas)\b[^.\n]*(?:enabled|approved now|allowed now|created|executed|true)\b/i],
  ['konva_runtime_enabled', /\bKonva browser canvas\b[^.\n]*(?:enabled|approved now|allowed now|created|rendered|executed|true)\b/i],
  ['babylon_runtime_enabled', /\bBabylon (?:Engine|WebGL|scene render)\b[^.\n]*(?:enabled|approved now|allowed now|created|rendered|executed|true)\b/i],
  ['render_enabled', /\b(?:render\/export|render export|Remotion render|resvg rasterization)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['supabase_enabled', /\bSupabase (?:write|mutation|SQL)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['gcs_enabled', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['public_artifact_enabled', /\bpublic artifacts?\b[^.\n]*(?:enabled|approved now|allowed now|created|true)\b/i],
  ['signed_url_enabled', /\bsigned URLs?\b[^.\n]*(?:enabled|approved now|allowed now|created|true)\b/i],
  ['beta_enabled', /\b(?:internal beta|external beta)\b[^.\n]*(?:enabled|approved now|allowed now|unlocked|true)\b/i],
  ['production_enabled', /\bproduction\b[^.\n]*(?:enabled|approved now|allowed now|unlocked|true)\b/i],
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
]
const failures = []
const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const git = (args) => execFileSync('git', args, { env, encoding: 'utf8' }).trim()
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

for (const path of [...requiredDocs, ...requiredEvidenceDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = [...requiredDocs, ...requiredEvidenceDocs]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText
  .replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed|claimed|created)| ran| is approved)\./g, '')
  .split('\n')
  .filter(
    (line) =>
      !/\b(?:blocked|not claimed|not approved|does not approve|remains false|remains blocked|stayed false|out of scope|deferred|separately gated|warning|warnings|false|no live|no public|no route|no worker|no provider|no Supabase|no browser|no WebGL|no canvas)\b/i.test(
        line,
      ),
  )
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-qa-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-qa-decision.md', 'utf8')
  : ''
for (const field of requiredTrueBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`true\`\\s*\\|`).test(decisionDoc)) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`).test(decisionDoc)) failures.push(`required_boolean_not_false:${field}`)
}
for (const token of [
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]) {
  if (!decisionDoc.includes(token)) failures.push(`supabase_field_missing:${token}`)
}

for (const token of requiredEvidenceTokens) {
  if (!docsText.includes(token)) failures.push(`required_evidence_token_missing:${token}`)
}

const acceptanceMatrix = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-acceptance-matrix.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-acceptance-matrix.md', 'utf8')
  : ''
for (const tool of tools) {
  if (!docsText.includes(`\`${tool}\``)) failures.push(`tool_missing_from_docs:${tool}`)
  const toolRow = acceptanceMatrix.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!toolRow) failures.push(`acceptance_row_missing:${tool}`)
  else if (!toolRow.includes('`accepted_with_warnings`')) failures.push(`acceptance_not_with_warnings:${tool}`)
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
if (
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-3-qa:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-3-qa-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-3-qa:diagnostics')
}
const dependencyVersions = {
  animejs: '4.4.1',
  three: '0.184.0',
  'pixi.js': '8.19.0',
  konva: '10.3.0',
  babylonjs: '9.12.0',
}
for (const [tool, version] of Object.entries(dependencyVersions)) {
  if (packageLock?.packages?.[`node_modules/${tool}`]?.version !== version) failures.push(`unexpected_lock_version:${tool}`)
  if (!packageJson?.dependencies?.[tool]) failures.push(`missing_package_dependency:${tool}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|pdf)$/i.test(path))
  .filter((path) => path.includes('open-source-tool-stack') || path.includes('ai-graphics-batch-3'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_tracked:${trackedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  toolsReviewed: tools,
  batch3Accepted: true,
  batch3AcceptedWithWarnings: true,
  readyForBatch4Approval: true,
  browserRuntimeExecuted: false,
  webglRuntimeExecuted: false,
  canvasRuntimeExecuted: false,
  e2eProductionProofClaimed: false,
  actualToolExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  renderExportApprovedNow: false,
  supabaseUpdateRequired: 'no write',
  supabaseStatus: 'docs_only',
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
