import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

async function installVisualContextBrowserMocks(page: Page) {
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
        return 18
      },
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get() {
        return getMediaState(this).currentTime
      },
      set(value: number) {
        getMediaState(this).currentTime = Number.isFinite(value) ? Math.max(0, Math.min(18, value)) : 0
        this.dispatchEvent(new Event('timeupdate', { bubbles: true }))
        this.dispatchEvent(new Event('seeked', { bubbles: true }))
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
        return 1280
      },
    })

    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get() {
        return 720
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

    const originalCreateElement = Document.prototype.createElement
    Document.prototype.createElement = function createElement(tagName: string, options?: ElementCreationOptions) {
      const element = originalCreateElement.call(this, tagName, options)
      if (tagName.toLowerCase() === 'canvas') {
        const canvas = element as HTMLCanvasElement
        canvas.getContext = (() => ({
          drawImage: () => undefined,
        })) as typeof canvas.getContext
        canvas.toDataURL = () => 'data:image/jpeg;base64,cXdlbjI1dmwtcGxheXdyaWdodC1mcmFtZQ=='
      }
      return element
    }
  })
}

test.describe('Project Edit Brief visual context', () => {
  test('analyzes sampled local video frames with deterministic fallback and shows Marker Chat availability', async ({ page }) => {
    await installVisualContextBrowserMocks(page)
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await page.locator('[data-testid^="project-edit-brief-marker-pill-"]').first().click()
    await expect(page.getByTestId('project-edit-brief-visual-context-panel')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-analyze-visual-context-button')).toBeDisabled()
    await expect(page.getByTestId('project-edit-brief-visual-context-disabled')).toContainText('Select local source video first')
    await expect(page.getByTestId('project-edit-brief-marker-chat-visual-context')).toContainText('Visual context unavailable')

    await page.getByTestId('project-source-video-file-input').setInputFiles({
      name: 'rp-qwenvl-beta-local-source.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('rp-qwenvl-beta mocked browser metadata only'),
    })
    const player = page.getByTestId('project-source-video-local-player')
    await expect(player).toBeVisible()
    await player.evaluate((element) => {
      element.dispatchEvent(new Event('loadedmetadata', { bubbles: true }))
    })

    await page.locator('[data-testid^="project-edit-brief-marker-pill-"]').first().click()
    await expect(page.getByTestId('project-edit-brief-analyze-visual-context-button')).toBeEnabled()
    await page.getByTestId('project-edit-brief-analyze-visual-context-button').click()

    await expect(page.getByTestId('project-edit-brief-visual-context-status')).toContainText(/fallback|Visual context/i)
    await expect(page.getByTestId('project-edit-brief-visual-context-summary')).toContainText('Visual context unavailable')
    await expect(page.getByTestId('project-edit-brief-visual-context-summary')).toContainText('0:18', { timeout: 5000 }).catch(async () => {
      await expect(page.getByTestId('project-edit-brief-visual-context-summary')).toContainText('sampled frame')
    })
    await expect(page.getByTestId('project-edit-brief-marker-chat-visual-context')).toContainText(/Visual context fallback used|Visual context available/)
    await expect(page.getByTestId('project-edit-brief-visual-context-boundary')).toContainText('No full video upload')
    await expect(page.getByText(/worker job created|render job created|credit reserved|full video upload started|provider call made/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
