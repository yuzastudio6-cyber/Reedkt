import { readFileSync } from 'node:fs'

const expectedPackages = ['satori', '@svgdotjs/svg.js', '@viz-js/viz', 'lottie-web']
const failures = []
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))

for (const packageName of expectedPackages) {
  if (!packageJson.dependencies?.[packageName]) failures.push(`missing_dependency:${packageName}`)
  if (!packageLock.packages?.[`node_modules/${packageName}`]) failures.push(`missing_lock_entry:${packageName}`)
}

const importResults = {}

try {
  const satori = await import('satori')
  importResults.satori = {
    status: typeof satori.default === 'function' && typeof satori.init === 'function' ? 'import_api_shape_passed' : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/satori']?.version ?? null,
    defaultExportType: typeof satori.default,
    initExportType: typeof satori.init,
    rasterizationUsed: false,
    externalFontsUsed: false,
  }
  if (importResults.satori.status !== 'import_api_shape_passed') failures.push('satori_api_shape_failed')
} catch (error) {
  importResults.satori = { status: 'import_failed', message: error.message }
  failures.push(`satori_import_failed:${error.message}`)
}

try {
  const svgjs = await import('@svgdotjs/svg.js')
  importResults.svgjs = {
    status: typeof svgjs.SVG === 'function' && typeof svgjs.registerWindow === 'function' ? 'import_api_shape_passed' : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/@svgdotjs/svg.js']?.version ?? null,
    svgFactoryType: typeof svgjs.SVG,
    registerWindowType: typeof svgjs.registerWindow,
    browserDomRuntimeUsed: false,
    svgOutputWritten: false,
  }
  if (importResults.svgjs.status !== 'import_api_shape_passed') failures.push('svgjs_api_shape_failed')
} catch (error) {
  importResults.svgjs = { status: 'import_failed', message: error.message }
  failures.push(`svgjs_import_failed:${error.message}`)
}

try {
  const viz = await import('@viz-js/viz')
  const instance = await viz.instance()
  const svg = instance.renderString('digraph Batch2Synthetic { alpha -> beta }', { format: 'svg', engine: 'dot' })
  importResults.viz = {
    status: typeof svg === 'string' && svg.includes('alpha') && svg.includes('beta') ? 'node_only_dot_to_svg_in_memory_passed' : 'node_only_dot_to_svg_in_memory_failed',
    version: packageLock.packages?.['node_modules/@viz-js/viz']?.version ?? null,
    graphvizVersion: viz.graphvizVersion ?? null,
    formatsIncludeSvg: Array.isArray(viz.formats) && viz.formats.includes('svg'),
    inMemorySvgLength: typeof svg === 'string' ? svg.length : 0,
    externalBinaryUsed: false,
    outputFileWritten: false,
  }
  if (importResults.viz.status !== 'node_only_dot_to_svg_in_memory_passed') failures.push('viz_node_only_dot_to_svg_failed')
} catch (error) {
  importResults.viz = { status: 'import_or_node_compile_failed', message: error.message }
  failures.push(`viz_import_or_node_compile_failed:${error.message}`)
}

try {
  const lottie = await import('lottie-web')
  const lottieSurface = lottie.default ?? lottie['module.exports'] ?? lottie
  importResults.lottieWeb = {
    status: 'manifest_validation_only_import_metadata_present',
    version: packageLock.packages?.['node_modules/lottie-web']?.version ?? null,
    moduleImported: true,
    surfaceType: typeof lottieSurface,
    enumerableApiKeys: Object.keys(lottieSurface ?? {}).length,
    browserPlayerRuntimeUsed: false,
    animationLoaded: false,
  }
} catch (error) {
  const browserBoundary = /\b(?:document|window|navigator|HTMLElement|DOM)\b/i.test(error.message)
  importResults.lottieWeb = {
    status: browserBoundary ? 'manifest_validation_only_import_blocked_by_browser_runtime' : 'import_failed',
    version: packageLock.packages?.['node_modules/lottie-web']?.version ?? null,
    message: error.message,
    browserPlayerRuntimeUsed: false,
    animationLoaded: false,
  }
  if (!browserBoundary) failures.push(`lottie_web_import_failed:${error.message}`)
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  proofType: 'batch_2_import_smoke_no_browser_no_runtime_execution',
  packages: Object.fromEntries(expectedPackages.map((name) => [name, packageLock.packages?.[`node_modules/${name}`]?.version ?? null])),
  importResults,
  browserRuntimeUsed: false,
  webglRuntimeUsed: false,
  lottiePlayerRuntimeUsed: false,
  rasterizationUsed: false,
  renderExportUsed: false,
  routeExecutionUsed: false,
  workerExecutionUsed: false,
  providerRuntimeUsed: false,
  supabaseMutationUsed: false,
  publicArtifactsCreated: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
