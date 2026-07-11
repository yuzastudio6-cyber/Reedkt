import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  writePrivateFileAtomicWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import { sha256ArtifactQaValue } from '../services/private-artifact-qa-authority-store'
import {
  actualRunEvidenceIdentityHash,
  actualRunEvidenceRecordRelativePath,
  actualRunPromotedArtifactRelativePath,
  clearActualRunEvidenceBridgeProcessStateForSmoke,
  createActualRunEvidenceBridge,
  type ServerInjectedCompletedRunReceiptProvider,
  type ServerInjectedSandboxOutputLocator,
} from '../tool-execution/actual-run-evidence-bridge'
import type {
  CollectActualRunEvidenceRequest,
  ServerVerifiedCompletedRunReceipt,
} from '../tool-execution/actual-run-evidence-schemas'
import { internalProducedArtifactEvidenceSchema } from '../validation/private-artifact-qa-authority-schemas'
import {
  allocatePrivateWorkerOutputPath,
  createPrivateCanonicalWorkerSandbox,
  type PrivateCanonicalWorkerSandbox,
} from '../workers/canonical-runtime/private-worker-sandbox'

type Fixture = {
  request: CollectActualRunEvidenceRequest
  sandbox: PrivateCanonicalWorkerSandbox
  scratchRelativePath: string
  bytes: Buffer
  expectedContentType: ServerVerifiedCompletedRunReceipt['reportedOutput']['contentType']
  receiptTransform?: (receipt: Record<string, unknown>) => unknown
  reportedBytes?: Buffer
  reportedContentType?: ServerVerifiedCompletedRunReceipt['reportedOutput']['contentType']
  locatorTransform?: (locator: Record<string, unknown>) => unknown
}

