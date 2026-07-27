import { expect, test, type Page } from '@playwright/test'
import { buildLocalProjectHandoffStorageKey, type LocalInternalProjectHandoff } from '../../src/lib/local-project-handoff'
import { buildLocalProjectStorageKey, type LocalProjectRecord } from '../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import {
  expectCardActionsReachable,
  expectCardWithinComposerRail,
  expectCardAttachedToAssistantMessage,
  expectComposerFadeLayer,
  expectChatCardsFitUnderComposer,
  expectChatCardNotTooWide,
  expectChatRhythmStable,
  expectCompactComposerSurface,
  expectFloatingComposer,
  expectFloatingComposerAligned,
  expectLastContentReachableAboveComposer,
  expectMessageLabelsNotOvercrowded,
  expectNoCardHorizontalOverflow,
  expectNoExcessiveVerticalGaps,
  expectNoHorizontalOverflow,
  setViewport,
} from './helpers/layout'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  createPlanFromUploadedEditorSources,
  completeEditorSetup,
  expectNoGenerationBeforeApproval,
  expectNoInternalToolNamesInEditor,
  findPlanReview,
  gotoEditor,
  gotoRoute,
  openEditBriefSourcePreview,
  uploadEditorGateSourceVideo,
  uploadEditorSourceFile,
} from './helpers/routes'

const e2eProjectScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const e2eProjectStorageKey = buildLocalProjectStorageKey(e2eProjectScope)
const e2eHandoffStorageKey = buildLocalProjectHandoffStorageKey(e2eProjectScope)
const e2eProjectScopeFingerprint = createProjectPersistenceScopeFingerprint(e2eProjectScope)

async function readE2EHandoffs(page: Page): Promise<LocalInternalProjectHandoff[]> {
  return page.evaluate((storageKey) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: LocalInternalProjectHandoff[] }
    return envelope.handoffs ?? []
  }, e2eHandoffStorageKey)
}

async function readE2EProjects(page: Page): Promise<LocalProjectRecord[]> {
  return page.evaluate((storageKey) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { projects?: LocalProjectRecord[] }
    return envelope.projects ?? []
  }, e2eProjectStorageKey)
}

