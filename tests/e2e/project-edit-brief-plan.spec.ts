import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const projectPath = '/projects/mock-project-edit-chat-foundation'
const youtubeChatPath = `${projectPath}/edits/edit-session-youtube-wide`
const youtubeBriefPath = `${youtubeChatPath}/brief`
const needsAssetBriefPath = `${projectPath}/edits/edit-session-social-feed/brief`

test.describe('Project Edit Brief Plan Hints', () => {
  test('prepares mock plan hints without planner or runtime effects', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, youtubeBriefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    const qaSummary = page.getByTestId('project-edit-brief-qa-summary')
    await qaSummary.getByTestId('project-edit-brief-run-qa-button').click()
    await expect(qaSummary.getByTestId('project-edit-brief-qa-status')).toContainText('Brief QA complete')

    const planPanel = page.getByTestId('project-edit-brief-plan-bridge')
    await expect(planPanel).toBeVisible()
    await expect(planPanel).toContainText('Brief Plan Hints')
    await expect(planPanel.getByTestId('project-edit-brief-plan-boundary')).toContainText('do not start editing')
    await planPanel.getByTestId('project-edit-brief-plan-prepare-button').click()

    await expect(planPanel.getByTestId('project-edit-brief-plan-status')).toContainText('Prepared')
    await expect(planPanel.getByTestId('project-edit-brief-plan-readiness')).toContainText(/eligible|warnings|blocked/i)
    await expect(planPanel.getByTestId('project-edit-brief-plan-instruction-list')).toBeVisible()
    await expect(planPanel.getByTestId('project-edit-brief-plan-instruction-card').first()).toContainText(/music|soundtrack|hint/i)
    await expect(planPanel.getByTestId('project-edit-brief-plan-application-log')).toContainText('Prepared')
    await expect(planPanel).toContainText('Priority policy')
    await expect(planPanel).toContainText('Export settings')

    await page.getByTestId('edit-session-route-tab-chat').click()
    await expect(page).toHaveURL(new RegExp(`${youtubeChatPath}/chat$`))
    await expect(page.getByTestId('edit-session-chat-input')).toBeVisible()

    await expect(page.getByText(/Run planner|Generate final edit|Render edit|Spend credits/i)).toHaveCount(0)
    await expect(page.getByText(/planner executed|edit plan created|provider call made|render job created|credit reserved|media processing started/i)).toHaveCount(0)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('shows skipped marker reasons for missing asset markers', async ({ page }) => {
    await setViewport(page, 1366)
    await gotoRoute(page, needsAssetBriefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    const planPanel = page.getByTestId('project-edit-brief-plan-bridge')
    await planPanel.getByTestId('project-edit-brief-plan-prepare-button').click()

    await expect(planPanel.getByTestId('project-edit-brief-plan-status')).toContainText('Prepared')
    await expect(planPanel.getByTestId('project-edit-brief-plan-skipped-list')).toContainText(/needs asset|Required asset metadata is missing|Marker QA status is needs_asset/i)
    await expect(planPanel.getByTestId('project-edit-brief-plan-application-log')).toContainText('Skipped')
    await expect(planPanel.getByTestId('project-edit-brief-plan-boundary')).toContainText('mock/local structured instructions only')
    await expect(page.getByText(/upload started|file bytes read|external url fetched|media processing started|render started|credit reserved/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
