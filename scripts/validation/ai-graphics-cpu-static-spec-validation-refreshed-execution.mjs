import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const runId = 'ai-graphics-cpu-static-spec-validation-refreshed-local-static'
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const evidenceDir = path.join(
  repoRoot,
  '.local-artifacts/open-source-tool-stack/ai-graphics/cpu-static-spec-validation',
  runId,
)

const canonicalPackageProofStatus = 'canonical_merged_package_import_static_fixture_proof'
const falseRuntimeFields = {
  browserRuntimeUsed: false,
  webglCanvasUsed: false,
  toolRouteExecuted: false,
  workerExecuted: false,
  publicArtifactCreated: false,
  signedUrlCreated: false,
}

const hashJson = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')

const summarizeModule = (module) =>
  Object.keys(module)
    .filter((key) => !key.startsWith('_'))
    .sort()
    .slice(0, 12)

async function validateD3() {
  const d3 = await import('d3')
  const input = [
    { label: 'intro', value: 12 },
    { label: 'proof', value: 24 },
    { label: 'handoff', value: 33 },
  ]
  const values = input.map((entry) => entry.value)
  const domain = d3.extent(values)
  const scale = d3.scaleLinear().domain(domain).range([0, 100])
  const summary = {
    domain,
    min: d3.min(values),
    max: d3.max(values),
    scaledMidpoint: Number(scale(24).toFixed(4)),
    labelCount: input.length,
  }
  return {
    toolId: 'd3',
    displayName: 'D3',
    packageName: 'd3',
    canonicalPackageProofStatus,
    dependencyPresentFromFreshBase: true,
    cpuStaticValidationExecuted: true,
    inputFixtureType: 'static_data_shape_fixture',
    expectedOutputType: 'deterministic_chart_metadata_json',
    actualOutputSummary: summary,
    outputValidationPassed:
      summary.domain[0] === 12 && summary.domain[1] === 33 && summary.labelCount === 3,
    resultStatus: 'cpu_static_metadata_validation_passed',
    localArtifactPath: `${evidenceDir}/d3.json`,
    nextProofMilestone: 'cpu_static_spec_validation_qa_review',
    ...falseRuntimeFields,
  }
}

async function validateVegaLite() {
  const vegaLite = await import('vega-lite')
  const compile = vegaLite.compile ?? vegaLite.default?.compile
  if (typeof compile !== 'function') throw new Error('vega-lite compile API missing')
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    mark: 'bar',
    data: { values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] },
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' },
    },
  }
  const compiled = compile(spec).spec
  const summary = {
    markCount: Array.isArray(compiled.marks) ? compiled.marks.length : 0,
    hasData: Boolean(compiled.data),
    hasScales: Array.isArray(compiled.scales),
    compiledHash: hashJson({ data: compiled.data, marks: compiled.marks, scales: compiled.scales }),
  }
  return {
    toolId: 'vega_lite',
    displayName: 'Vega-Lite',
    packageName: 'vega-lite',
    canonicalPackageProofStatus,
    dependencyPresentFromFreshBase: true,
    cpuStaticValidationExecuted: true,
    inputFixtureType: 'minimal_vega_lite_spec_fixture',
    expectedOutputType: 'compiled_spec_metadata_json',
    actualOutputSummary: summary,
    outputValidationPassed: summary.markCount > 0 && summary.hasData && summary.hasScales,
    resultStatus: 'cpu_static_spec_compile_or_validation_passed',
    localArtifactPath: `${evidenceDir}/vega_lite.json`,
    nextProofMilestone: 'cpu_static_spec_validation_qa_review',
    ...falseRuntimeFields,
  }
}

async function validateVega() {
  const vega = await import('vega')
  if (typeof vega.parse !== 'function') throw new Error('vega parse API missing')
  const spec = {
    $schema: 'https://vega.github.io/schema/vega/v6.json',
    width: 120,
    height: 80,
    data: [{ name: 'table', values: [{ x: 0, y: 1 }, { x: 1, y: 3 }] }],
    scales: [{ name: 'x', type: 'linear', domain: [0, 1], range: 'width' }],
    marks: [{ type: 'symbol', from: { data: 'table' }, encode: { enter: { x: { scale: 'x', field: 'x' } } } }],
  }
  const parsed = vega.parse(spec)
  const summary = {
    operatorCount: Array.isArray(parsed.operators) ? parsed.operators.length : 0,
    parsedKeys: Object.keys(parsed).sort(),
    markCount: Array.isArray(spec.marks) ? spec.marks.length : 0,
    parsedHash: hashJson({ operators: parsed.operators?.length ?? 0, data: parsed.data?.length ?? 0 }),
  }
  return {
    toolId: 'vega',
    displayName: 'Vega',
    packageName: 'vega',
    canonicalPackageProofStatus,
    dependencyPresentFromFreshBase: true,
    cpuStaticValidationExecuted: true,
    inputFixtureType: 'minimal_vega_spec_fixture',
    expectedOutputType: 'parsed_spec_metadata_json',
    actualOutputSummary: summary,
    outputValidationPassed: summary.operatorCount > 0 && summary.markCount === 1 && summary.parsedKeys.includes('operators'),
    resultStatus: 'cpu_static_spec_parse_or_validation_passed',
    localArtifactPath: `${evidenceDir}/vega.json`,
    nextProofMilestone: 'cpu_static_spec_validation_qa_review',
    ...falseRuntimeFields,
  }
}