class DeterministicCompletedRunSource implements
  ServerInjectedCompletedRunReceiptProvider,
  ServerInjectedSandboxOutputLocator {
  readonly providerKind = 'server_injected_completed_run_receipt_provider' as const
  readonly locatorKind = 'server_injected_private_sandbox_output_locator' as const
  receiptCalls = 0
  locatorCalls = 0
  private readonly fixtures = new Map<string, Fixture>()

  register(fixture: Fixture): void {
    this.fixtures.set(actualRunEvidenceIdentityHash(identityFrom(fixture.request)), fixture)
  }

  async loadCompletedRun(request: Readonly<CollectActualRunEvidenceRequest>): Promise<unknown> {
    this.receiptCalls += 1
    const fixture = this.requireFixture(request)
    const reportedBytes = fixture.reportedBytes ?? fixture.bytes
    const contentType = fixture.reportedContentType ?? fixture.expectedContentType
    const identity = identityFrom(request)
    const identityHash = actualRunEvidenceIdentityHash(identity)
    const reportedOutput = {
      sha256: sha256Bytes(reportedBytes),
      byteLength: reportedBytes.byteLength,
      contentType,
      placeholder: false,
      outputCommitmentHash: '',
    }
    reportedOutput.outputCommitmentHash = sha256ArtifactQaValue({
      identityHash,
      sandboxId: identity.sandboxId,
      outputId: identity.outputId,
      sha256: reportedOutput.sha256,
      byteLength: reportedOutput.byteLength,
      contentType: reportedOutput.contentType,
      placeholder: reportedOutput.placeholder,
    })
    const receipt: Record<string, unknown> = {
      schemaVersion: 'server-verified-completed-tool-run-v2',
      source: 'server_injected_completed_run_receipt_provider',
      identity,
      identityHash,
      leaseAuthorityHash: sha256ArtifactQaValue({ leaseId: identity.leaseId, scope: identity }),
      workerIdentity: 'private-local-canonical-worker-v1',
      attemptNumber: 1,
      artifactVersion: 1,
      attemptKind: 'initial',
      reportedOutput,
      runner: {
        runnerClass: 'private_ffmpeg_runner',
        runnerVersion: '2.0.0',
        containerImageRef: 'reeditpro-tool-runner',
        containerImageDigest: sha256ArtifactQaValue({ image: 'reeditpro-tool-runner', version: '2.0.0' }),
        toolBinaryVersion: 'ffmpeg-7.1.1',
        toolBinaryDigest: sha256ArtifactQaValue({ binary: 'ffmpeg', version: '7.1.1' }),
        commandDigest: sha256ArtifactQaValue({ operationId: identity.operationId, argv: 'redacted-fixed-plan' }),
        stdoutDigest: sha256ArtifactQaValue({ stdout: 'bounded-empty' }),
        stderrDigest: sha256ArtifactQaValue({ stderr: 'bounded-empty' }),
        stdoutByteLength: 0,
        stderrByteLength: 0,
      },
      timing: {
        startedAt: '2026-07-10T16:00:00.000Z',
        finishedAt: '2026-07-10T16:00:01.250Z',
        durationMs: 1_250,
        exitCode: 0,
      },
      resources: {
        cpuUserMs: 600,
        cpuSystemMs: 150,
        maximumResidentBytes: 64 * 1024 * 1024,
        inputBytesRead: 2_048,
        outputBytesWritten: reportedBytes.byteLength,
      },
      cost: {
        currency: 'USD',
        actualToolCostMicros: 1_250,
        costMeasurement: 'private_runner_measured',
        serviceFeeIncluded: false,
        walletMutationPerformed: false,
        settlementPerformed: false,
      },
      effects: {
        networkAccessed: false,
        sensitiveMaterialRead: false,
        providerCallMade: false,
        renderExecuted: false,
      },
    }
    return fixture.receiptTransform ? fixture.receiptTransform(structuredClone(receipt)) : receipt
  }

  async locateOutput(request: Readonly<CollectActualRunEvidenceRequest>): Promise<unknown> {
    this.locatorCalls += 1
    const fixture = this.requireFixture(request)
    const locator: Record<string, unknown> = {
      sandbox: fixture.sandbox,
      scratchRelativePath: fixture.scratchRelativePath,
    }
    return fixture.locatorTransform ? fixture.locatorTransform(structuredClone(locator)) : locator
  }

  private requireFixture(request: Readonly<CollectActualRunEvidenceRequest>): Fixture {
    const fixture = this.fixtures.get(actualRunEvidenceIdentityHash(identityFrom(request)))
    assert.ok(fixture, `No deterministic completed-run fixture for ${request.outputId}.`)
    return fixture
  }
}

const localStorageRoot = await mkdtemp(resolve(tmpdir(), 'reeditpro-actual-run-evidence-'))
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const source = new DeterministicCompletedRunSource()
let bridge = createActualRunEvidenceBridge({
  env,
  maximumArtifactBytes: 1024 * 1024,
  receiptProvider: source,
  outputLocator: source,
})

