import { createHash } from 'node:crypto'

import { expect, test, type Route } from '@playwright/test'

import {
  compileMotionStudioAudioAuthority,
  createMotionStudioAudioFixtureInput,
} from '../../server/motion-studio/audio'
import { sha256CanonicalJson } from '../../server/motion-studio/commands/canonical-json'
import type {
  MotionStudioAudioAuthorityBundleV2,
  MotionStudioAudioCandidateReviewSummaryDto,
  MotionStudioAudioMixArtifactDto,
  MotionStudioAudioMixBindingDto,
  MotionStudioAudioReviewState,
  MotionStudioAudioReviewSummaryDto,
  MotionStudioAudioMixState,
  MotionStudioAudioMixWorkspaceDto,
  MotionStudioAudioWorkspaceDto,
  MotionStudioVoiceCastingWorkspaceDto,
  MotionStudioProductionDto,
} from '../../src/types/motion-studio'
import {
  MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION,
  MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION,
} from '../../src/types/motion-studio'
import {
  activeProductLocalTestScope,
  installActiveProductRouteFixture,
  type ActiveProductRouteFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '91919191-9191-4191-8191-919191919191'

test.describe('Storytelling Audio workspace', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so private audio reads use the explicit frontend-safe boundary.')

  test('shows delayed loading, then an honest empty state without starting work', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let releaseAudioReads: (() => void) | undefined
    const audioReadGate = new Promise<void>((resolve) => { releaseAudioReads = resolve })
    let writes = 0
    let privateMediaReads = 0

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) {
        await audioReadGate
        return fulfillError(route, 404, 'MOTION_STUDIO_NOT_FOUND', 'Audio direction is not prepared yet.')
      }
      if (isAudioMixWorkspaceRoute(request.url())) {
        await audioReadGate
        return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id) })
      }
      if (isAudioContentRoute(request.url())) privateMediaReads += 1
      return unexpectedRoute(route)
    })

    await setViewport(page, 375, 812)
    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    const loading = page.getByTestId('storytelling-audio-state-loading')
    await expect(loading).toBeVisible()
    await expect(loading.getByText('Checking this story\'s audio')).toBeVisible()
    const loadingIcon = loading.locator('svg')
    await expect(loadingIcon).toHaveCount(1)
    expect(await loadingIcon.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')

    releaseAudioReads?.()
    await expect(page.getByTestId('storytelling-audio-state-empty')).toBeVisible()
    await expect(page.getByText('Audio production has not started')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue in Chat' })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await setViewport(page, 1440, 960)
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-empty')).toBeVisible()
    await expect(page).toHaveURL(`${fixture.editPath}?surface=audio`)
    await expectNoGenerationBeforeApproval(page)
    expect(writes).toBe(0)
    expect(privateMediaReads).toBe(0)
  })

  test('shows the exact prepared audio direction and returns to the same named-edit Chat', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-planned', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const audioWorkspace = createAudioWorkspace(fixture, production)
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillData(route, { audioWorkspace })
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id) })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    await expect(page.getByRole('heading', { exact: true, name: 'Audio' })).toBeVisible()
    await expect(page.getByTestId('storytelling-audio-state-planned')).toBeVisible()
    await expect(page.getByText('2 segments')).toBeVisible()
    await expect(page.getByText('1 cue', { exact: true })).toBeVisible()
    await expect(page.getByText('2 planned cues')).toBeVisible()
    await expect(page.getByText('Mix playback and approvals remain read-only here. Narrator planning changes only the editable Voice Bible draft.')).toBeVisible()

    const panel = page.getByTestId('storytelling-workspace-panel')
    await expect(panel).not.toContainText(/ElevenLabs|Lyria|MMAudio|Supabase|providerCostMicros|database|worker ID/i)
    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }

    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-planned')).toBeVisible()
    await page.getByRole('button', { name: 'Continue in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    expect(writes).toBe(0)
  })

  test('shows one checksum-verified music decision before the mix without exposing production internals', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-candidate-review', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const audioWorkspace = createAudioWorkspace(fixture, production)
    const wav = createPcmWav(48, 24)
    const candidateReviews = [
      createAudioCandidateReview(fixture, production, audioWorkspace.audioAuthority, 'music', 'ready_for_review', wav),
      createAudioCandidateReview(fixture, production, audioWorkspace.audioAuthority, 'foley', 'verifying'),
    ] as const
    let candidateReads = 0
    let writes = 0

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillData(route, { audioWorkspace })
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, {
          audioMixWorkspace: createMixWorkspace(
            production.id,
            undefined,
            undefined,
            candidateReviews,
          ),
        })
      }
      if (isAudioCandidateContentRoute(request.url())) {
        candidateReads += 1
        return route.fulfill({
          status: 200,
          headers: { 'content-type': 'audio/wav', 'cache-control': 'private, no-store' },
          body: wav,
        })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    const surface = page.getByTestId('storytelling-audio-candidate-ready_for_review')
    await expect(surface).toBeVisible()
    await expect(surface.getByRole('heading', { name: 'Music direction is ready to hear' })).toBeVisible()
    await expect(surface.getByText('6 checks after complete playback')).toBeVisible()
    await expect(surface.getByText('Synchronized scene sound')).toBeVisible()
    await expect(surface.getByText('Verifying', { exact: true })).toBeVisible()
    await expect(surface).not.toContainText(/ElevenLabs|Lyria|MMAudio|Fal|Supabase|provider|queue|worker|database|artifact ID|cost/i)
    await expect(surface.getByTestId('storytelling-audio-candidate-player-idle')).toBeVisible()
    expect(candidateReads).toBe(0)

    await surface.getByRole('button', { name: 'Load private audio' }).click()
    const player = surface.getByTestId('storytelling-audio-candidate-player-ready')
    await expect(player).toBeVisible()
    const audio = player.getByLabel('Verified private Storytelling music direction')
    expect(await audio.evaluate((element) => ({
      autoplay: (element as HTMLAudioElement).autoplay,
      sourceIsPrivateBlob: (element as HTMLAudioElement).src.startsWith('blob:'),
    }))).toEqual({ autoplay: false, sourceIsPrivateBlob: true })
    expect(candidateReads).toBe(1)
    expect(writes).toBe(0)

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }
    await expectNoGenerationBeforeApproval(page)

    await page.reload()
    await expect(page.getByTestId('storytelling-audio-candidate-ready_for_review')).toBeVisible()
    await page.getByRole('button', { name: 'Discuss in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
  })

  test('keeps narrator recovery copy free of internal routes', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-voice-casting-recovery', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) {
        return fulfillError(
          route,
          503,
          'VOICE_CASTING_WORKSPACE_UNAVAILABLE',
          `/v1/motion-studio/productions/${productionId}/voice-casting-workspace`,
        )
      }
      if (isAudioWorkspaceRoute(request.url())) {
        return fulfillError(route, 404, 'MOTION_STUDIO_NOT_FOUND', 'Audio direction is not prepared yet.')
      }
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id) })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    const recovery = page.getByTestId('storytelling-voice-casting-failure')
    await expect(recovery).toBeVisible()
    await expect(recovery).toContainText('Narrator choices could not be loaded. The Voice Bible was not changed.')
    await expect(recovery).not.toContainText('/v1/motion-studio')
    await expectNoGenerationBeforeApproval(page)
  })

  test('maps every durable mix lifecycle state without inventing percentage progress', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-lifecycle', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const audioWorkspace = createAudioWorkspace(fixture, production)
    let bindingState: Exclude<MotionStudioAudioMixState, 'ready_for_private_review'> = 'queued'
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillData(route, { audioWorkspace })
      if (isAudioMixWorkspaceRoute(request.url())) {
        const binding = createMixBinding(audioWorkspace.audioAuthority, bindingState)
        return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id, binding) })
      }
      return unexpectedRoute(route)
    })

    const cases: readonly {
      state: typeof bindingState
      resourceTestId: string
      title: string
    }[] = [
      { state: 'queued', resourceTestId: 'storytelling-audio-state-active', title: 'Audio mix is queued' },
      { state: 'in_progress', resourceTestId: 'storytelling-audio-state-active', title: 'Audio mix is being prepared' },
      { state: 'resumable', resourceTestId: 'storytelling-audio-state-resumable', title: 'Audio preparation can resume' },
      { state: 'reconciliation_required', resourceTestId: 'storytelling-audio-state-attention_required', title: 'Audio result needs verification' },
      { state: 'blocked', resourceTestId: 'storytelling-audio-state-attention_required', title: 'Audio preparation is blocked' },
      { state: 'failed', resourceTestId: 'storytelling-audio-state-attention_required', title: 'Audio preparation did not finish' },
      { state: 'cancelled', resourceTestId: 'storytelling-audio-state-attention_required', title: 'Audio preparation was cancelled' },
    ]

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    for (const scenario of cases) {
      bindingState = scenario.state
      await page.reload()
      await expect(page.getByTestId(scenario.resourceTestId)).toBeVisible()
      await expect(page.getByText(scenario.title)).toBeVisible()
      await expect(page.getByTestId('storytelling-workspace-panel')).not.toContainText(/\b\d{1,3}%\b/)
    }

    await expectNoGenerationBeforeApproval(page)
    expect(writes).toBe(0)
  })

  test('checksum-verifies the private WAV before playback and recovers without approval or mutation', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-playback', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const audioWorkspace = createAudioWorkspace(fixture, production)
    const wav = createPcmWav(audioWorkspace.audioAuthority.timingAuthority.durationFrames, 24)
    const tamperedWav = Buffer.from(wav)
    tamperedWav[100] = tamperedWav[100]! ^ 0xff
    const artifact = createArtifact(audioWorkspace.audioAuthority, wav)
    const binding = createMixBinding(audioWorkspace.audioAuthority, 'ready_for_private_review', artifact)
    let playbackReads = 0
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillData(route, { audioWorkspace })
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id, binding) })
      }
      if (isAudioContentRoute(request.url())) {
        playbackReads += 1
        return route.fulfill({
          status: 200,
          contentType: 'audio/wav',
          body: playbackReads === 1 ? tamperedWav : wav,
        })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    await expect(page.getByTestId('storytelling-audio-state-ready_for_private_review')).toBeVisible()
    await expect(page.getByText('Private Storytelling mix is ready to hear')).toBeVisible()
    await expect(page.getByTestId('storytelling-audio-player-idle')).toBeVisible()
    expect(playbackReads).toBe(0)

    await page.getByRole('button', { name: 'Load private mix' }).click()
    await expect(page.getByTestId('storytelling-audio-player-failure')).toBeVisible()
    await expect(page.getByText('The protected audio did not match the approved review version.')).toBeVisible()
    expect(playbackReads).toBe(1)

    await page.getByRole('button', { name: 'Try playback again' }).click()
    const player = page.getByTestId('storytelling-audio-player-ready')
    await expect(player).toBeVisible()
    const audio = player.getByLabel('Verified private Storytelling audio mix')
    await expect(audio).toBeVisible()
    expect(await audio.evaluate((element) => ({
      autoplay: (element as HTMLAudioElement).autoplay,
      sourceIsPrivateBlob: (element as HTMLAudioElement).src.startsWith('blob:'),
    }))).toEqual({ autoplay: false, sourceIsPrivateBlob: true })
    await expect(page.getByText('Listening does not approve, apply, export, or publish this version.')).toBeVisible()
    expect(playbackReads).toBe(2)
    expect(writes).toBe(0)
  })

  test('shows exact audio review, change, lock, and stale states without creating another approval surface', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-review-summary', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const audioWorkspace = createAudioWorkspace(fixture, production)
    const wav = createPcmWav(audioWorkspace.audioAuthority.timingAuthority.durationFrames, 24)
    const artifact = createArtifact(audioWorkspace.audioAuthority, wav)
    const binding = createMixBinding(audioWorkspace.audioAuthority, 'ready_for_private_review', artifact)
    let reviewState: MotionStudioAudioReviewState = 'ready_for_review'
    let writes = 0

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillData(route, { audioWorkspace })
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, {
          audioMixWorkspace: createMixWorkspace(
            production.id,
            binding,
            createAudioReviewSummary(fixture, production, artifact, reviewState),
          ),
        })
      }
      return unexpectedRoute(route)
    })

    const cases: readonly {
      state: MotionStudioAudioReviewState
      title: string
      action: string
      playbackAvailable: boolean
    }[] = [
      { state: 'ready_for_review', title: 'Review the completed Storytelling mix', action: 'Review in Chat', playbackAvailable: true },
      { state: 'changes_requested', title: 'This audio version needs a revision', action: 'Continue in Chat', playbackAvailable: true },
      { state: 'rejected', title: 'This audio version will not move forward', action: 'Choose a new direction', playbackAvailable: false },
      { state: 'approved_locked', title: 'Audio review is complete', action: 'Refresh', playbackAvailable: true },
      { state: 'stale', title: 'The story plan changed after this mix', action: 'Update in Chat', playbackAvailable: false },
    ]

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    for (const scenario of cases) {
      reviewState = scenario.state
      await page.reload()
      const surface = page.getByTestId(`storytelling-audio-review-${scenario.state}`)
      await expect(surface).toBeVisible()
      await expect(surface.getByRole('heading', { name: scenario.title })).toBeVisible()
      await expect(surface.getByRole('button', { name: scenario.action })).toBeVisible()
      await expect(surface.getByText('2 of 2 selected')).toBeVisible()
      await expect(surface.getByText('14 of 14 checks passed')).toBeVisible()
      await expect(surface.getByTestId('storytelling-audio-player-idle')).toHaveCount(scenario.playbackAvailable ? 1 : 0)
      await expect(surface).not.toContainText(/ElevenLabs|Lyria|MMAudio|Supabase|provider|database|worker|artifact ID|binding ID/i)
      await expectNoHorizontalOverflow(page)
    }

    await setViewport(page, 375, 812)
    reviewState = 'changes_requested'
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-review-changes_requested')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectNoGenerationBeforeApproval(page)
    expect(writes).toBe(0)
  })

  test('keeps access, missing, conflict, and recoverable failures distinct', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-errors', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let mixStatus = 403
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillError(route, 404, 'MOTION_STUDIO_NOT_FOUND')
      if (isAudioMixWorkspaceRoute(request.url())) {
        if (mixStatus === 200) return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id) })
        return fulfillError(route, mixStatus, errorCode(mixStatus))
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    await expect(page.getByTestId('storytelling-audio-state-permission_denied')).toBeVisible()
    await expect(page.getByText('Access denied')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

    mixStatus = 404
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-not_found')).toBeVisible()

    mixStatus = 409
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-conflict')).toBeVisible()

    mixStatus = 500
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-failure')).toBeVisible()
    mixStatus = 200
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-audio-state-empty')).toBeVisible()
    expect(writes).toBe(0)
  })

  test('fails closed when private mix lineage does not match the approved audio plan', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-audio-lineage', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const audioWorkspace = createAudioWorkspace(fixture, production)
    let servedBinding: MotionStudioAudioMixBindingDto = {
      ...createMixBinding(audioWorkspace.audioAuthority, 'queued'),
      sourceApprovedSnapshotId: uuid(998),
    }
    let servedCandidateReviews: readonly MotionStudioAudioCandidateReviewSummaryDto[] = []

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) return fulfillVoiceCastingNotPrepared(route, production)
      if (isAudioWorkspaceRoute(request.url())) return fulfillData(route, { audioWorkspace })
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, {
          audioMixWorkspace: createMixWorkspace(
            production.id,
            servedBinding,
            undefined,
            servedCandidateReviews,
          ),
        })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    await expect(page.getByTestId('storytelling-audio-state-failure')).toBeVisible()
    await expect(page.getByText('Audio could not be loaded')).toBeVisible()
    await expect(page.getByText('Your story and review decisions were not changed.')).toBeVisible()
    await expect(page.getByTestId('storytelling-audio-player-idle')).toHaveCount(0)

    const wav = createPcmWav(audioWorkspace.audioAuthority.timingAuthority.durationFrames, 24)
    const artifact = createArtifact(audioWorkspace.audioAuthority, wav)
    servedBinding = createMixBinding(audioWorkspace.audioAuthority, 'ready_for_private_review', {
      ...artifact,
      durationFrames: artifact.durationFrames - 1,
    })
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-failure')).toBeVisible()
    await expect(page.getByTestId('storytelling-audio-player-idle')).toHaveCount(0)

    servedBinding = createMixBinding(audioWorkspace.audioAuthority, 'queued')
    servedCandidateReviews = [{
      ...createAudioCandidateReview(fixture, production, audioWorkspace.audioAuthority, 'music', 'verifying'),
      editSessionId: 'another-edit-session',
    }]
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-failure')).toBeVisible()
    await expect(page.getByTestId('storytelling-audio-candidate-player-idle')).toHaveCount(0)

    servedCandidateReviews = [{
      ...createAudioCandidateReview(
        fixture,
        production,
        audioWorkspace.audioAuthority,
        'music',
        'verifying',
      ),
      sourceApprovedSnapshotId: 'another-approved-snapshot',
    }]
    await page.reload()
    await expect(page.getByTestId('storytelling-audio-state-failure')).toBeVisible()
    await expect(page.getByTestId('storytelling-audio-candidate-player-idle')).toHaveCount(0)
  })

  test('selects narrator direction through the exact Voice Bible draft and recovers from a stale write', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-voice-casting', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let voiceCastingWorkspace = createVoiceCastingWorkspace(fixture, production)
    let writeMode: 'success' | 'conflict' = 'success'
    let writes = 0
    let providerCalls = 0

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isVoiceCastingWorkspaceRoute(request.url())) {
        return fulfillData(route, { voiceCastingWorkspace })
      }
      if (isVoiceCastingSelectionRoute(request.url())) {
        writes += 1
        const body = request.postDataJSON() as Record<string, unknown>
        const serialized = JSON.stringify(body)
        expect(Object.keys(body).sort()).toEqual([
          'candidateReference',
          'catalogVersion',
          'voiceBibleBaseVersionDigest',
          'voiceBibleBaseVersionId',
        ])
        expect(serialized).not.toMatch(/provider|voiceId|preview|credit|approval/i)
        if (writeMode === 'conflict') {
          return fulfillError(route, 409, 'MOTION_STUDIO_CONFLICT', 'The Voice Bible changed while this narrator choice was open. Refresh and choose again.')
        }
        const selectedReference = String(body.candidateReference)
        voiceCastingWorkspace = {
          ...voiceCastingWorkspace,
          state: 'selected_for_planning',
          selectedCandidateReference: selectedReference,
          voiceBible: {
            ...voiceCastingWorkspace.voiceBible!,
            currentDraftVersion: {
              artifactId: uuid(401),
              versionId: uuid(403),
              versionNumber: 2,
              contentDigest: 'd'.repeat(64),
            },
          },
          notice: 'This narrator is part of the current Voice Bible draft. The plan is still unapproved and no speech has been generated.',
        }
        return fulfillData(route, {
          receipt: {
            updatedVoiceBibleVersion: voiceCastingWorkspace.voiceBible!.currentDraftVersion,
            workspace: voiceCastingWorkspace,
            planApproved: false,
            providerCallMade: false,
            speechGenerated: false,
            customerCreditsChanged: false,
          },
        })
      }
      if (isAudioWorkspaceRoute(request.url())) return fulfillError(route, 404, 'MOTION_STUDIO_NOT_FOUND')
      if (isAudioMixWorkspaceRoute(request.url())) {
        return fulfillData(route, { audioMixWorkspace: createMixWorkspace(production.id) })
      }
      if (/provider|voices|speech|generate/u.test(request.url())) providerCalls += 1
      return unexpectedRoute(route)
    })

    await setViewport(page, 1024, 900)
    await gotoRoute(page, `${fixture.editPath}?surface=audio`)
    const section = page.getByTestId('storytelling-voice-casting-ready')
    await expect(section).toBeVisible()
    await expect(section.getByRole('heading', { name: 'Narrator direction' })).toBeVisible()
    const select = section.getByLabel('Narrator', { exact: true })
    await select.focus()
    await expect(select).toBeFocused()
    await select.selectOption({ label: 'George - Warm, Captivating Storyteller' })
    await expect(section.getByText('Warm resonance that instantly captivates listeners.')).toBeVisible()
    await page.keyboard.press('Tab')
    const save = section.getByRole('button', { name: 'Use for planning' })
    await expect(save).toBeFocused()
    await page.keyboard.press('Enter')

    const selected = page.getByTestId('storytelling-voice-casting-selected_for_planning')
    await expect(selected).toBeVisible()
    await expect(selected.getByText('Narrator direction saved to the Voice Bible draft.')).toBeVisible()
    await expect(selected.getByRole('button', { name: 'Used for planning' })).toBeDisabled()
    await expect(page.getByTestId('storytelling-workspace-panel')).not.toContainText(/ElevenLabs|provider voice|voice ID|preview URL|Supabase|credit spent/i)
    expect(writes).toBe(1)
    expect(providerCalls).toBe(0)

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }

    await page.reload()
    await expect(page.getByTestId('storytelling-voice-casting-selected_for_planning')).toBeVisible()
    await expect(page.getByLabel('Narrator', { exact: true })).toHaveValue(voiceCastingWorkspace.selectedCandidateReference!)
    await expect(page).toHaveURL(`${fixture.editPath}?surface=audio`)

    writeMode = 'conflict'
    await page.getByLabel('Narrator', { exact: true }).selectOption({ label: 'Alice - Clear, Engaging Educator' })
    await page.getByRole('button', { name: 'Update direction' }).click()
    const conflict = page.getByTestId('storytelling-voice-casting-conflict')
    await expect(conflict).toBeVisible()
    await expect(conflict.getByText('The Voice Bible changed while this narrator choice was open. Refresh and choose again.')).toBeVisible()
    writeMode = 'success'
    await conflict.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-voice-casting-selected_for_planning')).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
  })
})

