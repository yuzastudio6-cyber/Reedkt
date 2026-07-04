import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

test.describe('Project Edit Brief marker flow', () => {
  test('creates, updates, confirms, and archives a mock/local marker', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-boundary')).toContainText('marker metadata editing is browser-safe')
    const markerLane = page.getByTestId('project-edit-brief-marker-lane')
    await markerLane.scrollIntoViewIfNeeded()
    const laneBox = await markerLane.boundingBox()
    expect(laneBox).not.toBeNull()
    await page.getByTestId('project-edit-brief-marker-lane').click({
      position: {
        x: Math.floor(laneBox!.width * 0.92),
        y: Math.floor(laneBox!.height * 0.84),
      },
    })
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Playhead moved')

    await page.getByRole('button', { name: /Add Marker/i }).click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toContainText('Add marker')
    await expect(page.getByTestId('project-edit-brief-attachment-panel')).toContainText('Save this marker before adding metadata-only')
    await expect(page.getByTestId('project-edit-brief-marker-qa-panel')).toContainText('Select or save a marker to run QA')
    await expect(page.getByTestId('project-edit-brief-marker-qa-panel')).toContainText('deterministic mock/local metadata only')

    await page.getByTestId('project-edit-brief-marker-type-picker').selectOption('broll')
    await page.getByTestId('project-edit-brief-marker-priority-picker').selectOption('must_follow')
    await page.getByTestId('project-edit-brief-marker-title-input').fill('Product cutaway RP06')
    await page.getByTestId('project-edit-brief-marker-note-input').fill('Add a future product cutaway here; this is mock/local marker metadata only.')
    await page.getByRole('button', { name: /Save marker/i }).click()

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker created in mock/local metadata')
    await expect(page.getByRole('button', { name: /Product cutaway RP06/i })).toBeVisible()

    await page.getByRole('button', { name: /Product cutaway RP06/i }).click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toContainText('Edit Marker')
    await expect(page.getByTestId('project-edit-brief-marker-chat-panel')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-note-input').fill('Updated marker note from the RP-EDITBRIEF-06 drawer.')
    await page.getByRole('button', { name: /Save update/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker update saved in mock/local metadata')
    await expect(page.getByTestId('project-edit-brief-marker-detail')).toContainText('Updated marker note from the RP-EDITBRIEF-06 drawer.')

    await page.getByRole('button', { name: /Confirm marker/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker confirmed in mock/local metadata')
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toContainText('Confirmed')

    await page.getByRole('button', { name: /^Archive$/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker archived in mock/local metadata')
    await expect(page.getByRole('button', { name: /Product cutaway RP06/i })).toHaveCount(0)

    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/credit reserved|render started|provider call made|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
