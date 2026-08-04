import { expect, test } from '@playwright/test'
import { completeEditorSetup, openMusicFlow } from './helpers/routes'

test('Music chat is a read-only canonical artifact projection', async ({ page }, testInfo) => {
  await completeEditorSetup(page)
  await openMusicFlow(page)

  const music = page.getByTestId('music-flow')
  await expect(music.getByText('Music department ready', { exact: true })).toBeVisible()
  await expect(music.getByText('Waiting for artifacts')).toBeVisible()
  await expect(music.getByText(/never simulates generation or QA/i)).toBeVisible()
  await expect(music.getByText(/No canonical Music plan has been published/i)).toBeVisible()
  await expect(music.getByRole('button', { name: /Approve music plan/i })).toHaveCount(0)
  await expect(music.getByText(/Music QA passed/i)).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('canonical-music-ui.png'), fullPage: true })
})
