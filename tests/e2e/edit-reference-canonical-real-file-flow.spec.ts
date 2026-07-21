import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../../server/edit-references/edit-reference-controlled-media-fixtures'
import { persistReadyTargetVideoUnderstandingFixture } from '../../server/smoke/fixtures/ready-target-video-understanding-fixture'
import { resolveCurrentEditReferenceActiveEditorAuthority } from '../../src/lib/current-edit-reference-active-editor-authority'
import { createPreferenceApplicationTargetContext } from '../../src/lib/project-edit-session-edit-reference-integration'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import type { ProjectEditBriefBackendLocalRecord } from '../../src/lib/project-edit-brief-backend-local'
import type { EditReferenceDetailData, PreferenceApplicationListData } from '../../src/types/edit-reference'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  gotoRoute,
} from './helpers/routes'

const apiPort = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_CANONICAL_API_PORT ?? 9005)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
let fixturePath = ''

test.describe('canonical Edit Preference real-file flow', () => {
  test.beforeAll(async ({ browserName }, testInfo) => {
    if (browserName !== 'chromium') {
      throw new Error('The canonical Edit Preference browser proof is qualified for Chromium only.')
    }
    const storageRoot = String(testInfo.config.metadata.editReferenceCanonicalStorageRoot ?? '')
    if (!path.isAbsolute(storageRoot)) {
      throw new Error('The canonical Edit Preference browser storage root must be absolute.')
    }
    const fixtureDefinition = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS.find(
      (definition) => definition.fixtureId === 'target_a_educational_product_demo',
    )
    if (!fixtureDefinition) throw new Error('The canonical Edit Preference media fixture is unavailable.')
    const fixture = await materializeEditReferenceControlledMediaFixture({
      outputRoot: path.join(storageRoot, 'controlled-browser-fixtures'),
      definition: fixtureDefinition,
      timeoutMs: 60_000,
    })
    fixturePath = fixture.videoPath
  })

  test('creates a preference, studies a real private video, and resumes from a saved checkpoint', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    const sourceBefore = sha256(await readFile(fixturePath))
    const preferenceName = `Documentary reference ${Date.now()}`

    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Edit Preferences' })).toBeVisible()

    await page.getByTestId('new-edit-reference').click()
    const createDialog = page.getByTestId('edit-reference-create-dialog')
    await expect(createDialog).toBeVisible()
    await expect(page.getByTestId('edit-reference-name')).toBeFocused()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()

    const chat = page.getByTestId('edit-reference-study-chat')
    await expect(chat).toBeVisible()
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    await expect(chat).toContainText('Tell me how you want ReEditPro to edit')
    await expect(page.getByTestId('edit-reference-dna-review')).toHaveCount(0)
    await expect(page.getByTestId('edit-reference-target-ready')).toHaveCount(0)

    await page.getByTestId('edit-reference-study-message').fill(
      'Use restrained documentary pacing, preserve interview meaning, keep captions minimal, and use maps only when they clarify location.',
    )
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(chat).toContainText('Nothing will be applied until you review and approve the finished preference.')

    await page.getByTestId('add-edit-reference-source').click()
    await expect(page.getByTestId('edit-reference-evidence-form')).toBeVisible()
    await page.getByTestId('edit-reference-video-file').setInputFiles(fixturePath)
    await page.getByTestId('save-edit-reference-evidence').click()

    const studyCard = page.locator('[data-testid^="edit-reference-long-form-study-"]').first()
    await expect(studyCard).toBeVisible()
    await expect(studyCard).toContainText('fixture.mp4')
    await expect(studyCard).toContainText('Large file size changes the transfer and analysis route—it does not reduce study coverage.')
    await studyCard.getByRole('button', { name: 'Start whole-video study' }).click()

    await expect(studyCard).toContainText('checkpointed section')
    await expect(studyCard.locator('progress')).toBeVisible()
    await expect(chat).toContainText('started a checkpointed whole-video study')
    await expect(page.getByTestId('edit-reference-dna-review')).toHaveCount(0)
    await expect(page.getByTestId('edit-reference-target-ready')).toHaveCount(0)

    await studyCard.getByRole('button', { name: 'Pause safely' }).click()
    await expect(studyCard.getByRole('button', { name: 'Resume study' })).toBeVisible()
    await expect(page.locator('.edit-reference-detail-status')).toHaveText('Study paused')
    await expect(studyCard).toContainText('Completed checkpoints are safe')

    const progressBeforeReload = await studyCard.locator('progress').getAttribute('value')
    await page.reload()
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    const restoredCard = page.locator('[data-testid^="edit-reference-long-form-study-"]').first()
    await expect(restoredCard.getByRole('button', { name: 'Resume study' })).toBeVisible()
    await expect(restoredCard.locator('progress')).toHaveAttribute('value', progressBeforeReload ?? '0')
    await restoredCard.getByRole('button', { name: 'Resume study' }).click()
    await expect(restoredCard.getByRole('button', { name: 'Pause safely' })).toBeVisible()
    await expect(restoredCard).toContainText('Study resumed from the last verified checkpoint.')

    await setViewport(page, 375, 812)
    await expectNoHorizontalOverflow(page)
    const chatIsContained = await page.getByTestId('edit-reference-study-chat').evaluate((element) => (
      element.scrollWidth <= element.clientWidth + 1
    ))
    expect(chatIsContained).toBe(true)

    const sourceAfter = sha256(await readFile(fixturePath))
    expect(sourceAfter).toBe(sourceBefore)
  })

  test('recovers a verified upload after reload without sending the private video twice', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    const preferenceName = `Upload recovery ${Date.now()}`
    let failNextEvidenceMutation = true
    let uploadIntentRequests = 0
    let uploadBodyRequests = 0
    let finalizeRequests = 0
    page.on('request', (request) => {
      const url = request.url()
      if (request.method() === 'POST' && /\/v1\/edit-references\/[^/]+\/upload-intents$/.test(url)) uploadIntentRequests += 1
      if (request.method() === 'PUT' && /\/v1\/upload-intents\/[^/]+\/local-object(?:\?.*)?$/.test(url)) uploadBodyRequests += 1
      if (request.method() === 'POST' && /\/v1\/upload-intents\/[^/]+\/finalize$/.test(url)) finalizeRequests += 1
    })
    await page.route('**/v1/edit-reference-studies/*/evidence', async (route) => {
      if (route.request().method() === 'POST' && failNextEvidenceMutation) {
        failNextEvidenceMutation = false
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    await page.getByRole('button', { name: 'Upload video' }).click()
    await page.getByTestId('edit-reference-video-file').setInputFiles(fixturePath)
    await page.getByTestId('save-edit-reference-evidence').click()

    await expect(page.getByTestId('edit-reference-video-upload-recovery')).toContainText('Verified upload waiting to attach')
    const callsAfterInterruptedEvidence = {
      uploadIntentRequests,
      uploadBodyRequests,
      finalizeRequests,
    }
    expect(callsAfterInterruptedEvidence.uploadIntentRequests).toBe(1)
    expect(callsAfterInterruptedEvidence.uploadBodyRequests).toBeGreaterThan(0)
    expect(callsAfterInterruptedEvidence.finalizeRequests).toBe(1)
    const storedRecovery = await page.evaluate(() => Array.from(
      { length: sessionStorage.length },
      (_, index) => {
        const key = sessionStorage.key(index) ?? ''
        return [key, sessionStorage.getItem(key)] as const
      },
    ).find(([key]) => key.startsWith('reeditpro.editReferenceUploadRecovery.v1.')))
    expect(storedRecovery).toBeTruthy()
    expect(JSON.stringify(storedRecovery)).not.toContain('target-documentary.mp4')

    await page.reload()
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    await page.getByRole('button', { name: 'Upload video' }).click()
    await expect(page.getByTestId('edit-reference-video-upload-recovery')).toContainText('Verified upload waiting to attach')
    await page.getByTestId('edit-reference-video-file').setInputFiles(fixturePath)
    await page.getByTestId('save-edit-reference-evidence').click()

    await expect(page.locator('[data-testid^="edit-reference-long-form-study-"]').first()).toBeVisible()
    expect(uploadIntentRequests).toBe(callsAfterInterruptedEvidence.uploadIntentRequests)
    expect(uploadBodyRequests).toBe(callsAfterInterruptedEvidence.uploadBodyRequests)
    expect(finalizeRequests).toBe(callsAfterInterruptedEvidence.finalizeRequests)
    const recoveryKeysAfterAttach = await page.evaluate(() => Array.from(
      { length: sessionStorage.length },
      (_, index) => sessionStorage.key(index) ?? '',
    ).filter((key) => key.startsWith('reeditpro.editReferenceUploadRecovery.v1.')))
    expect(recoveryKeysAfterAttach).toEqual([])
    await expectNoHorizontalOverflow(page)
  })

  test('reconciles a committed video attachment when its response is lost', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    const preferenceName = `Evidence readback ${Date.now()}`
    let loseCommittedResponse = true
    let evidenceMutationRequests = 0
    page.on('request', (request) => {
      if (
        request.method() === 'POST'
        && /\/v1\/edit-reference-studies\/[^/]+\/evidence$/.test(request.url())
      ) evidenceMutationRequests += 1
    })
    await page.route('**/v1/edit-reference-studies/*/evidence', async (route) => {
      if (route.request().method() === 'POST' && loseCommittedResponse) {
        loseCommittedResponse = false
        const committed = await route.fetch()
        expect(committed.ok()).toBe(true)
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    await page.getByRole('button', { name: 'Upload video' }).click()
    await page.getByTestId('edit-reference-video-file').setInputFiles(fixturePath)
    await page.getByTestId('save-edit-reference-evidence').click()

    const studyCards = page.locator('[data-testid^="edit-reference-long-form-study-"]')
    await expect(studyCards).toHaveCount(1)
    await expect(studyCards.first()).toContainText('target-documentary.mp4')
    expect(evidenceMutationRequests).toBe(1)
    await expect(page.getByTestId('edit-reference-video-upload-recovery')).toHaveCount(0)
    const recoveryKeys = await page.evaluate(() => Array.from(
      { length: sessionStorage.length },
      (_, index) => sessionStorage.key(index) ?? '',
    ).filter((key) => key.startsWith('reeditpro.editReferenceUploadRecovery.v1.')))
    expect(recoveryKeys).toEqual([])
    await expectNoHorizontalOverflow(page)
  })

  test('selects approved guidance, verifies the exact target, applies explicitly, reloads, and removes safely', async ({ page }, testInfo) => {
    test.setTimeout(180_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)
    const sourceBefore = sha256(await readFile(fixturePath))

    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('The Edit Preference workspace identity is missing.')

    const stamp = Date.now()
    const preferenceName = `Exact target documentary ${stamp}`
    const approved = await createApprovedReference(workspaceId, `canonical-target-${stamp}`, preferenceName)

    await gotoRoute(page, '/projects/new')
    const projectName = `Target adaptation project ${stamp}`
    const editName = `Target adaptation edit ${stamp}`
    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    // Project recovery can replace the initial local card with the verified
    // backend readback. Dispatch once the canonical button exists so this
    // fixture setup does not race that ownership-preserving replacement.
    await page.getByRole('button', { name: /^New edit$/i }).first().dispatchEvent('click')
    await expect(page.getByTestId('new-edit-dialog')).toBeVisible()
    await page.getByLabel(/Edit name/i).fill(editName)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await page.getByTestId('edit-upload-gate-input').setInputFiles(fixturePath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
    const instruction = 'Create a factual documentary edit with restrained pacing, clear captions, speech-safe audio, and maps only when they clarify place.'
    await page.getByTestId('chat-composer-textarea').fill(instruction)
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
    await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible()

    await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
    const editBriefGoal = 'Preserve the documentary evidence and adapt the approved editing intelligence to this exact video.'
    await page.getByTestId('edit-brief-goal-input').fill(editBriefGoal)
    await clickWhenReady(page.getByTestId('edit-brief-mark-ready'))
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Ready')

    const handoff = await waitForNamedEditHandoff(page, editName, workspaceId)
    const setup = handoff.setup
    const source = handoff.sourceMediaAssets?.[0]
    if (
      !setup?.aspectRatio
      || setup.aspectRatioConfirmed !== true
      || !setup.editLevel
      || !setup.targetPlatform
      || !handoff.editBriefState
      || !source?.storageObjectRecordId
      || !source.checksumSha256
    ) throw new Error('The exact named-edit source, frame, Edit Level, platform, or Edit Brief authority is incomplete.')

    const backendBrief = await waitForBackendBrief({
      editSessionId: handoff.editSessionId,
      projectId: handoff.projectId,
      workspaceId,
    })
    const authority = resolveCurrentEditReferenceActiveEditorAuthority({
      aspectRatio: setup.aspectRatio,
      aspectRatioConfirmed: setup.aspectRatioConfirmed,
      backendBrief: { ...backendBrief, readbackVerified: true },
      createdAt: handoff.createdAt,
      currentUserInstruction: setup.customInstructions ?? instruction,
      editBriefState: handoff.editBriefState,
      editLevel: setup.editLevel,
      editName: handoff.editName ?? editName,
      editSessionId: handoff.editSessionId,
      ownerUserId: 'local-test-user',
      projectId: handoff.projectId,
      projectName: handoff.projectName,
      sourceMediaAssets: handoff.sourceMediaAssets ?? [],
      targetPlatform: setup.targetPlatform,
      updatedAt: handoff.updatedAt,
      workspaceId,
    })
    expect(authority.ready).toBe(true)
    if (!authority.ready) throw new Error(authority.message)

    const targetContext = createPreferenceApplicationTargetContext({
      bundle: authority.authority.bundle,
      currentUserInstruction: authority.authority.currentUserInstruction,
      outputFrameConfirmed: true,
    })
    const storageRoot = String(testInfo.config.metadata.editReferenceCanonicalStorageRoot ?? '')
    expect(path.isAbsolute(storageRoot)).toBe(true)
    const targetPackage = await persistReadyTargetVideoUnderstandingFixture({
      localStorageRoot: storageRoot,
      ownerUserId: 'mock-user-runtime',
      workspaceId,
      editReferenceId: approved.detail.reference.id,
      studySessionId: approved.detail.study.id,
      targetContext,
      fixtureKey: `canonical-target-${stamp}`,
      durationSeconds: source.sourceMetadata?.durationSeconds ?? 3,
      sourceBinding: {
        storageObjectRecordId: source.storageObjectRecordId,
        mediaAssetId: source.mediaAssetId,
        checksumSha256: source.checksumSha256,
        sizeBytes: source.byteSize,
        mimeType: source.mimeType,
      },
      editBriefBinding: {
        id: backendBrief.id,
        revision: backendBrief.revisionNumber,
        digestSha256: backendBrief.contentDigestSha256,
      },
    })

    await page.route(/\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/edit-reference-target-understanding(?:\?|$)/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            targetVideoUnderstandingPackage: targetPackage,
            schedule: { scheduled: false, alreadyActive: false, runtime: 'blocked', reason: 'controlled_test_readback' },
            persistence: 'backend_local_private_versioned',
            replayed: true,
            productReady: false,
          },
          warnings: ['Controlled browser readback only; the exact package is persisted in the private backend test repository.'],
        }),
      })
    })

    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await expect(page).toHaveURL(/view=preferences/)
    const referenceSelect = page.getByTestId('current-edit-reference-select')
    await expect(referenceSelect).toBeVisible()
    await referenceSelect.selectOption(approved.detail.reference.id)

    const targetStudy = page.getByTestId('edit-reference-target-study')
    await expect(targetStudy).toHaveAttribute('data-state', 'ready')
    await expect(targetStudy).toContainText('This video is understood')
    const application = page.getByTestId('current-edit-reference-application')
    await expect(application).toHaveAttribute('data-state', 'ready_to_apply')
    await expect(application).toContainText('Ready for Apply')
    expect((await listApplications(workspaceId)).applications.filter((record) => record.targetIntegrationStatus === 'connected')).toHaveLength(0)

    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expect(referenceSelect).toHaveValue(approved.detail.reference.id)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'applied')
    await expect(page.getByTestId('current-edit-reference-application')).toContainText('Guidance is saved to this edit')
    const connected = (await listApplications(workspaceId)).applications.filter((record) => record.targetIntegrationStatus === 'connected')
    expect(connected).toHaveLength(1)
    expect(connected[0]).toMatchObject({
      editReferenceId: approved.detail.reference.id,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
      status: 'prepared',
    })

    await page.reload()
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue(approved.detail.reference.id)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'applied')
    await page.getByTestId('current-edit-reference-select').selectOption('')
    await expect(page.getByTestId('preference-material-change-warning')).toContainText('remove this preference')
    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue('')
    await expect(page.getByTestId('current-edit-preferences-apply-error')).toHaveCount(0)
    await expect(page.getByTestId('preference-material-change-warning')).toHaveCount(0)
    await expect.poll(async () => (
      (await listApplications(workspaceId)).applications
        .filter((record) => record.targetIntegrationStatus === 'connected')
        .length
    )).toBe(0)

    await setViewport(page, 375, 812)
    await expectNoHorizontalOverflow(page)
    expect(sha256(await readFile(fixturePath))).toBe(sourceBefore)
  })
})

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