test.describe('editor mocked browser flow', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('shows separate projects, edit videos, Motion Studio, and preferences navigation', async ({ page }) => {
    await gotoRoute(page, '/dashboard')

    await expect(page.getByTestId('testing-home-hero')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Create your first project/i })).toBeVisible()
    await expect(page.getByText(/exact plan and credit estimate before any editing begins/i)).toBeVisible()

    const sidebar = page.getByTestId('app-sidebar')
    await expect(sidebar.getByRole('link', { name: /^Home$/ })).toHaveAttribute('href', '/dashboard')
    await expect(sidebar.getByRole('link', { name: /^Projects$/ })).toHaveAttribute('href', '/projects')
    await expect(sidebar.getByRole('link', { name: /^Edit Videos$/ })).toHaveAttribute('href', '/edit-videos')
    await expect(sidebar.getByRole('link', { name: /^Motion Studio$/ })).toHaveAttribute('href', '/motion-studio')
    await expect(sidebar.getByRole('link', { name: /^Edit Preferences$/ })).toHaveAttribute('href', '/preferences')

    await expect(page.getByText(/Export queue/i)).toHaveCount(0)
    await expect(page.getByText(/Credit wallet preview/i)).toHaveCount(0)
    await expect(page.getByText(/mock jobs/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the launch page pointed at the project edit flow', async ({ page }) => {
    await gotoRoute(page, '/')

    await expect(page.getByRole('link', { name: /pricing/i })).toHaveCount(0)
    await expect(page.getByText(/View pricing|See pricing/i)).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Projects$/i }).first()).toHaveAttribute('href', '/projects')
    await expect(page.getByRole('link', { name: /^Start with chat$/i }).first()).toHaveAttribute('href', '/projects/new')
    await expect(page.getByRole('heading', { name: /Nothing expensive starts behind your back/i })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await gotoRoute(page, '/pricing')
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: /Projects/i })).toBeVisible()
  })

  test('shows the canonical library-first Edit Preferences surface for the local session', async ({ page }) => {
    await gotoRoute(page, '/preferences')

    const preferences = page.getByTestId('edit-preferences-page')
    await expect(preferences).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Edit Preferences' })).toBeVisible()
    await expect(preferences.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-reference-library-unavailable')).toBeVisible()
    await expect(page.getByTestId('edit-reference-empty-state')).toHaveCount(0)
    await expect(page.getByTestId('preference-edit-level')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Save defaults$/i })).toHaveCount(0)
    await expect(preferences).not.toContainText(/service[-_ ]?role|signed URL|production ready|VITE_|SUPABASE_/i)
    await expectNoHorizontalOverflow(page)
  })

  test('renders the default editor shell without overflow', async ({ page }) => {
    await gotoEditor(page)

    const editorHeader = page.getByTestId('editor-header')
    await expect(editorHeader).toBeVisible()
    await expect(editorHeader).toContainText(/Estimate pending/i)
    await expect(editorHeader).not.toContainText(/\b100 credits\b/i)
    await expect(page.getByTestId('edit-workspace-progress-card')).toBeVisible()
    await expect(page.getByTestId('edit-workspace-progress-card')).toContainText(/Prepare the edit plan/i)
    const planningInputs = page.getByTestId('edit-workspace-planning-inputs')
    await expect(planningInputs).toHaveCSS('display', 'grid')
    await expect(planningInputs.locator(':scope > div')).toHaveCount(4)
    expect((await planningInputs.evaluate((element) => getComputedStyle(element).gridTemplateColumns)).split(' ')).toHaveLength(4)
    await expect(page.getByTestId('source-sequence-card')).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chat-native editor' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await expectComposerFadeLayer(page)
    await expectFloatingComposer(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatCardNotTooWide(page, page.getByTestId('source-sequence-card'), 'source sequence card')
    await expectChatRhythmStable(page)
    await expectMessageLabelsNotOvercrowded(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('requires a clean edit name before opening the edit workspace', async ({ page }) => {
    await gotoRoute(page, '/projects/new')

    const projectName = `E2E edit naming ${Date.now()}`
    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel(/Edit name/i).fill('   ')
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())
    await expect(page.getByRole('alert')).toContainText(/Name this edit before creating it/i)
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    await page.getByLabel(/Edit name/i).fill('   Clean   kickoff   edit   ')
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await expect(page.getByTestId('editor-header')).toContainText('Clean kickoff edit')
    await expect(page.getByTestId('editor-header-persistence-status')).toHaveCount(0)
    await expect(page.getByTestId('editor-header')).not.toContainText(/backend|durable|cloud/i)

    const savedEditName = (await readE2EHandoffs(page))[0]?.editName

    expect(savedEditName).toBe('Clean kickoff edit')
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('shows upload-gate validation failures and clears them after a successful retry', async ({ page }) => {
    await gotoRoute(page, '/projects/new')

    const projectName = `E2E upload retry ${Date.now()}`
    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
    await page.getByLabel(/Edit name/i).fill('Upload retry edit')
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

    const uploadGate = page.getByTestId('edit-upload-gate')
    await expect(uploadGate).toBeVisible()
    await page.getByTestId('edit-upload-gate-input').setInputFiles({
      name: 'not-a-video.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a supported source video'),
    })

    const uploadError = page.getByTestId('edit-upload-gate-error')
    await expect(uploadError).toBeVisible()
    await expect(uploadError).toHaveAttribute('role', 'alert')
    await expect(uploadError).toContainText(/Choose a supported source video file/i)
    await expect(uploadError).toContainText(/MP4, MOV, M4V, or WebM file and try again/i)
    await expect(uploadError).toContainText(/No plan, credits, editing, or generation started/i)
    await expectNoGenerationBeforeApproval(page)

    await uploadEditorGateSourceVideo(page, 'upload-retry-source.mp4')
    await expect(page.getByTestId('edit-upload-gate-error')).toHaveCount(0)
    await expect(page.getByTestId('source-summary')).toContainText('upload-retry-source.mp4')
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps an unknown named-edit route closed instead of exposing an upload workspace', async ({ page }) => {
    const uniqueId = `missing-${Date.now()}`
    await gotoRoute(page, `/projects/${uniqueId}/edits/${uniqueId}-edit`)

    const notFound = page.getByTestId('named-edit-route-not-found')
    await expect(notFound).toBeVisible()
    await expect(notFound).toContainText(/Edit not found/i)
    await expect(notFound).toContainText(/No upload, planning, approval, or generation started/i)
    await expect(page.getByTestId('editor-page')).toHaveCount(0)
    await expect(page.getByTestId('edit-upload-gate')).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the canonical preference library mounted across route reloads', async ({ page }) => {
    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expect(page.getByTestId('edit-reference-library-unavailable')).toBeVisible()

    await gotoRoute(page, '/projects')
    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-reference-library-unavailable')).toBeVisible()
    await expect(page.getByTestId('preference-edit-level')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('sends a revision message without starting generation', async ({ page }) => {
    await gotoEditor(page)

    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    const revisionText = 'Make the hook more polished, but do not start generation yet.'
    await page.getByTestId('chat-composer-textarea').fill(revisionText)
    await page.getByTestId('chat-composer-send').click()

    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: revisionText })).toBeVisible()
    await expect(page.getByText(/revise the plan before any credits are approved/i)).toBeVisible()
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('chat-composer-textarea')).toHaveValue('')
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectMessageLabelsNotOvercrowded(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('preserves ordered chat intent and invalidates stale confirmed setup after material changes', async ({ page }) => {
    await completeEditorSetup(page)

    const firstInstruction = 'Keep the explanation calm and preserve the product steps.'
    const materialInstruction = 'Actually make it square, use basic edit level, and no extra visuals.'
    const composer = page.getByTestId('chat-composer-textarea')

    await composer.fill(firstInstruction)
    await page.getByTestId('chat-composer-send').click()
    await composer.fill(materialInstruction)
    await page.getByTestId('chat-composer-send').click()

    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: firstInstruction })).toBeVisible()
    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: materialInstruction })).toBeVisible()
    await expect(page.getByText(/changes confirmed setup.*previous plan is cleared/i)).toBeVisible()
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'frame')
    await expect(page.getByRole('button', { name: /Confirm frame/i })).toBeVisible()
    await expect(page.getByTestId('output-frame-control').getByRole('radio', { name: /1:1.*Square social/i }))
      .toHaveAttribute('aria-checked', 'true')
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('approves the mocked plan before the clean private review appears', async ({ page }) => {
    await completeEditorSetup(page)

    const planReview = page.getByTestId('plan-review-card')
    await expect(planReview).toBeVisible()
    expect(await planReview.locator('.clean-plan-checkpoint').evaluate((element) => getComputedStyle(element).display)).toBe('contents')
    expect(await planReview.locator('.clean-plan-intent').evaluate((element) => getComputedStyle(element).borderLeftWidth)).toBe('2px')
    const planFacts = planReview.locator('.clean-plan-facts')
    expect(await planFacts.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(
      await planFacts.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(4)
    expect(await planReview.locator('.clean-plan-estimate').evaluate((element) => getComputedStyle(element).justifyItems)).toBe('end')
    const deliveryCeiling = planReview.getByTestId('plan-review-4k-delivery-ceiling')
    await expect(deliveryCeiling).toContainText(/4K UHD render and export ceiling/i)
    await expect(deliveryCeiling).toContainText(/1080p, 2K, or 4K/i)
    await expect(deliveryCeiling).toContainText(/no second export estimate or charge/i)

    await setViewport(page, 700)
    expect(
      await planFacts.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(1)
    expect(await planReview.locator('.clean-plan-estimate').evaluate((element) => getComputedStyle(element).justifyItems)).toBe('start')
    await expectNoHorizontalOverflow(page)
    await setViewport(page, 1440)

    await expectNoGenerationBeforeApproval(page)
    await expectLastContentReachableAboveComposer(page, page.getByTestId('plan-review-approve'), 'plan review approve action')
    await clickWhenReady(page.getByTestId('plan-review-approve'))

    const privateReview = page.getByTestId('private-review')
    await expect(privateReview).toBeVisible({ timeout: 8_000 })
    await expect(privateReview).toContainText(/Private review|Review the edit/i)
    await expect(privateReview.getByRole('button', { name: /Load review/i })).toBeVisible()
    await expect(privateReview.getByRole('button', { name: /Download MP4/i })).toBeDisabled()
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expectNoInternalToolNamesInEditor(page)
    await expectLastContentReachableAboveComposer(page, privateReview, 'private review')
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('plans uploaded source files before approval and prepares a private internal review output', async ({ page }) => {
    await gotoEditor(page)
    await uploadEditorSourceFile(page, 'uploaded-source-story.mp4')

    await createPlanFromUploadedEditorSources(page)
    await clickWhenReady(page.getByTestId('plan-review-approve'))

    const privateReview = page.getByTestId('private-review')
    await expect(privateReview).toBeVisible({ timeout: 8_000 })
    await expect(privateReview).toContainText(/Private review|Review the edit/i)
    await expect(privateReview.getByRole('button', { name: /Load review/i })).toBeVisible()
    await expect(privateReview.getByRole('button', { name: /Download MP4/i })).toBeDisabled()
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
  })

  test('creates an edit plan from uploaded source and chat prompt without requiring Edit Brief', async ({ page }) => {
    await gotoRoute(page, '/projects')
    await clickWhenReady(page.getByRole('link', { name: /Create project/i }).first())

    const projectName = `E2E prompt-first ${Date.now()}`
    const editName = 'Prompt-first edit'
    const promptOnlyDirection = 'Make this a concise founder update with a calm hook, clean captions, and a clear closing CTA.'

    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
    await page.getByLabel(/Edit name/i).fill(editName)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()

    await uploadEditorGateSourceVideo(page, 'prompt-first-source.mp4')
    await page.getByTestId('chat-composer-textarea').fill(promptOnlyDirection)
    await clickWhenReady(page.getByTestId('chat-composer-send'))

    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: promptOnlyDirection })).toBeVisible()
    await expect(page.getByText(/I'll use that direction and revise the plan before any credits are approved/i)).toBeVisible()
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'source')
    await expect(page.getByTestId('source-summary')).toContainText(/prompt-first-source\.mp4/i)

    const promptPersistedBeforePlan = (await readE2EHandoffs(page))
      .find((handoff) => handoff.editName === editName)?.setup?.customInstructions

    expect(promptPersistedBeforePlan).toBe(promptOnlyDirection)

    await createPlanFromUploadedEditorSources(page)
    await expect(page.getByTestId('edit-brief-panel')).toHaveCount(0)
    await expect(page.getByTestId('plan-review-card')).toContainText(/Review the edit direction/i)
    await expect(page.getByTestId('plan-review-approval-summary')).toContainText(/What I understood/i)
    await expect(page.getByTestId('plan-review-card')).toContainText(/Credits are used only after you approve/i)
    await expect(page.getByTestId('editor-page')).not.toContainText(/\b(Qwen|DeepSeek|GPT-Image-2|Wan|Hailuo|Veo|Mirelo|MMAudio|Lyria)\b/i)
    await expect(page.getByTestId('editor-page')).not.toContainText(/provider calls|AI asset calls|backend required|external service required/i)

    const promptPersistedAfterPlan = (await readE2EHandoffs(page))
      .find((handoff) => handoff.editName === editName)?.setup?.customInstructions

    expect(promptPersistedAfterPlan).toBe(promptOnlyDirection)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
  })

  test('can include an optional Edit Brief in the plan after upload', async ({ page }) => {
    await gotoRoute(page, '/projects')
    await clickWhenReady(page.getByRole('link', { name: /Create project/i }).first())

    const projectName = `E2E brief-ready ${Date.now()}`
    const editName = 'Brief guided edit'
    const briefGoal = 'Make this feel like a polished launch update with a calm hook and a confident closing CTA.'
    const markerDirection = 'Keep the full product explanation and add a quiet lower-third when the speaker names the feature.'

    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
    await page.getByLabel(/Edit name/i).fill(editName)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await uploadEditorGateSourceVideo(page, 'brief-ready-source.mp4')
    const headerEditBrief = page.getByTestId('editor-header-edit-brief')
    await expect(headerEditBrief).toBeVisible()
    await clickWhenReady(headerEditBrief)
    await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
    await expect(headerEditBrief).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('edit-brief-workspace-surface')).toBeFocused()
    await expect(page.getByText(/Prepare the source in Chat first/i)).toBeVisible()
    await expect(page.locator('.chat-message-list')).toBeHidden()
    await expect(page.getByTestId('chat-composer')).toHaveCount(0)
    await expect(page.getByTestId('edit-preview-rail')).toHaveCount(0)
    await clickWhenReady(page.getByRole('button', { name: /^Go to Chat$/i }))
    await expect(page).not.toHaveURL(/[?&]view=brief(?:&|$)/)

    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
    await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible()

    await expect(headerEditBrief).toBeVisible()
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveCount(0)
    await clickWhenReady(headerEditBrief)
    await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
    await expect(headerEditBrief).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('editor-header')).toHaveAttribute('data-workspace-view', 'brief')
    await expect(page.getByTestId('edit-brief-workspace-surface')).toBeFocused()
    const professionalBrief = page.getByTestId('professional-edit-brief-workspace')
    await expect(professionalBrief).toBeVisible()
    await expect(professionalBrief.locator('.professional-edit-brief__header')).toHaveCount(0)
    await expect(page.locator('.edit-brief-workspace-toolbar')).toHaveCount(0)
    await expect(professionalBrief).toContainText(/Open the source for timeline playback/i)
    await expect(page.locator('.chat-message-list')).toBeHidden()
    await expect(page.getByTestId('chat-composer')).toHaveCount(0)
    await expect(page.getByTestId('edit-preview-rail')).toHaveCount(0)
    const directionDetails = page.getByTestId('edit-brief-direction-details')
    await expect(directionDetails).not.toHaveAttribute('open', '')
    const editBriefPanel = page.getByTestId('edit-brief-panel')
    await expect(editBriefPanel).toBeHidden()
    await openEditBriefSourcePreview(page, 'brief-ready-source.mp4')
    const sourcePlayer = page.getByTestId('edit-brief-source-player')
    const previewMonitor = page.locator('.professional-edit-brief__player')
    const sourcePlayerBox = await sourcePlayer.boundingBox()
    const previewMonitorBox = await previewMonitor.boundingBox()
    expect(Math.abs((sourcePlayerBox?.width ?? 0) - (previewMonitorBox?.width ?? 0))).toBeLessThanOrEqual(1)
    expect(Math.abs((sourcePlayerBox?.height ?? 0) - (previewMonitorBox?.height ?? 0))).toBeLessThanOrEqual(1)
    const markerLane = page.getByTestId('edit-brief-marker-lane')
    await expect(markerLane).toBeVisible()
    await expect(page.getByTestId('edit-brief-source-track')).toBeVisible()
    await expect(page.getByTestId('edit-brief-authority-status')).toContainText(/Local draft/i)
    const addMarker = page.getByTestId('edit-brief-add-direction')
    await expect(addMarker).toBeEnabled()
    const timelineHeightBeforePopover = (await markerLane.boundingBox())?.height ?? 0
    await clickWhenReady(addMarker)
    const markerPopover = page.getByTestId('edit-brief-marker-popover')
    await expect(markerPopover).toBeVisible()
    await expect(markerPopover).toHaveCSS('position', 'fixed')
    expect(Math.abs(
      ((await markerLane.boundingBox())?.height ?? 0) - timelineHeightBeforePopover,
    )).toBeLessThanOrEqual(1)
    const markerPrompt = markerPopover.getByLabel(/What should happen here/i)
    await expect(markerPrompt).toBeFocused()
    const initialMarkerPopoverBox = await markerPopover.boundingBox()
    const professionalBriefBox = await professionalBrief.boundingBox()
    expect(initialMarkerPopoverBox?.x ?? -1).toBeGreaterThanOrEqual(professionalBriefBox?.x ?? 0)
    expect(
      (initialMarkerPopoverBox?.x ?? 0) + (initialMarkerPopoverBox?.width ?? 0),
    ).toBeLessThanOrEqual(
      (professionalBriefBox?.x ?? 0) + (professionalBriefBox?.width ?? 0),
    )
    await expect(markerPopover.getByText('More options')).toBeVisible()
    await expect(markerPopover.getByLabel('Type')).toBeHidden()
    await markerPrompt.fill(markerDirection)
    await markerPopover.getByRole('button', { name: 'Add text' }).click()
    await expect(markerPopover.getByRole('button', { name: 'Add text' })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(markerPopover).toHaveCount(0)
    await expect(addMarker).toBeFocused()
    await clickWhenReady(addMarker)
    await expect(markerPopover).toBeVisible()
    await markerPopover.getByLabel(/What should happen here/i).fill(markerDirection)
    await markerPopover.getByRole('button', { name: 'Add text' }).click()
    await directionDetails.locator('summary').click()
    await expect(directionDetails).toHaveAttribute('open', '')
    await expect(editBriefPanel).toBeVisible()
    await expect(editBriefPanel).toContainText(/Skip this if the prompt already says enough/i)
    await editBriefPanel.scrollIntoViewIfNeeded()
    await page.evaluate(() => new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    }))
    const scrolledMarkerPopoverBox = await markerPopover.boundingBox()
    expect(scrolledMarkerPopoverBox?.y ?? -1).toBeGreaterThanOrEqual(0)
    expect(
      (scrolledMarkerPopoverBox?.y ?? 0) + (scrolledMarkerPopoverBox?.height ?? 900),
    ).toBeLessThanOrEqual(900)
    const workspaceLayout = page.locator('.editor-workspace-layout')
    const previewRail = page.getByTestId('edit-preview-rail')
    await expect(previewRail).toBeHidden()
    await expect(workspaceLayout).toHaveAttribute('data-view', 'brief')
    expect(await workspaceLayout.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    const briefCanvasBox = await page.getByTestId('editor-edit-brief-canvas').boundingBox()
    expect(briefCanvasBox?.width ?? 0).toBeGreaterThan(900)
    const editBriefFields = editBriefPanel.locator('.edit-brief-editable-fields')
    await expect(editBriefFields).toBeVisible()
    expect(await editBriefFields.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(['flex', 'inline-flex']).toContain(
      await editBriefPanel.locator('.edit-brief-status').first().evaluate((element) => getComputedStyle(element).display),
    )
    const firstBriefSection = editBriefPanel.locator('.edit-brief-section').first()
    expect(await firstBriefSection.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe('none')
    expect(await firstBriefSection.evaluate((element) => getComputedStyle(element).borderBottomStyle)).toBe('solid')
    const briefGoalInput = page.getByTestId('edit-brief-goal-input')
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveCount(0)

    const editBriefSummaryGrid = editBriefPanel.locator('.edit-brief-summary-grid')
    const timelineGrid = page.locator('.professional-edit-brief__timeline-grid')
    const timelineSurface = page.locator('.professional-edit-brief__timeline')
    const briefHeader = page.getByTestId('editor-header')
    const chatWorkspaceButton = page.getByTestId('edit-workspace-view-chat')
    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width)
      await expect(previewRail).toBeHidden()
      await expectNoHorizontalOverflow(page)
      const markerPopoverBox = await markerPopover.boundingBox()
      expect(markerPopoverBox?.x ?? -1).toBeGreaterThanOrEqual(0)
      expect((markerPopoverBox?.x ?? 0) + (markerPopoverBox?.width ?? width)).toBeLessThanOrEqual(width)
      expect((await chatWorkspaceButton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(
        await timelineGrid.evaluate((element) => (
          getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
        )),
      ).toBe(2)
      const previewBox = await previewMonitor.boundingBox()
      const timelineBox = await timelineSurface.boundingBox()
      const detailsBox = await directionDetails.boundingBox()
      const authorityNotice = professionalBrief.locator('.professional-edit-brief__notice')
      const authorityNoticeBox = await authorityNotice.count() > 0
        ? await authorityNotice.boundingBox()
        : null
      expect(
        Math.abs(
          (previewBox?.y ?? 0) + (previewBox?.height ?? 0) - (timelineBox?.y ?? 0),
        ),
      ).toBeLessThanOrEqual(2)
      expect(
        Math.abs(
          (timelineBox?.y ?? 0)
            + (timelineBox?.height ?? 0)
            - (authorityNoticeBox?.y ?? detailsBox?.y ?? 0),
        ),
      ).toBeLessThanOrEqual(2)
      if (authorityNoticeBox) {
        expect(
          Math.abs(
            authorityNoticeBox.y + authorityNoticeBox.height - (detailsBox?.y ?? 0),
          ),
        ).toBeLessThanOrEqual(2)
      }
      if (width >= 768) {
        expect((await briefHeader.boundingBox())?.height ?? 900).toBeLessThanOrEqual(80)
      }
    }
    await setViewport(page, 375)
    expect(
      await editBriefSummaryGrid.evaluate((element) => (
        getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
      )),
    ).toBe(1)
    await setViewport(page, 1440)
    const markerAuthorityUnavailable = await professionalBrief
      .locator('.professional-edit-brief__notice')
      .count() > 0
    await markerPrompt.press('Control+Enter')
    if (markerAuthorityUnavailable) {
      await expect(markerPopover).toBeVisible()
      await page.keyboard.press('Escape')
    } else {
      await expect(markerPopover).toHaveCount(0)
      await expect(page.locator('.professional-edit-brief__marker')).toHaveCount(1)
    }
    await expect(markerPopover).toHaveCount(0)
    await expect(addMarker).toBeFocused()

    await markerLane.scrollIntoViewIfNeeded()
    const markerLaneBox = await markerLane.boundingBox()
    await markerLane.dblclick({
      position: {
        x: Math.max(1, Math.round((markerLaneBox?.width ?? 100) * 0.7)),
        y: Math.max(1, Math.round((markerLaneBox?.height ?? 100) - 20)),
      },
    })
    await expect(markerPopover).toBeVisible()
    await expect(markerPopover.getByLabel(/What should happen here/i)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(markerPopover).toHaveCount(0)
    await expect(addMarker).toBeFocused()

    await briefGoalInput.fill(briefGoal)
    const referenceUrls = page.getByTestId('edit-brief-reference-urls')
    await referenceUrls.fill('https://example.com/approved-launch-reference')
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Draft')
    const markBriefReady = page.getByTestId('edit-brief-mark-ready')
    await markBriefReady.focus()
    await expect(markBriefReady).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Ready')
    await expect(page.getByTestId('edit-brief-panel')).toContainText(/Ready to include as structured direction/i)

    const persistedBrief = (await readE2EHandoffs(page)).find((handoff) => handoff.editName === editName)?.editBriefState
    expect(persistedBrief?.editBrief).toMatchObject({
      goal: briefGoal,
      status: 'ready',
      userProvidedReferenceUrls: ['https://example.com/approved-launch-reference'],
    })

    await page.reload()
    await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
    await expect(page.getByTestId('professional-edit-brief-workspace')).toBeVisible()
    await expect(page.getByText(/Prepare the source in Chat first/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Prepare source$/i })).toHaveCount(0)
    await page.getByTestId('edit-brief-direction-details').locator('summary').click()
    await expect(page.getByTestId('edit-brief-goal-input')).toHaveValue(briefGoal)
    await expect(page.getByTestId('edit-brief-reference-urls')).toHaveValue('https://example.com/approved-launch-reference')
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Ready')

    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
    await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await expect(page.getByTestId('plan-review-approval-summary')).toContainText(/What I understood/i)
    await expect(page.getByTestId('plan-review-card')).toContainText(/estimated credits/i)
    await clickWhenReady(page.getByTestId('plan-review-approve'))
    await expect(page.getByTestId('private-review')).toBeVisible({ timeout: 10_000 })
    await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
    await page.getByTestId('edit-brief-direction-details').locator('summary').click()
    await expect(page.getByTestId('edit-brief-locked')).toBeVisible()
    await expect(page.getByTestId('edit-brief-goal-input')).toBeDisabled()
    expect(Number(await editBriefFields.evaluate((element) => getComputedStyle(element).opacity))).toBeLessThan(1)
    expect(
      await page.getByTestId('edit-brief-locked').evaluate((element) => getComputedStyle(element).borderLeftWidth),
    ).toBe('2px')
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
  })

  test('creates a project, opens its edit, uploads video, and reaches private review', async ({ page }) => {
    await gotoRoute(page, '/projects')
    await expect(page.getByRole('heading', { level: 1, name: /Projects/i })).toBeVisible()
    await clickWhenReady(page.getByRole('link', { name: /Create project/i }).first())

    const projectName = `E2E private review ${Date.now()}`
    const editName = 'Launch edit v1'
    await expect(page.getByRole('heading', { name: /What are you working on/i })).toBeVisible()
    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())

    await expect(page).toHaveURL(/\/projects\/[^/]+$/)
    await expect(page.getByRole('heading', { level: 1, name: projectName })).toBeVisible()
    await expect(page.getByText(/No video edits yet/i)).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel(/Edit name/i).fill(editName)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(editName)
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByTestId('source-sequence-card')).toHaveCount(0)
    await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
    await expect(page.getByTestId('chat-composer-textarea')).toHaveValue('')
    const initialProjectEditSetup = (await readE2EHandoffs(page))
      .find((handoff) => handoff.editName === editName)?.setup
    expect(initialProjectEditSetup?.customInstructions ?? '').toBe('')
    expect(initialProjectEditSetup?.userInstructionHistory ?? []).toEqual([])

    await uploadEditorGateSourceVideo(page, 'created-project-source.mp4')
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'source')
    await createPlanFromUploadedEditorSources(page)
    await expect(page.getByTestId('editor-header')).toContainText(/Estimate in plan/i)
    await expect(page.getByTestId('editor-header')).not.toContainText(/\b100 credits\b/i)
    await expect(page.getByTestId('plan-review-card')).toContainText(/estimated credits/i)
    await expect(page.getByTestId('plan-review-card')).not.toContainText(/remaining after approval/i)
    const headerEditBrief = page.getByTestId('editor-header-edit-brief')
    await headerEditBrief.focus()
    await expect(headerEditBrief).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
    await expect(headerEditBrief).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('edit-brief-workspace-surface')).toBeFocused()
    await expect(page.getByTestId('chat-composer')).toHaveCount(0)
    await page.getByTestId('edit-brief-direction-details').locator('summary').click()
    await expect(page.getByTestId('edit-brief-panel')).toBeVisible()
    await expect(page.getByTestId('edit-brief-plan-impact')).toContainText(/Changes here require a fresh plan/i)
    await page.getByTestId('edit-brief-goal-input').fill('Make this feel polished, concise, and ready for an internal product walkthrough.')
    const markRevisedBriefReady = page.getByTestId('edit-brief-mark-ready')
    await markRevisedBriefReady.focus()
    await expect(markRevisedBriefReady).toBeFocused()
    await page.keyboard.press('Enter')
    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'planning')
    await expect(page.getByText(/Planning inputs changed\. Create a new edit plan from the updated context before approval/i)).toBeVisible()

    const briefInvalidatedHandoff = (await readE2EHandoffs(page))
      .find((handoff) => handoff.editName === editName)

    expect(briefInvalidatedHandoff).toMatchObject({ stage: 'source_uploaded' })
    expect(briefInvalidatedHandoff?.approvedSnapshotId).toBeUndefined()
    expect(briefInvalidatedHandoff?.privateReview).toBeUndefined()
    const createRevisedPlan = page.getByRole('button', { name: /Create edit plan/i }).first()
    await expect(createRevisedPlan).toBeEnabled()
    await clickWhenReady(createRevisedPlan)
    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await expect(page.getByTestId('plan-review-card')).not.toContainText(/couple starts happy|becomes pregnant|walks away and leaves her/i)
    await clickWhenReady(page.getByTestId('plan-review-approve'))

    const privateReview = page.getByTestId('private-review')
    await expect(privateReview).toBeVisible({ timeout: 8_000 })
    await expect(privateReview).toContainText(/Review the edit/i)
    await expect(privateReview).toContainText(/Sharing and release remain gated/i)
    await expect(privateReview).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth/i)
    const reviewPlaceholder = privateReview.locator('.clean-review-placeholder')
    await expect(reviewPlaceholder).toBeVisible()
    expect(await reviewPlaceholder.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(await reviewPlaceholder.evaluate((element) => getComputedStyle(element).aspectRatio)).toBe('16 / 7')
    expect(['flex', 'inline-flex']).toContain(
      await privateReview.locator('.clean-edit-step-meta').evaluate((element) => getComputedStyle(element).display),
    )
    await setViewport(page, 700)
    expect(await privateReview.locator('.clean-edit-step-header').evaluate((element) => getComputedStyle(element).flexDirection)).toBe('column')
    await expectNoHorizontalOverflow(page)
    await setViewport(page, 1440)
    await expect(page.getByRole('button', { name: /^Load review$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Download MP4/i })).toBeDisabled()
    const revisionText = 'Make the opening calmer and update the edit plan before continuing.'
    await page.getByTestId('chat-composer-textarea').fill(revisionText)
    await page.getByTestId('chat-composer-send').click()

    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: revisionText })).toBeVisible()
    const revisionResponse = page.locator('article[data-message-type="assistant_revision_response"]')
    await expect(revisionResponse).toBeVisible()
    await expect(revisionResponse).toHaveAttribute('data-role', 'assistant')
    await expect(revisionResponse).toContainText(/create a fresh plan before any credits are approved/i)
    expect(await revisionResponse.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    await expect(page.getByText(/previous private review stays as context only/i)).toBeVisible()
    await expect(page.getByTestId('private-review')).toHaveCount(0)
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'planning')
    await expect(page.getByTestId('planning-preparation')).toBeVisible()
    await expect(page.getByTestId('editor-page')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth|qwen|deepseek/i)

    const revisionInvalidatedHandoff = (await readE2EHandoffs(page))
      .find((handoff) => handoff.editName === editName)

    expect(revisionInvalidatedHandoff).toMatchObject({ stage: 'source_uploaded' })
    expect(revisionInvalidatedHandoff?.approvedSnapshotId).toBeUndefined()
    expect(revisionInvalidatedHandoff?.privateReview).toBeUndefined()
    expect(revisionInvalidatedHandoff?.revisionPlanContext).toMatchObject({
      contextOnly: true,
      freshPlanRequired: true,
      freshPrivateReviewRequired: true,
      request: revisionText,
    })
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
  })

  test('recovers a project detail page from saved edit handoff state', async ({ page }) => {
    const projectId = `recovered-project-${Date.now()}`
    const editSessionId = `${projectId}-edit-1`
    const now = new Date().toISOString()

    await page.addInitScript(({ editSessionId, handoffStorageKey, now, projectId, projectStorageKey, scope, scopeFingerprint }) => {
      window.localStorage.removeItem(projectStorageKey)
      window.localStorage.setItem(handoffStorageKey, JSON.stringify({
        recordVersion: 2,
        scope,
        scopeFingerprint,
        handoffs: [{
          id: editSessionId,
          workspaceId: scope.workspaceId,
          projectId,
          editSessionId,
          projectName: 'Recovered Project',
          editName: 'Recovered Edit',
          category: 'business_brand',
          editorPath: `/projects/${projectId}/edits/${editSessionId}?category=business_brand`,
          stage: 'created',
          sourceFileCount: 0,
          createdAt: now,
          updatedAt: now,
          persistence: 'browser_local_internal_testing',
        }],
        savedAt: now,
      }))
    }, {
      editSessionId,
      handoffStorageKey: e2eHandoffStorageKey,
      now,
      projectId,
      projectStorageKey: e2eProjectStorageKey,
      scope: e2eProjectScope,
      scopeFingerprint: e2eProjectScopeFingerprint,
    })

    await gotoRoute(page, `/projects/${projectId}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Recovered Project' })).toBeVisible()
    await expect(page.getByTestId('project-edit-list')).toContainText(/Recovered Edit/i)
    await expect(page.getByTestId('project-edit-list')).toContainText(/Source needed/i)

    await expect.poll(async () => {
      const projects = await readE2EProjects(page)
      const project = projects.find((item) => item.id === projectId)
      return project ? `${project.name}:${project.category}` : undefined
    }).toBe('Recovered Project:business_brand')

    await clickWhenReady(page.getByRole('link', { name: /^Upload source$/i }).first())
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/edits/${editSessionId}`))
    await expect(page.getByTestId('editor-header')).toContainText(/Recovered Edit/i)
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
    await expectNoHorizontalOverflow(page)
  })

  test('blocks approval through the guarded E2E failure path without starting progress', async ({ page }) => {
    // This query flag is honored only in dev/E2E mode and adds no visible debug control.
    await completeEditorSetup(page, '/editor?qaApprovalFailure=1')
    await expectNoGenerationBeforeApproval(page)
    await clickWhenReady(page.getByTestId('plan-review-approve'))

    const errorMessage = page.getByTestId('approval-error-message')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/Approval is blocked until one setup item is resolved/i)
    await expect(errorMessage).toContainText(/No credits were approved or used/i)
    await expectNoGenerationBeforeApproval(page)
    await expect(page.getByTestId('editor-header')).toContainText(/Needs attention/i)
    await expect(page.getByTestId('editor-header')).not.toContainText(/Plan \+ credits approved/i)
    await expect(page.getByText(/credits used|credits deducted|spent credits/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectMessageLabelsNotOvercrowded(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('supports source sequence interactions without layout overflow', async ({ page }) => {
    await gotoEditor(page)

    const sourceCard = page.getByTestId('source-sequence-card')
    await expect(sourceCard).toBeVisible()
    await expectCardWithinComposerRail(page, sourceCard, 'source sequence card')
    await expectChatCardNotTooWide(page, sourceCard, 'source sequence card')
    await expect(page.getByRole('button', { name: /Add mock clip/i })).toHaveCount(0)
    await expectCardActionsReachable(page, sourceCard.getByRole('button', { name: /^Add clip$/i }), 'source add clip action')
    await clickWhenReady(sourceCard.getByRole('button', { name: /^Add clip$/i }))

    await sourceCard.getByLabel(/Notes for ReeditPro/i).first().fill('Long QA note for browser layout wrapping and source context stability.')
    await sourceCard.locator('.source-clip-flags').getByLabel(/Important/i).first().check()
    await sourceCard.locator('.source-clip-flags').getByLabel(/Optional/i).first().check()

    const moveLater = sourceCard.getByRole('button', { name: /Move .* later in source order/i }).first()
    if (await moveLater.isEnabled()) {
      await moveLater.click()
    }

    const removeButtons = sourceCard.getByRole('button', { name: /Remove /i })
    if (await removeButtons.count() > 1) {
      await removeButtons.last().click()
    }

    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('supports reference URL, attach, and focus controls safely', async ({ page }) => {
    await gotoEditor(page)
    await uploadEditorSourceFile(page, 'reference-control-source.mp4')
    await clickWhenReady(page.getByRole('button', { name: /Use this source|Confirm order/i }))
    await clickWhenReady(page.getByTestId('output-frame-control').getByRole('radio', { name: /9:16/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm frame/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm cleanup/i }))
    await clickWhenReady(page.getByRole('button', { name: /Use (Normal|Premium|Ultra Premium)/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm direction/i }))

    const referenceCard = page.getByTestId('reference-control')
    await referenceCard.scrollIntoViewIfNeeded()
    await expect(referenceCard).toBeVisible()
    await expectCardWithinComposerRail(page, referenceCard, 'reference card')
    await expectChatCardNotTooWide(page, referenceCard, 'reference card')
    await referenceCard.getByLabel(/Public reference link/i).fill('https://example.com/reference/very-long-path-that-should-wrap-without-horizontal-overflow-or-breaking-the-editor-canvas')
    await referenceCard.getByRole('button', { name: /Pacing/i }).click()
    await expectCardActionsReachable(page, referenceCard.getByRole('button', { name: /Use reference|Reference attached/i }).first(), 'reference attach action')
    await clickWhenReady(referenceCard.getByRole('button', { name: /Use reference|Reference attached/i }).first())
    await expect(page.getByTestId('planning-preparation')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('planning-preparation'), 'the attached reference should survive a direct reload').toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps the retired advanced timeline out of the clean named-edit plan review', async ({ page }) => {
    await completeEditorSetup(page)
    await findPlanReview(page)

    await expect(page.getByTestId('timeline-open-trigger')).toHaveCount(0)
    await expect(page.getByTestId('timeline-drawer')).toHaveCount(0)
    await expect(page.getByTestId('editor-header-edit-brief')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectNoCardHorizontalOverflow(page)
  })
})