function createProduction(fixture: ActiveProductRouteFixture): MotionStudioProductionDto {
  return {
    id: productionId,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: 'draft',
    currentStage: 'director_brief',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-19T13:00:00.000Z',
    updatedAt: '2026-07-19T13:00:00.000Z',
    localCandidateOnly: true,
  }
}

function createAudioWorkspace(
  fixture: ActiveProductRouteFixture,
  production: MotionStudioProductionDto,
): MotionStudioAudioWorkspaceDto {
  const base = createMotionStudioAudioFixtureInput()
  const ownership = {
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
  }
  const preparedScript = { ...base.preparedScript, ...ownership, productionId: production.id }
  const preparedScriptArtifactPayload = {
    ...base.preparedScriptArtifactPayload,
    data: preparedScript,
  }
  const compiled = compileMotionStudioAudioAuthority({
    ...base,
    ownership,
    productionId: production.id,
    preparedScript,
    preparedScriptArtifactPayload,
    preparedScriptArtifactVersion: {
      ...base.preparedScriptArtifactVersion,
      contentDigest: sha256CanonicalJson(preparedScriptArtifactPayload),
    },
  })

  return {
    ...ownership,
    productionId: production.id,
    audioAuthority: compiled.bundle,
    state: 'review_only',
    warning: 'Audio direction is private and review-only. No generation, mix, approval, timeline, render, export, or billing action is available here.',
  }
}

