import assert from 'node:assert/strict'
import { mkdir, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  createPreferenceIntelligenceService,
  type PreferenceIntelligenceService,
} from '../services/preference-intelligence-service'
import {
  clearPrivatePreferenceIntelligenceProcessStateForSmoke,
  PREFERENCE_INSTRUCTION_PRIORITY,
  preferenceIntelligenceRecordRelativePath,
  readPrivatePreferenceIntelligenceAggregate,
  type PreferenceDnaQaResultRecord,
  type PreferenceDnaVersionRecord,
  type ReusableEditPreferenceRecord,
} from '../services/private-preference-intelligence-store'
import {
  clearPrivateEditAuthorityProcessStateForSmoke,
  mutatePrivateEditAuthorityAggregate,
} from '../services/private-edit-authority-store'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'

const localStorageRoot = '/tmp/reeditpro-preference-intelligence-authority-smoke'
const workspaceId = 'workspace-preference-intelligence-smoke'
const userId = 'user-preference-intelligence-smoke'
const editSessionId = 'edit-session-preference-intelligence-smoke'
await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()
clearPrivatePreferenceIntelligenceProcessStateForSmoke()
clearPrivateEditAuthorityProcessStateForSmoke()

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'preference-intelligence-authority-smoke',
  auth: { userId, isMockUser: true },
}
const service = createPreferenceIntelligenceService(context)
const project = (await createProjectService(context).createProject({
  workspaceId,
  name: 'Preference intelligence authority smoke',
})).project

const first = await createApprovedPreference({
  service,
  workspaceId,
  name: 'Clean Travel Intelligence',
  suffix: 'travel',
  includeMediaEvidence: true,
  transferableInstruction: 'Use warm, source-matched color with clean pacing and voice-first audio.',
})
assert.equal(first.preference.status, 'active')
assert.equal(first.dna.runtimeState, 'metadata_only')
assert.equal(first.dna.status, 'approved')
assert.equal(first.qa.status, 'passed')
assert.equal(first.qa.approvedForApplication, true)
assert.equal(first.mediaEvidenceBlocked, true)
assert.ok(first.dna.doNotCopyRules.length >= 4)
assert.ok(first.dna.nonTransferableElements.some((value) => /logo/i.test(value)))

const approvalReplay = await service.approveDna(first.approvalInput)
assert.deepEqual(
  approvalReplay,
  first.approval,
  'DNA approval retry must return its bounded exact persisted response even after no mutation.',
)

const second = await createApprovedPreference({
  service,
  workspaceId,
  name: 'Clean Product Intelligence',
  suffix: 'product',
  includeMediaEvidence: false,
  transferableInstruction: 'Use clear product close-ups, restrained motion, and readable benefit callouts.',
})

const selectorInput = {
  workspaceId,
  projectId: project.id,
  editSessionId,
  preferenceId: first.preference.id,
  expectedApplicationVersion: 0,
  source: 'selector' as const,
  idempotencyKey: 'apply-first-preference-selector',
}
const selectorApplied = await service.applyPreference(selectorInput)
assert.equal(selectorApplied.action, 'applied')
assert.equal(selectorApplied.application.applicationVersion, 1)
assert.equal(selectorApplied.application.source, 'selector')
assert.equal(selectorApplied.application.selectedEditPreferenceId, first.preference.id)
assert.equal(selectorApplied.application.selectedPreferenceDNAId, first.dna.id)
assert.ok(selectorApplied.application.doNotCopyRules.length >= 4)

const selectorReplay = await service.applyPreference(selectorInput)
assert.deepEqual(selectorReplay, selectorApplied, 'Preference application retry must replay the exact persisted response.')

