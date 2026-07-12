import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

test.describe('Project Edit Brief internal testing entrypoint', () => {
  test('keeps the retired internal testing console out of the active product', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/internal-testing')

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByTestId('home-flow-shell')).toBeVisible()
    await expect(page.getByTestId('internal-testing-page')).toHaveCount(0)
    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the controlled Edit Brief test route available directly', async ({ page }) => {
    await setViewport(page, 1280)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('edit-session-chat-page')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-boundary')).toContainText('mock/local')
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/credit reserved|render started|provider call made|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
