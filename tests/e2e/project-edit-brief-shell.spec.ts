import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const projectHomePath = '/projects/mock-project-edit-chat-foundation'
const markerChatPath = `${projectHomePath}/edits/edit-session-youtube-wide`
const briefPath = `${markerChatPath}/brief`

test.describe('Project Edit Brief shell', () => {
  test('opens the mock/local Brief route with video, timeline, marker detail, and boundaries', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, projectHomePath)

    await expect(page.getByTestId('project-edit-session-home')).toBeVisible()
    await expect(page.getByRole('button', { name: /Founder Story YouTube Cut/i })).toBeVisible()

    await gotoRoute(page, markerChatPath)
    await expect(page.getByTestId('edit-session-chat-page')).toBeVisible()
    await expect(page.getByTestId('edit-session-route-tab-brief')).toBeVisible()

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page).toHaveURL(new RegExp(`${briefPath}$`))
    await expect(page.getByTestId('edit-session-route-section-header')).toContainText('Brief')
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-header')).toContainText('Music Soundtrack Brief')
    await expect(page.getByTestId('project-edit-brief-boundary')).toContainText('Brief is mock/local; marker metadata editing is browser-safe')
    await expect(page.getByTestId('project-edit-brief-video-shell')).toContainText('Mock video shell only')
    await expect(page.getByTestId('project-edit-brief-timecode')).toContainText('/')
    await expect(page.getByTestId('project-edit-brief-timeline')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-timeline-ruler')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-lane')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-playhead')).toBeVisible()

    const marker = page.getByTestId('project-edit-brief-marker-pill-marker-calm-soundtrack')
    await expect(marker).toContainText('Calm optimistic bed')
    await marker.click()
    await expect(page.getByTestId('project-edit-brief-marker-detail')).toContainText('Calm optimistic bed')
    await expect(page.getByTestId('project-edit-brief-marker-detail')).toContainText('Structured intent')
    await expect(page.getByTestId('project-edit-brief-marker-detail')).toContainText('Marker Chat messages')
    await expect(page.getByTestId('project-edit-brief-marker-detail').getByTestId('project-edit-brief-attachment-chips')).toContainText('calm-soundtrack.mp3')
    await expect(page.getByTestId('project-edit-brief-export-settings')).toContainText(/Youtube Standard/i)
    await expect(page.getByTestId('project-edit-brief-export-settings')).toContainText('1920x1080')
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-chat-panel')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-chat-boundary')).toContainText('Marker Chat is mock/local')

    await page.getByTestId('edit-session-route-tab-chat').click()
    await expect(page).toHaveURL(new RegExp(`${markerChatPath}/chat$`))
    await expect(page.getByTestId('edit-session-chat-input')).toBeVisible()

    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/credit reserved|render started|provider call made|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('shows optional-not-opened empty state without creating markers', async ({ page }) => {
    await setViewport(page, 1280)
    await gotoRoute(page, `${projectHomePath}/edits/edit-session-vertical-dna/brief`)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-empty-state')).toContainText('Edit Brief has not been opened')
    await expect(page.getByTestId('project-edit-brief-empty-state')).toContainText('Add Marker requires an active mock Brief')
    await expect(page.getByTestId('project-edit-brief-marker-lane')).toBeVisible()
    await expect(page.locator('[data-testid^="project-edit-brief-marker-pill-"]')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-add-marker-disabled')).toContainText('Open an active mock Brief before adding markers')
    await expectNoHorizontalOverflow(page)
  })
})