await expectApiError(
  () => service.applyPreference({
    ...selectorInput,
    idempotencyKey: 'display-name-is-not-a-stable-preference-id',
    preferenceId: 'Clean Travel Intelligence',
    expectedApplicationVersion: 1,
  }),
  'VALIDATION_FAILED',
  'Preference application must not resolve a display name as identity.',
)
await expectApiError(
  () => service.applyPreference({
    workspaceId,
    projectId: project.id,
    editSessionId,
    preferenceId: second.preference.id,
    expectedApplicationVersion: 1,
    source: 'main_chat_tag',
    idempotencyKey: 'tag-without-structured-reference',
  }),
  'VALIDATION_FAILED',
  'Main Chat tags require a stable structured tag reference ID.',
)

const tagApplied = await service.applyPreference({
  workspaceId,
  projectId: project.id,
  editSessionId,
  preferenceId: second.preference.id,
  expectedApplicationVersion: 1,
  source: 'main_chat_tag',
  tagReferenceId: 'chat-tag-preference-product-1',
  idempotencyKey: 'replace-with-second-preference-tag',
})
assert.equal(tagApplied.action, 'replaced')
assert.equal(tagApplied.application.id, selectorApplied.application.id)
assert.equal(tagApplied.application.applicationVersion, 2)
assert.equal(tagApplied.application.source, 'main_chat_tag')
assert.equal(tagApplied.application.selectedEditPreferenceId, second.preference.id)
assert.equal(tagApplied.application.selectedPreferenceDNAId, second.dna.id)

for (const audience of ['planner', 'main_chat', 'marker_chat', 'edit_brief'] as const) {
  const contextPackage = await service.getContextPackage(
    workspaceId,
    project.id,
    editSessionId,
    audience,
  )
  assert.equal(contextPackage.applicationStatus, 'applied')
  assert.equal(contextPackage.audience, audience)
  assert.equal(contextPackage.context?.audience, audience)
  assert.equal(contextPackage.context?.preferenceId, second.preference.id)
  assert.equal(contextPackage.context?.preferenceDNAId, second.dna.id)
  assert.deepEqual(contextPackage.context?.doNotCopyRules, second.dna.doNotCopyRules)
  assert.deepEqual(contextPackage.instructionPriority, PREFERENCE_INSTRUCTION_PRIORITY)
  assert.equal(contextPackage.boundaries?.includesFullStudyChat, false)
  assert.equal(contextPackage.boundaries?.includesRawVideo, false)
  assert.equal(contextPackage.boundaries?.includesRawFrames, false)
  assert.equal(contextPackage.boundaries?.includesMarkerInstructions, false)
  assert.equal(contextPackage.boundaries?.editBriefMarkersRemainSeparate, true)
  assert.equal(JSON.stringify(contextPackage).includes('I prefer clean'), false)
}

const cleared = await service.clearPreference({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedApplicationVersion: 2,
  source: 'main_chat_tag',
  tagReferenceId: 'chat-tag-clear-preference-1',
  idempotencyKey: 'clear-preference-via-chat-tag',
})
assert.equal(cleared.application.id, selectorApplied.application.id)
assert.equal(cleared.application.applicationVersion, 3)
assert.equal(cleared.application.status, 'cleared')
assert.equal(cleared.application.selectedEditPreferenceId, undefined)
assert.equal(cleared.application.preferenceSummaryForMarkerChat, undefined)
assert.deepEqual(cleared.application.doNotCopyRules, [])
const clearedReplay = await service.clearPreference({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedApplicationVersion: 2,
  source: 'main_chat_tag',
  tagReferenceId: 'chat-tag-clear-preference-1',
  idempotencyKey: 'clear-preference-via-chat-tag',
})
assert.deepEqual(clearedReplay, cleared)

const reapplied = await service.applyPreference({
  workspaceId,
  projectId: project.id,
  editSessionId,
  preferenceId: first.preference.id,
  expectedApplicationVersion: 3,
  source: 'selector',
  idempotencyKey: 'reapply-first-preference-selector',
})
assert.equal(reapplied.application.applicationVersion, 4)
assert.equal(reapplied.application.id, selectorApplied.application.id)