async function waitForNamedEditHandoff(
  page: import('@playwright/test').Page,
  editName: string,
  workspaceId: string,
): Promise<LocalInternalProjectHandoff> {
  await expect.poll(async () => {
    const handoff = await readNamedEditHandoff(page, editName, workspaceId)
    return Boolean(
      handoff?.editBriefState?.editBrief.status === 'ready'
      && handoff.sourceMediaAssets?.[0]?.storageObjectRecordId,
    )
  }).toBe(true)
  const handoff = await readNamedEditHandoff(page, editName, workspaceId)
  if (!handoff) throw new Error('The exact named-edit handoff was not persisted.')
  return handoff
}

async function readNamedEditHandoff(
  page: import('@playwright/test').Page,
  editName: string,
  workspaceId: string,
): Promise<LocalInternalProjectHandoff | undefined> {
  const storageKey = buildLocalProjectHandoffStorageKey({
    authMode: 'local_test',
    userId: 'local-test-user',
    workspaceId,
  })
  return page.evaluate(({ key, name }) => {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as { handoffs?: LocalInternalProjectHandoff[] }
    return parsed.handoffs?.find((handoff) => handoff.editName === name)
  }, { key: storageKey, name: editName })
}

async function waitForBackendBrief(input: {
  editSessionId: string
  projectId: string
  workspaceId: string
}): Promise<ProjectEditBriefBackendLocalRecord> {
  let latest: ProjectEditBriefBackendLocalRecord | undefined
  await expect.poll(async () => {
    const response = await fetch(`${apiBaseUrl}/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/local-brief?workspaceId=${encodeURIComponent(input.workspaceId)}`)
    if (!response.ok) return false
    const payload = await response.json() as { ok?: boolean; data?: { editBrief?: ProjectEditBriefBackendLocalRecord } }
    latest = payload.data?.editBrief
    return Boolean(latest?.contentDigestSha256 && latest?.sourceStorageObjectRecordId && latest?.sourceMediaAssetId)
  }).toBe(true)
  if (!latest) throw new Error('The verified backend-local Edit Brief was not available.')
  return latest
}

