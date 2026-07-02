const routeModulePath = '../../server/routes/sound-cpu-worker-routes.ts'
const schemaModulePath = '../../server/validation/sound-cpu-worker-route-schemas.ts'

type ImportProofResult = Readonly<{
  ok: true
  routeModuleImported: true
  schemaModuleImported: true
  routeFactoryExportDetected: true
  routeFactoryInvoked: false
  routeExecutionEnabled: false
  workerDispatchExecutionEnabled: false
  supabaseMutationEnabled: false
  sqlExecutionEnabled: false
  mediaProcessingEnabled: false
  artifactCreationEnabled: false
  routeRegistrationModified: false
  exportedHandlers: string[]
  acceptedWorkerNames: readonly string[]
  acceptedImages: readonly string[]
  acceptedJobTypes: readonly string[]
}>

const routeModule = await import(routeModulePath)
const schemaModule = await import(schemaModulePath)

const requiredRouteExports = [
  'SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED',
  'SOUND_CPU_WORKER_ROUTE_DISABLED_REASON',
  'createSoundCpuRouteDisabledResponse',
  'createSoundCpuWorkerJobRoute',
  'getSoundCpuWorkerJobStatusRoute',
  'createSoundCpuWorkerRoutes',
] as const

const requiredSchemaExports = [
  'SOUND_CPU_WORKER_ROUTE_WORKER_NAMES',
  'SOUND_CPU_WORKER_ROUTE_IMAGES',
  'SOUND_CPU_WORKER_ROUTE_JOB_TYPES',
  'SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS',
  'createSoundCpuWorkerJobRouteSchema',
  'getSoundCpuWorkerJobStatusRouteSchema',
] as const

for (const exportName of requiredRouteExports) {
  if (!(exportName in routeModule)) throw new Error(`Missing route export: ${exportName}`)
}

for (const exportName of requiredSchemaExports) {
  if (!(exportName in schemaModule)) throw new Error(`Missing schema export: ${exportName}`)
}

if (routeModule.SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED !== false) {
  throw new Error('SOUND CPU route execution flag must remain false.')
}

const disabledFlags = schemaModule.SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS as Record<string, unknown>
for (const [key, value] of Object.entries(disabledFlags)) {
  if (value !== false) throw new Error(`SOUND CPU route flag ${key} must remain false.`)
}

const result: ImportProofResult = {
  ok: true,
  routeModuleImported: true,
  schemaModuleImported: true,
  routeFactoryExportDetected: true,
  routeFactoryInvoked: false,
  routeExecutionEnabled: false,
  workerDispatchExecutionEnabled: false,
  supabaseMutationEnabled: false,
  sqlExecutionEnabled: false,
  mediaProcessingEnabled: false,
  artifactCreationEnabled: false,
  routeRegistrationModified: false,
  exportedHandlers: [
    'createSoundCpuWorkerJobRoute',
    'getSoundCpuWorkerJobStatusRoute',
    'createSoundCpuWorkerRoutes',
  ],
  acceptedWorkerNames: schemaModule.SOUND_CPU_WORKER_ROUTE_WORKER_NAMES as readonly string[],
  acceptedImages: schemaModule.SOUND_CPU_WORKER_ROUTE_IMAGES as readonly string[],
  acceptedJobTypes: schemaModule.SOUND_CPU_WORKER_ROUTE_JOB_TYPES as readonly string[],
}

console.log(JSON.stringify(result, null, 2))
