import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

async function installBrowserVideoMetadataMock(page: Page) {
  await page.addInitScript(() => {
    type MockMediaState = {
      currentTime: number
      paused: boolean
    }

    const mediaState = new WeakMap<HTMLMediaElement, MockMediaState>()
    const getMediaState = (element: HTMLMediaElement): MockMediaState => {
      const existing = mediaState.get(element)
      if (existing) return existing
      const next = { currentTime: 0, paused: true }
      mediaState.set(element, next)
      return next
    }

    Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
      configurable: true,
      get() {
        return 12
      },
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get() {
        return getMediaState(this).currentTime
      },
      set(value: number) {
        getMediaState(this).currentTime = Number.isFinite(value) ? Math.max(0, Math.min(12, value)) : 0
        this.dispatchEvent(new Event('timeupdate', { bubbles: true }))
      },
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
      configurable: true,
      get() {
        return getMediaState(this).paused
      },
    })

    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      configurable: true,
      get() {
        return 1080
      },
    })

    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get() {
        return 1920
      },
    })

    HTMLMediaElement.prototype.play = async function play() {
      getMediaState(this).paused = false
      this.dispatchEvent(new Event('play', { bubbles: true }))
    }

    HTMLMediaElement.prototype.pause = function pause() {
      getMediaState(this).paused = true
      this.dispatchEvent(new Event('pause', { bubbles: true }))
    }
  })
}

test.describe('Project source video Brief playback', () => {
  test('uses local browser video metadata for preview, timeline, markers, and export recommendations', async ({ page }) => {
    await installBrowserVideoMetadataMock(page)
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-source-video-picker')).toContainText('Local browser preview only')
    await expect(page.locator('input[type="file"]:enabled')).toHaveCount(1)

    await page.getByTestId('project-source-video-file-input').setInputFiles({
      name: 'rp-media-01-local-source.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('rp-media-01 mocked browser metadata only'),
    })

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Local browser source video selected')
    await expect(page.getByTestId('project-source-video-local-mode')).toContainText('Local browser preview only')
    await expect(page.getByTestId('project-edit-brief-video-shell')).not.toContainText('Mock video shell only')

    const player = page.getByTestId('project-source-video-local-player')
    await expect(player).toBeVisible()
    await player.evaluate((element) => {
      element.dispatchEvent(new Event('loadedmetadata', { bubbles: true }))
    })

    await expect(page.getByTestId('project-source-video-summary')).toContainText('rp-media-01-local-source.mp4')
    await expect(page.getByTestId('project-source-video-summary')).toContainText('0:12')
    await expect(page.getByTestId('project-source-video-summary')).toContainText('1080x1920')
    await expect(page.getByTestId('project-source-video-summary')).toContainText('9:16')
    await expect(page.getByTestId('project-edit-brief-timecode')).toContainText('/ 0:12')

    const lane = page.getByTestId('project-edit-brief-marker-lane')
    await lane.scrollIntoViewIfNeeded()
    const laneBox = await lane.boundingBox()
    expect(laneBox).not.toBeNull()
    await lane.click({
      position: {
        x: Math.floor(laneBox!.width * 0.5),
        y: 8,
      },
    })

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('No marker was created')
    await expect(page.getByTestId('project-edit-brief-timecode')).toContainText('0:06 / 0:12')

    await page.getByTestId('project-edit-brief-add-marker-button').click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toContainText('Add marker')
    await expect(page.getByTestId('project-edit-brief-marker-start-time-input')).toHaveValue('6')
    await page.getByTestId('project-edit-brief-marker-time-mode-picker').selectOption('range')
    await expect(page.getByTestId('project-edit-brief-marker-end-time-input')).toHaveValue('9')

    const exportPanel = page.getByTestId('project-edit-brief-export-settings')
    await exportPanel.scrollIntoViewIfNeeded()
    await expect(exportPanel.getByTestId('project-source-video-export-recommendation')).toContainText('1080x1920')
    await exportPanel.getByTestId('project-source-video-export-recommendation-button').click()
    await expect(exportPanel.getByTestId('project-edit-brief-export-width-input')).toHaveValue('1080')
    await expect(exportPanel.getByTestId('project-edit-brief-export-height-input')).toHaveValue('1920')
    await expect(exportPanel.getByTestId('project-edit-brief-export-frame-rate-select')).toHaveValue('30')
    await expect(exportPanel.getByTestId('project-edit-brief-export-settings-status')).toContainText('Frame rate defaults to 30 fps')

    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/upload started|media processing started|worker job created|render job created|export job created|credit reserved|provider call made/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
