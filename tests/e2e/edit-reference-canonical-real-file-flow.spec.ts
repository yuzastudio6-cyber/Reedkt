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
import type {
  EditReferenceDetailData,
  EditReferenceMessageData,
} from '../../src/types/edit-reference'
import type {
  EditReferenceProductionExactEditApplyAuthorityRead,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
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

  test('reuses one create request after a committed response is lost', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    let loseCreateResponse = true
    const createIdempotencyKeys: string[] = []
    await page.route(/\/v1\/edit-references$/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      createIdempotencyKeys.push(route.request().headers()['idempotency-key'] ?? '')
      if (loseCreateResponse) {
        loseCreateResponse = false
        const committed = await route.fetch()
        expect(committed.ok()).toBe(true)
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    const preferenceName = `Create recovery ${Date.now()}`
    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    await expect(page.getByTestId('edit-reference-create-dialog')).toBeVisible()
    await page.getByTestId('save-edit-reference').click()

    await expect(page.getByTestId('edit-reference-create-dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    expect(createIdempotencyKeys).toHaveLength(2)
    expect(new Set(createIdempotencyKeys).size).toBe(1)
    expect(createIdempotencyKeys[0]).toMatch(/^edit-reference-create-/)
    await expectNoHorizontalOverflow(page)
  })

  test('reconciles a committed archive response without archiving twice', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    let archiveMutationRequests = 0
    await page.route(/\/v1\/edit-references\/[^/]+$/, async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue()
      archiveMutationRequests += 1
      const committed = await route.fetch()
      expect(committed.ok()).toBe(true)
      await route.abort('failed')
    })

    const preferenceName = `Archive recovery ${Date.now()}`
    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    await page.locator('summary').filter({ hasText: 'Study progress' }).click()
    await page.getByRole('button', { name: 'Archive reference' }).click()

    await expect(page.getByRole('button', { name: 'Archive reference' })).toBeDisabled()
    await expect(page.getByText('Preference archived. Its private history remains available.')).toBeVisible()
    expect(archiveMutationRequests).toBe(1)
    await expectNoHorizontalOverflow(page)
  })

  test('reconciles a committed creative-evidence response without duplicating the note', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    let evidenceMutationRequests = 0
    await page.route(/\/v1\/edit-reference-studies\/[^/]+\/evidence$/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      evidenceMutationRequests += 1
      const committed = await route.fetch()
      expect(committed.ok()).toBe(true)
      await route.abort('failed')
    })

    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(`Evidence recovery ${Date.now()}`)
    await page.getByTestId('save-edit-reference').click()
    await page.getByTestId('edit-reference-study-message').fill('Preserve meaning and keep the visual hierarchy restrained.')
    await page.getByTestId('send-edit-reference-study-message').click()

    await page.getByTestId('add-edit-reference-source').click()
    await page.getByRole('button', { name: 'Creative note' }).click()
    await page.getByTestId('edit-reference-evidence-title').fill('Speech-safe pacing')
    await page.getByTestId('edit-reference-evidence-summary').fill('Keep important spoken context intact and let visual changes support, not interrupt, the meaning.')
    await page.getByTestId('save-edit-reference-evidence').click()

    await expect(page.getByTestId('edit-reference-evidence-form')).toHaveCount(0)
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Speech-safe pacing')
    await expect(page.getByTestId('edit-reference-study-chat')).toContainText('2 study inputs saved')
    expect(evidenceMutationRequests).toBe(1)
    await expectNoHorizontalOverflow(page)
  })

  test('renders the durable reasoning status under the exact saved Study Chat message', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    let projectedReasoningStatus = false
    await page.route(/\/v1\/edit-reference-studies\/[^/]+\/messages$/, async (route) => {
      if (route.request().method() !== 'POST' || projectedReasoningStatus) return route.continue()
      projectedReasoningStatus = true
      const committed = await route.fetch()
      expect(committed.ok()).toBe(true)
      const payload = await committed.json() as {
        ok: true
        data: EditReferenceMessageData
        warnings: string[]
      }
      const appendedIds = new Set(payload.data.appendedMessageIds)
      const savedUserMessage = payload.data.detail.messages.find((message) => (
        appendedIds.has(message.id) && message.role === 'user'
      ))
      expect(savedUserMessage).toBeTruthy()
      const assistantIds = payload.data.appendedMessageIds.filter((id) => id !== savedUserMessage?.id)
      payload.data.appendedMessageIds = [savedUserMessage!.id]
      payload.data.detail.messages = payload.data.detail.messages.filter(
        (message) => !assistantIds.includes(message.id),
      )
      payload.data.detail.studyChatReasoning = [{
        attemptId: 'controlled-mounted-browser-attempt',
        userMessageId: savedUserMessage!.id,
        state: 'failed',
        statusText: 'Your direction is saved. ReEditPro could not complete the response.',
        retryAvailable: true,
        providerCallMayHaveOccurred: false,
        createdAt: savedUserMessage!.createdAt,
        updatedAt: savedUserMessage!.createdAt,
      }]
      await route.fulfill({ response: committed, json: payload })
    })

    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(`Reasoning status ${Date.now()}`)
    await page.getByTestId('save-edit-reference').click()
    await page.getByTestId('edit-reference-study-message').fill(
      'Keep the pacing restrained and preserve every claim long enough to read.',
    )
    await page.getByTestId('send-edit-reference-study-message').click()

    const status = page.locator('.edit-reference-reasoning-status')
    await expect(status).toHaveAttribute('data-state', 'failed')
    await expect(status).toContainText('Your direction is saved')
    await expect(page.getByTestId('edit-reference-study-chat')).toContainText('1 study input saved')
    await expectNoHorizontalOverflow(page)
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
    await expect(studyCards.first().locator('header strong')).toHaveText(/\.mp4$/)
    expect(evidenceMutationRequests).toBe(1)
    await expect(page.getByTestId('edit-reference-video-upload-recovery')).toHaveCount(0)
    const recoveryKeys = await page.evaluate(() => Array.from(
      { length: sessionStorage.length },
      (_, index) => sessionStorage.key(index) ?? '',
    ).filter((key) => key.startsWith('reeditpro.editReferenceUploadRecovery.v1.')))
    expect(recoveryKeys).toEqual([])
    await expectNoHorizontalOverflow(page)
  })

  test('reconciles committed Study Chat, evidence study, DNA synthesis, and quality review responses', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    const mutationRequests = {
      message: 0,
      study: 0,
      synthesis: 0,
      quality: 0,
    }
    const loseCommittedResponse = async (route: import('@playwright/test').Route) => {
      const committed = await route.fetch()
      expect(committed.ok()).toBe(true)
      await route.abort('failed')
    }
    await page.route(/\/v1\/edit-reference-studies\/[^/]+\/messages$/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      mutationRequests.message += 1
      await loseCommittedResponse(route)
    })
    await page.route(/\/v1\/edit-reference-studies\/[^/]+\/evidence-study$/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      mutationRequests.study += 1
      await loseCommittedResponse(route)
    })
    await page.route(/\/v1\/edit-reference-studies\/[^/]+\/preference-dna$/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      mutationRequests.synthesis += 1
      await loseCommittedResponse(route)
    })
    await page.route(/\/v1\/edit-reference-studies\/[^/]+\/preference-dna\/[^/]+\/qa$/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      mutationRequests.quality += 1
      await loseCommittedResponse(route)
    })

    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(`Study mutation recovery ${Date.now()}`)
    await page.getByTestId('save-edit-reference').click()

    const direction = 'Use meaning-led pacing, restrained visual hierarchy, readable target-authored captions, target-derived color, purposeful target B-roll, speech-safe audio, and original evidence graphics. Never copy exact footage, timing, layouts, people, identity, music, sound effects, captions, or marks.'
    await page.getByTestId('edit-reference-study-message').fill(direction)
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByTestId('edit-reference-study-message')).toHaveValue('')
    await expect(page.getByTestId('edit-reference-study-chat')).toContainText('Nothing will be applied until you review and approve the finished preference.')
    expect(mutationRequests.message).toBe(1)

    await page.getByTestId('run-edit-reference-evidence-study').click()
    await expect(page.getByTestId('edit-reference-dna-action')).toBeVisible()
    await expect(page.getByTestId('edit-reference-study-findings')).toBeVisible()
    expect(mutationRequests.study).toBe(1)

    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Ready for quality review')
    expect(mutationRequests.synthesis).toBe(1)

    await page.getByTestId('run-edit-reference-dna-qa').click()
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toBeVisible()
    await expect(page.getByTestId('run-edit-reference-dna-qa')).toHaveCount(0)
    expect(mutationRequests.quality).toBe(1)
    await expectNoHorizontalOverflow(page)
  })

  test('reconciles committed whole-video study commands when their responses are lost', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    const preferenceName = `Study command readback ${Date.now()}`
    let loseStartResponse = true
    const lostControlResponses = new Set<string>()
    let startMutationRequests = 0
    let controlMutationRequests = 0
    page.on('request', (request) => {
      const url = request.url()
      if (request.method() === 'POST' && /\/long-form-study$/.test(url)) startMutationRequests += 1
      if (request.method() === 'POST' && /\/long-form-study\/control$/.test(url)) controlMutationRequests += 1
    })
    await page.route('**/long-form-study', async (route) => {
      if (route.request().method() === 'POST' && loseStartResponse) {
        loseStartResponse = false
        const committed = await route.fetch()
        expect(committed.ok()).toBe(true)
        await route.abort('failed')
        return
      }
      await route.continue()
    })
    await page.route('**/long-form-study/control', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { action?: string }
      if (
        route.request().method() === 'POST'
        && body.action
        && ['pause', 'resume', 'cancel'].includes(body.action)
        && !lostControlResponses.has(body.action)
      ) {
        lostControlResponses.add(body.action)
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

    const studyCard = page.locator('[data-testid^="edit-reference-long-form-study-"]').first()
    await studyCard.getByRole('button', { name: 'Start whole-video study' }).click()
    await expect(studyCard).toContainText('Study start confirmed after the connection interrupted')
    expect(startMutationRequests).toBe(1)

    await studyCard.getByRole('button', { name: 'Pause safely' }).click()
    await expect(studyCard.getByRole('button', { name: 'Resume study' })).toBeVisible()
    await expect(studyCard).toContainText('Pause confirmed after the connection interrupted')

    await studyCard.getByRole('button', { name: 'Resume study' }).click()
    await expect(studyCard.getByRole('button', { name: 'Pause safely' })).toBeVisible()
    await expect(studyCard).toContainText('Resume confirmed after the connection interrupted')

    await studyCard.getByRole('button', { name: 'Cancel' }).click()
    await studyCard.getByRole('button', { name: 'Cancel study' }).click()
    await expect(studyCard).toContainText('Cancellation confirmed after the connection interrupted')
    await expect(studyCard).toContainText('Cancelled')
    expect(controlMutationRequests).toBe(3)
    expect([...lostControlResponses].sort()).toEqual(['cancel', 'pause', 'resume'])
    await expectNoHorizontalOverflow(page)
  })

  test('reconciles a committed Preference DNA approval when its response is lost', async ({ page }) => {
    test.setTimeout(120_000)
    page.setDefaultTimeout(15_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('The Edit Preference workspace identity is missing.')

    const stamp = Date.now()
    const reviewable = await createReviewableReference(
      workspaceId,
      `canonical-approval-readback-${stamp}`,
      `Approval recovery ${stamp}`,
    )
    let approvalMutationRequests = 0
    let loseCommittedApprovalResponse = true
    await page.route('**/v1/edit-reference-studies/*/preference-dna/*/approve', async (route) => {
      if (route.request().method() === 'POST') approvalMutationRequests += 1
      if (route.request().method() === 'POST' && loseCommittedApprovalResponse) {
        loseCommittedApprovalResponse = false
        const committed = await route.fetch()
        expect(committed.ok()).toBe(true)
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    await gotoRoute(page, `/preferences?reference=${encodeURIComponent(reviewable.detail.reference.id)}`)
    await expect(page.getByTestId('edit-reference-dna-approval')).toBeVisible()
    await page.getByTestId('acknowledge-edit-reference-dna-approval').check()
    const reasoningAcknowledgement = page.getByTestId('acknowledge-edit-reference-dna-reasoning-review')
    if (await reasoningAcknowledgement.count()) await reasoningAcknowledgement.check()
    await page.getByTestId('approve-edit-reference-dna').click()

    await expect(page.getByTestId('edit-reference-target-ready')).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Approved reusable guidance')
    expect(approvalMutationRequests).toBe(1)
    await expectNoHorizontalOverflow(page)
  })

  test('applies, replaces, reloads, and removes exact-target guidance despite lost responses', async ({ page }, testInfo) => {
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
    const replacementPreferenceName = `Exact target editorial ${stamp}`
    const replacementApproved = await createApprovedReference(
      workspaceId,
      `canonical-replacement-${stamp}`,
      replacementPreferenceName,
    )
    const lifecycleMutationRequests = { prepare: 0, apply: 0 }
    const lostPreparationKeys = new Set<string>()
    await page.route(/\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/edit-preferences\/reference-application\/prepare$/, async (route) => {
      if (route.request().method() === 'POST') lifecycleMutationRequests.prepare += 1
      const key = route.request().headers()['idempotency-key'] ?? ''
      if (route.request().method() === 'POST' && key && !lostPreparationKeys.has(key)) {
        lostPreparationKeys.add(key)
        const committed = await route.fetch()
        expect(committed.ok()).toBe(true)
        await route.abort('failed')
        return
      }
      await route.continue()
    })
    await page.route(/\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/edit-preferences\/apply$/, async (route) => {
      if (route.request().method() === 'POST') lifecycleMutationRequests.apply += 1
      await route.continue()
    })

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
    const replacementTargetPackage = await persistReadyTargetVideoUnderstandingFixture({
      localStorageRoot: storageRoot,
      ownerUserId: 'mock-user-runtime',
      workspaceId,
      editReferenceId: replacementApproved.detail.reference.id,
      studySessionId: replacementApproved.detail.study.id,
      targetContext,
      fixtureKey: `canonical-replacement-${stamp}`,
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
      const requestUrl = new URL(route.request().url())
      const requestBody = route.request().postDataJSON() as { editReferenceId?: string } | null
      const requestedReferenceId = requestUrl.searchParams.get('editReferenceId') ?? requestBody?.editReferenceId
      const selectedTargetPackage = requestedReferenceId === replacementApproved.detail.reference.id
        ? replacementTargetPackage
        : targetPackage
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            targetVideoUnderstandingPackage: selectedTargetPackage,
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
    expect((await readExactApplyAuthority({
      workspaceId,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
    })).currentApplicationId).toBeNull()

    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expect(referenceSelect).toHaveValue(approved.detail.reference.id)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'applied')
    await expect(page.getByTestId('current-edit-reference-application')).toContainText('Guidance is saved to this edit')
    const connectedAuthority = await readExactApplyAuthority({
      workspaceId,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
    })
    expect(connectedAuthority.currentApplicationId).toBeTruthy()
    const connectedApplicationId = connectedAuthority.currentApplicationId
    if (!connectedApplicationId) throw new Error('Canonical application identity was not connected.')
    const connectedApplicationAuthority = await readExactApplyAuthority({
      workspaceId,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
      selectedApplicationId: connectedApplicationId,
    })
    expect(connectedApplicationAuthority.selectedApplicationAuthority).toMatchObject({
      applicationId: connectedApplicationId,
      editReferenceId: approved.detail.reference.id,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
      status: 'prepared',
      connectionState: 'connected',
    })
    expect(lifecycleMutationRequests.prepare).toBe(2)
    expect(lifecycleMutationRequests.apply).toBe(1)

    await page.reload()
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue(approved.detail.reference.id)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'applied')
    await page.getByTestId('current-edit-reference-select').selectOption(replacementApproved.detail.reference.id)
    await expect(page.getByTestId('edit-reference-target-study')).toHaveAttribute('data-state', 'ready')
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'ready_to_apply')
    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue(replacementApproved.detail.reference.id)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'applied')
    const replacementAuthority = await readExactApplyAuthority({
      workspaceId,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
    })
    expect(replacementAuthority.currentApplicationId).not.toBe(connectedApplicationId)
    if (!replacementAuthority.currentApplicationId) throw new Error('Replacement application was not connected.')
    const replacementApplicationAuthority = await readExactApplyAuthority({
      workspaceId,
      projectId: handoff.projectId,
      editSessionId: handoff.editSessionId,
      selectedApplicationId: replacementAuthority.currentApplicationId,
    })
    expect(replacementApplicationAuthority.selectedApplicationAuthority).toMatchObject({
      editReferenceId: replacementApproved.detail.reference.id,
      connectionState: 'connected',
    })
    expect(lifecycleMutationRequests.prepare).toBe(4)
    expect(lifecycleMutationRequests.apply).toBe(2)

    await page.reload()
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue(replacementApproved.detail.reference.id)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute('data-state', 'applied')
    await page.getByTestId('current-edit-reference-select').selectOption('')
    await expect(page.getByTestId('preference-material-change-warning')).toContainText('remove this preference')
    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue('')
    await expect(page.getByTestId('current-edit-preferences-apply-error')).toHaveCount(0)
    await expect(page.getByTestId('preference-material-change-warning')).toHaveCount(0)
    await expect.poll(async () => (
      (await readExactApplyAuthority({
        workspaceId,
        projectId: handoff.projectId,
        editSessionId: handoff.editSessionId,
      })).currentApplicationId
    )).toBeNull()
    expect(lifecycleMutationRequests.apply).toBe(3)

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
  const quality = await createReviewableReference(workspaceId, keyPrefix, name)
  const studyId = quality.detail.study.id
  const dna = quality.detail.dnaVersions[0]
  if (!dna) throw new Error('The approved-reference fixture did not create Preference DNA.')
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

async function createReviewableReference(
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
  return quality
}

async function readExactApplyAuthority(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  selectedApplicationId?: string
}): Promise<EditReferenceProductionExactEditApplyAuthorityRead> {
  const query = new URLSearchParams({ workspaceId: input.workspaceId })
  if (input.selectedApplicationId) query.set('selectedApplicationId', input.selectedApplicationId)
  const response = await fetch(`${apiBaseUrl}/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/edit-preferences/apply-authority?${query}`)
  const payload = await response.json() as {
    ok?: boolean
    data?: { authority?: EditReferenceProductionExactEditApplyAuthorityRead }
    error?: { message?: string }
  }
  expect(response.ok, JSON.stringify(payload)).toBe(true)
  if (!payload.ok || !payload.data?.authority) {
    throw new Error(payload.error?.message ?? 'Exact Edit Reference authority could not be read.')
  }
  return payload.data.authority
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
