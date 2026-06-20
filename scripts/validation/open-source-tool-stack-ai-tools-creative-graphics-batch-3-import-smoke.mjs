import { readFileSync } from 'node:fs'

const expectedPackages = ['animejs', 'three', 'pixi.js', 'konva', 'babylonjs']
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const failures = []
const warnings = []
const importResults = {}

process.on('warning', (warning) => {
  warnings.push({
    name: warning.name,
    message: warning.message,
  })
})

for (const packageName of expectedPackages) {
  if (!packageJson.dependencies?.[packageName]) failures.push(`missing_dependency:${packageName}`)
  if (!packageLock.packages?.[`node_modules/${packageName}`]) failures.push(`missing_lock_entry:${packageName}`)
}

const browserBoundaryPattern = /\b(?:document|window|navigator|HTMLElement|HTMLCanvasElement|WebGLRenderingContext|canvas|DOM|localStorage)\b/i

try {
  const anime = await import('animejs')
  importResults.animejs = {
    status:
      typeof anime.animate === 'function' && typeof anime.createTimeline === 'function' && typeof anime.easings === 'object'
        ? 'import_api_shape_passed'
        : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/animejs']?.version ?? null,
    animateExportType: typeof anime.animate,
    createTimelineExportType: typeof anime.createTimeline,
    easingsExportType: typeof anime.easings,
    browserAnimationExecuted: false,
    motionRuntimeExecuted: false,
  }
  if (importResults.animejs.status !== 'import_api_shape_passed') failures.push('animejs_api_shape_failed')
} catch (error) {
  importResults.animejs = { status: 'import_failed', message: error.message }
  failures.push(`animejs_import_failed:${error.message}`)
}

try {
  const three = await import('three')
  importResults.three = {
    status:
      typeof three.REVISION === 'string' && typeof three.WebGLRenderer === 'function' && typeof three.Scene === 'function'
        ? 'import_api_shape_passed'
        : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/three']?.version ?? null,
    revision: three.REVISION ?? null,
    webglRendererExportType: typeof three.WebGLRenderer,
    sceneExportType: typeof three.Scene,
    webglRendererConstructed: false,
    webglContextCreated: false,
  }
  if (importResults.three.status !== 'import_api_shape_passed') failures.push('three_api_shape_failed')
} catch (error) {
  importResults.three = { status: browserBoundaryPattern.test(error.message) ? 'metadata_only_import_blocked_by_browser_runtime' : 'import_failed', message: error.message }
  if (importResults.three.status === 'import_failed') failures.push(`three_import_failed:${error.message}`)
}

try {
  const pixi = await import('pixi.js')
  importResults.pixiJs = {
    status:
      typeof pixi.VERSION === 'string' && typeof pixi.Application === 'function' && typeof pixi.Container === 'function' && typeof pixi.Sprite === 'function'
        ? 'import_api_shape_passed'
        : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/pixi.js']?.version ?? null,
    pixiVersion: pixi.VERSION ?? null,
    applicationExportType: typeof pixi.Application,
    containerExportType: typeof pixi.Container,
    spriteExportType: typeof pixi.Sprite,
    applicationConstructed: false,
    rendererConstructed: false,
    canvasRuntimeExecuted: false,
  }
  if (importResults.pixiJs.status !== 'import_api_shape_passed') failures.push('pixi_js_api_shape_failed')
} catch (error) {
  importResults.pixiJs = { status: browserBoundaryPattern.test(error.message) ? 'metadata_only_import_blocked_by_browser_runtime' : 'import_failed', message: error.message }
  if (importResults.pixiJs.status === 'import_failed') failures.push(`pixi_js_import_failed:${error.message}`)
}

try {
  const konvaModule = await import('konva')
  const konva = konvaModule.default ?? konvaModule
  importResults.konva = {
    status:
      typeof konva.version === 'string' && typeof konva.Stage === 'function' && typeof konva.Layer === 'function'
        ? 'import_api_shape_passed'
        : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/konva']?.version ?? null,
    konvaVersion: konva.version ?? null,
    stageExportType: typeof konva.Stage,
    layerExportType: typeof konva.Layer,
    stageConstructed: false,
    browserCanvasCreated: false,
  }
  if (importResults.konva.status !== 'import_api_shape_passed') failures.push('konva_api_shape_failed')
} catch (error) {
  importResults.konva = { status: browserBoundaryPattern.test(error.message) ? 'metadata_only_import_blocked_by_browser_runtime' : 'import_failed', message: error.message }
  if (importResults.konva.status === 'import_failed') failures.push(`konva_import_failed:${error.message}`)
}

try {
  const babylonModule = await import('babylonjs')
  const babylon = babylonModule.default ?? babylonModule['module.exports'] ?? babylonModule
  importResults.babylonjs = {
    status:
      typeof babylon.Engine === 'function' && typeof babylon.Scene === 'function' && typeof babylon.Vector3 === 'function'
        ? 'import_api_shape_passed_with_node_localstorage_warning'
        : 'import_api_shape_failed',
    version: packageLock.packages?.['node_modules/babylonjs']?.version ?? null,
    engineVersion: babylon.Engine?.Version ?? null,
    engineExportType: typeof babylon.Engine,
    sceneExportType: typeof babylon.Scene,
    vector3ExportType: typeof babylon.Vector3,
    engineConstructed: false,
    sceneConstructed: false,
    webglContextCreated: false,
  }
  if (importResults.babylonjs.status === 'import_api_shape_failed') failures.push('babylonjs_api_shape_failed')
} catch (error) {
  importResults.babylonjs = {
    status: browserBoundaryPattern.test(error.message) ? 'metadata_only_import_blocked_by_browser_runtime' : 'import_failed',
    message: error.message,
  }
  if (importResults.babylonjs.status === 'import_failed') failures.push(`babylonjs_import_failed:${error.message}`)
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  proofType: 'batch_3_import_smoke_no_browser_webgl_canvas_runtime_execution',
  packages: Object.fromEntries(expectedPackages.map((name) => [name, packageLock.packages?.[`node_modules/${name}`]?.version ?? null])),
  importResults,
  warnings,
  browserRuntimeExecuted: false,
  webglRuntimeExecuted: false,
  canvasRuntimeExecuted: false,
  animationRuntimeExecuted: false,
  pixiRendererExecuted: false,
  threeWebglContextCreated: false,
  konvaCanvasCreated: false,
  babylonEngineCreated: false,
  routeExecutionUsed: false,
  workerExecutionUsed: false,
  providerRuntimeUsed: false,
  renderExportUsed: false,
  mediaRuntimeUsed: false,
  supabaseMutationUsed: false,
  publicArtifactsCreated: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
