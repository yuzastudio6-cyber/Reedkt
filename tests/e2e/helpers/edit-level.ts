import { expect, type Page } from '@playwright/test'
import { clickWhenReady, gotoEditor } from './routes'

export async function openEditorEditLevelSetup(page: Page) {
  await gotoEditor(page)
  await clickWhenReady(page.getByRole('button', { name: /Confirm source order|Use this as the full source video/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm output frame/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm (Preserve natural|Light cleanup|Balanced cleanup|Tight retention|Aggressive|Documentary faithful|Tutorial complete|Custom)/i }).first())

  const editLevelCard = page.getByTestId('edit-level-inline-card')
  await editLevelCard.scrollIntoViewIfNeeded()
  await expect(editLevelCard).toBeVisible()
  return editLevelCard
}
