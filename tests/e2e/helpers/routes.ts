import { Buffer } from 'node:buffer'
import { expect, type Locator, type Page } from '@playwright/test'
import { expectFloatingComposerAligned, expectNoHorizontalOverflow } from './layout'

export const viewportWidths = [1024, 1280, 1440, 1728, 1920] as const
const EDITOR_READY_TIMEOUT_MS = 15_000

export const checkedRoutes = [
  { path: '/', label: 'landing' },
  { path: '/sign-in', label: 'sign-in' },
  { path: '/dashboard', label: 'dashboard' },
  { path: '/projects', label: 'projects' },
  { path: '/projects/new', label: 'projects-new' },
  { path: '/preferences', label: 'preferences' },
  { path: '/editor', label: 'editor' },
] as const

export const legacyRedirectRoutes = [
  { path: '/wallet', expectedPath: '/preferences', label: 'wallet-to-preferences' },
  { path: '/pricing', expectedPath: '/projects', label: 'pricing-to-projects' },
  { path: '/brand-kit', expectedPath: '/preferences', label: 'brand-kit-to-preferences' },
  { path: '/exports', expectedPath: '/projects', label: 'exports-to-projects' },
  { path: '/upload', expectedPath: '/projects/new', label: 'upload-to-new-project' },
  { path: '/edit-preferences', expectedPath: '/preferences', label: 'edit-preferences-to-preferences' },
  { path: '/settings', expectedPath: '/preferences', label: 'settings-to-preferences' },
  { path: '/app', expectedPath: '/dashboard', label: 'app-to-dashboard' },
] as const

const INTERNAL_TOOL_NAME_PATTERN =
  /\blibrosa\b|\baudioread\b|\bpydub\b|\bscipy\b|\bresampy\b|\bpyloudnorm\b|\baudioflux\b|\bmusic21\b|\bpretty_midi\b|\bmido\b|\bnoisereduce\b|\bpedalboard\b|\bmir_eval\b|\bpydub_effects\b|\bebu_r128_pyloudnorm\b|\bd3\b|\becharts\b|\bvega_lite\b|\bvega\b|\bsatori\b|\bsvg_js\b|\bviz_js\b|\blottie_web\b|\banimejs\b|\bthree_js\b|\bbabylonjs\b|\bbabylon_js\b|\bpixi_js\b|\bpixijs\b|\bkonva\b|\btorch_torchvision\b|\btransformers\b|\bsam2\b|\bbirefnet\b|\brembg\b|\btransparent_background\b|\breal_esrgan\b|\bkornia\b|\bffmpeg\b|\bffprobe\b|\bgpac\b|\bmp4box\b|\bmkvtoolnix\b|\bgstreamer\b|\bstreamer_render_pipeline_support\b|\bmkvtoolnix_container_validation\b|\bgpac_mp4box_packaging_validation\b|\bopencolorio\b|\bopenimageio\b|\bVisualExplain\b|\bStroke Motion\b|\bReal Motion\b|\bSoundSync\b/i

export async function expectNoInternalToolNamesInEditor(page: Page) {
  await expect(page.getByTestId('editor-page')).not.toContainText(INTERNAL_TOOL_NAME_PATTERN)
}

export async function expandVisibleEditorDetailsAndExpectNoInternalToolNames(page: Page) {
  const summaries = page.getByTestId('editor-page').locator('details > summary')
  const count = await summaries.count()

  for (let index = 0; index < count; index += 1) {
    const summary = summaries.nth(index)
    if (!(await summary.isVisible())) continue

    const alreadyOpen = await summary.evaluate((node) => {
      const details = node.parentElement as HTMLDetailsElement | null
      return Boolean(details?.open)
    })

    if (!alreadyOpen) {
      await summary.scrollIntoViewIfNeeded()
      await summary.click()
    }
  }

  await expectNoInternalToolNamesInEditor(page)
}

export async function gotoRoute(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
  await page.locator('body').waitFor({ state: 'visible' })

  if (isProtectedAppPath(path)) {
    await page.waitForFunction(() => Boolean(
      document.querySelector('[data-testid="app-shell"]')
      || document.querySelector('[data-testid="local-test-sign-in"]'),
    ), undefined, { timeout: EDITOR_READY_TIMEOUT_MS })

    const localTestEntry = page.getByTestId('local-test-sign-in')
    if (await localTestEntry.count()) {
      await expect(localTestEntry).toBeVisible()
      await localTestEntry.click()
      await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
    }
  }
}

function isProtectedAppPath(path: string): boolean {
  const pathname = new URL(path, 'http://reeditpro-e2e.local').pathname
  return pathname !== '/' && pathname !== '/sign-in'
}