function createMixWorkspace(
  targetProductionId: string,
  binding?: MotionStudioAudioMixBindingDto,
  acceptanceReview?: MotionStudioAudioReviewSummaryDto,
  candidateReviews?: readonly MotionStudioAudioCandidateReviewSummaryDto[],
): MotionStudioAudioMixWorkspaceDto {
  const bindings = binding ? [binding] : []
  const state: MotionStudioAudioMixWorkspaceDto['state'] = acceptanceReview
    ? ['ready_for_review', 'approved_locked'].includes(acceptanceReview.state)
      ? 'ready_for_private_review'
      : 'attention_required'
    : !binding
    ? 'empty'
    : binding.state === 'ready_for_private_review'
      ? 'ready_for_private_review'
      : ['failed', 'blocked', 'reconciliation_required'].includes(binding.state)
        ? 'attention_required'
        : 'active'
  return {
    productionId: targetProductionId,
    state,
    bindings,
    ...(candidateReviews ? { candidateReviews } : {}),
    ...(acceptanceReview ? { acceptanceReview } : {}),
    warning: 'Private Storytelling audio review only. No provider, timeline, render, export, billing, or public delivery action is available.',
  }
}

function createAudioCandidateReview(
  fixture: ActiveProductRouteFixture,
  production: MotionStudioProductionDto,
  audioAuthority: MotionStudioAudioAuthorityBundleV2,
  role: MotionStudioAudioCandidateReviewSummaryDto['role'],
  state: MotionStudioAudioCandidateReviewSummaryDto['state'],
  wav?: Buffer,
): MotionStudioAudioCandidateReviewSummaryDto {
  const candidateReference = `storytelling-${role}-candidate-v1`
  const durationMilliseconds = 2_000
  const playable = state === 'ready_for_review' || state === 'reviewed_passed' || state === 'reviewed_rejected'
  const reviewed = state === 'reviewed_passed' || state === 'reviewed_rejected'
  if (playable && !wav) throw new Error('Playable audio candidate fixture requires exact WAV bytes.')
  return {
    schemaVersion: MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION,
    productionId: production.id,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
    sourceApprovedSnapshotId: audioAuthority.approvedSnapshotId,
    sourceApprovedSnapshotDigest: audioAuthority.approvedSnapshotDigest,
    timingAuthorityDigest: audioAuthority.timingAuthority.timingAuthorityDigest,
    candidateReference,
    role,
    state,
    reviewVersion: 1,
    requiredReviewCheckCount: role === 'music' ? 6 : 5,
    completedReviewCheckCount: reviewed ? (role === 'music' ? 6 : 5) : 0,
    candidateDurationMilliseconds: durationMilliseconds,
    ...(playable && wav ? {
      candidate: {
        candidateReference,
        sha256: createHash('sha256').update(wav).digest('hex'),
        byteLength: wav.byteLength,
        mimeType: 'audio/wav' as const,
        codec: 'pcm_s16le' as const,
        sampleRateHertz: 48_000 as const,
        channelCount: 2 as const,
        durationMilliseconds,
        contentPath: `/v1/motion-studio/audio-candidates/${candidateReference}/content`,
        privateReviewOnly: true as const,
      },
    } : {}),
    ...(reviewed ? {
      review: {
        decision: state === 'reviewed_passed' ? 'passed' as const : 'rejected' as const,
        note: state === 'reviewed_passed'
          ? 'The complete private candidate supports the approved story context.'
          : 'The complete private candidate does not support the approved story context.',
        reviewedAt: '2026-07-20T22:00:00.000Z',
        immutable: true as const,
      },
    } : {}),
    exactReviewContextCurrent: !['stale', 'blocked'].includes(state),
    canonicalRuntimeEvidenceVerified: true,
    completePrivatePlaybackRequired: true,
    humanReviewRequired: true,
    automaticSelectionAllowed: false,
    selected: false,
    finalMixEligible: false,
    timelineReady: false,
    renderReady: false,
    exportReady: false,
    publicDeliveryReady: false,
    productReady: false,
  }
}

