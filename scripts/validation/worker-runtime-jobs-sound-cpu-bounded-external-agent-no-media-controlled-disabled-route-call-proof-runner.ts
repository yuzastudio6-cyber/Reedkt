import express from 'express'
import type { AddressInfo } from 'node:net'
import {
  SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH,
  SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS,
  createSoundCpuNoMediaAgentCallRoutes,
} from '../../server/routes/sound-cpu-no-media-agent-call-routes'

const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_disabled_route_call_proof_passed_with_warnings_ready_for_disabled_route_call_proof_owner_review'

const envelope = {
  approvedPlanSnapshotId: 'approved-plan-snapshot-sound-cpu-disabled-route-call-proof',
  workspaceId: 'workspace-sound-cpu-disabled-route-call-proof',
  projectId: 'project-sound-cpu-disabled-route-call-proof',
  jobId: 'job-sound-cpu-disabled-route-call-proof',
  idempotencyKey: 'sound-cpu-disabled-route-call-proof-2026-07-03',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  toolId: 'librosa',
  attemptMetadata: {
    attemptNumber: 1,
    maxAttempts: 1,
    requestedAtIso: '2026-07-03T22:16:04Z',
    agentRequestId: 'sound-cpu-disabled-route-call-proof-local',
  },
  staticOnlyRuntimeFlags: SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS,
} as const

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function allFalse(record: Record<string, unknown>): boolean {
  return Object.values(record).every((value) => value === false)
}

async function main() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  app.use(createSoundCpuNoMediaAgentCallRoutes())

  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>((resolve) => server.once('listening', resolve))

  try {
    const address = server.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${address.port}${SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope),
    })
    const body = (await response.json()) as {
      ok?: unknown
      error?: { code?: unknown }
      data?: {
        soundCpuNoMediaAgentCall?: {
          acceptedForExecution?: unknown
          routeRegisteredInApp?: unknown
          routeExecutionEnabled?: unknown
          validation?: { ok?: unknown; envelope?: { toolId?: unknown } }
          acceptedToolCount?: unknown
          acceptedWorkerCount?: unknown
          acceptedImageCount?: unknown
          acceptedJobTypeCount?: unknown
          sideEffects?: Record<string, unknown>
        }
      }
      warnings?: unknown[]
    }

    const result = body.data?.soundCpuNoMediaAgentCall
    assert(response.status === 409, 'Expected disabled route proof status 409')
    assert(body.ok === false, 'Expected top-level ok false')
    assert(body.error?.code === 'SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_NOT_ENABLED', 'Expected disabled route error code')
    assert(result?.acceptedForExecution === false, 'Expected acceptedForExecution false')
    assert(result.routeRegisteredInApp === true, 'Expected routeRegisteredInApp true')
    assert(result.routeExecutionEnabled === false, 'Expected routeExecutionEnabled false')
    assert(result.validation?.ok === true, 'Expected safe static envelope validation to pass before fail-closed block')
    assert(result.validation.envelope?.toolId === 'librosa', 'Expected explicit toolId to be preserved')
    assert(result.acceptedToolCount === 15, 'Expected 15 accepted tools')
    assert(result.acceptedWorkerCount === 2, 'Expected 2 accepted workers')
    assert(result.acceptedImageCount === 2, 'Expected 2 accepted images')
    assert(result.acceptedJobTypeCount === 4, 'Expected 4 accepted no-media job types')
    assert(result.sideEffects && allFalse(result.sideEffects), 'Expected all side-effect flags false')
    assert(Array.isArray(body.warnings), 'Expected warnings array')
    assert(body.warnings.includes('route_registered_disabled_handler_only'), 'Expected disabled registration warning')
    assert(body.warnings.includes('tool_execution_not_enabled'), 'Expected tool execution disabled warning')

    console.log(
      JSON.stringify(
        {
          ok: true,
          decision,
          routePath: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH,
          localHttpPostAttempted: true,
          localHostOnly: true,
          status: response.status,
          errorCode: body.error.code,
          routeRegisteredInApp: result.routeRegisteredInApp,
          routeExecutionEnabled: result.routeExecutionEnabled,
          acceptedForExecution: result.acceptedForExecution,
          envelopeValidationOk: result.validation.ok,
          explicitToolId: result.validation.envelope.toolId,
          acceptedToolCount: result.acceptedToolCount,
          acceptedWorkerCount: result.acceptedWorkerCount,
          acceptedImageCount: result.acceptedImageCount,
          acceptedNoMediaJobTypeCount: result.acceptedJobTypeCount,
          allSideEffectsFalse: true,
          warnings: body.warnings,
          workerDispatch: false,
          workerExecution: false,
          toolExecution: false,
          mediaProcessing: false,
          supabaseTouched: false,
          sqlExecuted: false,
          artifactCreated: false,
          providerModelCall: false,
          dockerCloudRunExecution: false,
          betaUnlocked: false,
          productionUnlocked: false,
        },
        null,
        2,
      ),
    )
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2))
  process.exitCode = 1
})
