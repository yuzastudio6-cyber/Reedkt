import { readFileSync } from 'node:fs'

const failures = []
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const expectedPackages = ['d3', 'echarts', 'vega-lite', 'vega']

for (const packageName of expectedPackages) {
  if (!packageJson.dependencies?.[packageName]) failures.push(`missing_dependency:${packageName}`)
  if (!packageLock.packages?.[`node_modules/${packageName}`]) failures.push(`missing_lock_entry:${packageName}`)
}

const d3 = await import('d3')
const echarts = await import('echarts')
const vegaLite = await import('vega-lite')
const vega = await import('vega')

const d3ScaleOutput = d3.scaleLinear().domain([0, 20]).range([0, 200])(10)
if (d3ScaleOutput !== 100) failures.push(`d3_scale_output:${d3ScaleOutput}`)

const d3LineOutput = d3.line()([
  [0, 0],
  [1, 1],
  [2, 4],
])
if (typeof d3LineOutput !== 'string' || !d3LineOutput.startsWith('M0,0')) {
  failures.push(`d3_line_output:${d3LineOutput}`)
}

if (typeof echarts.version !== 'string') failures.push('echarts_version_missing')
if (typeof echarts.init !== 'function') failures.push('echarts_init_surface_missing')
if (typeof echarts.graphic !== 'object') failures.push('echarts_graphic_surface_missing')

const vegaLiteSpec = {
  description: 'Synthetic Batch 1 smoke spec',
  data: {
    values: [
      { category: 'alpha', value: 4 },
      { category: 'beta', value: 12 },
    ],
  },
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' },
  },
}
const compiled = vegaLite.compile(vegaLiteSpec)
if (compiled?.spec?.marks?.[0]?.type !== 'rect') failures.push(`vega_lite_compiled_mark:${compiled?.spec?.marks?.[0]?.type}`)
const parsed = vega.parse(compiled.spec)
if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.operators)) failures.push('vega_parse_failed')

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  proofType: 'import_smoke_no_browser_no_runtime_execution',
  packages: Object.fromEntries(expectedPackages.map((name) => [name, packageLock.packages?.[`node_modules/${name}`]?.version ?? null])),
  d3ScaleOutput,
  d3LineOutput,
  echartsVersion: echarts.version,
  vegaLiteCompiledMarkType: compiled?.spec?.marks?.[0]?.type ?? null,
  vegaVersion: vega.version,
  browserRuntimeUsed: false,
  chartInitializationUsed: false,
  routeExecutionUsed: false,
  workerExecutionUsed: false,
  providerRuntimeUsed: false,
  supabaseMutationUsed: false,
  publicArtifactsCreated: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
