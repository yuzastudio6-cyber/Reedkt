import express from 'express'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import type { AddressInfo } from 'node:net'
import { promisify } from 'node:util'
import {
  SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS,
  SOUND_CPU_NO_MEDIA_AGENT_CALL_CONTROLLED_TOOL_PYTHON_ENV,
  SOUND_CPU_NO_MEDIA_AGENT_CALL_CONTROLLED_TOOL_TIMEOUT_MS_ENV,
  SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH,
  SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV,
  SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS,
  createSoundCpuNoMediaAgentCallRoutes,
} from '../../server/routes/sound-cpu-no-media-agent-call-routes'

const execFileAsync = promisify(execFile)
const decision =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_controlled_proof_passed_with_warnings_ready_for_route_to_tool_owner_review'
const requirementsPath = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'

function sanitizeOutput(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-20)
    .join('\n')
    .slice(0, 1600)
}

async function execChecked(file: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  try {
    return await execFileAsync(file, args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      maxBuffer: 1024 * 1024 * 12,
      timeout: 1000 * 60 * 20,
    })
  } catch (error) {
    const maybe = error as { stdout?: string; stderr?: string; message?: string }
    const message = [
        `command_failed:${file} ${args.join(' ')}`,
        maybe.message,
        sanitizeOutput(maybe.stdout ?? ''),
        sanitizeOutput(maybe.stderr ?? ''),
      ]
        .filter(Boolean)
        .join('\n')
    throw new Error(message, { cause: error })
  }
}

