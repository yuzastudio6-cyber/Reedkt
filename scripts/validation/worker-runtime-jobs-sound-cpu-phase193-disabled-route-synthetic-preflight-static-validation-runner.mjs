import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase193_disabled_route_synthetic_preflight_static_validation_passed_with_warnings_ready_for_synthetic_preflight_static_validation_result_owner_review'

const docs = {
  payload: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-payload-plan.md',
  auth: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase191-expected-disabled-response-plan.md',
  sideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase191-no-side-effect-observation-plan.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-phase191-stop-conditions-register.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required source document: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const match = read(file).match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function allFalse(record) {
  return Object.values(record).every((value) => value === false)
}

const parsed = {
  payload: parseJsonBlock(docs.payload, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-payload-plan'),
  auth: parseJsonBlock(docs.auth, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase191-expected-disabled-response-plan'),
  sideEffects: parseJsonBlock(docs.sideEffects, 'worker-runtime-jobs-sound-cpu-phase191-no-side-effect-observation-plan'),
  stops: parseJsonBlock(docs.stops, 'worker-runtime-jobs-sound-cpu-phase191-stop-conditions-register'),
}

const flags = parsed.payload.futureSyntheticPayload.staticOnlyRuntimeFlags
const auth = parsed.auth.futureSyntheticRequestContext
const response = parsed.response.futureExpectedDisabledResponse

const checks = {
  syntheticPayloadShapeValid:
    parsed.payload.futureSyntheticPayload.approvedPlanSnapshotId === 'synthetic-approved-plan-snapshot-id' &&
    parsed.payload.futureSyntheticPayload.workspaceId === 'synthetic-workspace-id' &&
    parsed.payload.futureSyntheticPayload.projectId === 'synthetic-project-id' &&
    parsed.payload.futureSyntheticPayload.jobId === 'synthetic-sound-cpu-disabled-route-job-id' &&
    parsed.payload.futureSyntheticPayload.idempotencyKey === 'synthetic-sound-cpu-disabled-route-idempotency-key',
  syntheticWorkerAndImageAllowed:
    parsed.payload.futureSyntheticPayload.workerName === 'sound-cpu-analysis-worker' &&
    parsed.payload.futureSyntheticPayload.imageName === 'reeditpro/sound-cpu-analysis-worker' &&
    parsed.payload.futureSyntheticPayload.jobType === 'sound.package_import_smoke',
  syntheticAttemptMetadataValid:
    parsed.payload.futureSyntheticPayload.attemptMetadata.attemptNumber === 1 &&
    parsed.payload.futureSyntheticPayload.attemptMetadata.maxAttempts === 1 &&
    parsed.payload.futureSyntheticPayload.attemptMetadata.requestedAtIso === 'synthetic-static-timestamp',
  syntheticPayloadFlagsAllFalse: allFalse(flags),
  syntheticPayloadNotSent: parsed.payload.currentGatePayloadSent === false,
  syntheticAuthShapeValid:
    auth.authContext === 'synthetic-authenticated-request-only' &&
    auth.idempotencyHeader === 'synthetic-non-secret-idempotency-key' &&
    auth.workspaceScope === 'synthetic-workspace-scope' &&
    auth.projectScope === 'synthetic-project-scope',
  syntheticAuthSecretsBlocked:
    auth.rawPromptAllowed === false &&
    auth.secretPayloadAllowed === false &&
    auth.serviceRolePayloadAllowed === false &&
    auth.signedUrlAsSourceOfTruthAllowed === false,
  syntheticAuthNotInvoked:
    parsed.auth.currentGateAuthMiddlewareInvoked === false &&
    parsed.auth.currentGateIdempotencyMiddlewareInvoked === false,
  expectedDisabledResponseShapeValid:
    response.httpStatus === 409 &&
    response.ok === false &&
    response.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED' &&
    response.reason === 'route_execution_not_enabled' &&
    response.ownerGateRequired === 'WORKER_RUNTIME_JOBS' &&
    response.accepted === false &&
    response.routeRegisteredInApp === true,
  expectedDisabledResponseSideEffectsFalse:
    response.workerDispatchStarted === false &&
    response.mediaProcessingStarted === false &&
    response.supabaseMutationStarted === false &&
    response.sqlExecutionStarted === false &&
    response.artifactCreated === false,
  expectedDisabledResponseNotObserved: parsed.response.currentGateResponseObserved === false,
  noSideEffectObservationPointsAllFalse: allFalse(parsed.sideEffects.futureObservationPoints),
  noSideEffectObservationNotPerformed: parsed.sideEffects.currentGateObservationPerformed === false,
  stopConditionsComplete:
    parsed.stops.futureSyntheticPreflightMustStopIf.includes('route_execution_flag_true') &&
    parsed.stops.futureSyntheticPreflightMustStopIf.includes('worker_dispatch_flag_true') &&
    parsed.stops.futureSyntheticPreflightMustStopIf.includes('supabase_or_sql_write_required') &&
    parsed.stops.futureSyntheticPreflightMustStopIf.includes('external_agent_execution_ready_claim_requested_before_disabled_preflight_proof'),
  stopConditionsClean:
    parsed.stops.currentGateUnsafeConditionDetected === false &&
    parsed.stops.currentGateStoppedForUnsafeCondition === false,
}

const failedChecks = Object.entries(checks)
  .filter(([, value]) => value !== true)
  .map(([key]) => key)

const result = {
  decision: failedChecks.length === 0
    ? decision
    : 'worker_runtime_jobs_sound_cpu_phase193_blocked_synthetic_preflight_static_validation_failed',
  sourceOnlySyntheticPreflightStaticValidationPassed: failedChecks.length === 0,
  sourceDocsRead: Object.values(docs),
  checks,
  failedChecks,
  staticAssertionsOnly: true,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE194-DISABLED-ROUTE-SYNTHETIC-PREFLIGHT-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
}

console.log(JSON.stringify(result, null, 2))

if (failedChecks.length > 0) process.exitCode = 1
