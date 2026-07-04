import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const projectPath = '/projects/mock-project-edit-chat-foundation'
const youtubeBriefPath = `${projectPath}/edits/edit-session-youtube-wide/brief`
const needsAssetBriefPath = `${projectPath}/edits/edit-session-social-feed/brief`

test.describe('Project Edit Brief Marker QA', () => {
  test('runs mock Brief QA and selected marker QA without runtime effects', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, youtubeBriefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    const qaSummary = page.getByTestId('project-edit-brief-qa-summary')
    await expect(qaSummary).toBeVisible()
    await expect(qaSummary.getByTestId('project-edit-brief-qa-boundary')).toContainText('does not call Qwen')
    await qaSummary.getByTestId('project-edit-brief-run-qa-button').click()
    await expect(qaSummary.getByTestId('project-edit-brief-qa-status')).toContainText('Brief QA complete')
    await expect(qaSummary).toContainText(/Readiness|Ready|warning|blocked/i)

    await page.getByTestId('project-edit-brief-marker-pill-marker-calm-soundtrack').click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toBeVisible()
    const markerQA = page.getByTestId('project-edit-brief-marker-qa-panel')
    await expect(markerQA).toBeVisible()
    await markerQA.getByTestId('project-edit-brief-run-qa-button').click()
    await expect(markerQA.getByTestId('project-edit-brief-marker-qa-status')).toContainText('Marker QA complete')
    await expect(markerQA.getByTestId('project-edit-brief-qa-findings')).toBeVisible()
    await expect(markerQA.getByTestId('project-edit-brief-conflict-list')).toBeVisible()

    await expect(page.getByText(/Qwen call made|DeepSeek call made|provider call made|render job created|credit reserved|media processing started|planner application started/i)).toHaveCount(0)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('shows missing asset QA on a fixture marker', async ({ page }) => {
    await setViewport(page, 1366)
    await gotoRoute(page, needsAssetBriefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-pill-marker-broll-needed').click()
    const markerQA = page.getByTestId('project-edit-brief-marker-qa-panel')
    await expect(markerQA).toBeVisible()
    await markerQA.getByTestId('project-edit-brief-run-qa-button').click()

    await expect(markerQA).toContainText(/B-roll asset metadata missing|needs asset/i)
    await expect(markerQA).toContainText('Attach metadata')
    await expect(markerQA.getByTestId('project-edit-brief-qa-boundary')).toContainText('does not call Qwen')
    await expect(page.getByText(/upload started|file bytes read|external url fetched|media processing started|sound runtime started|render started|credit reserved/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
