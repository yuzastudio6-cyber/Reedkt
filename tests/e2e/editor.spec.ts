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
  openTimeline,
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

  test('shows the clean app shell with only home, projects, and preferences', async ({ page }) => {
    await gotoRoute(page, '/dashboard')

    await expect(page.getByTestId('testing-home-hero')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Create your first project/i })).toBeVisible()
    await expect(page.getByText(/exact plan and credit estimate before any editing begins/i)).toBeVisible()

    const sidebarLinks = page.getByTestId('app-sidebar').getByRole('link')
    await expect(sidebarLinks).toHaveCount(3)
    await expect(sidebarLinks.nth(0)).toContainText('Home')
    await expect(sidebarLinks.nth(1)).toContainText('Projects')
    await expect(sidebarLinks.nth(2)).toHaveText('Edit Preferences')

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

  test('shows a clean internal testing connection readback in preferences', async ({ page }) => {
    await gotoRoute(page, '/preferences?internalTesting=1')

    const readinessCard = page.getByTestId('internal-testing-readiness-card')
    await expect(readinessCard).toBeHidden()
    await page.getByTestId('internal-testing-details-summary').click()
    await expect(readinessCard).toBeVisible()
    await expect(readinessCard).toContainText(/Testing connection/i)
    await expect(readinessCard).toContainText(/Supabase sign-in/i)
    await expect(readinessCard).toContainText(/API connection/i)
    await expect(readinessCard).toContainText(/Project and upload routes/i)
    await expect(readinessCard).toContainText(/Safety gates/i)
    await expect(readinessCard).toContainText(/Session check/i)
    await expect(readinessCard).toContainText(/A local test session is active/i)
    await expect(readinessCard).toContainText(/Live backend check/i)
    await expect(readinessCard).toContainText(/Connection check is waiting for setup/i)
    await expect(readinessCard).toContainText(/Public sharing, billing, and heavy execution stay off/i)
    await expect(readinessCard).not.toContainText(/service[-_ ]?role|signed URL|production ready|VITE_|SUPABASE_/i)
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

    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
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
    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
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

  test('saves edit preferences and seeds a new project edit from them', async ({ page }) => {
    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preferences-form')).toBeVisible()
    await page.getByTestId('preference-edit-level').selectOption('basic')
    await page.getByTestId('preference-workflow').selectOption('product_demo')
    await page.getByTestId('preference-cleanup').selectOption('light_cleanup')
    await page.getByTestId('preference-visual-direction').selectOption('no_extra_visuals')
    await page.getByTestId('preference-mood').selectOption('educational')
    await page.getByTestId('preference-credit-posture').selectOption('low_credit_cost')
    await page.getByTestId('preference-preferred-destination').selectOption('youtube')
    await clickWhenReady(page.getByRole('button', { name: /^Save defaults$/i }))
    await expect(page.getByText(/Edit Preferences saved for this signed-in test workspace/i)).toBeVisible()

    await gotoRoute(page, '/projects/new')
    const projectName = `E2E preferences ${Date.now()}`
    const editName = 'Preference seeded edit'
    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)
    await expect(page.getByText(/Normal \/ Light cleanup \/ No extra visuals/i)).toBeVisible()

    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
    await page.getByLabel(/Edit name/i).fill(editName)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await expect(page.getByTestId('editor-page')).toBeVisible()

    const savedEditSetup = (await readE2EHandoffs(page)).find((handoff) => handoff.editName === editName)?.setup

    expect(savedEditSetup).toMatchObject({
      editLevel: 'basic',
      editLevelConfirmed: true,
      workflowType: 'product_demo',
      cleanupPreference: 'light_cleanup',
      cleanupPreferenceConfirmed: true,
      visualPreference: 'no_extra_visuals',
      visualPreferenceConfirmed: true,
      moodStyle: 'educational',
      creditPreference: 'low_credit_cost',
      targetPlatform: 'youtube',
      preferenceDefaultsApplied: true,
    })

    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await uploadEditorGateSourceVideo(page, 'preference-seeded-source.mp4')
    await createPlanFromUploadedEditorSources(page)
    await expect(page.getByTestId('plan-review-card')).toBeVisible()

    await clickWhenReady(page.getByRole('button', { name: /^Revise setup$/i }).first())
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'frame')
    await expect(page.getByRole('button', { name: /Confirm frame/i })).toBeVisible()

    const invalidatedEditSetup = (await readE2EHandoffs(page)).find((handoff) => handoff.editName === editName)

    expect(invalidatedEditSetup).toMatchObject({
      stage: 'source_uploaded',
      setup: {
        aspectRatioConfirmed: false,
        cleanupPreferenceConfirmed: false,
        editLevelConfirmed: false,
        visualPreferenceConfirmed: false,
      },
    })
    expect(invalidatedEditSetup?.approvedSnapshotId).toBeUndefined()
    expect(invalidatedEditSetup?.privateReview).toBeUndefined()
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
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
    await expect(page.getByRole('button', { name: /Confirm output frame/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /1:1.*Square social/i })).toHaveAttribute('aria-pressed', 'true')
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('approves the mocked plan before progress and preview appear', async ({ page }) => {
    await completeEditorSetup(page)

    await expectNoGenerationBeforeApproval(page)
    await expectLastContentReachableAboveComposer(page, page.getByTestId('plan-review-approve'), 'plan review approve action')
    await clickWhenReady(page.getByTestId('plan-review-approve'))

    await expect(page.getByTestId('generation-progress-card')).toBeVisible()
    await expect(page.getByText(/Plan approved\. I'm preparing the review edit/i)).toBeVisible()
    await expect(page.getByTestId('preview-ready-card')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('preview-ready-card')).toContainText(/Private review is ready/i)
    await expect(page.getByTestId('preview-ready-card')).toContainText(/Review built from/i)
    await expect(page.getByTestId('preview-ready-card')).not.toContainText(/Property details/i)
    await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible()
    await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review edit ready/i)
    await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Sharing and billing remain off/i)
    await expect(page.getByTestId('generation-progress-card')).toContainText(/Approved plan:/i)
    await expect(page.getByTestId('generation-progress-card')).not.toContainText(/Approved snapshot|manifest assets|work items|backend approval/i)
    await expect(page.getByTestId('private-review-preparation-status-card')).toBeVisible()
    await expect(page.getByTestId('private-review-preparation-status-card')).toContainText(/Preparation status/i)
    await expect(page.getByTestId('private-review-preparation-status-card')).toContainText(/Approved edit direction/i)
    await expect(page.getByTestId('private-review-preparation-status-card')).toContainText(/Why this direction was selected/i)
    await expect(page.getByTestId('private-review-preparation-status-card')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth/i)
    await clickWhenReady(page.getByRole('button', { name: /Open edit workspace/i }).first())
    await expect(page.getByTestId('edit-review-workspace')).toBeVisible()
    await expect(page.getByTestId('edit-review-direction-card')).toBeVisible()
    await expect(page.getByTestId('edit-review-direction-card')).toContainText(/Approved edit direction/i)
    await expect(page.getByTestId('edit-review-direction-card')).toContainText(/Review record|Decision|Direction source/i)
    await expect(page.getByTestId('edit-review-direction-card')).toContainText(/Why this direction is attached/i)
    await expect(page.getByTestId('edit-review-direction-card')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth|Qwen|DeepSeek/i)
    await expect(page.getByTestId('revision-direction-trace-card')).toBeVisible()
    await expect(page.getByTestId('revision-direction-trace-card')).toContainText(/Revision keeps the approved direction/i)
    await expect(page.getByTestId('revision-direction-trace-card')).toContainText(/fresh approval and private review/i)
    await expect(page.getByTestId('revision-direction-trace-card')).toContainText(/What stays attached/i)
    await expect(page.getByTestId('revision-direction-trace-card')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth|Qwen|DeepSeek/i)
    await expect(page.getByRole('button', { name: /Load review video/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Download MP4/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Download review record/i })).toBeDisabled()
    await expectLastContentReachableAboveComposer(page, page.getByTestId('preview-ready-card'), 'preview ready card')
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatCardNotTooWide(page, page.getByTestId('plan-review-card'), 'plan review card')
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

    await expect(page.getByTestId('preview-ready-card')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('preview-ready-card')).toContainText(/Private review is ready/i)
    await expect(page.getByTestId('preview-ready-card')).toContainText(/Review built from/i)
    await expect(page.getByTestId('preview-ready-card')).not.toContainText(/Property details/i)
    await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible()
    await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review edit ready/i)
    await expect(page.getByTestId('private-review-preparation-status-card')).toBeVisible()
    await expect(page.getByTestId('private-review-preparation-status-card')).toContainText(/Approved edit direction/i)
    await expect(page.getByTestId('private-review-preparation-status-card')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth/i)
    await expect(page.getByRole('button', { name: /Load review video/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Download MP4/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Download review record/i })).toBeDisabled()
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

    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
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

    await page.getByLabel(/Project name/i).fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
    await page.getByLabel(/Edit name/i).fill(editName)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
    await uploadEditorGateSourceVideo(page, 'brief-ready-source.mp4')
    await expect(page.getByTestId('editor-header-edit-brief')).toHaveCount(0)
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
    await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible()

    const headerEditBrief = page.getByTestId('editor-header-edit-brief')
    await expect(headerEditBrief).toBeVisible()
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveCount(0)
    await clickWhenReady(headerEditBrief)
    await expect(page.getByTestId('edit-brief-panel')).toBeVisible()
    await expect(page.getByTestId('edit-brief-panel')).toContainText(/Skip this if the prompt already says enough/i)
    const briefGoalInput = page.getByTestId('edit-brief-goal-input')
    await expect(briefGoalInput).toBeFocused()
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveCount(0)
    await briefGoalInput.fill(briefGoal)
    await page.getByTestId('edit-brief-reference-urls').fill('https://example.com/approved-launch-reference')
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Draft')
    await clickWhenReady(page.getByTestId('edit-brief-mark-ready'))
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Ready')
    await expect(page.getByTestId('edit-brief-panel')).toContainText(/Ready to include as structured direction/i)

    const persistedBrief = (await readE2EHandoffs(page)).find((handoff) => handoff.editName === editName)?.editBriefState
    expect(persistedBrief?.editBrief).toMatchObject({
      goal: briefGoal,
      status: 'ready',
      userProvidedReferenceUrls: ['https://example.com/approved-launch-reference'],
    })

    await page.reload()
    await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
    await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
    await expect(page.getByTestId('edit-brief-goal-input')).toHaveValue(briefGoal)
    await expect(page.getByTestId('edit-brief-reference-urls')).toHaveValue('https://example.com/approved-launch-reference')
    await expect(page.getByTestId('editor-header-edit-brief-status')).toHaveText('Ready')

    await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await expect(page.getByTestId('plan-review-approval-summary')).toContainText(/What I understood/i)
    await expect(page.getByTestId('plan-review-card')).toContainText(/estimated credits/i)
    await clickWhenReady(page.getByTestId('plan-review-approve'))
    await expect(page.getByTestId('private-review')).toBeVisible({ timeout: 10_000 })
    await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
    await expect(page.getByTestId('edit-brief-locked')).toBeVisible()
    await expect(page.getByTestId('edit-brief-goal-input')).toBeDisabled()
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
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
    await expect(page.getByText(/No edits yet/i)).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
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
    await expect(page.getByTestId('edit-brief-panel')).toBeVisible()
    const focusedBriefGoal = page.getByTestId('edit-brief-goal-input')
    await expect(focusedBriefGoal).toBeFocused()
    await expect.poll(async () => {
      const [goalBox, composerBox] = await Promise.all([
        focusedBriefGoal.boundingBox(),
        page.getByTestId('chat-composer-surface').boundingBox(),
      ])
      return Boolean(goalBox && composerBox && goalBox.y + goalBox.height <= composerBox.y - 8)
    }).toBe(true)
    await expect(page.getByTestId('edit-brief-plan-impact')).toContainText(/Changes here require a fresh plan/i)
    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await page.getByTestId('edit-brief-goal-input').fill('Make this feel polished, concise, and ready for an internal product walkthrough.')
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'planning')
    await expect(page.getByText(/Planning inputs changed\. Create a new edit plan from the updated context before approval/i)).toBeVisible()

    const briefInvalidatedHandoff = (await readE2EHandoffs(page))
      .find((handoff) => handoff.editName === editName)

    expect(briefInvalidatedHandoff).toMatchObject({ stage: 'source_uploaded' })
    expect(briefInvalidatedHandoff?.approvedSnapshotId).toBeUndefined()
    expect(briefInvalidatedHandoff?.privateReview).toBeUndefined()
    await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await expect(page.getByTestId('plan-review-card')).not.toContainText(/couple starts happy|becomes pregnant|walks away and leaves her/i)
    await clickWhenReady(page.getByTestId('plan-review-approve'))

    await expect(page.getByTestId('private-review')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('private-review')).toContainText(/Review the edit/i)
    await expect(page.getByTestId('private-review')).toContainText(/Sharing and release remain gated/i)
    await expect(page.getByTestId('private-review')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth/i)
    await expect(page.getByRole('button', { name: /^Load review$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Download MP4/i })).toBeDisabled()
    const revisionText = 'Make the opening calmer and update the edit plan before continuing.'
    await page.getByTestId('chat-composer-textarea').fill(revisionText)
    await page.getByTestId('chat-composer-send').click()

    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: revisionText })).toBeVisible()
    await expect(page.getByText(/create a fresh plan before any credits are approved/i)).toBeVisible()
    await expect(page.getByText(/previous private review stays as context only/i)).toBeVisible()
    await expect(page.getByTestId('private-review')).toHaveCount(0)
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
    await completeRequiredEditorSetupBeforeFootagePrep(page)

    const referenceCard = page.getByTestId('reference-card')
    await referenceCard.scrollIntoViewIfNeeded()
    await expect(referenceCard).toBeVisible()
    await expectCardWithinComposerRail(page, referenceCard, 'reference card')
    await expectChatCardNotTooWide(page, referenceCard, 'reference card')
    await referenceCard.getByLabel(/Reference URL/i).fill('https://example.com/reference/very-long-path-that-should-wrap-without-horizontal-overflow-or-breaking-the-editor-canvas')
    await referenceCard.getByRole('button', { name: /Pacing/i }).click()
    await expectCardActionsReachable(page, referenceCard.getByRole('button', { name: /Use reference|Reference attached/i }).first(), 'reference attach action')
    await clickWhenReady(referenceCard.getByRole('button', { name: /Use reference|Reference attached/i }).first())
    await expect(page.getByText(/Reference: https:\/\/example\.com\/reference/i)).toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('opens and closes the advanced timeline inside the editor canvas', async ({ page }) => {
    await completeEditorSetup(page)
    await findPlanReview(page)
    await openTimeline(page)

    await expect(page.getByTestId('timeline-drawer').getByRole('heading', { name: /Layer timing/i }).first()).toBeVisible()
    await clickWhenReady(page.getByTestId('timeline-close'))
    await expect(page.getByTestId('timeline-drawer')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectNoCardHorizontalOverflow(page)
  })
})