function createAudioReviewSummary(
  fixture: ActiveProductRouteFixture,
  production: MotionStudioProductionDto,
  artifact: MotionStudioAudioMixArtifactDto,
  state: MotionStudioAudioReviewState,
): MotionStudioAudioReviewSummaryDto {
  const decision = state === 'approved_locked'
    ? 'accepted' as const
    : state === 'changes_requested'
      ? 'changes_requested' as const
      : state === 'rejected'
        ? 'rejected' as const
        : undefined
  return {
    schemaVersion: MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION,
    productionId: production.id,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
    state,
    selectionVersion: 1,
    requiredNarrationSegmentCount: 2,
    selectedNarrationSegmentCount: 2,
    optionalRoles: [
      { role: 'music', decision: 'included', selectedItemCount: 1 },
      { role: 'foley', decision: 'not_needed', selectedItemCount: 0 },
      { role: 'ambience', decision: 'included', selectedItemCount: 1 },
      { role: 'exact_sfx', decision: 'not_selected', selectedItemCount: 0 },
    ],
    narrationAssemblyVerified: true,
    integratedMixVerified: true,
    mixArtifactId: artifact.artifactId,
    durationFrames: artifact.durationFrames,
    frameRate: artifact.fps,
    passedBlockingCheckCount: 14,
    totalBlockingCheckCount: 14,
    allBlockingChecksPassed: true,
    ...(decision ? {
      review: {
        decision,
        reason: decision === 'accepted'
          ? 'The private mix supports the approved story and is ready for the next private editing stage.'
          : decision === 'changes_requested'
            ? 'Lower the music under the closing narration before another review.'
            : 'The current audio direction does not support the approved story.',
        reviewedAt: '2026-07-20T21:00:00.000Z',
        immutable: true as const,
      },
    } : {}),
    ...(state === 'stale' ? { recoveryAction: 'replanning_required' as const } : {}),
    fineCutHandoffEligible: state === 'approved_locked',
    privateReviewOnly: true,
    timelineReady: false,
    finalVideoReady: false,
    renderReady: false,
    exportReady: false,
    publicDeliveryReady: false,
    productReady: false,
  }
}

