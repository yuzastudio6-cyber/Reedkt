import { createHash } from 'node:crypto'

import { expect, test, type Route } from '@playwright/test'

import type {
  MotionStudioAnimaticArtifactDto,
  MotionStudioAnimaticAssemblyReceiptDto,
  MotionStudioAnimaticBindingDto,
  MotionStudioAnimaticWorkspaceDto,
  MotionStudioProductionDto,
  MotionStudioWorkGraphDto,
} from '../../src/types/motion-studio'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '81818181-8181-4181-8181-818181818181'
const approvedSnapshotId = '22222222-2222-4222-8222-222222222222'

test.describe('Storytelling timing preview', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('keeps the empty Preview clean, ordered, and connected to Chat', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-preview-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId, 'planning')
    let releaseRead: (() => void) | undefined
    const readGate = new Promise<void>((resolve) => { releaseRead = resolve })

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isAnimaticWorkspaceRoute(url)) {
        await readGate
        return fulfillData(route, { animaticWorkspace: emptyWorkspace() })
      }
      return unexpectedRoute(route)
    })

    await setViewport(page, 1280)
    await gotoRoute(page, `${fixture.editPath}?surface=preview`)
    await expect(page.getByRole('heading', { exact: true, name: 'Preview' })).toBeVisible()
    await expect(page.getByTestId('storytelling-preview-state-loading')).toBeVisible()
    releaseRead?.()

    await expect(page.getByRole('heading', { name: 'Preview comes after the story is timed' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Preview preparation sequence' })).toContainText('Lock the story')
    await expect(page.getByRole('list', { name: 'Preview preparation sequence' })).toContainText('Set narration')
    await expect(page.getByRole('list', { name: 'Preview preparation sequence' })).toContainText('Review the animatic')
    await expect(page.getByTestId('storytelling-workspace-panel')).not.toContainText(/digest|estimate id|provider|Supabase|render binding/i)

    await page.getByRole('button', { name: 'Continue in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('prepares only the exact approved timing preview and shows one queued decision', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-preview-prepare', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId, 'approved_for_execution')
    const assembly = createAssembly()
    const workGraph = createWorkGraph()
    let binding: MotionStudioAnimaticBindingDto | undefined
    let bindingRequest: Record<string, unknown> | undefined

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      const url = request.url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isWorkGraphRoute(url)) return fulfillData(route, { workGraph })
      if (isAnimaticWorkspaceRoute(url)) return fulfillData(route, { animaticWorkspace: workspace(assembly, binding) })
      if (isAnimaticBindingRoute(url) && request.method() === 'POST') {
        bindingRequest = request.postDataJSON() as Record<string, unknown>
        binding = createBinding(assembly, 'queued')
        return fulfillData(route, { binding, animaticWorkspace: workspace(assembly, binding) })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=preview`)
    await expect(page.getByRole('heading', { name: 'Build the timing preview' })).toBeVisible()
    await expect(page.getByText('Preview version details', { exact: true })).toBeVisible()
    await expect(page.getByText('Version 4')).not.toBeVisible()

    const prepare = page.getByTestId('storytelling-prepare-preview')
    const box = await prepare.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    await prepare.click()

    await expect(page.getByRole('heading', { name: 'Your timing preview is in line' })).toBeVisible()
    await expect(page.getByText('No estimated percentage is shown.')).toBeVisible()
    expect(bindingRequest).toEqual({
      approvedSnapshotId,
      animaticArtifactId: assembly.animatic.artifactId,
      animaticVersionId: assembly.animatic.versionId,
      animaticContentDigest: assembly.animatic.contentDigest,
      jobId: '60000001-0000-4000-8000-000000000001',
    })
    expect(bindingRequest).not.toHaveProperty('width')
    expect(bindingRequest).not.toHaveProperty('renderProps')
    expect(bindingRequest).not.toHaveProperty('internalCostMicros')

    await page.getByText('Preview version details', { exact: true }).click()
    await expect(page.getByText('Version 4')).toBeVisible()
    await expect(page.getByText('These versions stay linked to the same approved story plan.')).toBeVisible()
    await expect(page.getByTestId('storytelling-preview-workspace')).not.toContainText(/approvedSnapshotId|contentDigest|narrationAuthorityDigest|customer price|internal production estimate/i)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Your timing preview is in line' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('verifies private playback, recovers cleanly, and remains responsive with reduced motion', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-preview-playback', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId, 'reviewing')
    const assembly = createAssembly()
    const bytes = Buffer.alloc(4096, 17)
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const artifact = createArtifact(sha256, bytes.byteLength)
    const binding = createBinding(assembly, 'ready', artifact)
    let serveCorruptMedia = true

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isWorkGraphRoute(url)) return fulfillData(route, { workGraph: createWorkGraph() })
      if (isAnimaticWorkspaceRoute(url)) return fulfillData(route, { animaticWorkspace: workspace(assembly, binding) })
      if (isAnimaticContentRoute(url)) {
        const responseBytes = serveCorruptMedia ? Buffer.alloc(bytes.byteLength, 99) : bytes
        return route.fulfill({
          status: 200,
          contentType: 'video/mp4',
          headers: { 'content-length': String(responseBytes.byteLength) },
          body: responseBytes,
        })
      }
      return unexpectedRoute(route)
    })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoRoute(page, `${fixture.editPath}?surface=preview`)
    await expect(page.getByRole('heading', { name: 'Your timing preview is ready' })).toBeVisible()
    await expect(page.getByTestId('storytelling-preview-player-failure')).toContainText('The preview could not be verified')
    serveCorruptMedia = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-preview-player-ready')).toBeVisible()
    await expect(page.getByLabel('Private Storytelling timing preview')).toHaveAttribute('src', /^blob:/)
    await expect(page.getByText('0:10 · 1 scene · narration included')).toBeVisible()
    await expect(page.getByText('Storyboard visuals are temporary.')).toBeVisible()

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, width === 375 ? 812 : 900)
      await expect(page.getByTestId('storytelling-preview-workspace')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }

    await expect(page.getByTestId('storytelling-preview-workspace')).not.toContainText(/SHA-256|runtime identity|attestation|QA evidence|private object|signed URL|provider/i)
    await expectNoGenerationBeforeApproval(page)
  })

  test('keeps transport failure, version conflict, access denial, and failed work distinct', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-preview-states', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId, 'planning')
    const assembly = createAssembly()
    let scenario: 'failure' | 'empty' | 'conflict' | 'denied' | 'failed_work' = 'failure'

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isAnimaticWorkspaceRoute(url)) {
        if (scenario === 'failure') return fulfillError(route, 503, 'PREVIEW_UNAVAILABLE')
        if (scenario === 'conflict') return fulfillError(route, 409, 'PREVIEW_VERSION_CONFLICT')
        if (scenario === 'denied') return fulfillError(route, 403, 'PREVIEW_ACCESS_DENIED')
        if (scenario === 'failed_work') {
          return fulfillData(route, { animaticWorkspace: workspace(assembly, createBinding(assembly, 'failed')) })
        }
        return fulfillData(route, { animaticWorkspace: emptyWorkspace() })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=preview`)
    await expect(page.getByTestId('storytelling-preview-state-failure')).toContainText('The preview could not be loaded')
    scenario = 'empty'
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'Preview comes after the story is timed' })).toBeVisible()

    scenario = 'conflict'
    await page.reload()
    await expect(page.getByTestId('storytelling-preview-state-conflict')).toContainText('A newer preview version exists')

    scenario = 'denied'
    await page.reload()
    await expect(page.getByTestId('storytelling-preview-state-permission-denied')).toContainText('This preview is not available to you')
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

    scenario = 'failed_work'
    await page.reload()
    await expect(page.getByRole('heading', { name: 'The preview needs another try' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Check recovery' })).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
  })
})