const approvalReplayAfterLaterMutations = await service.approveDna(first.approvalInput)
assert.deepEqual(
  approvalReplayAfterLaterMutations,
  first.approval,
  'DNA approval retry must remain exact after later workspace aggregate revisions.',
)

const appliedEdits = await service.listAppliedEdits(workspaceId, first.preference.id)
assert.equal(appliedEdits.applications.length, 1)
assert.ok(appliedEdits.usageLogs.some((log) => log.eventType === 'applied'))
const replacedPreferenceUsage = await service.listAppliedEdits(workspaceId, second.preference.id)
assert.ok(replacedPreferenceUsage.usageLogs.some((log) => log.eventType === 'cleared'))

clearPrivatePreferenceIntelligenceProcessStateForSmoke()
clearLocalProjectMemoryForSmoke()
const restartedApplication = await createPreferenceIntelligenceService(context).getApplication(
  workspaceId,
  project.id,
  editSessionId,
)
assert.equal(restartedApplication.application?.applicationVersion, 4)
assert.equal(restartedApplication.application?.selectedEditPreferenceId, first.preference.id)

await mutatePrivateEditAuthorityAggregate({
  scope: { localStorageRoot, ownerUserId: userId, workspaceId },
  now: new Date().toISOString(),
  mutation: (aggregate) => {
    aggregate.plans.push({
      id: 'approved-plan-locking-preference-application',
      projectId: project.id,
      editSessionId,
      planningRequestId: 'approved-plan-locking-preference-application-request',
      planVersion: 1,
      status: 'approved',
      componentRefs: {},
      estimateId: 'approved-plan-locking-preference-application-estimate',
      workItemIds: [],
      planHash: '4'.repeat(64),
      workGraphHash: '5'.repeat(64),
      sourceSequenceHash: '6'.repeat(64),
      timingHash: '7'.repeat(64),
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    })
    return { result: undefined, changed: true }
  },
})

await expectApiError(
  () => service.applyPreference({
    workspaceId,
    projectId: project.id,
    editSessionId,
    preferenceId: second.preference.id,
    expectedApplicationVersion: 4,
    source: 'selector',
    idempotencyKey: 'forbidden-post-approval-preference-replace',
  }),
  'PLAN_NOT_APPROVED',
  'Approved plans must lock applied Preference DNA until Chat-led revision/replanning.',
)
await expectApiError(
  () => service.clearPreference({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedApplicationVersion: 4,
    source: 'selector',
    idempotencyKey: 'forbidden-post-approval-preference-clear',
  }),
  'PLAN_NOT_APPROVED',
  'Approved plans must lock preference clearing until Chat-led revision/replanning.',
)
const replayAfterApproval = await service.applyPreference(selectorInput)
assert.deepEqual(
  replayAfterApproval,
  selectorApplied,
  'A previously committed exact application retry may replay after approval without mutating approved state.',
)

const aggregate = await readPrivatePreferenceIntelligenceAggregate({ localStorageRoot, ownerUserId: userId, workspaceId })
assert.ok(aggregate)
assert.equal(aggregate.preferences.length, 2)
assert.equal(aggregate.applications.length, 1)
assert.equal(aggregate.applications[0]?.applicationVersion, 4)
assert.ok(aggregate.studyMessages.some((message) => message.role === 'user'))
assert.ok(aggregate.studyQuestions.length >= 1)
assert.ok(aggregate.studyAnswers.length >= 1)
assert.equal(aggregate.dnaVersions.every((dna) => dna.doNotCopyRules.length >= 4), true)
assert.equal(aggregate.evidence.every((evidence) => !evidence.rawFramesPersisted), true)
assert.equal(aggregate.evidence.every((evidence) => !evidence.fullVideoSentToReasoningModel), true)
assert.equal(aggregate.evidence.every((evidence) => !evidence.privateAssetId), true)