function createVoiceCastingWorkspace(
  fixture: ActiveProductRouteFixture,
  production: MotionStudioProductionDto,
): MotionStudioVoiceCastingWorkspaceDto {
  return {
    productionId: production.id,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
    state: 'ready',
    catalogVersion: 'c'.repeat(64),
    candidates: [
      {
        candidateReference: `voice-catalog:v1:${'1'.repeat(64)}`,
        displayName: 'George - Warm, Captivating Storyteller',
        description: 'Warm resonance that instantly captivates listeners.',
        traits: {
          accent: 'british',
          age: 'middle_aged',
          gender: 'male',
          language: 'en',
          useCase: 'narrative_story',
          character: 'mature',
        },
        auditionState: 'unavailable',
      },
      {
        candidateReference: `voice-catalog:v1:${'2'.repeat(64)}`,
        displayName: 'Alice - Clear, Engaging Educator',
        description: 'Clear and confident with a calm educational delivery.',
        traits: { accent: 'british', gender: 'female', language: 'en', useCase: 'education' },
        auditionState: 'unavailable',
      },
    ],
    voiceBible: {
      artifactId: uuid(401),
      providerCapability: 'speech_generation',
      currentDraftVersion: {
        artifactId: uuid(401),
        versionId: uuid(402),
        versionNumber: 1,
        contentDigest: 'b'.repeat(64),
      },
    },
    selectionAllowed: true,
    notice: 'Choose a narrator for the Voice Bible draft. This planning choice does not generate speech or use credits.',
    localCandidateOnly: true,
  }
}