try {
  const primary = await createFixture('primary', Buffer.from('{"artifact":"verified"}\n'), 'application/json')
  source.register(primary)

  await expectApiError(
    () => bridge.collect({
      ...primary.request,
      scratchPath: '/caller/path',
      resultUrl: 'https://untrusted.example/result',
      apiKey: 'caller-claim',
    } as never),
    'VALIDATION_FAILED',
  )

  const concurrent = await Promise.all([
    bridge.collect(primary.request),
    bridge.collect(primary.request),
  ])
  assert.equal(source.receiptCalls, 1)
  assert.equal(source.locatorCalls, 1)
  assert.deepEqual(concurrent.map((result) => result.replayed).sort(), [false, true])
  const primaryResult = concurrent[0]
  assert.equal(primaryResult.evidence.schemaVersion, 'actual-artifact-run-evidence-v2')
  assert.equal(primaryResult.evidence.identity.toolId, 'ffmpeg')
  assert.equal(primaryResult.evidence.identity.operationId, 'operation-primary')
  assert.equal(primaryResult.evidence.identity.leaseId, 'lease-primary')
  assert.equal(primaryResult.evidence.artifact.sha256, sha256Bytes(primary.bytes))
  assert.equal(primaryResult.evidence.artifact.byteLength, primary.bytes.byteLength)
  assert.equal(primaryResult.evidence.artifact.contentType, 'application/json')
  assert.equal(primaryResult.evidence.artifact.createOnlyPromotionCommitted, true)
  assert.equal(primaryResult.evidence.artifact.promotedBytesReRead, true)
  assert.equal(primaryResult.evidence.artifact.promotedHashSizeMimeVerified, true)
  assert.equal(primaryResult.evidence.artifact.placeholder, false)
  assert.equal(primaryResult.evidence.runner.containerImageRef, 'reeditpro-tool-runner')
  assert.equal(primaryResult.evidence.runner.runnerVersion, '2.0.0')
  assert.equal(primaryResult.evidence.timing.durationMs, 1_250)
  assert.equal(primaryResult.evidence.timing.exitCode, 0)
  assert.equal(primaryResult.evidence.resources.outputBytesWritten, primary.bytes.byteLength)
  assert.equal(primaryResult.evidence.cost.actualToolCostMicros, 1_250)
  assert.equal(primaryResult.evidence.cost.serviceFeeIncluded, false)
  assert.equal(primaryResult.evidence.cost.walletMutationPerformed, false)
  assert.equal(primaryResult.evidence.bridgeState.actualArtifactBytesVerified, true)
  assert.equal(primaryResult.evidence.bridgeState.leaseAuthorityIntegrated, false)
  assert.equal(primaryResult.evidence.executionPermissions.toolExecution, false)
  assert.equal(primaryResult.evidence.executionPermissions.render, false)
  assert.equal(primaryResult.evidence.executionPermissions.creditSpend, false)
  assert.equal(primaryResult.artifactAuthorityEnvelope.actualRunEvidence.actualRunVerified, false)
  assert.equal(
    primaryResult.artifactAuthorityEnvelope.actualRunEvidence.runnerEvidenceHash,
    primaryResult.evidence.runEvidenceHash,
  )
  assert.equal(internalProducedArtifactEvidenceSchema.safeParse(
    primaryResult.artifactAuthorityEnvelope,
  ).success, true)

  const serializedEvidence = JSON.stringify(primaryResult.evidence)
  assert.equal(serializedEvidence.includes(localStorageRoot), false)
  assert.equal(serializedEvidence.includes(primary.scratchRelativePath), false)
  assert.equal(serializedEvidence.includes('https://'), false)
  assert.equal(serializedEvidence.includes('file://'), false)
  assert.equal(serializedEvidence.includes('apiKey'), false)
  assert.equal(serializedEvidence.includes('leaseCredential'), false)

  const safeSvg = await createFixture(
    'safe-svg',
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="#112233"/></svg>\n'),
    'image/svg+xml',
  )
  source.register(safeSvg)
  const safeSvgResult = await bridge.collect(safeSvg.request)
  assert.equal(safeSvgResult.evidence.artifact.contentType, 'image/svg+xml')
  assert.equal(safeSvgResult.evidence.artifact.sha256, sha256Bytes(safeSvg.bytes))

  const activeSvg = await createFixture(
    'active-svg',
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>\n'),
    'image/svg+xml',
  )
  source.register(activeSvg)
  await expectApiError(() => bridge.collect(activeSvg.request), 'VALIDATION_FAILED')

  const primaryIdentity = identityFrom(primary.request)
  const promotedPath = resolve(localStorageRoot, actualRunPromotedArtifactRelativePath(primaryIdentity))
  const recordPath = resolve(localStorageRoot, actualRunEvidenceRecordRelativePath(primaryIdentity))
  assert.equal((await stat(promotedPath)).mode & 0o777, 0o600)
  assert.equal((await stat(recordPath)).mode & 0o777, 0o600)

  clearActualRunEvidenceBridgeProcessStateForSmoke()
  bridge = createActualRunEvidenceBridge({
    env,
    maximumArtifactBytes: 1024 * 1024,
    receiptProvider: source,
    outputLocator: source,
  })
  const callsBeforeRestartReplay = { receipt: source.receiptCalls, locator: source.locatorCalls }
  const restartReplay = await bridge.collect(primary.request)
  assert.equal(restartReplay.replayed, true)
  assert.equal(restartReplay.evidence.evidenceHash, primaryResult.evidence.evidenceHash)
  assert.equal(source.receiptCalls, callsBeforeRestartReplay.receipt)
  assert.equal(source.locatorCalls, callsBeforeRestartReplay.locator)

  const wrongTenant = await createFixture('wrong-tenant', Buffer.from('{"ok":true}\n'), 'application/json')
  wrongTenant.receiptTransform = (receipt) => {
    const identity = receipt.identity as Record<string, unknown>
    identity.workspaceId = 'another-workspace'
    return receipt
  }
  source.register(wrongTenant)
  await expectApiError(() => bridge.collect(wrongTenant.request), 'APPROVED_SNAPSHOT_REQUIRED')

  const placeholder = await createFixture('placeholder', Buffer.from('{"placeholder":true}\n'), 'application/json')
  placeholder.receiptTransform = (receipt) => {
    const reportedOutput = receipt.reportedOutput as Record<string, unknown>
    reportedOutput.placeholder = true
    return receipt
  }
  source.register(placeholder)
  await expectApiError(() => bridge.collect(placeholder.request), 'VALIDATION_FAILED')

  const badExit = await createFixture('bad-exit', Buffer.from('{"ok":false}\n'), 'application/json')
  badExit.receiptTransform = (receipt) => {
    const timing = receipt.timing as Record<string, unknown>
    timing.exitCode = 1
    return receipt
  }
  source.register(badExit)
  await expectApiError(() => bridge.collect(badExit.request), 'VALIDATION_FAILED')

  const secretClaim = await createFixture('secret-claim', Buffer.from('{"ok":true}\n'), 'application/json')
  secretClaim.receiptTransform = (receipt) => ({ ...receipt, providerApiKey: 'forbidden' })
  source.register(secretClaim)
  await expectApiError(() => bridge.collect(secretClaim.request), 'VALIDATION_FAILED')

  const wrongBytes = await createFixture('wrong-bytes', Buffer.from('{"actual":true}\n'), 'application/json')
  wrongBytes.reportedBytes = Buffer.from('{"reported":true}\n')
  source.register(wrongBytes)
  await expectApiError(() => bridge.collect(wrongBytes.request), 'UPLOAD_SOURCE_MISMATCH')

  const mimeMismatch = await createFixture('mime-mismatch', Buffer.from('{"json":true}\n'), 'application/json')
  mimeMismatch.reportedContentType = 'image/png'
  source.register(mimeMismatch)
  await expectApiError(() => bridge.collect(mimeMismatch.request), 'UPLOAD_SOURCE_MISMATCH')

  const unknownTool = await createFixture('unknown-tool', Buffer.from('{"ok":true}\n'), 'application/json', {
    toolId: 'not_registered_tool',
  })
  source.register(unknownTool)
  await expectApiError(() => bridge.collect(unknownTool.request), 'TOOL_NOT_READY')

  const collision = await createFixture('collision', Buffer.from('{"new":"bytes"}\n'), 'application/json')
  source.register(collision)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunPromotedArtifactRelativePath(identityFrom(collision.request)),
    content: Buffer.from('{"existing":"different"}\n'),
  })
  await expectApiError(() => bridge.collect(collision.request), 'IDEMPOTENCY_CONFLICT')
  assert.deepEqual(
    await readFile(resolve(localStorageRoot, actualRunPromotedArtifactRelativePath(identityFrom(collision.request)))),
    Buffer.from('{"existing":"different"}\n'),
  )

  const sourceSymlink = await createFixture('source-symlink', Buffer.from('{"source":"real"}\n'), 'application/json')
  const sourceAbsolutePath = resolve(localStorageRoot, sourceSymlink.scratchRelativePath)
  const outsideSourceRelativePath = 'actual-run-evidence/adversarial/outside-source.json'
  const outsideSourcePath = resolve(localStorageRoot, outsideSourceRelativePath)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: localStorageRoot,
    relativePath: outsideSourceRelativePath,
    content: sourceSymlink.bytes,
  })
  await rm(sourceAbsolutePath)
  await symlink(outsideSourcePath, sourceAbsolutePath)
  source.register(sourceSymlink)
  await expectApiError(() => bridge.collect(sourceSymlink.request), 'VALIDATION_FAILED')

  const promotedSymlink = await createFixture('promoted-symlink', Buffer.from('{"target":"real"}\n'), 'application/json')
  const promotedSymlinkRelativePath = actualRunPromotedArtifactRelativePath(identityFrom(promotedSymlink.request))
  const promotedSymlinkPath = resolve(localStorageRoot, promotedSymlinkRelativePath)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: localStorageRoot,
    relativePath: 'actual-run-evidence/adversarial/outside-promoted.json',
    content: promotedSymlink.bytes,
  })
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: `${promotedSymlinkRelativePath}.parent`,
    content: 'parent placeholder',
  })
  await symlink(resolve(localStorageRoot, 'actual-run-evidence/adversarial/outside-promoted.json'), promotedSymlinkPath)
  source.register(promotedSymlink)
  await expectApiError(() => bridge.collect(promotedSymlink.request), 'VALIDATION_FAILED')

  const originalPromotedBytes = await readFile(promotedPath)
  await writePrivateFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunPromotedArtifactRelativePath(primaryIdentity),
    content: Buffer.from('{"tampered":"artifact"}\n'),
  })
  await expectApiError(() => bridge.read(primary.request), 'UPLOAD_SOURCE_MISMATCH')
  await writePrivateFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunPromotedArtifactRelativePath(primaryIdentity),
    content: originalPromotedBytes,
  })

  const originalRecord = await readFile(recordPath, 'utf8')
  const tamperedRecord = JSON.parse(originalRecord) as {
    evidence: { runner: { runnerVersion: string } }
  }
  tamperedRecord.evidence.runner.runnerVersion = '9.9.9-tampered'
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunEvidenceRecordRelativePath(primaryIdentity),
    content: `${JSON.stringify(tamperedRecord)}\n`,
  })
  await expectApiError(() => bridge.read(primary.request), 'VALIDATION_FAILED')
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunEvidenceRecordRelativePath(primaryIdentity),
    content: originalRecord,
  })

  const outsideRecordRelativePath = 'actual-run-evidence/adversarial/outside-record.json'
  const outsideRecordPath = resolve(localStorageRoot, outsideRecordRelativePath)
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: outsideRecordRelativePath,
    content: originalRecord,
  })
  await rm(recordPath)
  await symlink(outsideRecordPath, recordPath)
  await expectApiError(() => bridge.read(primary.request), 'VALIDATION_FAILED')
  await rm(recordPath)
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: actualRunEvidenceRecordRelativePath(primaryIdentity),
    content: originalRecord,
  })

  const productionEnv = loadRuntimeEnv({
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'cloud_run',
    WORKER_RUNTIME_MODE: 'disabled',
    STORAGE_MODE: 'gcs_disabled',
    API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-placeholder',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
    REEDITPRO_INTERNAL_SERVICE_TOKEN: 'internal-placeholder',
  })
  await expectApiError(
    () => createActualRunEvidenceBridge({
      env: productionEnv,
      maximumArtifactBytes: 1024 * 1024,
      receiptProvider: source,
      outputLocator: source,
    }).collect(primary.request),
    'TOOL_NOT_READY',
  )

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'identity_only_request_rejects_paths_urls_secrets_and_result_claims',
      'server_injected_receipt_and_sandbox_locator',
      'tenant_snapshot_job_work_item_asset_tool_operation_lease_attempt_sandbox_output_binding',
      'registered_tool_id_required',
      'fixed_runner_image_digest_binary_command_timing_exit_resource_and_cost_metrics',
      'sandbox_stream_create_only_promotion',
      'promoted_bytes_reread_hash_size_and_mime_verified',
      'placeholder_and_failed_exit_rejected',
      'reported_byte_hash_and_mime_mismatch_rejected',
      'content_addressed_non_path_storage_identity',
      'existing_artifact_authority_envelope_schema_compatible_but_non_authorizing',
      'concurrent_exact_collection_runs_once',
      'restart_durable_replay_without_receipt_or_locator_rerun',
      'create_only_collision_refuses_overwrite',
      'source_promoted_and_record_symlinks_refused',
      'promoted_byte_and_record_tampering_detected',
      'private_file_modes',
      'no_path_url_sensitive_value_or_lease_capability_persisted',
      'no_tool_provider_render_wallet_settlement_delivery_or_route_side_effect',
      'production_fail_closed',
    ],
  }))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

