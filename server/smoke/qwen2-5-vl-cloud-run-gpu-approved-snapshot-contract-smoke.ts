import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_CONTRACT_SMOKE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-contract-smoke-result'

const ROOT = process.cwd()
const SERVICE_PATH = path.join(ROOT, 'server/workers/qwen2_5_vl_cloud_run_gpu/service.py')
const DECISION = 'qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_contract_smoke_passed_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_32-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-LOCAL-QUEUE-CONTRACT: define local queue payload handoff fixtures for Qwen approved-snapshot jobs, no inference'
const SCHEMA_VERSION = 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function parseBlock(relativePath: string, label: string) {
  const text = read(relativePath)
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('```json\\s+' + escaped + '\\n([\\s\\S]*?)\\n```'))
  check(match, `Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1]) as JsonRecord
}

async function getFreePort() {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  check(address && typeof address === 'object', 'Expected TCP address object')
  const { port } = address
  server.close()
  await once(server, 'close')
  return port
}

function requestJson(port: number, method: string, requestPath: string, body?: string | JsonRecord) {
  const rawBody = typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined
  const headers: Record<string, string | number> = {}
  if (rawBody !== undefined) {
    headers['content-type'] = 'application/json'
    headers['content-length'] = Buffer.byteLength(rawBody)
  }

  return new Promise<{ statusCode: number; payload: JsonRecord; text: string }>((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: requestPath,
        method,
        headers,
        timeout: 5000
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          try {
            resolve({
              statusCode: res.statusCode ?? 0,
              payload: text ? JSON.parse(text) as JsonRecord : {},
              text
            })
          } catch (error) {
            reject(error)
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error(`Timed out ${method} ${requestPath}`))
    })
    if (rawBody !== undefined) req.write(rawBody)
    req.end()
  })
}

async function waitForHealth(port: number) {
  const deadline = Date.now() + 8000
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const response = await requestJson(port, 'GET', '/healthz')
      if (response.statusCode === 200) return response
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw lastError instanceof Error ? lastError : new Error('Timed out waiting for local Qwen service')
}

function validContractFixture() {
  return {
    schemaVersion: SCHEMA_VERSION,
    requestId: 'req_mock_qwen_contract_001',
    approvedPlanSnapshotId: 'aps_mock_qwen_001',
    approvedPlanSnapshotHash: 'sha256_mock_approved_snapshot_hash',
    approvalRecordId: 'approval_mock_qwen_001',
    creditReservationId: 'credit_reservation_mock_qwen_001',
    jobId: 'job_mock_qwen_001',
    queueLease: {
      leaseId: 'lease_mock_qwen_001',
      workerId: 'qwen_worker_mock',
      expiresAt: '2026-06-27T04:00:00Z'
    },
    idempotencyKey: 'idem_mock_qwen_001',
    sourceOfTruthRefs: {
      supabaseRowRefs: ['supabase_row_ref_mock_qwen_001'],
      privateManifestRefs: ['private_manifest_ref_mock_qwen_001'],
      checksumRefs: ['checksum_ref_mock_qwen_001'],
      approvedPlanSnapshotRefs: ['aps_mock_qwen_001']
    },
    modelPolicy: {
      modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
      modelRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5',
      modelAggregateSha256: '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b'
    },
    runtimeGates: {
      rawVlmPromptAllowed: false,
      providerExecutionAllowed: false,
      mediaProcessingAllowed: false,
      publicOutputAllowed: false,
      trackAExecutionAllowed: false,
      modelInferenceEnabled: false
    },
    task: {
      useCase: 'visual_understanding',
      taskRef: 'task_mock_qwen_001'
    }
  }
}

function assertFalseRuntimeSideEffects(payload: JsonRecord) {
  const runtimeSideEffects = payload.runtimeSideEffects as JsonRecord | undefined
  if (!runtimeSideEffects) return
  for (const [key, value] of Object.entries(runtimeSideEffects)) {
    assert.equal(value, false, `Runtime side effect ${key} must be false`)
  }
}

const forbiddenDocPatterns: Array<[string, RegExp]> = [
  ['non-local URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(inferenceRun|forwardPassRun|promptProcessed|cloudRunUsed|gcpTouched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i]
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenDocPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

async function main() {
  for (const file of [
    'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result.md',
    'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result-change-log.md',
    'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-contract-smoke-result.ts',
    'server/smoke/qwen2-5-vl-cloud-run-gpu-approved-snapshot-contract-smoke.ts',
    'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
    'package.json'
  ]) {
    check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
  }

  const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
  assert.equal(
    packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract'],
    'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-approved-snapshot-contract-smoke.ts',
    'package script mismatch'
  )

  const changeLog = parseBlock(
    'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result-change-log.md',
    'qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result-change-log'
  )
  assert.equal(changeLog.decision, DECISION, 'change log decision mismatch')
  assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_CONTRACT_SMOKE_RESULT.decision, DECISION)
  assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_CONTRACT_SMOKE_RESULT.nextPrompt, NEXT_PROMPT)
  assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion, SCHEMA_VERSION)

  for (const file of [
    'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result.md',
    'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result-change-log.md',
    'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-contract-smoke-result.ts'
  ]) {
    assertNoForbiddenText(file)
  }

  const port = await getFreePort()
  const child = spawn('python3', [SERVICE_PATH], {
    cwd: ROOT,
    env: {
      ...process.env,
      PYTHONDONTWRITEBYTECODE: '1',
      PORT: String(port),
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      HF_HUB_DISABLE_TELEMETRY: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      RAW_VLM_PROMPT_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      MEDIA_PROCESSING_ENABLED: 'false',
      REAL_MEDIA_INPUT_ENABLED: 'false',
      ARBITRARY_MEDIA_INPUT_ENABLED: 'false',
      PUBLIC_OUTPUT_ENABLED: 'false',
      TRACK_A_EXECUTION_ENABLED: 'false',
      QWEN_APPROVED_SNAPSHOT_REQUIRED: 'true',
      QWEN_QUEUE_LEASE_REQUIRED: 'true',
      QWEN_MODEL_IMPORT_ON_STARTUP: 'false',
      QWEN_INFERENCE_ENABLED: 'false'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', (chunk) => {
    stdout += String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk)
  })

  try {
    const health = await waitForHealth(port)
    assert.equal(health.statusCode, 200, 'health status mismatch')
    assert.equal(health.payload.ok, true, 'health must be ok')
    assert.equal(health.payload.modelInferenceEnabled, false, 'health must keep inference disabled')
    assertFalseRuntimeSideEffects(health.payload)

    const contract = await requestJson(port, 'GET', '/contract')
    assert.equal(contract.statusCode, 200, 'contract endpoint status mismatch')
    const runtimeContract = contract.payload.runtimeContract as JsonRecord
    assert.equal(runtimeContract.schemaVersion, SCHEMA_VERSION, 'contract schema mismatch')
    assert.deepEqual(runtimeContract.execution, {
      contractCanExecuteNow: false,
      modelImportOnStartup: false,
      modelInferenceEnabled: false,
      serviceRuntimeRequestExecutes: false
    })

    const invalidJson = await requestJson(port, 'POST', '/', '{"notJson":')
    assert.equal(invalidJson.statusCode, 400, 'invalid JSON status mismatch')
    assert.equal(invalidJson.payload.reason, 'invalid_json', 'invalid JSON reason mismatch')

    const oversized = await requestJson(port, 'POST', '/', 'x'.repeat(65537))
    assert.equal(oversized.statusCode, 413, 'oversized status mismatch')
    assert.equal(oversized.payload.reason, 'request_too_large', 'oversized reason mismatch')

    const missingFields = await requestJson(port, 'POST', '/', { schemaVersion: SCHEMA_VERSION })
    assert.equal(missingFields.statusCode, 403, 'missing fields status mismatch')
    assert.equal(missingFields.payload.reason, 'qwen_runtime_contract_rejected')
    const missingReasons = missingFields.payload.contractRejectionReasons as string[]
    assert(missingReasons.includes('missing_approvedPlanSnapshotId'), 'missing approved snapshot reason expected')
    assert(missingReasons.includes('missing_queueLease'), 'missing queue lease reason expected')

    const rawPromptFixture = validContractFixture()
    rawPromptFixture.task = {
      useCase: 'visual_understanding',
      taskRef: 'task_mock_qwen_raw_prompt',
      raw_prompt: 'this must be rejected before any runtime path'
    } as typeof rawPromptFixture.task
    const rawPrompt = await requestJson(port, 'POST', '/', rawPromptFixture)
    assert.equal(rawPrompt.statusCode, 403, 'raw prompt status mismatch')
    assert.equal(rawPrompt.payload.reason, 'qwen_runtime_contract_rejected')
    const rawPromptReasons = rawPrompt.payload.contractRejectionReasons as string[]
    assert(rawPromptReasons.some((reason) => reason.startsWith('raw_prompt_field_blocked')), 'raw prompt rejection expected')

    const validContract = await requestJson(port, 'POST', '/', validContractFixture())
    assert.equal(validContract.statusCode, 403, 'valid contract status mismatch')
    assert.equal(validContract.payload.reason, 'qwen_inference_disabled_after_contract_check')
    assert.equal(validContract.payload.contractSatisfiedForFutureRuntime, true)
    assert.deepEqual(validContract.payload.contractRejectionReasons, [])
    assert.equal(validContract.payload.modelInferenceEnabled, false)
    assert.equal(validContract.payload.runtimeContractExecutesNow, false)

    for (const flags of [
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_CONTRACT_SMOKE_RESULT.runtimeFlags,
      changeLog.runtimeFlags as Record<string, boolean>
    ]) {
      assert.equal(flags.localHandlerStarted, true)
      assert.equal(flags.localHandlerStopped, true)
      assert.equal(flags.validContractAcceptedForFutureRuntime, true)
      assert.equal(flags.validContractStillExecutes, false)
      assert.equal(flags.cloudRunTouched, false)
      assert.equal(flags.gcpMutationCreated, false)
      assert.equal(flags.modelImportRun, false)
      assert.equal(flags.modelLoadRun, false)
      assert.equal(flags.vllmEngineInitialized, false)
      assert.equal(flags.promptProcessed, false)
      assert.equal(flags.forwardPassRun, false)
      assert.equal(flags.inferenceRun, false)
      assert.equal(flags.providerCallsMade, false)
      assert.equal(flags.workersDispatched, false)
      assert.equal(flags.supabaseTouched, false)
      assert.equal(flags.sqlExecuted, false)
      assert.equal(flags.generatedAssetsCreated, false)
      assert.equal(flags.publicArtifactsCreated, false)
      assert.equal(flags.signedUrlsCreated, false)
      assert.equal(flags.creditMutationCreated, false)
      assert.equal(flags.betaUnlocked, false)
      assert.equal(flags.productionUnlocked, false)
      assert.equal(flags.dryRunPassedClaimed, false)
      assert.equal(flags.generatedLocalFixturePassedClaimed, false)
    }

    console.log(JSON.stringify({
      ok: true,
      decision: DECISION,
      localHandlerStarted: true,
      localHandlerStopped: true,
      healthStatus: health.statusCode,
      contractStatus: contract.statusCode,
      invalidJsonStatus: invalidJson.statusCode,
      oversizedStatus: oversized.statusCode,
      missingFieldsStatus: missingFields.statusCode,
      rawPromptStatus: rawPrompt.statusCode,
      validContractStatus: validContract.statusCode,
      validContractAcceptedForFutureRuntime: true,
      validContractStillExecutes: false,
      inferenceRun: false,
      cloudRunTouched: false,
      nextPrompt: NEXT_PROMPT
    }, null, 2))
  } finally {
    child.kill('SIGTERM')
    await Promise.race([
      once(child, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ])
    if (!child.killed) child.kill('SIGKILL')
    assert.equal(stdout.trim(), '', 'local worker should not write stdout during smoke')
    assert.equal(stderr.trim(), '', 'local worker should not write stderr during smoke')
  }
}

await main()