function createMixBinding(
  authority: MotionStudioAudioAuthorityBundleV2,
  state: MotionStudioAudioMixState,
  artifact?: MotionStudioAudioMixArtifactDto,
): MotionStudioAudioMixBindingDto {
  const roles = ['narration', 'music', 'foley', 'exact_sfx'] as const
  const stemByRole = new Map(authority.stems.map((stem) => [stem.role, stem]))
  const cueByRole = {
    narration: authority.voiceSegments[0]!.voiceSegmentId,
    music: authority.musicCues[0]!.cueId,
    foley: authority.soundEvents.find((event) => event.role === 'foley')!.soundEventId,
    exact_sfx: authority.soundEvents.find((event) => event.role === 'exact_sfx')!.soundEventId,
  }
  const sampleCountPerChannel = authority.timingAuthority.durationFrames * 48_000 / authority.timingAuthority.frameRate

  return {
    bindingId: uuid(200),
    productionId: authority.productionId,
    audioAuthorityId: uuid(201),
    sourceApprovedSnapshotId: authority.approvedSnapshotId,
    executionApprovedSnapshotId: uuid(202),
    mixPlanVersionId: authority.mixPlan.mixPlanArtifactVersion.versionId,
    mixPlanContentDigest: authority.mixPlan.mixPlanArtifactVersion.contentDigest,
    jobId: 'storytelling-audio-mix-job-1',
    profileId: 'motion_studio_storytelling_speech_safe_mix_v1',
    state,
    fps: authority.timingAuthority.frameRate,
    durationFrames: authority.timingAuthority.durationFrames,
    sampleCountPerChannel,
    inputs: roles.map((role, index) => {
      const stem = stemByRole.get(role)
      if (!stem) throw new Error(`Audio fixture is missing ${role}.`)
      return {
        role,
        stemId: stem.stemId,
        mediaAssetId: `private-audio-${role}`,
        checksumSha256: String(index + 6).repeat(64),
        startFrame: 0,
        endFrame: authority.timingAuthority.durationFrames,
        cueAuthorityId: cueByRole[role],
        cueReason: `Use the approved ${role} cue for this exact private mix.`,
        rightsEvidenceId: stem.audioAssetVersion.rightsEvidenceIds[0]!,
        mimeType: 'audio/wav' as const,
        audioCodec: 'pcm_s16le' as const,
        sampleRateHertz: 48_000 as const,
        channelCount: role === 'narration' ? 1 as const : 2 as const,
        sampleCountPerChannel,
      }
    }),
    attemptCount: state === 'queued' ? 0 : 1,
    ...(state === 'queued' ? {} : { latestAttemptNumber: 1 }),
    providerCostMicros: 0,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
    ...(artifact ? { artifact } : {}),
    createdAt: '2026-07-19T14:00:00.000Z',
  }
}