async function createApprovedReference(
  workspaceId: string,
  keyPrefix: string,
  name: string,
): Promise<EditReferenceDetailData> {
  const created = await post<EditReferenceDetailData>('/v1/edit-references', `${keyPrefix}-create`, {
    workspaceId,
    name,
    description: 'Reusable documentary editing intelligence for exact target adaptation.',
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics'],
  })
  const studyId = created.detail.study.id
  const evidence = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence`, `${keyPrefix}-evidence`, {
    workspaceId,
    expectedStudyRevision: created.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: `${name} direction`,
    category: 'all_goals',
    summary: 'Use meaning-led pacing, restrained visual hierarchy, readable target-authored captions, target-derived color, purposeful target B-roll, speech-safe audio, and original evidence graphics. Never copy exact footage, timing, layouts, people, identity, music, sound effects, captions, or marks.',
    intendedUse: 'transferable',
  })
  const studied = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence-study`, `${keyPrefix}-study`, {
    workspaceId,
    expectedStudyRevision: evidence.detail.study.revision,
  })
  const synthesized = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna`, `${keyPrefix}-dna`, {
    workspaceId,
    expectedStudyRevision: studied.detail.study.revision,
  })
  const dna = synthesized.detail.dnaVersions[0]
  if (!dna) throw new Error('The approved-reference fixture did not create Preference DNA.')
  const quality = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/qa`, `${keyPrefix}-qa`, {
    workspaceId,
    expectedStudyRevision: synthesized.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
  })
  const qa = quality.detail.dnaQaResults[0]
  if (!qa) throw new Error('The approved-reference fixture did not create a quality result.')
  return post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/approve`, `${keyPrefix}-approve`, {
    workspaceId,
    expectedStudyRevision: quality.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
    qaResultId: qa.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: qa.status === 'requires_user_review',
  })
}

async function listApplications(workspaceId: string): Promise<PreferenceApplicationListData> {
  const response = await fetch(`${apiBaseUrl}/v1/edit-reference-applications?workspaceId=${encodeURIComponent(workspaceId)}`)
  const payload = await response.json() as { ok?: boolean; data?: PreferenceApplicationListData; error?: { message?: string } }
  expect(response.ok, JSON.stringify(payload)).toBe(true)
  if (!payload.ok || !payload.data) throw new Error(payload.error?.message ?? 'Preference Applications could not be read.')
  return payload.data
}

async function post<T>(path: string, key: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { ok?: boolean; data?: T; error?: { message?: string } }
  expect(response.ok, JSON.stringify(payload)).toBe(true)
  if (!payload.ok || !payload.data) throw new Error(payload.error?.message ?? 'Edit Preference API request failed.')
  return payload.data
}
