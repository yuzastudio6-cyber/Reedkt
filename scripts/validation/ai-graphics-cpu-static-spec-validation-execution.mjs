import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..', '..')
const runId = 'ai-graphics-cpu-static-spec-validation-local-static'
const blockedDecision = 'blocked_pending_cpu_static_dependency_install_from_lock'
const passDecision = 'ai_graphics_cpu_static_spec_validation_execution_passed_with_warnings'
const evidenceDir = join(
  repoRoot,
  '.local-artifacts',
  'open-source-tool-stack',
  'ai-graphics',
  'cpu-static-spec-validation',
  runId,
)

const approvedTools = [
  { toolId: 'd3', packageName: 'd3', fixture: 'static_data_shape_fixture' },
  { toolId: 'vega_lite', packageName: 'vega-lite', fixture: 'minimal_vega_lite_spec_fixture' },
  { toolId: 'vega', packageName: 'vega', fixture: 'compiled_minimal_vega_spec_fixture' },
  { toolId: 'satori', packageName: 'satori', fixture: 'static_jsx_like_manifest_contract' },
  { toolId: 'svgdotjs_svg_js', packageName: '@svgdotjs/svg.js', fixture: 'static_svg_construction_manifest_contract' },
  { toolId: 'viz_js', packageName: '@viz-js/viz', fixture: 'small_dot_graph_metadata_contract' },
]

const excludedTools = ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'))
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function packageDeclares(packageJson, packageName) {
  return Boolean(
    packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName] ||
      packageJson.optionalDependencies?.[packageName] ||
      packageJson.peerDependencies?.[packageName],
  )
}

function lockfileDeclares(packageLock, packageName) {
  return Boolean(packageLock.packages?.[`node_modules/${packageName}`] || packageLock.dependencies?.[packageName])
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')

const dependencyStatus = approvedTools.map((tool) => ({
  ...tool,
  packageJsonDeclared: packageDeclares(packageJson, tool.packageName),
  packageLockDeclared: lockfileDeclares(packageLock, tool.packageName),
}))

const missingDependencies = dependencyStatus.filter((tool) => !tool.packageJsonDeclared || !tool.packageLockDeclared)
const decision = missingDependencies.length > 0 ? blockedDecision : passDecision

const result = {
  schema: 'reeditpro.openSourceToolStack.aiGraphicsCpuStaticSpecValidationLocalEvidence.v1',
  runId,
  decision,
  createdAt: new Date().toISOString(),
  sourceBranch: 'codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-execution',
  dependencyInstallPerformed: false,
  packageLockMutationPerformed: false,
  packageAvailabilityGatePassed: missingDependencies.length === 0,
  missingDependencies: missingDependencies.map((tool) => ({
    toolId: tool.toolId,
    packageName: tool.packageName,
    packageJsonDeclared: tool.packageJsonDeclared,
    packageLockDeclared: tool.packageLockDeclared,
  })),
  approvedTools: dependencyStatus.map((tool) => ({
    toolId: tool.toolId,
    packageName: tool.packageName,
    fixture: tool.fixture,
    status:
      decision === blockedDecision
        ? 'blocked_pending_cpu_static_dependency_install_from_lock'
        : 'available_for_future_static_contract_validation',
    executed: false,
    browserRuntimePerformed: false,
    webglCanvasRuntimePerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  })),
  excludedTools,
  noScope: {
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightDownloadPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecutionPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    internalBetaReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  },
}

result.sha256 = createHash('sha256').update(stableJson(result)).digest('hex')

mkdirSync(evidenceDir, { recursive: true })
writeFileSync(join(evidenceDir, 'execution-evidence.json'), stableJson(result))

console.log(
  stableJson({
    runId,
    decision,
    evidencePath:
      '.local-artifacts/open-source-tool-stack/ai-graphics/cpu-static-spec-validation/ai-graphics-cpu-static-spec-validation-local-static/execution-evidence.json',
    missingDependencies: result.missingDependencies,
  }),
)