function createArtifact(
  authority: MotionStudioAudioAuthorityBundleV2,
  wav: Buffer,
): MotionStudioAudioMixArtifactDto {
  const artifactId = uuid(210)
  const gates = [
    'file_integrity', 'format', 'duration_sync', 'integrated_loudness', 'true_peak',
    'sample_clipping', 'cue_timing', 'speech_priority', 'rights_provenance',
  ] as const
  return {
    artifactId,
    sha256: createHash('sha256').update(wav).digest('hex'),
    byteLength: wav.byteLength,
    mimeType: 'audio/wav',
    codec: 'pcm_s16le',
    sampleRateHertz: 48_000,
    channelCount: 2,
    sampleCountPerChannel: authority.timingAuthority.durationFrames * 48_000 / authority.timingAuthority.frameRate,
    durationFrames: authority.timingAuthority.durationFrames,
    fps: authority.timingAuthority.frameRate,
    quality: {
      integratedLufs: -16,
      loudnessRangeLu: 6,
      truePeakDbfs: -1.5,
      samplePeakDbfs: -2,
      speechPriorityRatio: 1.5,
      gateResults: gates.map((gate) => ({ gate, result: 'passed' as const, blocking: true as const })),
      qaEvidenceDigest: 'e'.repeat(64),
    },
    privateReviewOnly: true,
    contentPath: `/v1/motion-studio/audio-mix-artifacts/${artifactId}/content`,
  }
}