function createProduction(
  projectId: string,
  editSessionId: string,
  status: MotionStudioProductionDto['status'],
): MotionStudioProductionDto {
  return {
    id: productionId,
    projectId,
    editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status,
    currentStage: 'animatic',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 3,
    createdAt: '2026-07-20T12:00:00.000Z',
    updatedAt: '2026-07-20T12:10:00.000Z',
    localCandidateOnly: true,
  }
}

function emptyWorkspace(): MotionStudioAnimaticWorkspaceDto {
  return { productionId, assemblies: [], bindings: [], localCandidateOnly: true }
}

function createAssembly(): MotionStudioAnimaticAssemblyReceiptDto {
  return {
    productionId,
    approvedSnapshotId,
    preparedScript: version('10000001-0000-4000-8000-000000000001', '10000002-0000-4000-8000-000000000001', 2, '1'),
    voiceBible: version('20000001-0000-4000-8000-000000000001', '20000002-0000-4000-8000-000000000001', 3, '2'),
    storyboard: version('30000001-0000-4000-8000-000000000001', '30000002-0000-4000-8000-000000000001', 3, '3'),
    animatic: version('40000001-0000-4000-8000-000000000001', '40000002-0000-4000-8000-000000000001', 4, '4'),
    narrationAuthorityDigest: '5'.repeat(64),
    localCandidateOnly: true,
  }
}

