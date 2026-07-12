import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { spawnSync } from 'node:child_process'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import { executeEditReferenceChatCommand } from '../../src/backend/project-edit-session-preference/edit-reference-chat-command-service'
import { createEditReferenceApiClient } from '../../src/lib/edit-reference-api-client'
import {
  connectPreferenceApplicationToProjectEditSession,
  preparePreferenceApplicationForProjectEditSession,
} from '../../src/lib/project-edit-session-edit-reference-integration'
import { readConnectedPreferenceApplicationContext } from '../../src/lib/edit-reference-downstream-context'
import { createDefaultMockProjectEditSessionApiClient } from '../../src/lib/project-edit-session-api-client'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  PreferenceApplicationListData,
} from '../../src/types/edit-reference'
import type { ProjectEditSessionBundleRecord } from '../../src/types/project-edit-session-repository'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate-8-1-'))
const fixturePath = join(root, 'controlled-reference.mp4')
const ownerUserId = 'mock-user-runtime'
const workspaceId = 'workspace-private-beta'
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-revision-requested'

try {
  createControlledVideoFixture(fixturePath)
  const fixture = await readFile(fixturePath)
  const runtime = await startRuntime(root)
  try {
    const editReferenceClient = createEditReferenceApiClient(runtime.baseUrl)
    const first = await createReference(runtime.baseUrl, 'Gate Eight One Travel', 'gate-8-1-first')
    const upload = await uploadReferenceVideo({
      baseUrl: runtime.baseUrl,
      referenceId: first.detail.reference.id,
      studyId: first.detail.study.id,
      body: fixture,
    })
    const withVideo = await mutate<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${first.detail.study.id}/evidence`, 'gate-8-1-video-evidence', {
      workspaceId,
      expectedStudyRevision: first.detail.study.revision,
      sourceType: 'reference_video_metadata',
      title: 'Controlled local reference fixture',
      sourceLabel: 'Rights-safe generated color and tone fixture',
      rightsBasis: 'reference_only',
      durationSeconds: 1.5,
      width: 640,
      height: 360,
      hasAudio: true,
      storageObjectRecordId: upload.storageObjectRecordId,
      mediaAssetId: upload.mediaAssetId,
    })
    const withManualEvidence = await addManualEvidence(
      runtime.baseUrl,
      withVideo,
      'gate-8-1-first-manual',
      'Use a question-led travel story, restrained pacing, warm target-derived color, readable target-authored captions, purposeful original B-roll, speech-safe sound, and original evidence graphics. Never copy exact footage, sequence, captions, timing, layouts, marks, identity, music, or sound effects.',
    )
    const studied = await mutate<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${first.detail.study.id}/evidence-study`, 'gate-8-1-first-study', {
      workspaceId,
      expectedStudyRevision: withManualEvidence.detail.study.revision,
    })

    assert.equal(studied.detail.study.status, 'evidence_ready')
    assert.equal(studied.detail.safety.fileBytesRead, true)
    assert.equal(studied.detail.safety.mediaProcessingStarted, true)
    assert(studied.detail.assets.some((asset) => (
      asset.mediaStudyStatus === 'media_studied_local_partial'
      && asset.representativeFrameCount !== undefined
      && asset.representativeFrameCount > 0
      && asset.storageObjectRecordId === upload.storageObjectRecordId
      && asset.mediaAssetId === upload.mediaAssetId
    )))
    const structureRun = studied.detail.skillRuns.find((run) => (
      run.skillId === 'edit_reference.media_structure.metadata_map'
      && run.runtimeSource === 'verified_local'
    ))
    assert(structureRun)
    assert.deepEqual(structureRun.toolIds, ['ffprobe', 'ffmpeg'])
    assert.equal(structureRun.fileBytesRead, true)
    assert.equal(structureRun.mediaProcessingStarted, true)
    assert(studied.detail.skillRuns.some((run) => run.readinessAtRun === 'degraded' && run.status === 'blocked'))
    assert(studied.detail.skillRuns.some((run) => run.runtimeSource === 'verified_mock'))
    assert(studied.detail.evidence.some((record) => record.category === 'media_structure' && record.provenance.runtimeSource === 'verified_local'))
    assert(studied.detail.evidence.some((record) => record.category === 'visual_language' && record.provenance.runtimeSource === 'verified_local'))
    assert.doesNotMatch(JSON.stringify(studied.detail), /"(?:rawFrames|rawProviderPayload|signedUrl|localFilePath|accessToken)"\s*:/i)

    const firstApproved = await approveStudiedReference(runtime.baseUrl, studied, 'gate-8-1-first')
    const secondCreated = await createReference(runtime.baseUrl, 'Gate Eight One Teaching', 'gate-8-1-second')
    const secondEvidence = await addManualEvidence(
      runtime.baseUrl,
      secondCreated,
      'gate-8-1-second-manual',
      'Use calm educational progression, restrained hierarchy, readable target-authored labels, original diagrams, and speech-safe audio. Never copy exact footage, sequence, captions, layouts, people, identity, music, or sound effects.',
    )
    const secondStudied = await mutate<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${secondCreated.detail.study.id}/evidence-study`, 'gate-8-1-second-study', {
      workspaceId,
      expectedStudyRevision: secondEvidence.detail.study.revision,
    })
    const secondApproved = await approveStudiedReference(runtime.baseUrl, secondStudied, 'gate-8-1-second')

    const sessionClient = createDefaultMockProjectEditSessionApiClient({ projectId, preserveMockSession: false })
    let bundle = await loadBundle(sessionClient)
    const prepared = await preparePreferenceApplicationForProjectEditSession({
      applicationSource: 'setup_selector',
      bundle,
      currentUserInstruction: 'Keep the target product proof exact and adapt only reusable story judgment.',
      editReferenceClient,
      editReferenceId: firstApproved.detail.reference.id,
      outputFrameConfirmed: true,
      workspaceId,
    })
    if (!prepared.ok) throw new Error(prepared.message)
    assert.equal(prepared.ok, true)
    assert.equal(prepared.application.applicationSource, 'setup_selector')
    const connected = await connectPreferenceApplicationToProjectEditSession({
      application: prepared.application,
      editReferenceClient,
      outputFrameConfirmed: true,
      projectEditSessionClient: sessionClient,
      referenceRevision: prepared.detail.reference.revision,
      workspaceId,
    })
    assert.equal(connected.ok, true)
    assert.equal(connected.application?.applicationSource, 'setup_selector')
    assert(connected.application?.decisions.some((decision) => decision.decision === 'adapted'))
    assert(connected.application?.decisions.some((decision) => decision.decision === 'blocked_from_transfer'))
    assert(connected.application?.doNotCopyRules.some((rule) => /footage/i.test(rule)))
    bundle = await loadBundle(sessionClient)
    assert.equal(readConnectedPreferenceApplicationContext(bundle.session)?.applicationId, connected.application?.id)

    const sameReference = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Use @GateEightOneTravel for this edit.',
      workspaceId,
    })
    assert.equal(sameReference.ok, true)
    assert.equal(sameReference.idempotentReplay, true)
    assert.equal(sameReference.mutated, false)

    const missingReference = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Use @ReferenceThatDoesNotExist for this edit.',
      workspaceId,
    })
    assert.equal(missingReference.ok, true)
    assert.equal(missingReference.mutated, false)
    assert.match(missingReference.assistantText ?? '', /could not find/i)

    const ambiguousReference = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Use @GateEightOne for this edit.',
      workspaceId,
    })
    assert.equal(ambiguousReference.ok, true)
    assert.equal(ambiguousReference.mutated, false)
    assert.match(ambiguousReference.assistantText ?? '', /more than one approved Edit Reference/i)

    const compared = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Compare @GateEightOneTravel and @GateEightOneTeaching.',
      workspaceId,
    })
    assert.equal(compared.ok, true)
    assert.equal(compared.comparedReferences.length, 2)
    assert.equal(compared.mutated, false)

    const replacementPrompt = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Replace the current reference with @GateEightOneTeaching.',
      workspaceId,
    })
    assert.equal(replacementPrompt.confirmationRequired, true)
    assert.equal(replacementPrompt.mutated, false)

    const replaced = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Confirm replace with @GateEightOneTeaching but make captions stronger.',
      workspaceId,
    })
    assert.equal(replaced.ok, true)
    assert.equal(replaced.mutated, true)
    assert.equal(replaced.application?.applicationSource, 'chat_tag')
    assert.equal(replaced.application?.editReferenceId, secondApproved.detail.reference.id)
    assert.match(replaced.application?.targetContext.currentUserInstruction ?? '', /captions stronger/i)
    bundle = await loadBundle(sessionClient)
    assert.equal(readConnectedPreferenceApplicationContext(bundle.session)?.applicationId, replaced.application?.id)
    assert.equal(readConnectedPreferenceApplicationContext(bundle.session)?.applicationSource, 'chat_tag')

    const removePrompt = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Remove the current edit reference.',
      workspaceId,
    })
    assert.equal(removePrompt.confirmationRequired, true)
    const removed = await executeEditReferenceChatCommand({
      bundle,
      editReferenceClient,
      projectEditSessionClient: sessionClient,
      text: 'Confirm remove current edit reference.',
      workspaceId,
    })
    assert.equal(removed.ok, true)
    assert.equal(removed.mutated, true)
    bundle = await loadBundle(sessionClient)
    assert.equal(readConnectedPreferenceApplicationContext(bundle.session), undefined)

    const history = await query<PreferenceApplicationListData>(runtime.baseUrl, `/v1/edit-reference-applications?workspaceId=${workspaceId}`)
    const targetHistory = history.applications
      .filter((application) => application.projectId === projectId && application.editSessionId === editSessionId)
      .sort((left, right) => left.version - right.version)
    assert.deepEqual(targetHistory.map((application) => application.status), ['replaced', 'cleared'])
    assert.deepEqual(targetHistory.map((application) => application.applicationSource), ['setup_selector', 'chat_tag'])
    assert(targetHistory[0]?.updatedAt)
    assert(targetHistory[1]?.updatedAt)
    assert.equal(targetHistory[0]?.replacedByApplicationId, targetHistory[1]?.id)
    assert.equal(targetHistory[1]?.replacesApplicationId, targetHistory[0]?.id)

    const status = JSON.parse(await readFile(join(process.cwd(), 'docs/edit-reference-goal-status.json'), 'utf8')) as {
      currentGate?: string
      productionReady?: boolean
      remoteMutationAllowed?: boolean
      readinessDecision?: string
      gate81?: { applicationEntryPoints?: string; liveStudyClosure?: string }
    }
    assert.match(status.currentGate ?? '', /^(?:gate_8_1_complete|gate_9_)/)
    assert.equal(status.productionReady, false)
    assert.equal(status.remoteMutationAllowed, false)
    assert.equal(status.readinessDecision, 'feature_complete_except_external_blocker')
    assert.equal(status.gate81?.applicationEntryPoints, 'passed_backend_local')
    assert.equal(status.gate81?.liveStudyClosure, 'passed_local_partial_external_blockers')

    const stored = await readFile(join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(ownerUserId, workspaceId), 'aggregate.json'), 'utf8')
    assert.doesNotMatch(stored, /"(?:rawFrames|rawProviderPayload|signedUrl|localFilePath|apiKey|serviceRoleKey|accessToken)"\s*:/i)
    assert.match(stored, /media_studied_local_partial/)
    assert.match(stored, /preference_application_replaced/)
    assert.match(stored, /preference_application_cleared/)
  } finally {
    await runtime.close()
  }

  console.log(JSON.stringify({
    check: 'edit_reference_gate_8_1_closure',
    ok: true,
    applicationEntryPoints: ['setup_selector', 'chat_tag'],
    liveStudy: 'verified_local_partial',
    productionReady: false,
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}

function createControlledVideoFixture(outputPath: string): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100',
    '-t', '1.5', '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'aac', '-shortest', '-y', outputPath,
  ], { encoding: 'utf8' })
  assert.equal(result.status, 0, `Controlled ffmpeg fixture failed: ${result.stderr}`)
}

async function startRuntime(localStorageRoot: string) {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test', API_PORT: '8787', E2E_RUNTIME_MODE: 'local', API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local', LOCAL_STORAGE_ROOT: localStorageRoot, PROVIDER_EXECUTION_ENABLED: 'false', WORKER_RUNTIME_MODE: 'mock',
  })
  const server = createReeditProApiApp(env).listen(0, '127.0.0.1')
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  }
}

async function createReference(baseUrl: string, name: string, key: string): Promise<EditReferenceDetailData> {
  return mutate(baseUrl, '/v1/edit-references', key, {
    workspaceId,
    name,
    description: 'Gate 8.1 controlled behavioral fixture.',
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics'],
  })
}

async function addManualEvidence(
  baseUrl: string,
  data: EditReferenceDetailData,
  key: string,
  summary: string,
): Promise<EditReferenceDetailData> {
  return mutate(baseUrl, `/v1/edit-reference-studies/${data.detail.study.id}/evidence`, key, {
    workspaceId,
    expectedStudyRevision: data.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: 'Target-safe transferable principles',
    category: 'all_goals',
    summary,
    intendedUse: 'transferable',
  })
}

async function approveStudiedReference(
  baseUrl: string,
  studied: EditReferenceDetailData,
  prefix: string,
): Promise<EditReferenceDetailData> {
  const synthesized = await mutate<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studied.detail.study.id}/preference-dna`, `${prefix}-dna`, {
    workspaceId,
    expectedStudyRevision: studied.detail.study.revision,
  })
  const dna = synthesized.detail.dnaVersions.at(-1)
  assert(dna)
  const quality = await mutate<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studied.detail.study.id}/preference-dna/${dna.id}/qa`, `${prefix}-qa`, {
    workspaceId,
    expectedStudyRevision: synthesized.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
  })
  const qa = quality.detail.dnaQaResults.find((record) => record.dnaVersionId === dna.id)
  assert(qa)
  assert.notEqual(qa.status, 'blocked')
  return mutate(baseUrl, `/v1/edit-reference-studies/${studied.detail.study.id}/preference-dna/${dna.id}/approve`, `${prefix}-approve`, {
    workspaceId,
    expectedStudyRevision: quality.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
    qaResultId: qa.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: qa.status === 'requires_user_review',
  })
}

async function uploadReferenceVideo(input: {
  baseUrl: string
  referenceId: string
  studyId: string
  body: Buffer
}): Promise<{ storageObjectRecordId: string; mediaAssetId: string }> {
  const checksumSha256 = createHash('sha256').update(input.body).digest('hex')
  const created = await mutate<{
    uploadIntent: { id: string }
    uploadTarget: { uploadUrl: string; uploadMethod: 'PUT'; uploadHeaders?: Record<string, string> }
  }>(input.baseUrl, `/v1/projects/${input.referenceId}/upload-intents`, 'gate-8-1-upload-intent', {
    workspaceId,
    chatSessionId: input.studyId,
    uploadPurpose: 'reference_media',
    originalFileName: 'controlled-reference.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: input.body.byteLength,
    checksumSha256,
  })
  const uploadUrl = created.uploadTarget.uploadUrl.startsWith('http')
    ? created.uploadTarget.uploadUrl
    : `${input.baseUrl}${created.uploadTarget.uploadUrl}`
  const uploaded = await fetch(uploadUrl, {
    method: created.uploadTarget.uploadMethod,
    headers: { 'content-type': 'video/mp4', ...(created.uploadTarget.uploadHeaders ?? {}) },
    body: Uint8Array.from(input.body).buffer,
  })
  assert.equal(uploaded.ok, true, await uploaded.text())
  const finalized = await mutate<{
    storageObjectRecord: { id: string }
    mediaAsset: { id: string }
  }>(input.baseUrl, `/v1/upload-intents/${created.uploadIntent.id}/finalize`, 'gate-8-1-upload-finalize', {
    workspaceId,
    sizeBytes: input.body.byteLength,
    checksumSha256,
  })
  return {
    storageObjectRecordId: finalized.storageObjectRecord.id,
    mediaAssetId: finalized.mediaAsset.id,
  }
}

async function loadBundle(
  client: ReturnType<typeof createDefaultMockProjectEditSessionApiClient>,
): Promise<ProjectEditSessionBundleRecord> {
  const response = await client.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(editSessionId)
  assert.equal(response.ok, true)
  assert(response.data?.bundle)
  return response.data.bundle
}

async function mutate<T>(baseUrl: string, path: string, key: string, body: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as EditReferenceApiSuccess<T> | { error: { code: string; message: string } }
  assert.equal(response.ok, true, JSON.stringify(payload))
  assert('ok' in payload && payload.ok === true)
  return payload.data
}

async function query<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`)
  const payload = await response.json() as EditReferenceApiSuccess<T> | { error: { code: string; message: string } }
  assert.equal(response.ok, true, JSON.stringify(payload))
  assert('ok' in payload && payload.ok === true)
  return payload.data
}
