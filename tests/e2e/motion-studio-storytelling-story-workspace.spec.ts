import { createHash } from 'node:crypto'
import { expect, test, type Page, type Route } from '@playwright/test'

import {
  validEmptyStoryWorkspaceDto,
  validNotReadyStoryContinuityReviewDto,
  validReadyStoryContinuityReviewDto,
  validStoryWorkspaceDto,
} from '../../src/lib/motion-studio/contracts'
import {
  buildLocalProjectHandoffStorageKey,
  createLocalSourceSetFingerprint,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import type {
  MotionStudioVersionReference,
  MotionStudioProductionDto,
  MotionStudioStoryWorkspaceDto,
  NarrativeFunctionReference,
  StorytellingMotionStyleDecisionDto,
  StorytellingMotionStyleDecisionState,
  StorytellingMotionStylePlanPreparationDto,
  StorytellingStoryContinuityReviewDto,
  StorytellingStyleCalibrationReviewDto,
  StorytellingStyleCalibrationReviewState,
  StorytellingStyleCalibrationScenarioStatus,
  StyleCalibrationScenario,
  StyleCalibrationScenarioKind,
} from '../../src/types/motion-studio'
import { buildMotionStudioGenerationRoutePolicy } from '../../server/motion-studio/generation/compiler'
import {
  createStorytellingMotionStylePlanReviewInput,
  createStorytellingMotionStyleSelection,
  createStyleCalibrationPlan,
  getStorytellingMotionStyleProfile,
  storytellingMotionStyleProfileReference,
} from '../../server/motion-studio/style-system'
import {
  activeProductLocalTestScope,
  installActiveProductRouteFixture,
  type ActiveProductRouteFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  expectNoGenerationBeforeApproval,
  gotoRoute,
} from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'

type CanonicalStorytellingStyleAuthorityBrowserProof = {
  schemaVersion: 'canonical-storytelling-style-authority-v1'
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  styleSelection: {
    styleProfile: { styleProfileId: string }
  }
  calibrationPlan: {
    scenarioKinds: string[]
  }
  internalCostEnvelope: {
    unit: 'usd_micros'
    internalProductionCostOnly: true
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
  }
  decisionAuthority: 'existing_plan_review'
  planReviewIsSoleApprovalAuthority: true
  changedStyleRequiresFreshPlanAndEstimate: true
  historicalApprovedSnapshotRemainsImmutable: true
  runtimeExecutionAuthorized: false
  providerExecutionAuthorized: false
  customerCommercialAuthorityGranted: false
  productionReady: false
  immutable: true
}

test.describe('Storytelling Story workspace', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('shows delayed loading and a truthful empty state without reading Research', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'story-workspace-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const storyWorkspace = exactWorkspace(validEmptyStoryWorkspaceDto, production)
    let storyReads = 0
    let researchReads = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(url)) {
        storyReads += 1
        // Leave enough time for the mounted route and lazy workspace chunk to
        // become observable even when the complete suite runs in parallel.
        await new Promise((resolve) => setTimeout(resolve, 1_200))
        return fulfillData(route, { storyWorkspace })
      }
      if (isResearchWorkspaceRoute(url)) researchReads += 1
      return unexpectedRoute(route)
    })

    await setViewport(page, 1280)
    await gotoRoute(page, `${fixture.editPath}?surface=story`)
    await expect(page.getByTestId('storytelling-story-state-loading')).toBeVisible()
    await expect(page.getByTestId('storytelling-story-state-empty')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your story starts in Chat' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Shape story in Chat' })).toBeVisible()
    await expect(page.getByText('Story is read-only here.')).toBeVisible()
    await page.getByRole('button', { name: 'Shape story in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    expect(storyReads).toBe(1)
    expect(researchReads).toBe(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('presents the exact timed script with progressive disclosure and responsive keyboard access', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'story-workspace-script', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const storyWorkspace = exactWorkspace(validStoryWorkspaceDto, production)
    storyWorkspace.storyContinuityReview = storyContinuityReview('ready_for_plan_review')
    storyWorkspace.storyBible!.people = [`Lead investigator ${'LongName'.repeat(48)}`]

    await installRoutes(page, production, storyWorkspace)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, width === 375 ? 812 : 900)
      await gotoRoute(page, `${fixture.editPath}?surface=story`)
      await expect(page.getByTestId('storytelling-story-state-script-ready')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Timed script is ready to review' })).toBeVisible()
      await expect(page.getByRole('heading', { name: storyWorkspace.preparedScript!.title })).toBeVisible()
      await expect(page.getByTestId('storytelling-motion-style-review')).toBeVisible()
      await expect(page.getByTestId('storytelling-story-continuity-review')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Question to resolution is prepared' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Compare how this story could move' })).toBeVisible()
      await expect(page.getByText('00:00–00:15')).toBeVisible()
      await expect(page.getByText(storyWorkspace.preparedScript!.chapters[0]!.narrationSegments[0]!.text)).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }

    const styleOptions = page.getByRole('radio')
    await expect(styleOptions).toHaveCount(4)
    await expect(page.getByRole('radio', { name: 'Editorial Collage' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('storytelling-motion-style-detail')).toContainText('Balanced')
    const editorialOption = page.getByRole('radio', { name: 'Editorial Collage' })
    await editorialOption.focus()
    await editorialOption.press('ArrowRight')
    const cinematicOption = page.getByRole('radio', { name: 'Cinematic Realist Documentary' })
    await expect(cinematicOption).toBeFocused()
    await expect(cinematicOption).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('storytelling-motion-style-detail')).toContainText('Selective generated shots')
    await expect(page.getByRole('button', { name: 'Discuss Cinematic Realist Documentary in Chat' })).toBeVisible()
    await expect(page.getByTestId('storytelling-motion-style-review')).not.toContainText('Vox')

    const continuityDisclosure = page.getByText('Story flow details', { exact: true })
    await continuityDisclosure.focus()
    await expect(continuityDisclosure).toBeFocused()
    await continuityDisclosure.press('Enter')
    await expect(page.getByText('Paper route marker', { exact: true })).toBeVisible()
    await expect(page.getByText('2 transitions', { exact: true })).toBeVisible()

    const secondChapter = page.locator('details').filter({ has: page.getByText('The consequence', { exact: true }) }).first()
    const secondSummary = secondChapter.locator(':scope > summary')
    await expect(secondChapter).not.toHaveAttribute('open', '')
    await secondSummary.focus()
    await expect(secondSummary).toBeFocused()
    await secondSummary.press('Enter')
    await expect(secondChapter).toHaveAttribute('open', '')
    await expect(secondChapter.getByText('That single discrepancy forced the team to reconstruct the decision.')).toBeVisible()

    const meaningDisclosure = secondChapter.getByText('Meaning and visual direction', { exact: true })
    await meaningDisclosure.focus()
    await meaningDisclosure.press('Enter')
    await expect(secondChapter.getByText('Connect the evidence to the story consequence.')).toBeVisible()

    const storyBibleDisclosure = page.getByText('Story Bible', { exact: true }).last()
    await storyBibleDisclosure.focus()
    await storyBibleDisclosure.press('Enter')
    await expect(page.getByText(storyWorkspace.storyBible!.premise)).toBeVisible()
    await expect(page.getByText(/Story Bible version 2 · Needs review/)).toBeVisible()

    const reviewAction = page.getByRole('button', { name: 'Review in Chat' })
    await expect(reviewAction).toBeVisible()
    const actionBox = await reviewAction.boundingBox()
    expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    const spinAnimation = await page.getByTestId('storytelling-workspace-panel').evaluate((element) => {
      const spinner = element.querySelector('[class*="spin"]')
      return spinner ? getComputedStyle(spinner).animationName : 'none'
    })
    expect(spinAnimation).toBe('none')
    await page.getByRole('button', { name: 'Discuss Cinematic Realist Documentary in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).toHaveValue(
      'I want to explore the Cinematic Realist Documentary direction for this story. ',
    )
    await expect(page.getByTestId('chat-composer-textarea')).toBeFocused()
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('distinguishes failure, retry recovery, exact-edit mismatch, and approved read-only state', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'story-workspace-recovery', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const approved = approvedWorkspace(exactWorkspace(validStoryWorkspaceDto, production))
    let storyAttempts = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(url)) {
        storyAttempts += 1
        if (storyAttempts === 1) return fulfillError(route, 503, 'STORY_TEMPORARILY_UNAVAILABLE', 'The exact story could not be read.')
        return fulfillData(route, { storyWorkspace: approved })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=story`)
    await expect(page.getByTestId('storytelling-story-state-failure')).toBeVisible()
    await expect(page.getByText('The exact story could not be read.')).toBeVisible()
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-story-state-approved-read-only')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Story and timed script are approved' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Request revision in Chat' })).toBeVisible()
    await expect(page.getByText(/approved story and timed script are locked/i)).toBeVisible()
    expect(storyAttempts).toBe(2)

    await page.unroute(`${apiOrigin}/v1/**`)
    const mismatch = { ...structuredClone(approved), editSessionId: 'another-edit' }
    await installRoutes(page, production, mismatch)
    await page.reload()
    await expect(page.getByTestId('storytelling-story-state-failure')).toBeVisible()
    await expect(page.getByText(/did not match this exact Storytelling project and named edit/i)).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
  })

  test('shows selected, Plan Review, approved, and stale style states without creating another approval surface', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'story-workspace-style-lifecycle', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    let storyWorkspace = exactWorkspace(validStoryWorkspaceDto, production)
    storyWorkspace.motionStyleDecision = styleDecision('selected_for_plan')
    storyWorkspace.storyContinuityReview = storyContinuityReview('needs_preparation')
    storyWorkspace.styleCalibrationReview = styleCalibrationReview('not_ready', 'Editorial Collage')

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(url)) return fulfillData(route, { storyWorkspace })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=story`)
    const styleReview = page.getByTestId('storytelling-motion-style-review')
    await expect(styleReview.getByText('Chosen in Chat', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editorial Collage is ready to add to the plan' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Editorial Collage' })).toHaveAttribute('data-authoritative', 'true')
    await expect(page.getByRole('button', { name: 'Continue planning in Chat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Structure the story flow before Plan Review' })).toBeVisible()

    storyWorkspace = { ...storyWorkspace, motionStyleDecision: styleDecision('awaiting_plan_review') }
    storyWorkspace.storyContinuityReview = storyContinuityReview('ready_for_plan_review')
    storyWorkspace.styleCalibrationReview = styleCalibrationReview('awaiting_plan_review', 'Editorial Collage')
    await page.reload()
    await expect(styleReview.getByText('Awaiting Plan Review', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editorial Collage is included in the current plan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review the plan in Chat' })).toBeVisible()
    await expect(page.getByText('Ready for Plan Review', { exact: false })).toBeVisible()

    storyWorkspace = { ...storyWorkspace, motionStyleDecision: styleDecision('approved_locked') }
    storyWorkspace.storyContinuityReview = storyContinuityReview('approved_locked')
    storyWorkspace.styleCalibrationReview = styleCalibrationReview('approved_not_started', 'Editorial Collage')
    await page.reload()
    await expect(styleReview.getByText('Approved direction', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editorial Collage is locked to the approved plan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Request a style change in Chat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Question to resolution is locked to the approved plan' })).toBeVisible()

    storyWorkspace = { ...storyWorkspace, motionStyleDecision: styleDecision('stale_replan_required') }
    storyWorkspace.storyContinuityReview = storyContinuityReview('stale')
    storyWorkspace.styleCalibrationReview = styleCalibrationReview('stale', 'Cinematic Realist Documentary')
    await page.reload()
    await expect(styleReview.getByText('New plan required', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cinematic Realist Documentary needs a new Plan Review' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Cinematic Realist Documentary' })).toHaveAttribute('data-authoritative', 'true')
    await expect(page.getByRole('heading', { name: 'Story flow no longer matches the current story' })).toBeVisible()
    const impact = page.getByRole('region', { name: 'Style change impact' })
    await expect(impact).toContainText('Keep4')
    await expect(impact).toContainText('Review2')
    await expect(impact).toContainText('Rebuild6')
    await expect(impact).toContainText('earlier approved version remains unchanged')
    await expect(page.getByRole('button', { name: 'Continue replanning in Chat' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Approve|Use credits|Start generation/i })).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('mounts missing, loading, ready, conflict, retry, and approval-lock states in the one Plan Review', async ({ page }) => {
    test.setTimeout(90_000)
    const fixture = await installActiveProductRouteFixture(page, 'style-plan-review-mounted', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await seedSourceReadyStorytellingEdit(page, fixture)
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const readyPreparation = readyStylePlanPreparation(production, activeProductLocalTestScope.workspaceId)
    const planReviewStoryWorkspace = exactWorkspace(validStoryWorkspaceDto, production)
    planReviewStoryWorkspace.storyContinuityReview = storyContinuityReview('ready_for_plan_review')
    const wrongWorkspacePreparation = readyStylePlanPreparation(production, 'workspace-from-another-project')
    let responseMode: 'ready' | 'conflict' | 'wrong_workspace' = 'ready'
    let styleRequests = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (isProductionRoute(route.request().url())) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(route.request().url())) return fulfillData(route, { storyWorkspace: planReviewStoryWorkspace })
      if (isStylePlanPreparationRoute(route.request().url())) {
        styleRequests += 1
        await new Promise((resolve) => setTimeout(resolve, 450))
        if (responseMode === 'conflict') {
          return fulfillError(route, 409, 'MOTION_STUDIO_CONFLICT', 'The exact motion direction changed while this plan was prepared.')
        }
        return fulfillData(route, {
          preparation: responseMode === 'wrong_workspace' ? wrongWorkspacePreparation : readyPreparation,
        })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, fixture.editPath)
    await finishSourceReadyPlanSetup(page)

    const planReview = page.getByTestId('plan-review-card')
    const styleSupplement = page.getByTestId('storytelling-style-plan-review')
    await expect(planReview).toBeVisible()
    await expect(styleSupplement).toContainText('Choose one direction before approval')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()
    expect(styleRequests).toBe(0)

    await page.reload()
    await expect(page.getByTestId('motion-studio-storytelling-workspace-page')).toBeVisible()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()

    const composer = page.getByTestId('chat-composer-textarea')
    await composer.fill('Use Editorial Collage as the motion direction for this story.')
    await page.getByTestId('chat-composer-send').click()
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await createFreshPlanFromPreparedSource(page)
    await expect(styleSupplement).toContainText('Checking the Storytelling style')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()
    await expect(styleSupplement).toContainText('Editorial Collage')
    await expect(styleSupplement).toContainText('five-scene calibration proposal')
    await expect(styleSupplement).toContainText('Execution remains unavailable')
    await expect(page.getByTestId('storytelling-continuity-plan-review')).toContainText('Story flow · Ready for Plan Review')
    await expect(page.getByTestId('storytelling-continuity-plan-review')).toContainText('Question to resolution')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()
    await expect(planReview).toContainText('Plan save did not finish')
    await expect(page.getByRole('button', { name: 'Retry saving this exact plan' })).toBeVisible()

    responseMode = 'conflict'
    await composer.fill('Keep the approved evidence labels concise.')
    await page.getByTestId('chat-composer-send').click()
    await createFreshPlanFromPreparedSource(page)
    await expect(styleSupplement).toContainText('The style could not be verified')
    await expect(styleSupplement).toContainText('exact motion direction changed')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()

    responseMode = 'wrong_workspace'
    await styleSupplement.getByRole('button', { name: 'Try again' }).click()
    await expect(styleSupplement).toContainText('did not match this exact named edit')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()

    responseMode = 'ready'
    await styleSupplement.getByRole('button', { name: 'Try again' }).click()
    await expect(styleSupplement).toContainText('Editorial Collage')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()
    await expect(planReview).toContainText('Plan save did not finish')
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('saves the exact Storytelling style in the canonical handoff while uncompiled rich work keeps approval locked', async ({ page }) => {
    test.setTimeout(120_000)
    const fixture = await installActiveProductRouteFixture(page, 'style-plan-review-canonical-authority', {
      category: 'storytelling',
      preserveOnReload: true,
      productWorkflow: 'motion_studio.storytelling',
    })
    await seedSourceReadyStorytellingEdit(page, fixture)
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const readyPreparation = readyStylePlanPreparation(production, activeProductLocalTestScope.workspaceId)
    const planReviewStoryWorkspace = exactWorkspace(validStoryWorkspaceDto, production)
    planReviewStoryWorkspace.storyContinuityReview = storyContinuityReview('ready_for_plan_review')
    const preferenceAuthority = exactStorytellingPreferenceAuthority(
      fixture.project.id,
      fixture.edit.editSessionId,
    )
    const handoffRequests: Array<Record<string, unknown>> = []
    let presentationRequests = 0
    let approvalRequests = 0
    let executionRequests = 0
    let journeyAvailable = false
    let recoveryReadUnavailableOnce = false

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname

      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(request.url())) return fulfillData(route, { storyWorkspace: planReviewStoryWorkspace })
      if (isStylePlanPreparationRoute(request.url())) {
        return fulfillData(route, { preparation: readyPreparation })
      }
      if (/\/canonical-journey$/u.test(path)) {
        if (journeyAvailable) {
          if (recoveryReadUnavailableOnce) {
            recoveryReadUnavailableOnce = false
            return fulfillError(route, 503, 'TOOL_NOT_READY', 'Canonical journey read is temporarily unavailable.')
          }
          return fulfillData(route, {
            canonicalEditJourney: canonicalPublicationRequiredJourneyFixture(fixture),
          })
        }
        return fulfillError(route, 404, 'PLAN_NOT_APPROVED', 'No canonical plan has been published yet.')
      }
      if (/\/edit-preferences\/planning-authority$/u.test(path)) {
        expect(request.method()).toBe('GET')
        expect(new URL(request.url()).searchParams.get('workspaceId')).toBe(
          activeProductLocalTestScope.workspaceId,
        )
        return fulfillData(route, { authority: preferenceAuthority })
      }
      if (/\/canonical-planning-handoff$/u.test(path) && request.method() === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>
        handoffRequests.push(body)
        journeyAvailable = true
        return fulfillData(route, {
          canonicalPlanningHandoff: canonicalStorytellingStyleHandoff(fixture),
        })
      }
      if (/\/canonical-planning-handoffs\/[^/]+\/plan-presentations$/u.test(path) && request.method() === 'POST') {
        presentationRequests += 1
      }
      if (/\/canonical-approval$/u.test(path) && request.method() === 'POST') {
        approvalRequests += 1
      }
      if (/\/approved-snapshots\/[^/]+\/canonical-execution-package$/u.test(path) || /\/edit-executions\//u.test(path)) {
        executionRequests += 1
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, fixture.editPath)
    const composer = page.getByTestId('chat-composer-textarea')
    await composer.fill('Use Editorial Collage as the motion direction for this story.')
    await page.getByTestId('chat-composer-send').click()
    await finishSourceReadyPlanSetup(page)

    const planReview = page.getByTestId('plan-review-card')
    await expect(planReview).toBeVisible()
    await expect(page.getByTestId('storytelling-style-plan-review')).toContainText('Editorial Collage')
    await expect(page.getByTestId('canonical-planning-save-handoff-saved-waiting-for-compiler')).toBeVisible()
    await expect(planReview).toContainText('Planning inputs saved')
    await expect(planReview).toContainText('still needs an exact execution path')
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()
    await expect(page.getByTestId('plan-review-approve')).toHaveText('Approval not ready')
    await expect.poll(() => handoffRequests.length).toBe(1)

    const handoffBody = handoffRequests[0] as {
      canonicalPlanComponents?: {
        motionStudioStorytellingStyleAuthority?: CanonicalStorytellingStyleAuthorityBrowserProof
      }
    }
    const handoffStyle = handoffBody.canonicalPlanComponents?.motionStudioStorytellingStyleAuthority
    expect(handoffStyle).toMatchObject({
      schemaVersion: 'canonical-storytelling-style-authority-v1',
      workspaceId: activeProductLocalTestScope.workspaceId,
      projectId: fixture.project.id,
      editSessionId: fixture.edit.editSessionId,
      productionId: production.id,
      decisionAuthority: 'existing_plan_review',
      planReviewIsSoleApprovalAuthority: true,
      changedStyleRequiresFreshPlanAndEstimate: true,
      historicalApprovedSnapshotRemainsImmutable: true,
      runtimeExecutionAuthorized: false,
      providerExecutionAuthorized: false,
      customerCommercialAuthorityGranted: false,
      productionReady: false,
      immutable: true,
    })
    expect(handoffStyle?.styleSelection.styleProfile.styleProfileId).toBe('storytelling_style.editorial_collage')
    expect(handoffStyle?.calibrationPlan.scenarioKinds).toEqual([
      'style_led_motion',
      'character_continuity',
      'strict_first_last_frame',
      'reference_heavy',
      'exact_text_data',
    ])
    expect(handoffStyle?.internalCostEnvelope).toMatchObject({
      unit: 'usd_micros',
      internalProductionCostOnly: true,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
    })
    expect(presentationRequests).toBe(0)
    expect(approvalRequests).toBe(0)
    expect(executionRequests).toBe(0)

    const recoveryMarker = await page.evaluate(({ editSessionId, projectId }) => {
      const key = `reeditpro.motion-storytelling-plan-review.v1:${projectId}:${editSessionId}`
      return window.sessionStorage.getItem(key)
    }, {
      editSessionId: fixture.edit.editSessionId,
      projectId: fixture.project.id,
    })
    expect(recoveryMarker).toBeTruthy()
    expect(recoveryMarker).toContain('storytelling-plan-input:')
    expect(recoveryMarker).not.toContain('Use Editorial Collage')
    expect(recoveryMarker).not.toContain(`${fixture.edit.editSessionId}.mp4`)
    expect(recoveryMarker).not.toContain('customInstructions')
    expect(recoveryMarker).not.toContain('editBriefState')
    const savedBeforeReload = await readExactHandoff(page, fixture.edit.editSessionId)
    expect(savedBeforeReload?.setup).toMatchObject({
      sourceOrderConfirmed: true,
      aspectRatioConfirmed: true,
      cleanupPreferenceConfirmed: true,
      editLevelConfirmed: true,
      visualPreferenceConfirmed: true,
      referenceSkipped: true,
    })

    recoveryReadUnavailableOnce = true
    await page.reload()
    await expect(page.getByRole('button', { name: 'Check saved Plan Review again' })).toBeVisible()
    expect(handoffRequests).toHaveLength(1)
    await page.getByRole('button', { name: 'Check saved Plan Review again' }).click()
    await expect(page.getByTestId('storytelling-plan-review-recovered')).toBeVisible()
    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await expect.poll(() => handoffRequests.length).toBe(1)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps a normal named edit byte-for-behavior outside the Storytelling style request path', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'normal-edit-style-zero-call', { category: 'talking_head' })
    let styleRequests = 0
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (isStylePlanPreparationRoute(route.request().url())) styleRequests += 1
      return unexpectedRoute(route)
    })

    await gotoRoute(page, fixture.editPath)
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('storytelling-style-plan-review')).toHaveCount(0)
    expect(styleRequests).toBe(0)
  })

  test('returns a Storytelling private-review change request to Chat without a direct revision pass or new credit reservation', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-private-review-replan', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await seedVerifiedStorytellingPrivateReview(page, fixture)
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const reviewMediaBytes = Buffer.from('storytelling-private-review-canonical-media')
    const finalArtifactSha256 = createHash('sha256').update(reviewMediaBytes).digest('hex')
    let userReviewWrites = 0
    let creditAuthorityWrites = 0
    let revisionRecorded = false

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (/\/canonical-journey$/u.test(path)) {
        return revisionRecorded
          ? fulfillError(route, 404, 'REVISION_PLAN_REQUIRED', 'A fresh Storytelling plan is required.')
          : fulfillData(route, {
              canonicalEditJourney: canonicalPrivateReviewReadyJourneyFixture(
                fixture.project.id,
                fixture.edit.editSessionId,
                finalArtifactSha256,
              ),
            })
      }
      if (request.method() === 'GET' && /\/private-review-assemblies\/storytelling-review-assembly\/media$/u.test(path)) {
        return route.fulfill({
          body: reviewMediaBytes,
          headers: {
            'access-control-allow-origin': 'http://127.0.0.1:5195',
            'access-control-expose-headers': [
              'cache-control',
              'content-disposition',
              'content-length',
              'content-type',
              'x-reeditpro-artifact-sha256',
              'x-reeditpro-review-assembly-id',
              'x-reeditpro-review-manifest-sha256',
            ].join(', '),
            'cache-control': 'private, no-store, max-age=0',
            'content-disposition': 'inline; filename="storytelling-private-review.mp4"',
            'content-length': String(reviewMediaBytes.byteLength),
            'content-type': 'video/mp4',
            'x-reeditpro-artifact-sha256': finalArtifactSha256,
            'x-reeditpro-review-assembly-id': 'storytelling-review-assembly',
            'x-reeditpro-review-manifest-sha256': '7'.repeat(64),
          },
          status: 200,
        })
      }
      if (request.method() !== 'GET' && (
        /\/credit-estimates\/[^/]+\/reserve$/u.test(path) ||
        /\/approved-snapshots$/u.test(path) ||
        /\/edit-plan\/approve$/u.test(path)
      )) {
        creditAuthorityWrites += 1
      }
      if (request.method() === 'POST' && /\/private-review-assemblies\/storytelling-review-assembly\/canonical-decision$/u.test(path)) {
        userReviewWrites += 1
        const body = request.postDataJSON() as {
          decision: string
          revisionIntent?: { summary?: string }
        }
        expect(body.decision).toBe('request_revision')
        expect(body.revisionIntent?.summary).toBe('Keep the evidence, but rebuild the opening with a calmer visual rhythm.')
        revisionRecorded = true
        await markLocalStorytellingRevisionRequested(page, fixture)
        return fulfillData(route, {
          canonicalPrivateReviewDecision: canonicalPrivateReviewDecisionReceiptFixture(
            fixture.project.id,
            fixture.edit.editSessionId,
            finalArtifactSha256,
          ),
        })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=review`)
    const privateReview = page.getByTestId('canonical-private-review')
    await expect(privateReview).toBeVisible()
    await expect(page.getByRole('button', { name: 'Run revised review' })).toHaveCount(0)
    await privateReview.getByRole('button', { name: 'Load private review' }).click()
    await expect(page.getByTestId('canonical-private-review-player')).toBeVisible()
    await privateReview.getByLabel('Revision direction').fill('Keep the evidence, but rebuild the opening with a calmer visual rhythm.')
    await privateReview.getByRole('button', { name: 'Request changes' }).click()

    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    await expect(page.getByTestId('storytelling-workspace-chat')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('canonical-private-review')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Run revised review' })).toHaveCount(0)
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('storytelling-director-read-only')).toHaveCount(0)
    expect(userReviewWrites).toBe(1)
    expect(creditAuthorityWrites).toBe(0)

    const saved = await readExactHandoff(page, fixture.edit.editSessionId)
    expect(saved).toMatchObject({
      // The browser mirror deliberately downgrades to source_uploaded once
      // the obsolete approval/review authorities are cleared. The immutable
      // revision context is what carries the exact change request forward.
      stage: 'source_uploaded',
      revisionPlanContext: {
        contextOnly: true,
        freshPlanRequired: true,
        freshPrivateReviewRequired: true,
        previousStage: 'private_review_verified',
        previousApprovedSnapshotId: 'storytelling-approved-snapshot',
        previousCreditReservationId: 'storytelling-credit-reservation',
      },
    })
    expect(saved?.approvedSnapshotId).toBeUndefined()
    expect(saved?.approvedCreditReservationId).toBeUndefined()
    expect(saved?.privateReview).toBeUndefined()
    await expectNoGenerationBeforeApproval(page)
  })

  test('shows verified calibration progress, recovery, review, blocking, and locked states without provider internals', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'story-workspace-calibration-lifecycle', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    let storyWorkspace = exactWorkspace(validStoryWorkspaceDto, production)
    storyWorkspace.motionStyleDecision = styleDecision('approved_locked')
    storyWorkspace.styleCalibrationReview = styleCalibrationReview('preparing', 'Editorial Collage')

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(url)) return fulfillData(route, { storyWorkspace })
      return unexpectedRoute(route)
    })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoRoute(page, `${fixture.editPath}?surface=story`)
    const calibration = page.getByTestId('storytelling-style-calibration-review')
    await expect(calibration).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Building the five-scene comparison' })).toBeVisible()
    await expect(calibration.getByRole('list', { name: 'Style calibration scenarios' }).getByRole('listitem')).toHaveCount(5)
    await expect(calibration).toContainText('1 reviewable · 1 accepted')
    await expect(calibration).toContainText('Character continuity')
    await expect(calibration).not.toContainText(/provider|model|job|attempt|internal cost|snapshot|digest/i)
    const spinAnimation = await calibration.evaluate((element) => {
      const spinner = element.querySelector('[class*="spin"]')
      return spinner ? getComputedStyle(spinner).animationName : 'none'
    })
    expect(spinAnimation).toBe('none')

    storyWorkspace = { ...storyWorkspace, styleCalibrationReview: styleCalibrationReview('resumable', 'Editorial Collage') }
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calibration can continue from its saved point' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review resume options in Chat' })).toBeVisible()

    storyWorkspace = { ...storyWorkspace, styleCalibrationReview: styleCalibrationReview('needs_review', 'Editorial Collage') }
    await page.reload()
    await expect(page.getByRole('heading', { name: 'The private comparison needs creative review' })).toBeVisible()
    await expect(calibration).toContainText('5 reviewable · 2 accepted')
    await expect(calibration).toContainText('Needs attention')

    storyWorkspace = { ...storyWorkspace, styleCalibrationReview: styleCalibrationReview('blocked', 'Editorial Collage') }
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calibration cannot advance safely' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Resolve the issue in Chat' })).toBeVisible()
    await expect(calibration.getByRole('alert')).toBeVisible()

    storyWorkspace = { ...storyWorkspace, styleCalibrationReview: styleCalibrationReview('approved_locked', 'Editorial Collage') }
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Editorial Collage passed the five-scene calibration' })).toBeVisible()
    await expect(calibration).toContainText('5 reviewable · 5 accepted')
    const approvedReel = calibration.locator('details')
    await expect(approvedReel).not.toHaveAttribute('open', '')
    const approvedReelSummary = approvedReel.locator(':scope > summary')
    await approvedReelSummary.focus()
    await expect(approvedReelSummary).toBeFocused()
    await approvedReelSummary.press('Enter')
    await expect(approvedReel).toHaveAttribute('open', '')
    await expect(calibration.getByText('Character continuity', { exact: true })).toBeVisible()
    await expect(calibration.getByRole('button')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Approve|Use credits|Start generation|Select route/i })).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })
})

function createProduction(projectId: string, editSessionId: string): MotionStudioProductionDto {
  return {
    id: '91919191-9191-4191-8191-919191919191',
    projectId,
    editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: 'draft',
    currentStage: 'story_script',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-20T04:00:00.000Z',
    updatedAt: '2026-07-20T04:00:00.000Z',
    localCandidateOnly: true,
  }
}

function exactWorkspace(
  source: MotionStudioStoryWorkspaceDto,
  production: MotionStudioProductionDto,
): MotionStudioStoryWorkspaceDto {
  return {
    ...structuredClone(source),
    productionId: production.id,
    projectId: production.projectId,
    editSessionId: production.editSessionId,
  }
}

function approvedWorkspace(source: MotionStudioStoryWorkspaceDto): MotionStudioStoryWorkspaceDto {
  const workspace = structuredClone(source)
  workspace.state = 'approved_read_only'
  if (!workspace.storyBible || !workspace.preparedScript) throw new Error('Approved Story fixture requires story and script.')
  workspace.storyBible.versionState = 'approved'
  workspace.storyBible.currentApprovedVersion = workspace.storyBible.currentVersion
  workspace.preparedScript.versionState = 'locked'
  workspace.preparedScript.currentApprovedVersion = workspace.preparedScript.currentVersion
  workspace.notice = 'The approved story and timed script are locked to their exact versions. Request a revision in Chat to change them.'
  return workspace
}

function storyContinuityReview(
  state: StorytellingStoryContinuityReviewDto['state'],
): StorytellingStoryContinuityReviewDto {
  if (state === 'not_ready') return structuredClone(validNotReadyStoryContinuityReviewDto)
  if (state === 'needs_preparation') return {
    ...structuredClone(validNotReadyStoryContinuityReviewDto),
    state,
    statusLabel: 'Story flow needed',
    title: 'Structure the story flow before Plan Review',
    summary: 'The story and timed script are ready, but their opening, payoff, through-line, and scene transitions are not bound yet.',
    nextAction: { kind: 'continue_in_chat', label: 'Structure the story flow in Chat' },
  }
  const prepared = structuredClone(validReadyStoryContinuityReviewDto)
  if (state === 'ready_for_plan_review') return prepared
  if (state === 'approved_locked') return {
    ...prepared,
    state,
    statusLabel: 'Approved story flow',
    title: 'Question to resolution is locked to the approved plan',
    summary: 'The exact story flow is preserved with the approved version. Revisions return through Chat and require a new plan.',
    nextAction: { kind: 'request_revision_in_chat', label: 'Request a story-flow revision in Chat' },
    approvedLocked: true,
  }
  return {
    ...prepared,
    state: 'stale',
    statusLabel: 'New plan required',
    title: 'Story flow no longer matches the current story',
    summary: 'The earlier story flow remains preserved, but the changed story, script, or motion direction requires a fresh Plan Review.',
    nextAction: { kind: 'continue_replanning', label: 'Continue replanning in Chat' },
  }
}

function styleDecision(state: Exclude<StorytellingMotionStyleDecisionState, 'comparison_only'>): StorytellingMotionStyleDecisionDto {
  const editorial = {
    selectedStyleProfileId: 'storytelling_style.editorial_collage' as const,
    selectedStyleDisplayName: 'Editorial Collage',
  }
  const base = {
    schemaVersion: 'motion-studio.storytelling-style-decision.v1' as const,
    decisionAuthority: 'existing_plan_review' as const,
    readOnly: true as const,
    runtimeExecutionAuthorized: false as const,
  }
  if (state === 'selected_for_plan') return {
    ...base,
    ...editorial,
    state,
    statusLabel: 'Chosen in Chat',
    title: 'Editorial Collage is ready to add to the plan',
    summary: 'The direction is captured as draft planning input. It is not approved, generated, or charged yet.',
    nextAction: { kind: 'continue_in_chat', label: 'Continue planning in Chat' },
    planReviewRequired: true,
    approvedLocked: false,
    approvedDecisionPreserved: false,
    calibrationState: 'not_planned',
    calibrationScenarioCount: 0,
  }
  if (state === 'awaiting_plan_review') return {
    ...base,
    ...editorial,
    state,
    statusLabel: 'Awaiting Plan Review',
    title: 'Editorial Collage is included in the current plan',
    summary: 'Review this direction with the existing plan and estimate. Nothing starts until that one Plan Review is approved.',
    nextAction: { kind: 'review_plan', label: 'Review the plan in Chat' },
    planReviewRequired: true,
    approvedLocked: false,
    approvedDecisionPreserved: false,
    calibrationState: 'planning_only',
    calibrationScenarioCount: 5,
  }
  if (state === 'approved_locked') return {
    ...base,
    ...editorial,
    state,
    statusLabel: 'Approved direction',
    title: 'Editorial Collage is locked to the approved plan',
    summary: 'The exact style and bounded calibration plan are preserved with the approved version. Approval alone does not claim that media has been generated.',
    nextAction: { kind: 'request_revision', label: 'Request a style change in Chat' },
    planReviewRequired: false,
    approvedLocked: true,
    approvedDecisionPreserved: true,
    calibrationState: 'approved_not_executed',
    calibrationScenarioCount: 5,
  }
  return {
    ...base,
    selectedStyleProfileId: 'storytelling_style.cinematic_realist_documentary',
    selectedStyleDisplayName: 'Cinematic Realist Documentary',
    state,
    statusLabel: 'New plan required',
    title: 'Cinematic Realist Documentary needs a new Plan Review',
    summary: 'The earlier approval remains immutable. Story and research can stay, while affected visual work is reviewed or rebuilt under a new plan and estimate.',
    nextAction: { kind: 'continue_replanning', label: 'Continue replanning in Chat' },
    planReviewRequired: true,
    approvedLocked: false,
    approvedDecisionPreserved: true,
    calibrationState: 'stale',
    calibrationScenarioCount: 0,
    changeImpact: {
      preservedVersionCount: 4,
      reviewRequiredVersionCount: 2,
      rebuildRequiredVersionCount: 6,
      priorApprovalRemainsImmutable: true,
    },
  }
}

const calibrationScenarioCopy: Readonly<Record<StyleCalibrationScenarioKind, {
  label: string
  purpose: string
}>> = {
  style_led_motion: { label: 'Style-led motion', purpose: 'Checks whether the chosen visual language stays coherent while the scene moves.' },
  character_continuity: { label: 'Character continuity', purpose: 'Checks identity, wardrobe, age, and appearance continuity across motion.' },
  strict_first_last_frame: { label: 'Frame-to-frame control', purpose: 'Checks whether a directed transition reaches its approved opening and ending frames.' },
  reference_heavy: { label: 'Reference-heavy scene', purpose: 'Checks composition, camera, location, object, and motion references together.' },
  exact_text_data: { label: 'Text and data precision', purpose: 'Checks exact editable typography, maps, charts, labels, and evidence graphics.' },
}

const calibrationScenarioKinds = Object.keys(calibrationScenarioCopy) as StyleCalibrationScenarioKind[]

function styleCalibrationReview(
  state: StorytellingStyleCalibrationReviewState,
  selectedStyleDisplayName?: string,
): StorytellingStyleCalibrationReviewDto {
  const statuses = calibrationStatuses(state)
  const scenarios = state === 'not_ready' ? [] : calibrationScenarioKinds.map((kind, index) => ({
    kind,
    ...calibrationScenarioCopy[kind],
    status: statuses[index]!,
    statusLabel: calibrationStatusLabel(statuses[index]!),
  }))
  const content: Record<StorytellingStyleCalibrationReviewState, Pick<StorytellingStyleCalibrationReviewDto,
  'statusLabel' | 'title' | 'summary' | 'nextAction'>> = {
    not_ready: {
      statusLabel: selectedStyleDisplayName ? 'Direction chosen' : 'Not ready',
      title: selectedStyleDisplayName ? 'Add the direction to the plan first' : 'Choose a motion direction before calibration',
      summary: selectedStyleDisplayName
        ? 'The direction is still draft planning input. The five-scene comparison appears only after it enters the existing Plan Review.'
        : 'Compare the motion directions above, then discuss the best fit in Chat.',
      nextAction: { kind: 'discuss_in_chat', label: selectedStyleDisplayName ? 'Continue planning in Chat' : 'Discuss a direction in Chat' },
    },
    awaiting_plan_review: {
      statusLabel: 'Awaiting Plan Review',
      title: 'Five-scene calibration is included in the plan',
      summary: 'Review the bounded comparison and its estimate in the existing Plan Review. Nothing starts from this surface.',
      nextAction: { kind: 'review_plan', label: 'Review the plan in Chat' },
    },
    approved_not_started: {
      statusLabel: 'Not started',
      title: 'The private calibration has not started',
      summary: `${selectedStyleDisplayName} is approved for a bounded five-scene comparison, but there is no verified calibration run to show yet.`,
      nextAction: { kind: 'continue_in_chat', label: 'Check the next step in Chat' },
    },
    preparing: {
      statusLabel: 'Preparing privately',
      title: 'Building the five-scene comparison',
      summary: '1 of 5 scenarios have reached a reviewable outcome. Progress shown here comes only from durable private work state.',
      nextAction: { kind: 'continue_in_chat', label: 'Discuss progress in Chat' },
    },
    resumable: {
      statusLabel: 'Paused safely',
      title: 'Calibration can continue from its saved point',
      summary: '1 of 5 scenarios have reached a reviewable outcome. Completed evidence remains preserved while recovery is reviewed.',
      nextAction: { kind: 'request_recovery_in_chat', label: 'Review resume options in Chat' },
    },
    needs_review: {
      statusLabel: 'Review needed',
      title: 'The private comparison needs creative review',
      summary: '2 of 5 scenarios are accepted. Review the remaining visual behavior before any project-wide routing can be locked.',
      nextAction: { kind: 'continue_in_chat', label: 'Review the comparison in Chat' },
    },
    blocked: {
      statusLabel: 'Needs attention',
      title: 'Calibration cannot advance safely',
      summary: 'A private result is incomplete or inconsistent. No production-scale routing was approved.',
      nextAction: { kind: 'request_recovery_in_chat', label: 'Resolve the issue in Chat' },
    },
    approved_locked: {
      statusLabel: 'Approved routing',
      title: `${selectedStyleDisplayName} passed the five-scene calibration`,
      summary: 'All five scenario decisions are accepted and locked to the approved project version. Changing the direction requires a new plan and estimate.',
      nextAction: { kind: 'request_revision_in_chat', label: 'Request a calibration change in Chat' },
    },
    stale: {
      statusLabel: 'New plan required',
      title: 'The earlier calibration no longer matches the current direction',
      summary: 'Earlier evidence remains preserved. A new plan and estimate must define what can stay, what needs review, and what must be rebuilt.',
      nextAction: { kind: 'continue_replanning', label: 'Continue replanning in Chat' },
    },
  }
  const completedScenarioCount = scenarios.filter((scenario) => [
    'ready_for_review', 'accepted', 'needs_attention',
  ].includes(scenario.status)).length
  return {
    schemaVersion: 'motion-studio.storytelling-style-calibration-review.v1',
    state,
    ...(selectedStyleDisplayName ? { selectedStyleDisplayName } : {}),
    ...content[state],
    scenarios,
    completedScenarioCount,
    acceptedScenarioCount: scenarios.filter((scenario) => scenario.status === 'accepted').length,
    needsAttentionCount: scenarios.filter((scenario) => scenario.status === 'needs_attention').length,
    ...(['preparing', 'resumable'].includes(state) ? { currentScenarioKind: 'character_continuity' as const } : {}),
    decisionAuthority: 'existing_chat_and_plan_review',
    privateReviewOnly: true,
    automaticSelectionAllowed: false,
    approvedPlanMutationAllowed: false,
    readOnly: true,
    runtimeExecutionAuthorized: false,
    notice: 'This is a private, read-only comparison. It never starts media work, changes an approved plan, selects a route automatically, or spends customer credits.',
  }
}

function calibrationStatuses(
  state: StorytellingStyleCalibrationReviewState,
): readonly StorytellingStyleCalibrationScenarioStatus[] {
  if (state === 'preparing' || state === 'resumable') {
    return ['accepted', 'preparing', 'not_started', 'not_started', 'not_started']
  }
  if (state === 'needs_review') {
    return ['accepted', 'accepted', 'ready_for_review', 'ready_for_review', 'needs_attention']
  }
  if (state === 'blocked') {
    return ['accepted', 'needs_attention', 'not_started', 'not_started', 'not_started']
  }
  if (state === 'approved_locked') return Array(5).fill('accepted') as StorytellingStyleCalibrationScenarioStatus[]
  if (state === 'stale') return Array(5).fill('stale') as StorytellingStyleCalibrationScenarioStatus[]
  return Array(state === 'not_ready' ? 0 : 5).fill('not_started') as StorytellingStyleCalibrationScenarioStatus[]
}

function calibrationStatusLabel(status: StorytellingStyleCalibrationScenarioStatus): string {
  return {
    not_started: 'Not started',
    preparing: 'Preparing',
    ready_for_review: 'Ready for review',
    accepted: 'Accepted',
    needs_attention: 'Needs attention',
    stale: 'New plan required',
  }[status]
}

async function seedSourceReadyStorytellingEdit(
  page: Page,
  fixture: ActiveProductRouteFixture,
) {
  const storageKey = buildLocalProjectHandoffStorageKey(activeProductLocalTestScope)
  await page.addInitScript(({ editSessionId, storageKey: key }) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return
    const envelope = JSON.parse(raw) as { handoffs?: Array<Record<string, unknown>> }
    envelope.handoffs = (envelope.handoffs ?? []).map((handoff) => handoff.editSessionId === editSessionId
      ? {
          ...handoff,
          stage: 'source_uploaded',
          sourceFileCount: 1,
          sourceMediaAssets: [{
            mediaAssetId: `media-${editSessionId}`,
            sourceSequenceItemId: `sequence-${editSessionId}`,
            uploadedClipId: `clip-${editSessionId}`,
            uploadedOrder: 1,
            storageProvider: 'local_private',
            storageBucket: 'source-media',
            storagePath: `private/source/${editSessionId}.mp4`,
            fileName: `${editSessionId}.mp4`,
            mimeType: 'video/mp4',
            byteSize: 4096,
            checksumSha256: 'a'.repeat(64),
            sourceMetadata: {
              probeStatus: 'probed',
              source: 'local_ffprobe',
              durationSeconds: 9,
              width: 1920,
              height: 1080,
              videoCodec: 'h264',
              audioCodec: 'aac',
              formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
              streamCount: 2,
              hasVideo: true,
              hasAudio: true,
            },
            privateArtifact: true,
            publicUrl: null,
            signedUrl: null,
          }],
        }
      : handoff)
    window.localStorage.setItem(key, JSON.stringify(envelope))
  }, { editSessionId: fixture.edit.editSessionId, storageKey })
}

async function seedVerifiedStorytellingPrivateReview(
  page: Page,
  fixture: ActiveProductRouteFixture,
) {
  const sourceAsset: NonNullable<LocalInternalProjectHandoff['sourceMediaAssets']>[number] = {
    mediaAssetId: `review-source-${fixture.edit.editSessionId}`,
    sourceSequenceItemId: `review-sequence-${fixture.edit.editSessionId}`,
    uploadedClipId: `review-clip-${fixture.edit.editSessionId}`,
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: 'source-media',
    storagePath: `private/source/${fixture.edit.editSessionId}.mp4`,
    fileName: `${fixture.edit.editSessionId}.mp4`,
    mimeType: 'video/mp4',
    byteSize: 4096,
    checksumSha256: 'a'.repeat(64),
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }
  const sourceSetFingerprint = createLocalSourceSetFingerprint([sourceAsset])
  if (!sourceSetFingerprint) throw new Error('Storytelling private-review fixture needs an exact source fingerprint.')
  const storageKey = buildLocalProjectHandoffStorageKey(activeProductLocalTestScope)
  await page.addInitScript((input) => {
    const raw = window.localStorage.getItem(input.storageKey)
    if (!raw) return
    const envelope = JSON.parse(raw) as { handoffs?: LocalInternalProjectHandoff[] }
    const handoff = envelope.handoffs?.find((candidate) => candidate.editSessionId === input.editSessionId)
    if (!handoff) return
    handoff.stage = 'private_review_verified'
    handoff.sourceFileCount = 1
    handoff.sourceMediaAssets = [input.sourceAsset]
    handoff.sourceSetFingerprint = input.sourceSetFingerprint
    handoff.approvedSnapshotId = 'storytelling-approved-snapshot'
    handoff.approvedCreditReservationId = 'storytelling-credit-reservation'
    handoff.privateReview = {
      manifestVerified: true,
      sourceSetFingerprint: input.sourceSetFingerprint,
      renderPreviewAssemblyId: 'storytelling-review-assembly',
      creditReservationId: 'storytelling-credit-reservation',
      privateInternalDownloadPath: '/v1/edit-executions/private-internal-downloads/storytelling-review/file',
      privateInternalManifestPath: '/v1/edit-executions/private-internal-downloads/storytelling-review/manifest',
      finalRenderArtifactId: 'storytelling-review-artifact',
      editDecisionManifestVerification: {
        manifestVersion: 'private-internal-edit-decision-manifest-v1',
        approvedPlanSnapshotId: 'storytelling-approved-snapshot',
        renderPreviewAssemblyId: 'storytelling-review-assembly',
        creditReservationId: 'storytelling-credit-reservation',
        finalRenderArtifactId: 'storytelling-review-artifact',
        approvedEditContextReady: true,
        approvedEditContext: {
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          goalSummary: 'Create a concise documentary story.',
          editLevel: 'pro',
          editingCategory: 'storytelling',
          aspectRatio: '16:9',
          creditEstimateTotalCredits: 40,
          segmentCount: 3,
          operationCount: 5,
          professionalSkillTrace: null,
          planningContextTrace: null,
        },
        sourceMediaAssetCount: 1,
        clipDecisionCount: 1,
        sourceOrderPreserved: true,
        uploadedOrderMonotonic: true,
        sourceMediaCoverageComplete: true,
        sourceChecksumCoverageComplete: true,
        sourceStorageIdentityCoverageComplete: true,
        processedPrivateArtifactTraceComplete: true,
        processedArtifactCount: 1,
        processedArtifactIds: ['storytelling-review-artifact'],
        firstAppearanceSourceMediaAssetIds: [input.sourceAsset.mediaAssetId],
        firstAppearanceUploadedOrders: [1],
        privateCaptionPackageAttached: true,
        professionalLayerCounts: {
          reviewOverlays: 1,
          captionOverlays: 1,
          transitionPolish: 0,
          visualPolish: 1,
          finalTiming: 1,
          audioPolish: 1,
        },
        verifiedAt: '2026-07-21T12:00:00.000Z',
      },
      reviewVideoMetadata: {
        playable: true,
        durationSeconds: 30,
        width: 1280,
        height: 720,
        verifiedAt: '2026-07-21T12:00:00.000Z',
      },
      updatedAt: '2026-07-21T12:00:00.000Z',
    }
    handoff.updatedAt = '2026-07-21T12:00:00.000Z'
    window.localStorage.setItem(input.storageKey, JSON.stringify(envelope))
  }, {
    editSessionId: fixture.edit.editSessionId,
    projectId: fixture.project.id,
    sourceAsset,
    sourceSetFingerprint,
    storageKey,
  })
}

function canonicalPrivateReviewReadyJourneyFixture(
  projectId: string,
  editSessionId: string,
  finalArtifactSha256: string,
) {
  return {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: {
      workspaceId: activeProductLocalTestScope.workspaceId,
      projectId,
      editSessionId,
    },
    stage: 'private_review_ready',
    nextAction: {
      code: 'record_private_review_decision',
      actor: 'authenticated_user',
      method: 'POST',
      routeTemplate: '/v1/edit-executions/private-review-assemblies/storytelling-review-assembly/canonical-decision',
    },
    planningHandoff: {
      handoffId: 'storytelling-planning-handoff',
      handoffHash: '4'.repeat(64),
      canonicalPlanComponentsHash: '5'.repeat(64),
      publicationStatus: 'published',
    },
    plan: {
      planId: 'storytelling-approved-plan',
      planVersion: 1,
      status: 'approved',
      planHash: '1'.repeat(64),
      estimateId: 'storytelling-approved-estimate',
      estimateStatus: 'approved',
      estimateHash: '2'.repeat(64),
      approvedMaximumCredits: 40,
      workItemCount: 5,
    },
    approval: {
      approvalId: 'storytelling-plan-approval',
      snapshotId: 'storytelling-approved-snapshot',
      snapshotHash: '3'.repeat(64),
      reservationId: 'storytelling-credit-reservation',
      reservationStatus: 'reserved',
      reservedCredits: 40,
      jobCount: 5,
      readyJobCount: 1,
      blockedJobCount: 4,
    },
    execution: {
      packageRecordId: 'storytelling-package-record',
      packageHash: '6'.repeat(64),
      snapshotId: 'storytelling-approved-snapshot',
      purpose: 'private_internal_execution_handoff',
    },
    review: {
      reviewAssemblyId: 'storytelling-review-assembly',
      manifestSha256: '7'.repeat(64),
      finalArtifactSha256,
    },
    permissions: {
      inspectionOnly: true,
      rawPlanInputsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      snapshotMutation: false,
      creditMutation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    },
    testOnly: true,
  }
}

function canonicalPrivateReviewDecisionReceiptFixture(
  projectId: string,
  editSessionId: string,
  finalArtifactSha256: string,
) {
  return {
    schemaVersion: 'canonical-private-review-decision-coordinator-receipt-v1',
    source: 'canonical_private_review_decision_coordinator_service',
    purpose: 'record_canonical_private_review_decision',
    disposition: 'decision_recorded',
    identity: {
      workspaceId: activeProductLocalTestScope.workspaceId,
      projectId,
      editSessionId,
      packageRecordId: 'storytelling-package-record',
      reviewAssemblyId: 'storytelling-review-assembly',
    },
    authority: {
      reviewManifestSha256: '7'.repeat(64),
      finalArtifactSha256,
      exactReviewAuthorityRevalidated: true,
      immutableApprovedSnapshotPreserved: true,
      immutableReviewManifestPreserved: true,
    },
    decision: {
      value: 'request_revision',
      status: 'canonical_revision_requested',
      revisionRequested: true,
      requiresReplanning: true,
      requiresFreshEstimateAndApproval: true,
    },
    readiness: {
      privateReviewDecisionRecorded: true,
      publicExportReady: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      nextRequiredGate: 'canonical_revision_plan_compilation_and_fresh_approval',
    },
    boundaries: {
      rawDecisionAuthorityReturned: false,
      artifactIdentityReturned: false,
      jobOrToolDetailsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      publicArtifactCreated: false,
      publicDeliveryStarted: false,
      productionRenderStarted: false,
      revisionExecutionStarted: false,
      replacementPlanPublished: false,
      customerPriceMutation: false,
      customerCreditMutation: false,
      walletMutation: false,
      reservationMutation: false,
      settlementStarted: false,
      billingStarted: false,
      deploymentStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    decidedAt: '2026-07-22T13:00:00.000Z',
    testOnly: true,
  }
}

async function markLocalStorytellingRevisionRequested(
  page: Page,
  fixture: ActiveProductRouteFixture,
) {
  const storageKey = buildLocalProjectHandoffStorageKey(activeProductLocalTestScope)
  await page.evaluate((input) => {
    const raw = window.localStorage.getItem(input.storageKey)
    if (!raw) return
    const envelope = JSON.parse(raw) as { handoffs?: LocalInternalProjectHandoff[] }
    const handoff = envelope.handoffs?.find((candidate) => candidate.editSessionId === input.editSessionId)
    if (!handoff) return
    handoff.stage = 'revision_requested'
    handoff.revisionPlanContext = {
      request: 'Keep the evidence, but rebuild the opening with a calmer visual rhythm.',
      sourceSetFingerprint: handoff.sourceSetFingerprint,
      previousStage: 'private_review_verified',
      previousReviewVerified: true,
      previousReviewArtifactId: 'storytelling-review-artifact',
      contextOnly: true,
      freshPlanRequired: true,
      freshPrivateReviewRequired: true,
      previousApprovedSnapshotId: 'storytelling-approved-snapshot',
      previousCreditReservationId: 'storytelling-credit-reservation',
      updatedAt: '2026-07-22T13:00:00.000Z',
    }
    handoff.approvedSnapshotId = undefined
    handoff.approvedCreditReservationId = undefined
    handoff.privateReview = undefined
    handoff.updatedAt = '2026-07-22T13:00:00.000Z'
    window.localStorage.setItem(input.storageKey, JSON.stringify(envelope))
  }, {
    editSessionId: fixture.edit.editSessionId,
    storageKey,
  })
}

async function readExactHandoff(page: Page, editSessionId: string) {
  const storageKey = buildLocalProjectHandoffStorageKey(activeProductLocalTestScope)
  return page.evaluate(({ key, targetEditSessionId }) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return undefined
    const envelope = JSON.parse(raw) as { handoffs?: LocalInternalProjectHandoff[] }
    return envelope.handoffs?.find((candidate) => candidate.editSessionId === targetEditSessionId)
  }, { key: storageKey, targetEditSessionId: editSessionId })
}

async function finishSourceReadyPlanSetup(page: Page) {
  await completeRequiredEditorSetupBeforeFootagePrep(page)
  await createFreshPlanFromPreparedSource(page)
}

async function createFreshPlanFromPreparedSource(page: Page) {
  const prepareSource = page.getByRole('button', { name: /Prepare source/i }).first()
  if (await prepareSource.count() && await prepareSource.isVisible()) {
    await clickWhenReady(prepareSource)
    await expect(page.getByText(/Source prep is ready for 1 uploaded source file|Ready to create the plan/i)).toBeVisible()
  }
  await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
  await expect(page.getByTestId('plan-review-card')).toBeVisible()
}

function readyStylePlanPreparation(
  production: MotionStudioProductionDto,
  workspaceId: string,
): StorytellingMotionStylePlanPreparationDto {
  const profile = getStorytellingMotionStyleProfile('storytelling_style.editorial_collage')
  const ownership = {
    workspaceId,
    projectId: production.projectId,
    editSessionId: production.editSessionId,
  }
  const motionDnaVersion = styleVersion('storytelling-motion-dna', 'storytelling-motion-dna-v1', '1')
  const referenceContractVersion = styleVersion('storytelling-reference', 'storytelling-reference-v1', '2')
  const selection = createStorytellingMotionStyleSelection({
    ...ownership,
    id: 'storytelling-style-selection-mounted-plan-review',
    productionId: production.id,
    styleProfile: storytellingMotionStyleProfileReference(profile),
    motionLanguage: profile.motionLanguage,
    motionDnaVersion,
    referenceContractVersions: [referenceContractVersion],
    sourceAuditDigests: ['3'.repeat(64)],
    selectionOrigin: 'user_selected',
    matchedInputAliases: ['editorial collage'],
    customizationNotes: ['Keep evidence labels concise and editable.'],
    state: 'selected_for_plan',
  })
  const calibrationPlan = createStyleCalibrationPlan({
    ...ownership,
    id: 'storytelling-style-calibration-mounted-plan-review',
    productionId: production.id,
    styleSelectionDigest: selection.selectionDigest,
    styleProfile: selection.styleProfile,
    motionLanguage: selection.motionLanguage,
    motionDnaVersion,
    routePolicy: buildMotionStudioGenerationRoutePolicy('video_clip', 'pro'),
    scenarios: mountedCalibrationScenarios(selection.motionLanguage, referenceContractVersion),
    estimatedInternalCostRangeMicros: { minimum: 2_500_000, maximum: 20_000_000 },
    approvalAuthority: {
      state: 'planning_only',
      customerPriceIncluded: false,
      customerCreditsMutated: false,
    },
  }, selection)
  const planReviewInput = createStorytellingMotionStylePlanReviewInput({
    styleSelection: selection,
    calibrationPlan,
  })
  return {
    schemaVersion: 'motion-studio.storytelling-style-plan-preparation.v1',
    productionId: production.id,
    projectId: production.projectId,
    editSessionId: production.editSessionId,
    state: 'ready_for_plan_review',
    decision: styleDecision('awaiting_plan_review'),
    planReviewInput,
    planReviewIsSoleApprovalAuthority: true,
    customerPriceCalculatedHere: false,
    customerCreditsMutated: false,
    runtimeExecutionAuthorized: false,
    localCandidateOnly: true,
  }
}

function mountedCalibrationScenarios(
  motionLanguage: StyleCalibrationScenario['motionLanguage'],
  referenceContractVersion: MotionStudioVersionReference,
): StyleCalibrationScenario[] {
  const narratives: Record<StyleCalibrationScenarioKind, NarrativeFunctionReference> = {
    style_led_motion: mountedNarrative('explain-cause-and-effect', '4'),
    character_continuity: mountedNarrative('introduce-person', '5'),
    strict_first_last_frame: mountedNarrative('transition-chapter', '6'),
    reference_heavy: mountedNarrative('reveal-evidence', '7'),
    exact_text_data: mountedNarrative('quantify', '8'),
  }
  const scenario = (
    kind: StyleCalibrationScenarioKind,
    productionMode: StyleCalibrationScenario['productionMode'],
    recipeFamily: StyleCalibrationScenario['recipeFamily'],
    requiresGeneratedMedia: boolean,
    deterministicTextDataRequired: boolean,
  ): StyleCalibrationScenario => ({
    id: `mounted-calibration-${kind}`,
    kind,
    narrativeFunction: narratives[kind],
    motionLanguage,
    productionMode,
    recipeFamily,
    requiresGeneratedMedia,
    deterministicTextDataRequired,
    referenceContractVersions: [referenceContractVersion],
    acceptanceCriteria: ['Preserve approved meaning, evidence, disclosures, timing, and editability.'],
  })
  return [
    scenario('style_led_motion', 'hybrid_directed', 'editorial_archive_reveal', true, false),
    scenario('character_continuity', 'generative_first', 'cinematic_reconstruction', true, false),
    scenario('strict_first_last_frame', 'generative_first', 'cinematic_reconstruction', true, false),
    scenario('reference_heavy', 'hybrid_directed', 'editorial_archive_reveal', true, false),
    scenario('exact_text_data', 'native_graphics_first', 'native_evidence_graphic', false, true),
  ]
}

function mountedNarrative(id: string, digestCharacter: string): NarrativeFunctionReference {
  return {
    narrativeFunctionId: `narrative_function.${id}`,
    narrativeFunctionVersion: '1.0.0',
    narrativeFunctionDigest: digestCharacter.repeat(64),
  }
}

function styleVersion(
  artifactId: string,
  versionId: string,
  digestCharacter: string,
): MotionStudioVersionReference {
  return { artifactId, versionId, versionNumber: 1, contentDigest: digestCharacter.repeat(64) }
}

function exactStorytellingPreferenceAuthority(
  projectId: string,
  editSessionId: string,
) {
  const values = {
    editLevel: 'pro',
    workflowType: 'social_short_viral_clip',
    cleanupPreference: 'balanced_cleanup',
    visualPreference: 'more_stroke_motion',
    moodStyle: 'emotional',
    creditPreference: 'balanced',
    targetPlatform: 'custom',
  }
  const now = '2026-07-21T12:00:00.000Z'
  return {
    schemaVersion: 'canonical-exact-edit-planning-authority-read-v1',
    sourceAuthority: 'private_exact_edit_preference_compatibility',
    runtimeSource: 'private_internal',
    authorityReadReceiptId: `canonical-exact-edit-read-${editSessionId}`,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId,
    editSessionId,
    recordRevision: 1,
    preferenceRevision: 0,
    planningInputRevision: 0,
    preferenceFingerprintSha256: '7'.repeat(64),
    values,
    baseline: {
      values,
      preferenceSnapshotId: `storytelling-style-preference-${editSessionId}`,
      preferenceFingerprintSha256: '8'.repeat(64),
      capturedAt: now,
      persistenceSource: 'authenticated_private_internal_backend',
      provenance: 'saved_edit_preferences',
    },
    sourcePreparation: {
      status: 'ready',
      sourceCandidateHashSha256: 'a'.repeat(64),
      evidenceHashSha256: 'b'.repeat(64),
      confirmedAt: now,
    },
    frameConfirmation: {
      status: 'confirmed',
      confirmationId: `canonical-frame-${editSessionId}`,
      aspectRatio: '9:16',
      confirmedAt: now,
      authorityDigestSha256: '6'.repeat(64),
    },
    lifecyclePhase: 'planning',
    locked: false,
    currentApplicationState: 'not_selected',
    currentApplicationId: null,
    readAt: now,
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  }
}

function canonicalStorytellingStyleHandoff(fixture: ActiveProductRouteFixture) {
  return {
    schemaVersion: 'canonical-planning-handoff-response-v1',
    source: 'canonical_planning_handoff_service',
    identity: {
      workspaceId: activeProductLocalTestScope.workspaceId,
      projectId: fixture.project.id,
      editSessionId: fixture.edit.editSessionId,
    },
    canonicalPlanComponentsHash: 'c'.repeat(64),
    sourceBindingManifestCandidate: {},
    sourceMediaAuthority: {},
    planningInputAuthority: {},
    resolvedPlanningInputAuthority: {},
    readiness: {
      finalizedSourceMediaVerified: true,
      exactEditPreferencesVerified: true,
      preferenceApplicationVerified: true,
      editBriefVerified: true,
      outputFrameAndCleanupVerified: true,
      readyForCanonicalPlanPublication: true,
    },
    handoffHash: 'b'.repeat(64),
    handoffId: 'canonical-storytelling-style-handoff',
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
    noPlanPublished: true,
    noSnapshotCreated: true,
    noCreditReservation: true,
    noToolExecution: true,
    noProviderCall: true,
    noRender: true,
    testOnly: true,
  }
}

function canonicalPublicationRequiredJourneyFixture(fixture: ActiveProductRouteFixture) {
  return {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: {
      workspaceId: activeProductLocalTestScope.workspaceId,
      projectId: fixture.project.id,
      editSessionId: fixture.edit.editSessionId,
    },
    stage: 'publication_request_required',
    nextAction: {
      code: 'submit_publication_request',
      actor: 'planning_client',
      method: 'POST',
      routeTemplate:
        `/v1/projects/${fixture.project.id}/edit-sessions/${fixture.edit.editSessionId}/` +
        'canonical-planning-handoffs/canonical-storytelling-style-handoff/publication-requests',
    },
    planningHandoff: {
      handoffId: 'canonical-storytelling-style-handoff',
      handoffHash: 'b'.repeat(64),
      canonicalPlanComponentsHash: 'c'.repeat(64),
      publicationStatus: 'unpublished',
    },
    permissions: {
      inspectionOnly: true,
      rawPlanInputsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      snapshotMutation: false,
      creditMutation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    },
    testOnly: true,
  }
}

async function installRoutes(
  page: Page,
  production: MotionStudioProductionDto,
  storyWorkspace: MotionStudioStoryWorkspaceDto,
) {
  await page.route(`${apiOrigin}/v1/**`, async (route) => {
    const url = route.request().url()
    if (isProductionRoute(url)) return fulfillData(route, { production })
    if (isStoryWorkspaceRoute(url)) return fulfillData(route, { storyWorkspace })
    return unexpectedRoute(route)
  })
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isStoryWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/story-workspace$/u.test(new URL(url).pathname)
}

function isResearchWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/research-workspace$/u.test(new URL(url).pathname)
}

function isStylePlanPreparationRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/storytelling-style-plan-preparations$/u.test(new URL(url).pathname)
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

async function unexpectedRoute(route: Route) {
  await fulfillError(route, 404, 'UNEXPECTED_TEST_ROUTE', route.request().url())
}