function createBinding(
  assembly: MotionStudioAnimaticAssemblyReceiptDto,
  status: MotionStudioAnimaticBindingDto['status'],
  artifact?: MotionStudioAnimaticArtifactDto,
): MotionStudioAnimaticBindingDto {
  return {
    id: '50000001-0000-4000-8000-000000000001',
    productionId,
    approvedSnapshotId,
    preparedScript: assembly.preparedScript,
    voiceBible: assembly.voiceBible,
    storyboard: assembly.storyboard,
    animatic: assembly.animatic,
    narrationAuthorityDigest: assembly.narrationAuthorityDigest,
    jobId: '60000001-0000-4000-8000-000000000001',
    approvedWorkItemId: '70000001-0000-4000-8000-000000000001',
    width: 640,
    height: 360,
    fpsNumerator: 30,
    fpsDenominator: 1,
    renderedFrameCount: 300,
    sceneCount: 1,
    status,
    currentAttemptId: '80000001-0000-4000-8000-000000000001',
    ...(artifact ? { artifact } : {}),
    createdAt: '2026-07-20T12:20:00.000Z',
    localCandidateOnly: true,
  }
}

function createArtifact(sha256: string, byteLength: number): MotionStudioAnimaticArtifactDto {
  return {
    id: '90000001-0000-4000-8000-000000000001',
    bindingId: '50000001-0000-4000-8000-000000000001',
    jobId: '60000001-0000-4000-8000-000000000001',
    attemptId: '80000001-0000-4000-8000-000000000001',
    sha256,
    byteLength,
    mimeType: 'video/mp4',
    codec: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    audioCodec: 'aac',
    audioSampleRateHertz: 48_000,
    audioChannelCount: 1,
    width: 640,
    height: 360,
    fpsNumerator: 30,
    fpsDenominator: 1,
    renderedFrameCount: 300,
    frameEvidence: [
      { frame: 0, sha256: 'a'.repeat(64) },
      { frame: 149, sha256: 'b'.repeat(64) },
      { frame: 299, sha256: 'c'.repeat(64) },
    ],
    runtimeIdentityDigest: 'd'.repeat(64),
    attestationDigest: 'e'.repeat(64),
    qaEvidenceDigest: 'f'.repeat(64),
    createdAt: '2026-07-20T12:25:00.000Z',
    localCandidateOnly: true,
  }
}

function createWorkGraph(): MotionStudioWorkGraphDto {
  return {
    productionId,
    approvedSnapshotId,
    costEstimateId: '33333333-3333-4333-8333-333333333333',
    status: 'authorized',
    jobs: [{
      id: '60000001-0000-4000-8000-000000000001',
      productionId,
      approvedSnapshotId,
      approvedWorkItemId: '70000001-0000-4000-8000-000000000001',
      workItemKey: 'prepared-animatic-preview',
      sequenceNumber: 3,
      workItemType: 'render_motion_studio_animatic',
      required: true,
      status: 'queued',
      attemptCount: 0,
      maxAttempts: 2,
      runAfter: '2026-07-20T12:15:00.000Z',
      upstreamJobIds: [],
    }],
    dependencies: [],
    localCandidateOnly: true,
  }
}

function workspace(
  assembly: MotionStudioAnimaticAssemblyReceiptDto,
  binding?: MotionStudioAnimaticBindingDto,
): MotionStudioAnimaticWorkspaceDto {
  return {
    productionId,
    assemblies: [assembly],
    bindings: binding ? [binding] : [],
    localCandidateOnly: true,
  }
}

function version(artifactId: string, versionId: string, versionNumber: number, digestCharacter: string) {
  return { artifactId, versionId, versionNumber, contentDigest: digestCharacter.repeat(64) }
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isWorkGraphRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/work-graph$/u.test(new URL(url).pathname)
}

function isAnimaticWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/animatic-workspace$/u.test(new URL(url).pathname)
}

function isAnimaticBindingRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/animatic-bindings$/u.test(new URL(url).pathname)
}

function isAnimaticContentRoute(url: string): boolean {
  return /\/v1\/motion-studio\/animatic-artifacts\/[^/]+\/content$/u.test(new URL(url).pathname)
}

async function fulfillData(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, statusCode: status, data, warnings: [], mockOnly: false }),
  })
}

async function fulfillError(route: Route, status: number, code: string) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: false,
      statusCode: status,
      error: { code, message: code },
      warnings: [],
      mockOnly: false,
    }),
  })
}

async function unexpectedRoute(route: Route) {
  await route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: false,
      statusCode: 404,
      error: { code: 'UNEXPECTED_TEST_ROUTE', message: route.request().url() },
      warnings: [],
      mockOnly: false,
    }),
  })
}