function createPcmWav(durationFrames: number, fps: 24 | 30): Buffer {
  const sampleRate = 48_000
  const channelCount = 2
  const bytesPerSample = 2
  const sampleCount = durationFrames * sampleRate / fps
  const dataLength = sampleCount * channelCount * bytesPerSample
  const wav = Buffer.alloc(44 + dataLength)
  wav.write('RIFF', 0, 'ascii')
  wav.writeUInt32LE(36 + dataLength, 4)
  wav.write('WAVE', 8, 'ascii')
  wav.write('fmt ', 12, 'ascii')
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(channelCount, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28)
  wav.writeUInt16LE(channelCount * bytesPerSample, 32)
  wav.writeUInt16LE(bytesPerSample * 8, 34)
  wav.write('data', 36, 'ascii')
  wav.writeUInt32LE(dataLength, 40)
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const value = Math.round(Math.sin(2 * Math.PI * 220 * sample / sampleRate) * 1_200)
    const offset = 44 + sample * channelCount * bytesPerSample
    wav.writeInt16LE(value, offset)
    wav.writeInt16LE(value, offset + bytesPerSample)
  }
  return wav
}

function uuid(sequence: number): string {
  return `11111111-1111-4111-8111-${sequence.toString().padStart(12, '0')}`
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isAudioWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/audio-workspace$/u.test(new URL(url).pathname)
}

function isVoiceCastingWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/voice-casting-workspace$/u.test(new URL(url).pathname)
}

function isVoiceCastingSelectionRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/voice-casting-selections$/u.test(new URL(url).pathname)
}

function isAudioMixWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/audio-mix-workspace$/u.test(new URL(url).pathname)
}

function isAudioContentRoute(url: string): boolean {
  return /\/v1\/motion-studio\/audio-mix-artifacts\/[^/]+\/content$/u.test(new URL(url).pathname)
}

function isAudioCandidateContentRoute(url: string): boolean {
  return /\/v1\/motion-studio\/audio-candidates\/[^/]+\/content$/u.test(new URL(url).pathname)
}

function errorCode(status: number): string {
  if (status === 403) return 'WORKSPACE_ACCESS_DENIED'
  if (status === 404) return 'MOTION_STUDIO_NOT_FOUND'
  if (status === 409) return 'MOTION_STUDIO_CONFLICT'
  return 'INTERNAL_ERROR'
}

async function fulfillData(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, statusCode: 200, data, warnings: [], mockOnly: false }),
  })
}

async function fulfillError(route: Route, status: number, code: string, message = code) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, statusCode: status, error: { code, message }, warnings: [], mockOnly: false }),
  })
}

async function fulfillVoiceCastingNotPrepared(route: Route, production: MotionStudioProductionDto) {
  await fulfillData(route, {
    voiceCastingWorkspace: {
      productionId: production.id,
      projectId: production.projectId,
      editSessionId: production.editSessionId,
      state: 'not_prepared',
      candidates: [],
      selectionAllowed: false,
      notice: 'Prepare narrator direction in Chat before choosing a production voice.',
      localCandidateOnly: true,
    } satisfies MotionStudioVoiceCastingWorkspaceDto,
  })
}

async function unexpectedRoute(route: Route) {
  await fulfillError(route, 404, 'UNEXPECTED_TEST_ROUTE', route.request().url())
}