const intelligenceRelativePath = preferenceIntelligenceRecordRelativePath(userId, workspaceId)
const intelligencePath = join(localStorageRoot, intelligenceRelativePath)
assert.equal((await stat(intelligencePath)).mode & 0o777, 0o600)
assert.equal((await stat(dirname(intelligencePath))).mode & 0o777, 0o700)

const targetSymlinkRoot = '/tmp/reeditpro-preference-intelligence-target-symlink-smoke'
const targetSymlinkOutsideFile = '/tmp/reeditpro-preference-intelligence-target-symlink-outside.json'
await rm(targetSymlinkRoot, { recursive: true, force: true })
await rm(targetSymlinkOutsideFile, { force: true })
const targetSymlinkPath = join(targetSymlinkRoot, intelligenceRelativePath)
await mkdir(dirname(targetSymlinkPath), { recursive: true })
await writeFile(targetSymlinkOutsideFile, 'outside preference intelligence record must remain unchanged\n')
await symlink(targetSymlinkOutsideFile, targetSymlinkPath)
await expectApiError(
  () => createPreferenceIntelligenceService({
    ...context,
    env: { ...env, localStorageRoot: targetSymlinkRoot },
  }).listPreferences(workspaceId),
  'VALIDATION_FAILED',
  'Preference Intelligence persistence must reject a symbolic-link record target.',
)
assert.equal(
  await readFile(targetSymlinkOutsideFile, 'utf8'),
  'outside preference intelligence record must remain unchanged\n',
)
await rm(targetSymlinkRoot, { recursive: true, force: true })
await rm(targetSymlinkOutsideFile, { force: true })

const parentSymlinkRoot = '/tmp/reeditpro-preference-intelligence-parent-symlink-smoke'
const parentSymlinkOutsideRoot = '/tmp/reeditpro-preference-intelligence-parent-symlink-outside'
await rm(parentSymlinkRoot, { recursive: true, force: true })
await rm(parentSymlinkOutsideRoot, { recursive: true, force: true })
await mkdir(parentSymlinkRoot, { recursive: true })
await mkdir(parentSymlinkOutsideRoot, { recursive: true })
await symlink(parentSymlinkOutsideRoot, join(parentSymlinkRoot, 'preference-intelligence'))
await expectApiError(
  () => createPreferenceIntelligenceService({
    ...context,
    env: { ...env, localStorageRoot: parentSymlinkRoot },
  }).createPreference({
    workspaceId,
    name: 'Parent symlink must not receive Preference Intelligence',
    idempotencyKey: 'preference-intelligence-parent-symlink-refusal',
  }),
  'VALIDATION_FAILED',
  'Preference Intelligence persistence must reject a symbolic-link parent directory.',
)
assert.deepEqual(await readdir(parentSymlinkOutsideRoot), [])
await rm(parentSymlinkRoot, { recursive: true, force: true })
await rm(parentSymlinkOutsideRoot, { recursive: true, force: true })

const otherUserContext: ServiceContext = {
  ...context,
  requestId: 'preference-intelligence-other-user',
  auth: { userId: 'other-preference-intelligence-user', isMockUser: true },
}
const otherUserPreferences = await createPreferenceIntelligenceService(otherUserContext).listPreferences(workspaceId)
assert.deepEqual(otherUserPreferences.preferences, [])
await expectApiError(
  () => createPreferenceIntelligenceService(otherUserContext).getApplication(workspaceId, project.id, editSessionId),
  'PROJECT_NOT_FOUND',
  'Another local-test user must not read another owner’s Project Edit Session application.',
)

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'disabled',
  STORAGE_MODE: 'gcs_disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://preference-intelligence-production.supabase.co',
  SUPABASE_ANON_KEY: 'production-anon-placeholder',
  SUPABASE_SERVICE_ROLE_KEY: 'production-service-role-placeholder',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'production-internal-token-placeholder',
})
await expectApiError(
  () => createPreferenceIntelligenceService({ ...context, env: productionEnv }).listPreferences(workspaceId),
  'TOOL_NOT_READY',
  'Production must fail closed until canonical Preference Intelligence persistence and RLS exist.',
)

