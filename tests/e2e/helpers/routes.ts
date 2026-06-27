import { expect, type Locator, type Page } from '@playwright/test'
import { expectFloatingComposerAligned, expectNoHorizontalOverflow } from './layout'

export const viewportWidths = [1024, 1280, 1440, 1728, 1920] as const

export const checkedRoutes = [
  { path: '/', label: 'landing' },
  { path: '/dashboard', label: 'dashboard' },
  { path: '/projects', label: 'projects' },
  { path: '/projects/new', label: 'projects-new' },
  { path: '/editor', label: 'editor' },
  { path: '/wallet', label: 'wallet' },
  { path: '/pricing', label: 'pricing' },
  { path: '/brand-kit', label: 'brand-kit' },
  { path: '/exports', label: 'exports' },
] as const

export async function gotoRoute(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
  await page.locator('body').waitFor({ state: 'visible' })
}

export async function gotoEditor(page: Page, path = '/editor') {
  await gotoRoute(page, path)
  await expect(page.getByTestId('editor-page')).toBeVisible()
  await expect(page.getByTestId('editor-header')).toBeVisible()
  await expect(page.getByTestId('chat-composer')).toBeVisible()
}

export async function clickWhenReady(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()
  await locator.click()
}

export async function findPlanReview(page: Page) {
  const card = page.getByTestId('plan-review-card')
  await card.scrollIntoViewIfNeeded()
  await expect(card).toBeVisible()
  await expect(page.getByTestId('plan-review-approve')).toBeVisible()
  return card
}

export async function expectNoGenerationBeforeApproval(page: Page) {
  await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
  await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
}

export async function completeEditorSetup(page: Page, path = '/editor') {
  await gotoEditor(page, path)

  await clickWhenReady(page.getByRole('button', { name: /Confirm source order|Use this as the full source video/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm output frame/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm (Preserve natural|Light cleanup|Balanced cleanup|Tight retention|Aggressive|Documentary faithful|Tutorial complete|Custom)/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Use this level/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Use this preference/i }).first())

  const intentButton = page.getByRole('button', { name: /Looks right/i }).first()
  if (await intentButton.count()) {
    await clickWhenReady(intentButton)
  }

  await findPlanReview(page)
  await expectNoHorizontalOverflow(page)
  await expectFloatingComposerAligned(page)
}

export async function openTimeline(page: Page) {
  const trigger = page.getByTestId('timeline-open-trigger')
  await clickWhenReady(trigger)
  await expect(page.getByTestId('timeline-drawer')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

export async function openSFXFlow(page: Page) {
  await clickWhenReady(page.getByRole('button', { name: /Plan SFX with SoundSync/i }).first())
  await expect(page.getByTestId('sfx-flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

export async function openMusicFlow(page: Page) {
  await clickWhenReady(page.getByRole('button', { name: /Plan music with SoundSync/i }).first())
  await expect(page.getByTestId('music-flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}
