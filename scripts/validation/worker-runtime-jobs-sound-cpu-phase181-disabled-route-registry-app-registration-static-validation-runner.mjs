import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase181_disabled_route_registry_app_registration_static_validation_passed_with_warnings_ready_for_static_validation_result_owner_review'

const files = {
  app: 'server/app.ts',
  route: 'server/routes/sound-cpu-worker-routes.ts',
  registry: 'server/workers/sound-cpu/disabled-route-registry.ts',
  index: 'server/workers/sound-cpu/index.ts',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const appSource = read(files.app)
const routeSource = read(files.route)
const registrySource = read(files.registry)
const indexSource = read(files.index)

const importCount = countMatches(
  appSource,
  /import\s+\{\s*createSoundCpuWorkerRoutes\s*\}\s+from\s+['"]\.\/routes\/sound-cpu-worker-routes['"]/g,
)
const mountCount = countMatches(appSource, /app\.use\(createSoundCpuWorkerRoutes\(\)\)/g)
const routeFactoryReferenceCount = countMatches(appSource, /createSoundCpuWorkerRoutes/g)

const routeExecutionFlagFalse = routeSource.includes(
  'export const SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const',
)
const routeDisabledResponsePreservesNoExecution =
  routeSource.includes('workerDispatchStarted: false') &&
  routeSource.includes('mediaProcessingStarted: false') &&
  routeSource.includes('supabaseMutationStarted: false') &&
  routeSource.includes('sqlExecutionStarted: false') &&
  routeSource.includes('artifactCreated: false') &&
  routeSource.includes('routeRegisteredInApp: true')
const registryExecutionFlagFalse = registrySource.includes(
  'export const SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const',
)
const registryDispatchBlocked = registrySource.includes('acceptedForDispatch: false')
const registryIndexExportPresent =
  indexSource.includes("from './disabled-route-registry.ts'") &&
  indexSource.includes('SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED') &&
  indexSource.includes('listSoundCpuDisabledRouteRegistry')

assert(importCount === 1, `Expected exactly one app import for createSoundCpuWorkerRoutes, found ${importCount}`)
assert(mountCount === 1, `Expected exactly one app.use(createSoundCpuWorkerRoutes()) mount, found ${mountCount}`)
assert(
  routeFactoryReferenceCount === 2,
  `Expected exactly two app references to createSoundCpuWorkerRoutes, found ${routeFactoryReferenceCount}`,
)
assert(routeExecutionFlagFalse, 'SOUND CPU worker route execution flag is not fail-closed')
assert(routeDisabledResponsePreservesNoExecution, 'Disabled response no-execution fields are missing')
assert(registryExecutionFlagFalse, 'Disabled route registry execution flag is not fail-closed')
assert(registryDispatchBlocked, 'Disabled route registry dispatch block is missing')
assert(registryIndexExportPresent, 'Disabled route registry index export is missing')

const output = {
  decision,
  sourceOnlyStaticValidationPassed: true,
  appSourceUsed: files.app,
  routeSourceUsed: files.route,
  registrySourceUsed: files.registry,
  indexSourceUsed: files.index,
  appRegistrationPresent: true,
  appImportCount: importCount,
  appMountCount: mountCount,
  routeFactoryReferenceCount,
  duplicateAppRegistrationFound: false,
  routeExecutionFlagFalse,
  routeDisabledResponsePreservesNoExecution,
  registryExecutionFlagFalse,
  registryDispatchBlocked,
  registryIndexExportPresent,
  serverStarted: false,
  httpRouteRequestExecuted: false,
  routeHandlerInvoked: false,
  workerDispatchExecutionEnabled: false,
  routeExecutionEnabled: false,
  supabaseMutationEnabled: false,
  sqlExecutionEnabled: false,
  mediaProcessingEnabled: false,
  artifactCreationEnabled: false,
  nextPrompt:
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE182-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
}

console.log(JSON.stringify(output, null, 2))
