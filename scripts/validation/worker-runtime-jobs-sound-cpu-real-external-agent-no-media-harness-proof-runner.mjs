import fs from 'node:fs'
import {
  createSelfTestRequests,
  invokeSoundCpuAgentCallableNoMediaToolCall,
} from './worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs'

const decision =
  'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_passed_with_warnings_ready_for_harness_owner_review'

const blockedDecision = 'worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_blocked'

const forbiddenHarnessFields = [
  'agentSecret',
  'apiKey',
  'oauthToken',
  'serviceAccountJson',
  'secretManagerRef',
  'mediaFilePath',
  'sourceMediaUrl',
  'signedUrl',
  'publicArtifactUrl',
  'artifactWriteTarget',
  'supabaseWriteIntent',
  'sqlStatement',
  'workerDispatchRequest',
  'routeExecutionRequest',
  'dockerRunRequest',
  'gcpResourceTarget',
]

function hasValue(value) {
  if (value === undefined || value === null || value === false) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return value !== 0
}

function sideEffects() {
  return {
    realExternalAgentCredentialsUsed: false,
    realUserMediaUsed: false,
    mediaOpened: false,
    workerDispatched: false,
    routeExecuted: false,
    manifestPersisted: false,
    providerCalled: false,
    modelCalled: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    publicArtifactCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    outputWrittenToDisk: false,
    tempArtifactsCreated: false,
  }
}

export function invokeRealExternalAgentNoMediaHarness(request) {
  const stopReasons = []

  if (!request || typeof request !== 'object') stopReasons.push('harness_request_object_required')
  if (request?.harnessKind !== 'sound_cpu_real_external_agent_no_media_harness') {
    stopReasons.push('harness_kind_invalid')
  }
  if (request?.agentOrigin !== 'external_agent_no_media_harness') stopReasons.push('agent_origin_invalid')
  if (!request?.agentSessionId) stopReasons.push('agent_session_id_required')
  if (!request?.agentRequestId) stopReasons.push('agent_request_id_required')
  if (!request?.adapterRequest || typeof request.adapterRequest !== 'object') {
    stopReasons.push('adapter_request_required')
  }

  for (const field of forbiddenHarnessFields) {
    if (hasValue(request?.[field])) stopReasons.push(`${field}_not_allowed`)
  }

  const adapterResult = request?.adapterRequest
    ? invokeSoundCpuAgentCallableNoMediaToolCall(request.adapterRequest)
    : {
        status: 'blocked',
        decision: 'worker_runtime_jobs_sound_cpu_agent_callable_no_media_tool_call_adapter_blocked',
        stopReasons: ['adapter_request_required'],
        acceptedToolCount: 0,
        sideEffects: sideEffects(),
      }

  if (adapterResult.status !== 'accepted') {
    stopReasons.push(...adapterResult.stopReasons.map((reason) => `adapter_${reason}`))
  }

  const accepted = stopReasons.length === 0

  return {
    status: accepted ? 'accepted' : 'blocked',
    harness: 'worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof',
    decision: accepted ? decision : blockedDecision,
    stopReasons: [...new Set(stopReasons)],
    requestSummary: {
      agentOrigin: request?.agentOrigin ?? null,
      agentSessionIdPresent: Boolean(request?.agentSessionId),
      agentRequestIdPresent: Boolean(request?.agentRequestId),
      adapterStatus: adapterResult.status,
      adapterJobType: request?.adapterRequest?.jobType ?? null,
      adapterToolDescriptorCount: request?.adapterRequest?.toolDescriptors?.length ?? 0,
    },
    externalAgentEnvelopeAccepted: accepted,
    acceptedToolCount: accepted ? adapterResult.acceptedToolCount : 0,
    adapterResult,
    sideEffects: sideEffects(),
  }
}

function createValidHarnessRequest() {
  return {
    harnessKind: 'sound_cpu_real_external_agent_no_media_harness',
    agentOrigin: 'external_agent_no_media_harness',
    agentSessionId: 'agent-session-local-no-media-001',
    agentRequestId: 'agent-request-local-no-media-001',
    adapterRequest: createSelfTestRequests()[0],
  }
}

export function createHarnessProofRequests() {
  const valid = createValidHarnessRequest()
  return {
    valid,
    invalidOrigin: {
      ...valid,
      agentOrigin: 'unknown_agent',
      agentRequestId: 'agent-request-invalid-origin',
    },
    agentSecret: {
      ...valid,
      agentRequestId: 'agent-request-secret-block',
      agentSecret: 'blocked-secret-placeholder',
    },
    mediaPath: {
      ...valid,
      agentRequestId: 'agent-request-media-path-block',
      adapterRequest: {
        ...valid.adapterRequest,
        mediaFilePath: '/private/no-media-should-not-open.wav',
      },
    },
    trueRuntimeFlag: {
      ...valid,
      agentRequestId: 'agent-request-runtime-flag-block',
      adapterRequest: {
        ...valid.adapterRequest,
        runtimeFlags: {
          ...valid.adapterRequest.runtimeFlags,
          allowWorkerDispatch: true,
        },
      },
    },
  }
}

export function runHarnessProof() {
  const requests = createHarnessProofRequests()
  const validResult = invokeRealExternalAgentNoMediaHarness(requests.valid)
  const blockedResults = Object.entries(requests)
    .filter(([name]) => name !== 'valid')
    .map(([name, request]) => ({
      name,
      result: invokeRealExternalAgentNoMediaHarness(request),
    }))

  const allBlocked = blockedResults.every(({ result }) => result.status === 'blocked')
  const passed = validResult.status === 'accepted' && allBlocked && validResult.acceptedToolCount === 15

  return {
    status: passed ? 'passed' : 'failed',
    decision: passed ? decision : blockedDecision,
    validExternalAgentNoMediaEnvelopeAccepted: validResult.status === 'accepted',
    blockedCaseCount: blockedResults.filter(({ result }) => result.status === 'blocked').length,
    expectedBlockedCaseCount: blockedResults.length,
    acceptedToolCount: validResult.acceptedToolCount,
    validResult,
    blockedResults,
    sideEffects: sideEffects(),
  }
}

function printContract() {
  console.log(
    JSON.stringify(
      {
        harnessKind: 'sound_cpu_real_external_agent_no_media_harness',
        agentOrigin: 'external_agent_no_media_harness',
        requiredFields: ['harnessKind', 'agentOrigin', 'agentSessionId', 'agentRequestId', 'adapterRequest'],
        forbiddenHarnessFields,
        outputMode: 'stdout_json_only',
        writesFiles: false,
        readsMedia: false,
        dispatchesWorkers: false,
        executesRoutes: false,
        mutatesSupabase: false,
        createsArtifacts: false,
      },
      null,
      2,
    ),
  )
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--print-contract')) {
    printContract()
    return
  }

  if (args.includes('--proof')) {
    const proof = runHarnessProof()
    console.log(JSON.stringify(proof, null, 2))
    if (proof.status !== 'passed') process.exitCode = 1
    return
  }

  const inputIndex = args.indexOf('--input')
  let raw
  if (inputIndex >= 0) {
    const inputPath = args[inputIndex + 1]
    if (!inputPath) throw new Error('--input requires a JSON file path')
    raw = fs.readFileSync(inputPath, 'utf8')
  } else {
    raw = await readStdin()
  }

  const request = JSON.parse(raw)
  const result = invokeRealExternalAgentNoMediaHarness(request)
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== 'accepted') process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'error', message: error.message }, null, 2))
  process.exitCode = 1
})
