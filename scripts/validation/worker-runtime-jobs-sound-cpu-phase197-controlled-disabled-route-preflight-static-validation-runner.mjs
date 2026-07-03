import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase197_controlled_disabled_route_preflight_static_validation_passed_with_warnings_ready_for_controlled_disabled_route_preflight_static_validation_result_owner_review'

const docs = {
  checklist: 'docs/worker-runtime-jobs-sound-cpu-phase195-preflight-checklist.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-phase195-route-handler-boundary-plan.md',
  auth: 'docs/worker-runtime-jobs-sound-cpu-phase195-auth-idempotency-preconditions.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase195-disabled-response-contract-plan.md',
  sideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase195-no-side-effect-observation-plan.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-phase195-stop-conditions-register.md',
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
  checklist: parseJsonBlock(docs.checklist, 'worker-runtime-jobs-sound-cpu-phase195-preflight-checklist'),
  boundary: parseJsonBlock(docs.boundary, 'worker-runtime-jobs-sound-cpu-phase195-route-handler-boundary-plan'),
  auth: parseJsonBlock(docs.auth, 'worker-runtime-jobs-sound-cpu-phase195-auth-idempotency-preconditions'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase195-disabled-response-contract-plan'),
  sideEffects: parseJsonBlock(docs.sideEffects, 'worker-runtime-jobs-sound-cpu-phase195-no-side-effect-observation-plan'),
  stops: parseJsonBlock(docs.stops, 'worker-runtime-jobs-sound-cpu-phase195-stop-conditions-register'),
}

const checks = {
  preflightPreconditionsValid:
    parsed.checklist.futureControlledPreflightPreconditions.phase194OwnerReviewDecisionRequired === true &&
    parsed.checklist.futureControlledPreflightPreconditions.routeExecutionFlagMustRemainFalse === true &&
    parsed.checklist.futureControlledPreflightPreconditions.workerDispatchMustRemainFalse === true &&
    parsed.checklist.futureControlledPreflightPreconditions.supabaseSqlArtifactMustRemainFalse === true,
  currentGateActionsAllFalse: allFalse(parsed.checklist.currentGateActions),
  routeBoundaryValid:
    parsed.boundary.futureProofBoundary.targetRouteSource === 'server/routes/sound-cpu-worker-routes.ts' &&
    parsed.boundary.futureProofBoundary.createHandler === 'createSoundCpuWorkerJobRoute' &&
    parsed.boundary.futureProofBoundary.expectedDisabledReason === 'route_execution_not_enabled' &&
    parsed.boundary.futureProofBoundary.expectedHttpStatus === 409,
  routeBoundarySideEffectsFalse:
    parsed.boundary.futureProofBoundary.expectedWorkerDispatchStarted === false &&
    parsed.boundary.futureProofBoundary.expectedMediaProcessingStarted === false &&
    parsed.boundary.futureProofBoundary.expectedSupabaseMutationStarted === false &&
    parsed.boundary.futureProofBoundary.expectedSqlExecutionStarted === false &&
    parsed.boundary.futureProofBoundary.expectedArtifactCreated === false,
  routeBoundaryNotInvoked: allFalse(parsed.boundary.currentGateBoundary),
  authPreconditionsValid:
    parsed.auth.futureSyntheticPreconditions.authContext === 'synthetic-authenticated-request-only' &&
    parsed.auth.futureSyntheticPreconditions.idempotencyKey === 'synthetic-non-secret-idempotency-key' &&
    parsed.auth.futureSyntheticPreconditions.rawPromptAllowed === false &&
    parsed.auth.futureSyntheticPreconditions.secretPayloadAllowed === false &&
    parsed.auth.futureSyntheticPreconditions.serviceRolePayloadAllowed === false &&
    parsed.auth.futureSyntheticPreconditions.signedUrlAsSourceOfTruthAllowed === false,
  authNotInvoked: allFalse(parsed.auth.currentGateExecution),
  disabledResponseValid:
    parsed.response.futureExpectedDisabledResponse.ok === false &&
    parsed.response.futureExpectedDisabledResponse.httpStatus === 409 &&
    parsed.response.futureExpectedDisabledResponse.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED' &&
    parsed.response.futureExpectedDisabledResponse.reason === 'route_execution_not_enabled' &&
    parsed.response.futureExpectedDisabledResponse.accepted === false,
  disabledResponseSideEffectsFalse:
    parsed.response.futureExpectedDisabledResponse.workerDispatchStarted === false &&
    parsed.response.futureExpectedDisabledResponse.mediaProcessingStarted === false &&
    parsed.response.futureExpectedDisabledResponse.supabaseMutationStarted === false &&
    parsed.response.futureExpectedDisabledResponse.sqlExecutionStarted === false &&
    parsed.response.futureExpectedDisabledResponse.artifactCreated === false,
  disabledResponseNotObserved:
    parsed.response.currentGateResponseCreated === false && parsed.response.currentGateResponseObserved === false,
  noSideEffectObservationPointsAllFalse: allFalse(parsed.sideEffects.futureObservationPoints),
  noSideEffectObservationNotPerformed: parsed.sideEffects.currentGateObservationPerformed === false,
  stopConditionsComplete:
    parsed.stops.futureControlledPreflightMustStopIf.includes('route_execution_flag_true') &&
    parsed.stops.futureControlledPreflightMustStopIf.includes('worker_dispatch_flag_true') &&
    parsed.stops.futureControlledPreflightMustStopIf.includes('supabase_or_sql_write_required') &&
    parsed.stops.futureControlledPreflightMustStopIf.includes('expected_disabled_response_not_fail_closed') &&
    parsed.stops.futureControlledPreflightMustStopIf.includes(
      'external_agent_execution_ready_claim_requested_before_disabled_preflight_proof',
    ),
  stopConditionsClean:
    parsed.stops.currentGateUnsafeConditionDetected === false &&
    parsed.stops.currentGateStoppedForUnsafeCondition === false,
}

const failedChecks = Object.entries(checks)
  .filter(([, value]) => value !== true)
  .map(([key]) => key)

const result = {
  decision:
    failedChecks.length === 0
      ? decision
      : 'worker_runtime_jobs_sound_cpu_phase197_blocked_controlled_preflight_static_validation_failed',
  sourceOnlyControlledPreflightStaticValidationPassed: failedChecks.length === 0,
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
  nextPrompt:
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE198-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
}

console.log(JSON.stringify(result, null, 2))

if (failedChecks.length > 0) process.exitCode = 1
