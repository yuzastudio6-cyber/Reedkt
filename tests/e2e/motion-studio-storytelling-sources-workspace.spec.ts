import { expect, test, type Page, type Route } from '@playwright/test'

import { validResearchWorkspaceDto } from '../../src/lib/motion-studio/contracts'
import type { MotionStudioProductionDto, MotionStudioResearchWorkspaceDto } from '../../src/types/motion-studio'
import { buildLocalProjectHandoffStorageKey } from '../../src/lib/local-project-handoff'
import {
  activeProductLocalTestScope,
  installActiveProductRouteFixture,
  type ActiveProductRouteFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '93939393-9393-4393-8393-939393939393'

test.describe('Storytelling Sources workspace', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('shows delayed loading and keeps attached Chat material separate from an empty research package', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-sources-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await preserveAttachedSourceCount(page, fixture, 2)
    const production = createProduction(fixture)
    let writes = 0
    let releaseResearchRead: () => void = () => undefined
    const researchGate = new Promise<void>((resolve) => { releaseResearchRead = resolve })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isResearchWorkspaceRoute(request.url())) {
        await researchGate
        return fulfillData(route, { researchWorkspace: createEmptyResearchWorkspace(production.id) })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=sources`)
    const loading = page.getByTestId('motion-studio-research-state-loading')
    await expect(loading).toBeVisible()
    expect(await loading.locator('.motion-studio-research-skeleton').first().evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    releaseResearchRead()

    await expect(page.getByTestId('storytelling-sources-workspace')).toBeVisible()
    await expect(page.getByTestId('storytelling-sources-attachment-notice')).toContainText('2 Chat attachments preserved')
    await expect(page.getByTestId('storytelling-sources-attachment-notice')).toContainText('no reviewed research source record exists yet')
    await expect(page.getByTestId('motion-studio-research-state-empty')).toContainText('No research package exists yet')
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
    expect(writes).toBe(0)
  })

  test('mounts the accepted source, claim, evidence, chronology, coverage, and review truth cleanly', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-sources-ready', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const researchWorkspace = createResearchWorkspace(production.id)
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isResearchWorkspaceRoute(request.url())) return fulfillData(route, { researchWorkspace })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=sources`)
    const workspace = page.getByTestId('storytelling-sources-workspace')
    await expect(workspace).toBeVisible()
    await expect(page.getByRole('heading', { exact: true, name: 'Sources' })).toBeVisible()
    await expect(page.getByTestId('motion-studio-research-state-approved')).toContainText('Research is approved')
    await expect(page.getByText('Reviewed official chronology record')).toBeVisible()
    await expect(page.getByText('Authoritative', { exact: true })).toBeVisible()

    const sourceLibrary = disclosure(page, 'Source Library')
    const claimLedger = disclosure(page, 'Claim Ledger')
    const visualCoverage = disclosure(page, 'Visual Coverage Plan')
    const reviewQueue = disclosure(page, 'Review Queue')
    await expect(sourceLibrary).toHaveAttribute('open', '')
    await expect(sourceLibrary.getByText('Public Domain', { exact: true })).toBeVisible()
    await expect(claimLedger).not.toHaveAttribute('open', '')
    await expect(visualCoverage).not.toHaveAttribute('open', '')
    await expect(reviewQueue).not.toHaveAttribute('open', '')

    const claimSummary = claimLedger.locator('summary')
    await claimSummary.focus()
    await expect(claimSummary).toBeFocused()
    await claimSummary.press('Enter')
    await expect(page.getByText('The first documented event occurred on 12 May 2020.')).toBeVisible()

    for (const section of ['Chronology', 'Evidence Fragments', 'Visual Coverage Plan', 'Technique Blueprints', 'Review Queue']) {
      await expect(page.getByText(section, { exact: true })).toBeVisible()
    }
    await expect(workspace).not.toContainText(/93939393|canonicalUrl|copyrightSafeExcerpt|providerApiKey|signedUrl|database|worker|customer credits|internal cost/i)

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }

    await page.reload()
    await expect(page.getByTestId('storytelling-sources-workspace')).toBeVisible()
    await page.getByTestId('storytelling-workspace-chat').click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    expect(writes).toBe(0)
  })

  test('keeps disputed claims, rights blocks, and bounded public evidence explicit and review-only', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-sources-review', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const researchWorkspace = createNeedsReviewWorkspace(production.id)
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isResearchWorkspaceRoute(request.url())) return fulfillData(route, { researchWorkspace })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=sources`)
    await expect(page.getByTestId('motion-studio-research-state-needs-review')).toContainText('Research needs review')
    const sourceLibrary = disclosure(page, 'Source Library')
    await expect(sourceLibrary.getByText('Disputed', { exact: true })).toBeVisible()
    await expect(sourceLibrary.getByText('Unknown', { exact: true })).toBeVisible()
    await expect(disclosure(page, 'Review Queue')).toHaveAttribute('open', '')
    await expect(page.getByText('Resolve the chronology conflict', { exact: true })).toBeVisible()
    await expect(page.getByTestId('motion-studio-research-external-evidence')).toContainText('Bounded public evidence')
    await expect(page.getByTestId('motion-studio-research-external-evidence')).toContainText('Confirm the event date against the official primary record.')
    await expect(page.getByTestId('motion-studio-research-external-evidence')).toContainText('No capture is eligible for final asset registration or timeline placement.')
    await expect(page.locator('body')).not.toContainText(/https?:\/\/|temporary URL|provider|signed URL|raw capture|database/i)
    await expectNoGenerationBeforeApproval(page)
    expect(writes).toBe(0)
  })

  test('keeps blocked, transport failure, access denial, invalid identity, and retry recovery distinct', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-sources-errors', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let scenario: 'blocked' | 'failure' | 'denied' | 'invalid' | 'ready' = 'blocked'
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (!isResearchWorkspaceRoute(request.url())) return unexpectedRoute(route)
      if (scenario === 'failure') {
        return fulfillError(
          route,
          503,
          'MOTION_STUDIO_RESEARCH_UNAVAILABLE',
          `/v1/motion-studio/productions/${productionId}/research-workspace`,
        )
      }
      if (scenario === 'denied') return fulfillError(route, 403, 'WORKSPACE_ACCESS_DENIED')
      if (scenario === 'invalid') {
        return fulfillData(route, { researchWorkspace: createResearchWorkspace('94949494-9494-4494-8494-949494949494') })
      }
      const researchWorkspace = scenario === 'blocked'
        ? { ...createNeedsReviewWorkspace(production.id), state: 'blocked' as const }
        : createResearchWorkspace(production.id)
      return fulfillData(route, { researchWorkspace })
    })

    await gotoRoute(page, `${fixture.editPath}?surface=sources`)
    await expect(page.getByTestId('motion-studio-research-state-blocked')).toContainText('Research is blocked')

    scenario = 'failure'
    await page.reload()
    await expect(page.getByTestId('motion-studio-research-state-unavailable')).toContainText('Research could not be loaded')
    await expect(page.getByTestId('motion-studio-research-state-unavailable')).toContainText('The current research state is unavailable. No empty result was assumed.')
    await expect(page.getByTestId('motion-studio-research-state-unavailable')).not.toContainText('/v1/motion-studio')
    await expect(page.getByTestId('motion-studio-research-state-empty')).toHaveCount(0)

    scenario = 'ready'
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('motion-studio-research-state-approved')).toBeVisible()

    scenario = 'denied'
    await page.reload()
    await expect(page.getByTestId('motion-studio-research-state-permission-denied')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

    scenario = 'invalid'
    await page.reload()
    await expect(page.getByTestId('motion-studio-research-state-invalid')).toContainText('Research could not be verified')
    expect(writes).toBe(0)
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
    status: 'planning',
    currentStage: 'research',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-19T13:00:00.000Z',
    updatedAt: '2026-07-19T13:00:00.000Z',
    localCandidateOnly: true,
  }
}

function createResearchWorkspace(targetProductionId: string): MotionStudioResearchWorkspaceDto {
  return {
    ...structuredClone(validResearchWorkspaceDto),
    productionId: targetProductionId,
  }
}

function createEmptyResearchWorkspace(targetProductionId: string): MotionStudioResearchWorkspaceDto {
  return {
    ...createResearchWorkspace(targetProductionId),
    state: 'empty',
    sources: [],
    evidence: [],
    claims: [],
    chronology: [],
    visualNeeds: [],
    candidates: [],
    techniqueBlueprints: [],
    reviewQueue: [],
    summary: {
      sourceCount: 0,
      evidenceCount: 0,
      claimCount: 0,
      approvedClaimCount: 0,
      unresolvedContradictionCount: 0,
      visualNeedCount: 0,
      missingVisualCoverageCount: 0,
      rightsBlockedCandidateCount: 0,
    },
  }
}

function createNeedsReviewWorkspace(targetProductionId: string): MotionStudioResearchWorkspaceDto {
  const workspace = createResearchWorkspace(targetProductionId)
  return {
    ...workspace,
    state: 'needs_review',
    scope: { ...workspace.scope, fixtureOnly: false },
    sources: workspace.sources.map((source) => ({
      ...source,
      trustStatus: 'disputed',
      rightsStatus: 'unknown',
      promptInjectionStatus: 'needs_review',
      reviewStatus: 'blocked',
    })),
    claims: workspace.claims.map((claim) => ({
      ...claim,
      classification: 'disputed_claim',
      status: 'needs_review',
      contradictionCount: 1,
      disclosureRequired: true,
      blockingReason: 'Resolve the chronology conflict before factual approval.',
    })),
    chronology: workspace.chronology.map((event) => ({
      ...event,
      contradictionStatus: 'unresolved',
      reviewStatus: 'needs_review',
    })),
    candidates: workspace.candidates.map((candidate) => ({
      ...candidate,
      rightsStatus: 'unknown',
      technicalSuitability: 'review_needed',
      selectionStatus: 'needs_review',
      blockingReason: 'Rights must be reviewed before selection.',
    })),
    reviewQueue: [{
      subjectType: 'chronology_event',
      subjectId: workspace.chronology[0].chronologyEventId,
      label: 'Resolve the chronology conflict',
      reason: 'Two records disagree about the event date.',
      severity: 'blocking',
    }],
    summary: {
      ...workspace.summary,
      approvedClaimCount: 0,
      unresolvedContradictionCount: 1,
      rightsBlockedCandidateCount: 1,
    },
    externalEvidence: {
      ...workspace.externalEvidence,
      state: 'needs_review',
      requestCount: 1,
      capturedRecordCount: 1,
      binaryCaptureCount: 0,
      externalSourceCount: 1,
      openQuestionCount: 1,
      openQuestions: ['Confirm the event date against the official primary record.'],
      reviewOnlyCandidateCount: 1,
    },
    externalRetrievalPerformed: true,
    localFixtureOnly: false,
  }
}

function disclosure(page: Page, label: string) {
  return page.getByText(label, { exact: true }).locator('xpath=ancestor::details')
}

async function preserveAttachedSourceCount(page: Page, fixture: ActiveProductRouteFixture, sourceFileCount: number) {
  await page.addInitScript(({ editSessionId, key, sourceFileCount: count }) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return
    const envelope = JSON.parse(raw) as { handoffs?: Array<{ editSessionId?: string; sourceFileCount?: number }> }
    const edit = envelope.handoffs?.find((candidate) => candidate.editSessionId === editSessionId)
    if (!edit) return
    edit.sourceFileCount = count
    window.localStorage.setItem(key, JSON.stringify(envelope))
  }, {
    editSessionId: fixture.edit.editSessionId,
    key: buildLocalProjectHandoffStorageKey(activeProductLocalTestScope),
    sourceFileCount,
  })
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isResearchWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/research-workspace$/u.test(new URL(url).pathname)
}

async function fulfillData(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, statusCode: 200, data, warnings: [], mockOnly: false }),
  })
}

async function fulfillError(route: Route, status: number, code: string) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, statusCode: status, error: { code, message: code }, warnings: [], mockOnly: false }),
  })
}

async function unexpectedRoute(route: Route) {
  await fulfillError(route, 404, 'UNEXPECTED_TEST_ROUTE')
}