console.log('Preference intelligence authority smoke passed.')
console.log(JSON.stringify({
  reusableEditPreferences: true,
  structuredStudyState: true,
  evidenceRuntimeHonesty: true,
  mediaAnalysisClaimed: false,
  structuredVersionedDna: true,
  deterministicMetadataQa: true,
  explicitDnaApproval: true,
  stableSelectorAndTagApplicationState: true,
  applyReplaceClear: true,
  compactPlannerMainChatMarkerChatEditBriefSummaries: true,
  doNotCopyPriorityPreserved: true,
  editBriefMarkersRemainSeparate: true,
  approvalLifecycleLock: true,
  exactCriticalMutationReplay: true,
  usageAndAuditLogs: true,
  restartRecovery: true,
  privateModesAndSymlinkAttackRefusal: true,
  tenantIsolation: true,
  productionFailClosed: true,
  productionClaims: false,
}, null, 2))

type DnaApprovalResult = Awaited<ReturnType<PreferenceIntelligenceService['approveDna']>>

type ApprovedPreferenceFixture = {
  preference: ReusableEditPreferenceRecord
  dna: PreferenceDnaVersionRecord
  qa: PreferenceDnaQaResultRecord
  approval: DnaApprovalResult
  approvalInput: {
    workspaceId: string
    preferenceId: string
    dnaVersionId: string
    expectedPreferenceRevision: number
    expectedDnaVersion: number
    idempotencyKey: string
  }
  mediaEvidenceBlocked: boolean
}

