import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase185_disabled_route_runtime_readiness_static_validation_passed_with_warnings_ready_for_runtime_readiness_static_validation_result_owner_review'

const files = {
  route: 'server/routes/sound-cpu-worker-routes.ts',
  routeSchema: 'server/validation/sound-cpu-worker-route-schemas.ts',
  dispatchContract: 'server/workers/sound-cpu/dispatch-contract.ts',
  runtimeGuards: 'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts',
  runtimeContracts: 'server/workers/sound-cpu/runtime/soundCpuJobContracts.ts',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const route = read(files.route)
const routeSchema = read(files.routeSchema)
const dispatchContract = read(files.dispatchContract)
const runtimeGuards = read(files.runtimeGuards)
const runtimeContracts = read(files.runtimeContracts)

const routeExecutionFlagFalse = route.includes(
  'export const SOUND_CPU_WORKER_ROUTE_EXECUTION_ENABLED = false as const',
)
const routeDisabledResponseNoExecution =
  route.includes('workerDispatchStarted: false') &&
  route.includes('mediaProcessingStarted: false') &&
  route.includes('supabaseMutationStarted: false') &&
  route.includes('sqlExecutionStarted: false') &&
  route.includes('artifactCreated: false')
const routeDisabledWarningsPresent =
  route.includes('route_execution_not_enabled') &&
  route.includes('worker_dispatch_execution_not_enabled') &&
  route.includes('supabase_mutation_not_enabled') &&
  route.includes('media_processing_not_enabled') &&
  route.includes('artifact_creation_not_enabled')

const routeSchemaAllFlagsLiteralFalse = [
  'routeExecutionEnabled',
  'workerDispatchExecutionEnabled',
  'mediaProcessingEnabled',
  'supabaseMutationEnabled',
  'sqlExecutionEnabled',
  'storageObjectCreationEnabled',
  'signedUrlCreationEnabled',
  'publicArtifactCreationEnabled',
  'providerModelCallEnabled',
  'dockerCloudRunExecutionEnabled',
].every((flag) => routeSchema.includes(`${flag}: z.literal(false)`))

const routeDisabledFlagValuesFalse = [
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
].every((flag) => routeSchema.includes(flag))

const dispatchRuntimeFlagsDisabled = [
  "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0'",
  "REEDITPRO_WORKER_EXECUTION_ENABLED: '0'",
  "REEDITPRO_MEDIA_PROCESSING_ENABLED: '0'",
  "REEDITPRO_SUPABASE_MUTATION_ENABLED: '0'",
  "REEDITPRO_ARTIFACT_WRITE_ENABLED: '0'",
].every((flag) => dispatchContract.includes(flag) && runtimeGuards.includes(flag) && runtimeContracts.includes(flag))

const dispatchEnvelopeNoExecution =
  dispatchContract.includes('acceptedForDispatch: false') &&
  dispatchContract.includes('noWorkerExecution: true') &&
  dispatchContract.includes('noRouteExecution: true') &&
  dispatchContract.includes('noSupabaseMutation: true') &&
  dispatchContract.includes('noSqlExecution: true') &&
  dispatchContract.includes('noMediaProcessing: true') &&
  dispatchContract.includes('noArtifactCreated: true')

const runtimeGateStateFailClosed =
  runtimeGuards.includes('runtimeExecutionApproved: false') &&
  runtimeGuards.includes('workerExecutionApproved: false') &&
  runtimeGuards.includes('mediaProcessingApproved: false') &&
  runtimeGuards.includes('supabaseMutationApproved: false') &&
  runtimeGuards.includes('artifactWriteApproved: false')

assert(routeExecutionFlagFalse, 'route execution flag is not false')
assert(routeDisabledResponseNoExecution, 'route disabled response no-execution fields missing')
assert(routeDisabledWarningsPresent, 'route disabled warnings missing')
assert(routeSchemaAllFlagsLiteralFalse, 'route schema does not require all disabled flags as literal false')
assert(routeDisabledFlagValuesFalse, 'route disabled flag values are not all false')
assert(dispatchRuntimeFlagsDisabled, 'dispatch/runtime flags are not all disabled')
assert(dispatchEnvelopeNoExecution, 'dispatch envelope no-execution fields missing')
assert(runtimeGateStateFailClosed, 'runtime gate state is not fail-closed')

const output = {
  decision,
  sourceOnlyRuntimeReadinessStaticValidationPassed: true,
  routeSourceUsed: files.route,
  routeSchemaSourceUsed: files.routeSchema,
  dispatchContractSourceUsed: files.dispatchContract,
  runtimeGuardsSourceUsed: files.runtimeGuards,
  runtimeContractsSourceUsed: files.runtimeContracts,
  routeExecutionFlagFalse,
  routeDisabledResponseNoExecution,
  routeDisabledWarningsPresent,
  routeSchemaAllFlagsLiteralFalse,
  routeDisabledFlagValuesFalse,
  dispatchRuntimeFlagsDisabled,
  dispatchEnvelopeNoExecution,
  runtimeGateStateFailClosed,
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
  runtimeReadinessClaimed: false,
  nextPrompt:
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE186-DISABLED-ROUTE-RUNTIME-READINESS-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
}

console.log(JSON.stringify(output, null, 2))