async function createFixture(
  label: string,
  bytes: Buffer,
  expectedContentType: Fixture['expectedContentType'],
  overrides: Partial<Pick<CollectActualRunEvidenceRequest, 'toolId' | 'operationId'>> = {},
): Promise<Fixture> {
  const baseScope = {
    localStorageRoot,
    ownerUserId: 'actual-run-user',
    workspaceId: 'actual-run-workspace',
    projectId: 'actual-run-project',
    editSessionId: 'actual-run-edit-session',
    jobId: `job-${label}`,
    leaseId: `lease-${label}`,
  }
  const sandbox = await createPrivateCanonicalWorkerSandbox(baseScope)
  const outputId = `output-${label}`
  const output = await allocatePrivateWorkerOutputPath({
    sandbox,
    outputId,
    extension: expectedContentType === 'application/json' ? 'json' : 'bin',
  })
  await writeFile(output.absolutePath, bytes, { flag: 'wx', mode: 0o600 })
  return {
    request: {
      ownerUserId: baseScope.ownerUserId,
      workspaceId: baseScope.workspaceId,
      projectId: baseScope.projectId,
      editSessionId: baseScope.editSessionId,
      snapshotId: `snapshot-${label}`,
      jobId: baseScope.jobId,
      approvedWorkItemId: `work-item-${label}`,
      expectedAssetId: `expected-asset-${label}`,
      toolId: overrides.toolId ?? 'ffmpeg',
      operationId: overrides.operationId ?? `operation-${label}`,
      leaseId: baseScope.leaseId,
      attemptId: `attempt-${label}`,
      sandboxId: sandbox.sandboxId,
      outputId,
      purpose: 'collect_private_actual_artifact_run_evidence_v2',
    },
    sandbox,
    scratchRelativePath: output.relativePath,
    bytes,
    expectedContentType,
  }
}

function identityFrom(request: CollectActualRunEvidenceRequest) {
  return {
    ownerUserId: request.ownerUserId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    snapshotId: request.snapshotId,
    jobId: request.jobId,
    approvedWorkItemId: request.approvedWorkItemId,
    expectedAssetId: request.expectedAssetId,
    toolId: request.toolId,
    operationId: request.operationId,
    leaseId: request.leaseId,
    attemptId: request.attemptId,
    sandboxId: request.sandboxId,
    outputId: request.outputId,
  }
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function expectApiError(action: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError, String(error))
    assert.equal(error.code, code)
  }
}