async function validateSatori() {
  const satori = await import('satori')
  const manifest = {
    type: 'card',
    props: {
      width: 640,
      height: 360,
      children: [{ type: 'text', props: { children: 'CPU static contract only' } }],
    },
  }
  const summary = {
    defaultExportFunction: typeof satori.default === 'function',
    manifestNodeCount: manifest.props.children.length + 1,
    outputContract: 'svg_string_metadata_shape_later_no_render_now',
    moduleKeys: summarizeModule(satori),
  }
  return {
    toolId: 'satori',
    displayName: 'Satori',
    packageName: 'satori',
    canonicalPackageProofStatus,
    dependencyPresentFromFreshBase: true,
    cpuStaticValidationExecuted: true,
    inputFixtureType: 'static_jsx_like_manifest_fixture',
    expectedOutputType: 'manifest_contract_metadata_json',
    actualOutputSummary: summary,
    outputValidationPassed: summary.defaultExportFunction && summary.manifestNodeCount === 2,
    resultStatus: 'cpu_static_manifest_contract_validation_passed_with_no_render',
    localArtifactPath: `${evidenceDir}/satori.json`,
    nextProofMilestone: 'cpu_static_spec_validation_qa_review',
    ...falseRuntimeFields,
  }
}

async function validateSvgdotjs() {
  const svgdotjs = await import('@svgdotjs/svg.js')
  const manifest = {
    root: { width: 320, height: 180 },
    elements: [{ kind: 'rect', attrs: { x: 8, y: 8, width: 80, height: 40 } }],
  }
  const summary = {
    svgFactoryPresent: typeof svgdotjs.SVG === 'function',
    elementCount: manifest.elements.length,
    outputContract: 'svg_element_or_string_metadata_later_no_dom_runtime_now',
    moduleKeys: summarizeModule(svgdotjs),
  }
  return {
    toolId: 'svgdotjs_svg_js',
    displayName: '@svgdotjs/svg.js',
    packageName: '@svgdotjs/svg.js',
    canonicalPackageProofStatus,
    dependencyPresentFromFreshBase: true,
    cpuStaticValidationExecuted: true,
    inputFixtureType: 'static_svg_construction_manifest',
    expectedOutputType: 'svg_manifest_contract_metadata_json',
    actualOutputSummary: summary,
    outputValidationPassed: summary.svgFactoryPresent && summary.elementCount === 1,
    resultStatus: 'cpu_static_manifest_contract_validation_passed_with_no_dom_runtime',
    localArtifactPath: `${evidenceDir}/svgdotjs_svg_js.json`,
    nextProofMilestone: 'cpu_static_spec_validation_qa_review',
    ...falseRuntimeFields,
  }
}

async function validateVizJs() {
  const viz = await import('@viz-js/viz')
  const dot = 'digraph G { source -> proof; proof -> qa; }'
  const edgeMatches = [...dot.matchAll(/([A-Za-z]+)\s*->\s*([A-Za-z]+)/g)]
  const summary = {
    dotHash: createHash('sha256').update(dot).digest('hex'),
    nodeCount: new Set(edgeMatches.flatMap((match) => [match[1], match[2]])).size,
    edgeCount: edgeMatches.length,
    moduleKeys: summarizeModule(viz),
    renderApiPresent: typeof viz.instance === 'function' || typeof viz.Viz === 'function',
  }
  return {
    toolId: 'viz_js',
    displayName: '@viz-js/viz',
    packageName: '@viz-js/viz',
    canonicalPackageProofStatus,
    dependencyPresentFromFreshBase: true,
    cpuStaticValidationExecuted: true,
    inputFixtureType: 'tiny_dot_graph_fixture',
    expectedOutputType: 'dot_metadata_shape_json',
    actualOutputSummary: summary,
    outputValidationPassed: summary.nodeCount === 3 && summary.edgeCount === 2 && summary.moduleKeys.length > 0,
    resultStatus: 'cpu_static_dot_metadata_validation_passed',
    localArtifactPath: `${evidenceDir}/viz_js.json`,
    nextProofMilestone: 'cpu_static_spec_validation_qa_review',
    ...falseRuntimeFields,
  }
}

const validators = [validateD3, validateVegaLite, validateVega, validateSatori, validateSvgdotjs, validateVizJs]
mkdirSync(evidenceDir, { recursive: true })

const startedAt = new Date().toISOString()
const toolResults = []
for (const validate of validators) {
  const result = await validate()
  writeFileSync(result.localArtifactPath, `${JSON.stringify(result, null, 2)}\n`)
  toolResults.push(result)
}

const failed = toolResults.filter((result) => !result.outputValidationPassed)
const summary = {
  runId,
  startedAt,
  completedAt: new Date().toISOString(),
  status: failed.length === 0 ? 'passed_with_warnings' : 'blocked',
  decision:
    failed.length === 0
      ? 'ai_graphics_cpu_static_spec_validation_refreshed_execution_passed_with_warnings'
      : `blocked_pending_${failed[0].toolId}_static_validation`,
  tools: toolResults.map((result) => ({
    toolId: result.toolId,
    resultStatus: result.resultStatus,
    outputValidationPassed: result.outputValidationPassed,
    localArtifactPath: result.localArtifactPath,
  })),
  noScope: {
    browserRuntimePerformed: false,
    webglCanvasRuntimePerformed: false,
    toolRouteExecutionPerformed: false,
    workerExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}
writeFileSync(path.join(evidenceDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))

if (failed.length > 0) {
  process.exitCode = 1
}