async function createApprovedPreference(input: {
  service: PreferenceIntelligenceService
  workspaceId: string
  name: string
  suffix: string
  includeMediaEvidence: boolean
  transferableInstruction: string
}): Promise<ApprovedPreferenceFixture> {
  const created = await input.service.createPreference({
    workspaceId: input.workspaceId,
    name: input.name,
    description: 'Reusable structured editing intelligence for smoke validation.',
    idempotencyKey: `create-preference-${input.suffix}`,
  })
  const preference = created.preference
  const started = await input.service.startStudy({
    workspaceId: input.workspaceId,
    preferenceId: preference.id,
    title: `${input.name} Study`,
    idempotencyKey: `start-study-${input.suffix}`,
  })
  const studySessionId = started.study.session.id as string
  let sessionRevision = started.study.session.revision as number

  const userMessage = await input.service.appendUserStudyMessage({
    workspaceId: input.workspaceId,
    studySessionId,
    expectedSessionRevision: sessionRevision,
    content: `I prefer clean ${input.suffix} edits with restrained motion and strong do-not-copy rules.`,
    clientMessageId: `client-message-${input.suffix}`,
    idempotencyKey: `append-user-message-${input.suffix}`,
  })
  sessionRevision = userMessage.study.session.revision as number
  const assistantMessage = await input.service.appendAssistantStudyMessage({
    workspaceId: input.workspaceId,
    studySessionId,
    expectedSessionRevision: sessionRevision,
    content: 'Automatic Qwen preference reasoning is not live here; this study will use typed manual evidence.',
    runtimeState: 'future_gated',
    idempotencyKey: `append-assistant-message-${input.suffix}`,
  })
  sessionRevision = assistantMessage.study.session.revision as number

  if (input.includeMediaEvidence) {
    const question = await input.service.addStudyQuestion({
      workspaceId: input.workspaceId,
      studySessionId,
      expectedSessionRevision: sessionRevision,
      prompt: 'Should voice clarity outrank music energy?',
      category: 'audio',
      responseType: 'boolean',
      options: [],
      required: true,
      runtimeState: 'metadata_only',
      idempotencyKey: `add-question-${input.suffix}`,
    })
    sessionRevision = question.study.session.revision as number
    const answer = await input.service.answerStudyQuestion({
      workspaceId: input.workspaceId,
      studySessionId,
      questionId: question.question.id,
      expectedSessionRevision: sessionRevision,
      answerText: 'Yes. Keep speech clear at all times.',
      selectedOptions: [],
      idempotencyKey: `answer-question-${input.suffix}`,
    })
    sessionRevision = answer.study.session.revision as number
  }

  const manualEvidence = await input.service.addEvidence({
    workspaceId: input.workspaceId,
    studySessionId,
    expectedSessionRevision: sessionRevision,
    evidenceType: 'manual_description',
    label: `${input.name} manual direction`,
    manualDescription: 'User-authored structured evidence; no provider inference.',
    metadata: { sourceKind: 'manual' },
    observations: [
      {
        category: 'pacing',
        instruction: input.transferableInstruction,
        reason: 'The user explicitly supplied this transferable editing direction.',
        confidence: 0.92,
        transferability: 'transferable',
        conditions: ['Adapt to source meaning and speech clarity.'],
        exceptions: ['Do not force the reference content into an unrelated source video.'],
        prohibitedCopy: false,
      },
      {
        category: 'do_not_copy',
        instruction: `Do not copy the exact ${input.suffix} reference logo, shot order, captions, or music.`,
        reason: 'Reference identity and assets are non-transferable.',
        confidence: 1,
        transferability: 'non_transferable',
        conditions: [],
        exceptions: [],
        prohibitedCopy: true,
      },
    ],
    idempotencyKey: `add-manual-evidence-${input.suffix}`,
  })
  sessionRevision = manualEvidence.study.session.revision as number

  let mediaEvidenceBlocked = false
  if (input.includeMediaEvidence) {
    await expectApiError(
      () => input.service.addEvidence({
        workspaceId: input.workspaceId,
        studySessionId,
        expectedSessionRevision: sessionRevision,
        evidenceType: 'reference_video',
        label: `${input.name} private reference video`,
        privateAssetId: `unverified-private-reference-asset-${input.suffix}`,
        metadata: {
          sourceKind: 'private_asset',
          mimeType: 'video/mp4',
          durationSeconds: 30,
          width: 1920,
          height: 1080,
          hasAudioTrack: true,
        },
        observations: [],
        idempotencyKey: `blocked-media-evidence-${input.suffix}`,
      }),
      'TOOL_NOT_READY',
      'Unverified caller asset IDs must not become Preference Evidence.',
    )
    mediaEvidenceBlocked = true
  }

  const built = await input.service.buildDna({
    workspaceId: input.workspaceId,
    studySessionId,
    expectedSessionRevision: sessionRevision,
    idempotencyKey: `build-dna-${input.suffix}`,
  })
  const qa = await input.service.runDnaQa({
    workspaceId: input.workspaceId,
    preferenceId: preference.id,
    dnaVersionId: built.dna.id,
    expectedPreferenceRevision: 2,
    idempotencyKey: `run-dna-qa-${input.suffix}`,
  })
  const approvalInput = {
    workspaceId: input.workspaceId,
    preferenceId: preference.id,
    dnaVersionId: built.dna.id,
    expectedPreferenceRevision: 3,
    expectedDnaVersion: built.dna.version,
    idempotencyKey: `approve-dna-${input.suffix}`,
  }
  const approval = await input.service.approveDna(approvalInput)
  return {
    preference,
    dna: approval.dna,
    qa: qa.qa,
    approval,
    approvalInput,
    mediaEvidenceBlocked,
  }
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: ApiError['code'],
  message: string,
): Promise<void> {
  try {
    await operation()
    assert.fail(message)
  } catch (error) {
    assert.ok(error instanceof ApiError, message)
    assert.equal(error.code, code, message)
  }
}
