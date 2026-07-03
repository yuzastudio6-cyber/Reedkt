import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase189_disabled_route_execution_preflight_static_validation_passed_with_warnings_ready_for_preflight_static_validation_result_owner_review'

const sourceFiles = {
  app: 'server/app.ts',
  route: 'server/routes/sound-cpu-worker-routes.ts',
  schema: 'server/validation/sound-cpu-worker-route-schemas.ts',
  runtimeGuards: 'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts',
  dispatchContract: 'server/workers/sound-cpu/dispatch-contract.ts',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing source file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function includesAll(text, needles) {
  return needles.every((needle) => text.includes(needle))
}

const app = read(sourceFiles.app)
const route = read(sourceFiles.route)
const schema = read(sourceFiles.schema)
const runtimeGuards = read(sourceFiles.runtimeGuards)
const dispatchContract = read(sourceFiles.dispatchContract)

const checks = {
  appRegistrationSourcePresent: includesAll(app, [
    "import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'",
    'app.use(createSoundCpuWorkerRoutes())',
  ]),
  routeExecutionConstFalse: route.includes('export const SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const'),
  routeDisabledReasonStatic: route.includes("export const SOUND_CPU_WORKER_ROUTE_DISABLED_REASON = 'route_execution_not_enabled' as const"),
  routeHandlersSourcePresent: includesAll(route, [
    'export async function createSoundCpuWorkerJobRoute',
    'export async function getSoundCpuWorkerJobStatusRoute',
    'export function createSoundCpuWorkerRoutes(): Router',
  ]),
  authAndIdempotencyMiddlewarePresent: includesAll(route, [
    "router.post('/v1/sound-cpu/jobs', requireAuth, requireIdempotency, asyncRoute(createSoundCpuWorkerJobRoute))",
    "router.get('/v1/sound-cpu/jobs/:jobId', requireAuth, asyncRoute(getSoundCpuWorkerJobStatusRoute))",
  ]),
  disabledResponseStatus409: route.includes('response.status(409).json({'),
  disabledResponseNoSideEffects: includesAll(route, [
    'workerDispatchStarted: false',
    'mediaProcessingStarted: false',
    'supabaseMutationStarted: false',
    'sqlExecutionStarted: false',
    'artifactCreated: false',
  ]),
  disabledWarningsPresent: includesAll(route, [
    "'route_execution_not_enabled'",
    "'worker_dispatch_execution_not_enabled'",
    "'supabase_mutation_not_enabled'",
    "'media_processing_not_enabled'",
    "'artifact_creation_not_enabled'",
  ]),
  schemaDisabledFlagsLiteralFalse: includesAll(schema, [
    'routeExecutionEnabled: z.literal(false)',
    'workerDispatchExecutionEnabled: z.literal(false)',
    'mediaProcessingEnabled: z.literal(false)',
    'supabaseMutationEnabled: z.literal(false)',
    'sqlExecutionEnabled: z.literal(false)',
    'storageObjectCreationEnabled: z.literal(false)',
    'signedUrlCreationEnabled: z.literal(false)',
    'publicArtifactCreationEnabled: z.literal(false)',
    'providerModelCallEnabled: z.literal(false)',
    'dockerCloudRunExecutionEnabled: z.literal(false)',
  ]),
  schemaDisabledFlagsRuntimeValuesFalse: includesAll(schema, [
    'routeExecutionEnabled: false',
    'workerDispatchExecutionEnabled: false',
    'mediaProcessingEnabled: false',
    'supabaseMutationEnabled: false',
    'sqlExecutionEnabled: false',
    'storageObjectCreationEnabled: false',
    'signedUrlCreationEnabled: false',
    'publicArtifactCreationEnabled: false',
    'providerModelCallEnabled: false',
    'dockerCloudRunExecutionEnabled: false',
  ]),
  runtimeEnvFlagsZero: includesAll(runtimeGuards, [
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0'",
    "REEDITPRO_WORKER_EXECUTION_ENABLED: '0'",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED: '0'",
    "REEDITPRO_SUPABASE_MUTATION_ENABLED: '0'",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED: '0'",
  ]),
  runtimeGateStateFailClosed: includesAll(runtimeGuards, [
    'runtimeExecutionApproved: false',
    'workerExecutionApproved: false',
    'mediaProcessingApproved: false',
    'supabaseMutationApproved: false',
    'artifactWriteApproved: false',
    'throw new Error(SOUND_CPU_RUNTIME_BLOCKED_REASON)',
  ]),
  dispatchRuntimeFlagsZero: includesAll(dispatchContract, [
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0'",
    "REEDITPRO_WORKER_EXECUTION_ENABLED: '0'",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED: '0'",
    "REEDITPRO_SUPABASE_MUTATION_ENABLED: '0'",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED: '0'",
  ]),
  dispatchEnvelopeNoExecution: includesAll(dispatchContract, [
    'acceptedForDispatch: false',
    "blockedReason: 'worker_dispatch_execution_not_enabled'",
    'noWorkerExecution: true',
    'noRouteExecution: true',
    'noSupabaseMutation: true',
    'noSqlExecution: true',
    'noMediaProcessing: true',
    'noArtifactCreated: true',
  ]),
}

const failedChecks = Object.entries(checks)
  .filter(([, value]) => value !== true)
  .map(([key]) => key)

const result = {
  decision: failedChecks.length === 0
    ? decision
    : 'worker_runtime_jobs_sound_cpu_phase189_blocked_preflight_static_validation_failed',
  sourceOnlyPreflightStaticValidationPassed: failedChecks.length === 0,
  sourceFilesRead: Object.values(sourceFiles),
  checks,
  failedChecks,
  serverStarted: false,
  httpRouteRequestExecuted: false,
  routeHandlerInvoked: false,
  expressRouterInstantiated: false,
  workerDispatchExecutionEnabled: false,
  routeExecutionEnabled: false,
  claimLeaseMutationEnabled: false,
  supabaseMutationEnabled: false,
  sqlExecutionEnabled: false,
  mediaProcessingEnabled: false,
  artifactCreationEnabled: false,
  externalAgentExecutionReady: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE190-DISABLED-ROUTE-EXECUTION-PREFLIGHT-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
}

console.log(JSON.stringify(result, null, 2))

if (failedChecks.length > 0) process.exitCode = 1