function isolatedEditorPath(path: string) {
  const url = new URL(path, 'http://reeditpro-e2e.local')
  if (url.pathname !== '/editor') return path

  const uniqueId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`
  if (!url.searchParams.has('projectId')) {
    url.searchParams.set('projectId', `${uniqueId}-project`)
  }
  if (!url.searchParams.has('editSessionId')) {
    url.searchParams.set('editSessionId', `${uniqueId}-edit`)
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export async function gotoEditor(page: Page, path = '/editor') {
  await gotoRoute(page, isolatedEditorPath(path))
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('editor-header')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('chat-composer')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
}

export async function clickWhenReady(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()
  await locator.click()
}

export async function findPlanReview(page: Page) {
  const checkpoint = page.getByTestId('plan-approval-checkpoint')
  const legacyCard = page.getByTestId('plan-review-card')
  const card = await checkpoint.count() ? checkpoint : legacyCard
  await card.scrollIntoViewIfNeeded()
  await expect(card).toBeVisible()
  await expect(page.getByTestId('plan-review-approve')).toBeVisible()
  return card
}

export async function expectNoGenerationBeforeApproval(page: Page) {
  await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
  await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
  await expect(page.getByTestId('editor-processing')).toHaveCount(0)
  await expect(page.getByTestId('private-review')).toHaveCount(0)
}

export async function uploadEditorSourceFile(page: Page, fileName = 'e2e-source-story.mp4') {
  const cleanSource = page.getByTestId('source-summary')
  const legacySource = page.getByTestId('source-sequence-card')
  const sourceCard = await cleanSource.count() ? cleanSource : legacySource
  await expect(sourceCard).toBeVisible()
  await sourceCard.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'video/mp4',
    buffer: Buffer.from(`mock-safe uploaded source video bytes for ${fileName}`),
  })
  await expect(sourceCard).toContainText(fileName, { timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(sourceCard).toContainText(/File uploaded to private source storage|Source file uploaded|Source file planned/i)
}

export async function uploadEditorGateSourceVideo(page: Page, fileName = 'e2e-source-story.mp4') {
  const gate = page.getByTestId('edit-upload-gate')
  await expect(gate).toBeVisible()
  await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
  await page.getByTestId('edit-upload-gate-input').setInputFiles({
    name: fileName,
    mimeType: 'video/mp4',
    buffer: Buffer.from(`mock-safe uploaded source video bytes for ${fileName}`),
  })

  const cleanSource = page.getByTestId('source-summary')
  const legacySource = page.getByTestId('source-sequence-card')
  await expect(cleanSource.or(legacySource)).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  const sourceCard = await cleanSource.count() ? cleanSource : legacySource
  await expect(sourceCard).toContainText(fileName, { timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
}

export async function createPlanFromUploadedEditorSources(page: Page) {
  await completeRequiredEditorSetupBeforeFootagePrep(page)
  await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
  await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible()

  if (await page.getByTestId('planning-preparation').count()) {
    await expect(page.getByTestId('planning-preparation')).toContainText(/Ready to create the plan/i)
    await expect(page.getByTestId('plan-approval-checkpoint')).toHaveCount(0)
    await expect(page.getByTestId('edit-brief-panel')).toHaveCount(0)
    await expect(page.getByTestId('editor-header-edit-brief')).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
    await expect(page.getByTestId('plan-approval-checkpoint')).toBeVisible()
    await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
    await expectNoInternalToolNamesInEditor(page)
    await findPlanReview(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    return
  }

  await expect(page.getByTestId('edit-workspace-progress-card')).toContainText(/Prepare the edit plan/i)
  await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
  await expect(page.getByTestId('edit-brief-panel')).toHaveCount(0)
  await expect(page.getByTestId('editor-header-edit-brief')).toBeVisible()
  await expect(page.getByText(/No Edit Brief added/i)).toBeVisible()
  await expect(page.getByText(/create the edit plan from the prompt and source context/i)).toBeVisible()
  await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
  await findPlanReview(page)
  await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
  await expect(page.getByTestId('plan-review-approval-summary')).toContainText(/What I understood/i)
  await expect(page.getByTestId('plan-review-decision-summary')).toContainText(/Visual explanation|Premium motion|Sound design|Story animation|Clean source edit/i)
  await expect(page.getByTestId('plan-review-card')).not.toContainText(/\b(Qwen|DeepSeek|GPT-Image-2|Wan|Hailuo|Veo|Mirelo|MMAudio|Lyria)\b/i)
  await expectNoInternalToolNamesInEditor(page)

  await findPlanReview(page)
  await expectNoHorizontalOverflow(page)
  await expectFloatingComposerAligned(page)
}

export async function completeRequiredEditorSetupBeforeFootagePrep(page: Page) {
  if (await page.getByTestId('source-summary').count()) {
    await clickWhenReady(page.getByRole('button', { name: /Use this source|Confirm order/i }))
    const outputFrame = page.getByTestId('output-frame-control')
    await expect(outputFrame).toBeVisible()
    await clickWhenReady(outputFrame.getByRole('radio', { name: /9:16/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm frame/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm cleanup/i }))
    await clickWhenReady(page.getByRole('button', { name: /Use (Normal|Premium|Ultra Premium)/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm direction/i }))
    await clickWhenReady(page.getByRole('button', { name: /Skip reference/i }))
    return
  }

  await clickWhenReady(page.getByRole('button', { name: /Confirm source order|Use this as the full source video/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm output frame/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm (Preserve natural|Light cleanup|Balanced cleanup|Tight retention|Aggressive|Documentary faithful|Tutorial complete|Custom)/i }).first())
  await clickOptionalSetupAction(page.getByRole('button', { name: /Use this level/i }).first())
  await clickOptionalSetupAction(page.getByRole('button', { name: /Use this preference/i }).first())

  const intentButton = page.getByRole('button', { name: /Looks right/i }).first()
  if (await intentButton.count()) {
    await clickWhenReady(intentButton)
  }
}

async function clickOptionalSetupAction(locator: Locator) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 7_500 })
  } catch {
    return
  }

  await clickWhenReady(locator)
}

export async function completeEditorSetup(page: Page, path = '/editor') {
  await gotoEditor(page, path)
  await uploadEditorSourceFile(page)
  await createPlanFromUploadedEditorSources(page)
}

export async function openTimeline(page: Page) {
  const trigger = page.getByTestId('timeline-open-trigger')
  await clickWhenReady(trigger)
  await expect(page.getByTestId('timeline-drawer')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

export async function openSFXFlow(page: Page) {
  await clickWhenReady(page.getByRole('button', { name: /Plan sound effects/i }).first())
  await expect(page.getByTestId('sfx-flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

export async function openMusicFlow(page: Page) {
  await clickWhenReady(page.getByRole('button', { name: /^Plan music$/i }).first())
  await expect(page.getByTestId('music-flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}