function createEnvelope(toolId: string, index: number) {
  return {
    approvedPlanSnapshotId: 'approved-plan-snapshot-sound-cpu-route-to-tool-controlled-proof',
    workspaceId: 'workspace-sound-cpu-route-to-tool-controlled-proof',
    projectId: 'project-sound-cpu-route-to-tool-controlled-proof',
    jobId: `job-sound-cpu-route-to-tool-controlled-proof-${String(index + 1).padStart(2, '0')}`,
    idempotencyKey: `sound-cpu-route-to-tool-controlled-proof-${toolId}`,
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    jobType: 'sound.package_import_smoke',
    toolId,
    attemptMetadata: {
      attemptNumber: 1,
      maxAttempts: 1,
      requestedAtIso: '2026-07-04T00:21:00Z',
      agentRequestId: `sound-cpu-route-to-tool-controlled-proof-${toolId}`,
    },
    staticOnlyRuntimeFlags: SOUND_CPU_NO_MEDIA_AGENT_CALL_STATIC_ONLY_RUNTIME_FLAGS,
    claims: {
      generated_local_fixture_passed: false,
      dry_run_passed: false,
      runtimeReadiness: false,
      workerReadiness: false,
      mediaReadiness: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function allFalseExceptRouteToTool(sideEffects: Record<string, unknown>): boolean {
  return Object.entries(sideEffects).every(([key, value]) => {
    if (key === 'routeToToolExecuted') return value === true
    return value === false
  })
}

async function removeTempDir(tempDir: string): Promise<boolean> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

async function main() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reeditpro-sound-cpu-route-to-tool-proof-'))
  const venvDir = path.join(tempDir, 'venv')
  let tempVenvRemoved = false
  let server: ReturnType<express.Express['listen']> | undefined

  try {
    await execChecked('python3', ['-m', 'venv', venvDir])
    const pythonPath = path.join(venvDir, 'bin', 'python')
    await execChecked(pythonPath, [
      '-m',
      'pip',
      'install',
      '--no-compile',
      '--no-cache-dir',
      '--progress-bar',
      'off',
      '-r',
      requirementsPath,
    ])

    process.env[SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV] = '1'
    process.env[SOUND_CPU_NO_MEDIA_AGENT_CALL_CONTROLLED_TOOL_PYTHON_ENV] = pythonPath
    process.env[SOUND_CPU_NO_MEDIA_AGENT_CALL_CONTROLLED_TOOL_TIMEOUT_MS_ENV] = '180000'

    const app = express()
    app.disable('x-powered-by')
    app.use(express.json({ limit: '1mb' }))
    app.use(createSoundCpuNoMediaAgentCallRoutes())

    server = app.listen(0, '127.0.0.1')
    await new Promise<void>((resolve) => server?.once('listening', resolve))
    const address = server.address() as AddressInfo
    const baseUrl = `http://127.0.0.1:${address.port}${SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH}`

    const routeResults = []
    for (const [index, toolId] of SOUND_CPU_NO_MEDIA_AGENT_CALL_ALLOWED_TOOLS.entries()) {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(createEnvelope(toolId, index)),
      })
      const body = (await response.json()) as {
        ok?: unknown
        data?: {
          soundCpuNoMediaAgentCall?: {
            acceptedForExecution?: unknown
            routeToToolExecutionEnabled?: unknown
            routeExecutionEnabled?: unknown
            controlledRunner?: {
              ok?: unknown
              toolId?: unknown
              attemptedToolCount?: unknown
              passedToolCount?: unknown
              failedToolCount?: unknown
            }
            sideEffects?: Record<string, unknown>
          }
        }
        warnings?: unknown[]
      }
      const result = body.data?.soundCpuNoMediaAgentCall
      assert(response.status === 200, `Expected route proof HTTP 200 for ${toolId}, got ${response.status}`)
      assert(body.ok === true, `Expected ok true for ${toolId}`)
      assert(result?.acceptedForExecution === true, `Expected acceptedForExecution true for ${toolId}`)
      assert(result.routeToToolExecutionEnabled === true, `Expected routeToToolExecutionEnabled true for ${toolId}`)
      assert(result.routeExecutionEnabled === true, `Expected routeExecutionEnabled true for ${toolId}`)
      assert(result.controlledRunner?.ok === true, `Expected runner ok for ${toolId}`)
      assert(result.controlledRunner.toolId === toolId, `Expected runner tool id ${toolId}`)
      assert(result.controlledRunner.attemptedToolCount === 1, `Expected attempted count 1 for ${toolId}`)
      assert(result.controlledRunner.passedToolCount === 1, `Expected passed count 1 for ${toolId}`)
      assert(result.controlledRunner.failedToolCount === 0, `Expected failed count 0 for ${toolId}`)
      assert(result.sideEffects && allFalseExceptRouteToTool(result.sideEffects), `Unexpected side effects for ${toolId}`)
      assert(Array.isArray(body.warnings), `Expected warnings for ${toolId}`)
      routeResults.push({
        toolId,
        httpStatus: response.status,
        acceptedForExecution: result.acceptedForExecution,
        routeToToolExecutionEnabled: result.routeToToolExecutionEnabled,
        controlledRunner: result.controlledRunner,
        sideEffects: result.sideEffects,
      })
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()))
    })
    server = undefined
    tempVenvRemoved = await removeTempDir(tempDir)

    assert(tempVenvRemoved, 'Expected disposable proof venv to be removed')

    console.log(
      JSON.stringify(
        {
          ok: true,
          decision,
          sourceMergeCommit: '20c167d2e4d96125a432c75f00af36d99eda9e83',
          routePath: SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH,
          localHttpPostAttempted: true,
          localHostOnly: true,
          routeToToolEnvGateEnabledForProof: true,
          attemptedToolCount: routeResults.length,
          passedToolCount: routeResults.filter((item) => item.controlledRunner.passedToolCount === 1).length,
          failedToolCount: routeResults.filter((item) => item.controlledRunner.failedToolCount !== 0).length,
          tools: routeResults.map((item) => ({
            toolId: item.toolId,
            httpStatus: item.httpStatus,
            acceptedForExecution: item.acceptedForExecution,
            routeToToolExecutionEnabled: item.routeToToolExecutionEnabled,
            runnerPassed: item.controlledRunner.passedToolCount === 1,
          })),
          sideEffects: {
            routeToToolExecuted: true,
            workerDispatched: false,
            workerExecuted: false,
            mediaOpened: false,
            mediaProcessed: false,
            providerCalled: false,
            modelCalled: false,
            supabaseTouched: false,
            sqlExecuted: false,
            storageObjectCreated: false,
            signedUrlCreated: false,
            publicArtifactCreated: false,
            artifactWritten: false,
            dockerOrCloudRunExecuted: false,
            betaUnlocked: false,
            productionUnlocked: false,
          },
          tempVenvRemoved,
        },
        null,
        2,
      ),
    )
  } finally {
    if (server) {
      await new Promise<void>((resolve) => {
        server?.close(() => resolve())
      })
    }
    if (!tempVenvRemoved) await removeTempDir(tempDir)
    delete process.env[SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_TO_TOOL_EXECUTION_ENV]
    delete process.env[SOUND_CPU_NO_MEDIA_AGENT_CALL_CONTROLLED_TOOL_PYTHON_ENV]
    delete process.env[SOUND_CPU_NO_MEDIA_AGENT_CALL_CONTROLLED_TOOL_TIMEOUT_MS_ENV]
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        decision: 'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_controlled_proof_blocked',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exitCode = 1
})
