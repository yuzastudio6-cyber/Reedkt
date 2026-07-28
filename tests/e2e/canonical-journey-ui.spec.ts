import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  type LocalProjectRecord,
} from '../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import { expectFloatingComposerAligned, expectNoHorizontalOverflow } from './helpers/layout'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  expectNoGenerationBeforeApproval,
  expectNoInternalToolNamesInEditor,
  gotoRoute,
} from './helpers/routes'

const scope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}

test.describe('canonical journey named-edit UI bridge', () => {
  test('saves exact planning inputs and keeps approval locked when richer work has no exact graph', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-plan-save')
    const preferenceRequests = await installExactEditPreferenceAuthority(page, [fixture])
    const handoffRequests: Array<Record<string, unknown>> = []
    let candidateRequestCount = 0

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({
          ok: false,
          error: { code: 'PLAN_NOT_APPROVED', message: 'No workflow yet.' },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoff', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>
      handoffRequests.push(body)
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalPlanningHandoff: canonicalPlanningHandoffFixture(
              fixture.project.id,
              fixture.edit.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoffs/*/publication-requests', async (route) => {
      candidateRequestCount += 1
      await route.abort()
    })

    await gotoRoute(page, fixture.editPath)
    await page.getByTestId('chat-composer-textarea').fill(
      'Create a polished founder update with clean captions, restrained color, and clear audio.',
    )
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await expect(page.getByLabel('Prepared source summary')).toContainText('2s')
    await expect(page.getByLabel('Prepared source summary')).not.toContainText('4:08')
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))

    const planReview = page.getByTestId('plan-review-card')
    await expect(planReview).toBeVisible()
    await expect.poll(() => handoffRequests.length).toBe(1)
    const saveStatus = page.getByTestId('canonical-planning-save-handoff-saved-waiting-for-compiler')
    await expect(saveStatus).toBeVisible()
    await expect(saveStatus).toContainText('Planning inputs saved')
    await expect(saveStatus).toContainText('Saving never approves credits or starts editing')
    await expect(saveStatus).not.toContainText(/\/v1\/|[a-f0-9]{64}|handoff|candidate|ffmpeg|ffprobe|libass|remotion|provider|filesystem|credential/i)

    const requestBody = JSON.stringify(handoffRequests[0])
    expect(preferenceRequests.readCount).toBe(1)
    expect(preferenceRequests.updateCount).toBe(0)
    expect(requestBody).not.toMatch(/storagePath|private\/source|signedUrl|publicUrl|sourceBytes|bytesBase64/)
    expect(requestBody).toContain(`server-preference-${fixture.edit.editSessionId}`)
    expect(requestBody).toContain(fixture.edit.sourceMediaAssets![0]!.sourceSequenceItemId!)
    expect(requestBody).toContain(fixture.edit.sourceMediaAssets![0]!.mediaAssetId)
    expect(requestBody).toContain(fixture.edit.sourceMediaAssets![0]!.checksumSha256!)
    expect(candidateRequestCount).toBe(0)

    const approve = page.getByTestId('plan-review-approve')
    await expect(approve).toBeDisabled()
    await expect(approve).toHaveText('Approval not ready')
    await expectNoGenerationBeforeApproval(page)
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('discards a late plan-save result after the named-edit identity changes', async ({ page }) => {
    const firstFixture = createSourceReadyNamedEdit('late-save-route-a')
    const secondFixture = createSourceReadyNamedEdit('late-save-route-b')
    await installSourceReadyNamedEditFixtures(page, [firstFixture, secondFixture])
    const preferenceRequests = await installExactEditPreferenceAuthority(page, [firstFixture, secondFixture])
    let handoffRequestCount = 0
    let releaseHandoff!: () => void
    const handoffGate = new Promise<void>((resolve) => {
      releaseHandoff = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({
          ok: false,
          error: { code: 'PLAN_NOT_APPROVED', message: 'No workflow yet.' },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoff', async (route) => {
      handoffRequestCount += 1
      await handoffGate
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalPlanningHandoff: canonicalPlanningHandoffFixture(
              firstFixture.project.id,
              firstFixture.edit.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, firstFixture.editPath)
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))
    await expect.poll(() => handoffRequestCount).toBe(1)
    expect(preferenceRequests.readCount).toBe(1)
    await expect(page.getByTestId('canonical-planning-save-saving')).toBeVisible()

    await page.evaluate((path) => {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, secondFixture.editPath)
    await expect(page).toHaveURL(new RegExp(secondFixture.edit.editSessionId))
    await expect(page.getByRole('heading', { level: 1, name: secondFixture.edit.editName })).toBeVisible()
    await expect(page.locator('[data-testid^="canonical-planning-save-"]')).toHaveCount(0)

    releaseHandoff()
    await page.waitForTimeout(100)
    await expect(page.locator('[data-testid^="canonical-planning-save-"]')).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
  })

  test('records one exact approval, recovers the immutable snapshot, and starts no edit work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const identity = {
      projectId: 'canonical-project-approval-browser',
      editSessionId: 'canonical-edit-approval-browser',
    }
    const approvalRequests: Array<{
      authorization: string | null
      idempotencyKey: string | null
      body: Record<string, unknown>
    }> = []
    let approved = false
    let executionRequestCount = 0
    let releaseApproval!: () => void
    const approvalGate = new Promise<void>((resolve) => {
      releaseApproval = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalEditJourney: canonicalApprovalJourneyFixture(
              identity.projectId,
              identity.editSessionId,
              approved,
            ),
          },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/edit-plans/plan-canonical-approval-browser/canonical-approval', async (route) => {
      approvalRequests.push({
        authorization: await route.request().headerValue('authorization'),
        idempotencyKey: await route.request().headerValue('idempotency-key'),
        body: route.request().postDataJSON() as Record<string, unknown>,
      })
      await approvalGate
      approved = true
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalPlanApproval: canonicalApprovalReceiptFixture(identity.projectId, identity.editSessionId) },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/edit-executions/**', async (route) => {
      executionRequestCount += 1
      await route.abort()
    })

    await gotoRoute(page, '/sign-in')
    await page.evaluate(async () => {
      const harness = await import('/tests/e2e/fixtures/mount-canonical-plan-approval-browser-harness.ts')
      harness.mountCanonicalPlanApprovalBrowserHarness()
    })

    const harness = page.getByTestId('canonical-approval-browser-harness')
    await expect(harness).toBeVisible()
    await expect(harness.getByTestId('canonical-journey-status')).toHaveAttribute('data-journey-stage', 'plan_approval_required')
    await expect(harness.getByTestId('plan-review-estimate-credits')).toHaveText('38')
    await expect(harness.getByTestId('plan-review-card')).not.toContainText('11 credits')
    const approve = harness.getByTestId('plan-review-approve')
    await expect(approve).toBeEnabled()
    await expect(approve).toHaveText('Approve plan')

    await approve.click()
    await expect(approve).toBeDisabled()
    await expect(approve).toHaveAttribute('aria-busy', 'true')
    await expect(approve).toHaveText('Approving plan…')
    const approvingStatus = harness.getByTestId('canonical-plan-approval-approving')
    await expect(approvingStatus).toBeVisible()
    await expect(approvingStatus).toHaveAttribute('aria-busy', 'true')
    await expect(approvingStatus).toContainText('Editing will remain stopped')
    await expect.poll(() => approvalRequests.length).toBe(1)
    expect(executionRequestCount).toBe(0)
    await expectNoGenerationBeforeApproval(page)

    const approvalRequest = approvalRequests[0]!
    expect(approvalRequest.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(approvalRequest.idempotencyKey).toMatch(/^canonical-plan-approval:/)
    expect(Object.keys(approvalRequest.body).sort()).toEqual([
      'expectedEditSessionId',
      'expectedEstimateHash',
      'expectedEstimateId',
      'expectedMaximumCredits',
      'expectedPlanHash',
      'expectedPlanVersion',
      'expectedProjectId',
      'workspaceId',
    ])
    expect(approvalRequest.body).toEqual({
      workspaceId: scope.workspaceId,
      expectedProjectId: identity.projectId,
      expectedEditSessionId: identity.editSessionId,
      expectedPlanVersion: 1,
      expectedPlanHash: '1'.repeat(64),
      expectedEstimateId: 'estimate-canonical-approval-browser',
      expectedEstimateHash: '2'.repeat(64),
      expectedMaximumCredits: 38,
    })
    expect(JSON.stringify(approvalRequest.body)).not.toMatch(
      /authorityRevision|internalToken|storagePath|signedUrl|publicUrl|componentRefs|jobIds|sourceBytes|bytesBase64/i,
    )

    releaseApproval()
    const approvalStatus = harness.getByTestId('canonical-plan-approval-approved')
    await expect(approvalStatus).toBeVisible()
    await expect(approvalStatus).toContainText('Plan and credits approved')
    await expect(approvalStatus).toContainText('Editing, rendering, and delivery have not started')
    await expect(approve).toHaveText('Plan approved')
    await expect(harness.getByTestId('canonical-journey-status')).toHaveAttribute('data-journey-stage', 'approved_snapshot_available')
    await expect(harness.getByTestId('canonical-journey-status')).toContainText('Approval is safely recorded')
    await expect.poll(() => executionRequestCount).toBe(0)
    await expectNoGenerationBeforeApproval(page)
    await expect(harness).not.toContainText(/\b(ffmpeg|ffprobe|libass|remotion|provider secret|service role|filesystem path)\b/i)
    await expectNoHorizontalOverflow(page)
  })

  test('requests one exact private handoff without starting browser-owned edit work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-package-request')
    const identity = {
      projectId: fixture.project.id,
      editSessionId: fixture.edit.editSessionId,
    }
    const packageRequests: Array<{
      authorization: string | null
      idempotencyKey: string | null
      body: Record<string, unknown>
      url: string
    }> = []
    let packageRequested = false
    let internalExecutionRequestCount = 0
    let releasePackageRequest!: () => void
    const packageRequestGate = new Promise<void>((resolve) => {
      releasePackageRequest = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalEditJourney: packageRequested
              ? canonicalPackagedJourneyFixture(identity.projectId, identity.editSessionId)
              : canonicalApprovalJourneyFixture(identity.projectId, identity.editSessionId, true),
          },
          warnings: [],
        }),
      })
    })
    await page.route(
      '**/v1/approved-snapshots/snapshot-canonical-approval-browser/canonical-execution-package',
      async (route) => {
        packageRequests.push({
          authorization: await route.request().headerValue('authorization'),
          idempotencyKey: await route.request().headerValue('idempotency-key'),
          body: route.request().postDataJSON() as Record<string, unknown>,
          url: route.request().url(),
        })
        await packageRequestGate
        packageRequested = true
        await route.fulfill({
          contentType: 'application/json',
          status: 201,
          body: JSON.stringify({
            ok: true,
            data: {
              canonicalExecutionPackageRequest: canonicalExecutionPackageRequestReceiptFixture(
                identity.projectId,
                identity.editSessionId,
              ),
            },
            warnings: [],
          }),
        })
      },
    )
    await page.route('**/v1/edit-executions/**', async (route) => {
      internalExecutionRequestCount += 1
      await route.abort()
    })

    await gotoRoute(page, fixture.editPath)

    const status = page.getByTestId('canonical-journey-status')
    await expect(status).toHaveAttribute('data-journey-stage', 'approved_snapshot_available')
    const requestButton = page.getByTestId('canonical-execution-package-request-submit')
    await expect(requestButton).toBeEnabled()
    await expect(requestButton).toHaveText('Prepare private handoff')

    await requestButton.click()
    await expect(requestButton).toBeDisabled()
    await expect(requestButton).toHaveAttribute('aria-busy', 'true')
    await expect(requestButton).toHaveText('Preparing handoff…')
    const requesting = page.getByTestId('canonical-execution-package-request-requesting')
    await expect(requesting).toContainText('Editing tools and rendering remain stopped')
    await expect.poll(() => packageRequests.length).toBe(1)
    expect(internalExecutionRequestCount).toBe(0)

    const request = packageRequests[0]!
    expect(request.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(request.idempotencyKey).toMatch(/^canonical-execution-package:/)
    expect(request.url).toContain(
      '/v1/approved-snapshots/snapshot-canonical-approval-browser/canonical-execution-package',
    )
    expect(request.body).toEqual({
      workspaceId: scope.workspaceId,
      expectedProjectId: identity.projectId,
      expectedEditSessionId: identity.editSessionId,
      expectedSnapshotHash: '3'.repeat(64),
      purpose: 'request_canonical_execution_package',
    })
    expect(JSON.stringify(request.body)).not.toMatch(
      /internalToken|storagePath|signedUrl|publicUrl|componentRefs|jobIds|toolManifest|sourceBytes|bytesBase64/i,
    )

    releasePackageRequest()
    await expect(status).toHaveAttribute('data-journey-stage', 'execution_in_progress')
    await expect(status).toContainText('Private preparation handoff is ready')
    await expect(status).toContainText('Backend preparation has not reported progress yet')
    await expect(page.getByTestId('canonical-execution-package-request-submit')).toHaveCount(0)
    expect(internalExecutionRequestCount).toBe(0)
    await expect(page.getByTestId('editor-page')).not.toContainText(
      /\b(ffmpeg|ffprobe|libass|remotion|provider secret|service role|filesystem path|tool manifest)\b/i,
    )
    await expectNoHorizontalOverflow(page)
  })

  test('starts exact private edit preparation without exposing browser-owned jobs or tools', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-private-preparation')
    const identity = {
      projectId: fixture.project.id,
      editSessionId: fixture.edit.editSessionId,
    }
    const preparationRequests: Array<{
      authorization: string | null
      internalToken: string | null
      idempotencyKey: string | null
      body: Record<string, unknown>
      url: string
    }> = []
    let prepared = false
    let rawInternalRequestCount = 0
    let releasePreparation!: () => void
    const preparationGate = new Promise<void>((resolve) => {
      releasePreparation = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalEditJourney: prepared
              ? canonicalPrivateReviewReadyJourneyFixture(identity.projectId, identity.editSessionId)
              : canonicalPackagedJourneyFixture(identity.projectId, identity.editSessionId),
          },
          warnings: [],
        }),
      })
    })
    await page.route(
      '**/v1/edit-executions/packages/package-canonical-approval-browser/canonical-private-edit-preparation',
      async (route) => {
        preparationRequests.push({
          authorization: await route.request().headerValue('authorization'),
          internalToken: await route.request().headerValue('x-reeditpro-internal-token'),
          idempotencyKey: await route.request().headerValue('idempotency-key'),
          body: route.request().postDataJSON() as Record<string, unknown>,
          url: route.request().url(),
        })
        await preparationGate
        prepared = true
        await route.fulfill({
          contentType: 'application/json',
          status: 201,
          body: JSON.stringify({
            ok: true,
            data: {
              canonicalPrivateEditPreparation: canonicalPrivateEditPreparationReceiptFixture(
                identity.projectId,
                identity.editSessionId,
              ),
            },
            warnings: [],
          }),
        })
      },
    )
    await page.route('**/v1/edit-executions/packages/*/private-internal-work-graph-runs', async (route) => {
      rawInternalRequestCount += 1
      await route.abort()
    })
    await page.route('**/v1/edit-executions/packages/*/private-review-assemblies', async (route) => {
      rawInternalRequestCount += 1
      await route.abort()
    })

    await gotoRoute(page, fixture.editPath)

    const status = page.getByTestId('canonical-journey-status')
    await expect(status).toHaveAttribute('data-journey-stage', 'execution_in_progress')
    const prepareButton = page.getByTestId('canonical-private-edit-preparation-submit')
    await expect(prepareButton).toBeEnabled()
    await expect(prepareButton).toHaveText('Start private edit')

    await prepareButton.click()
    await expect(prepareButton).toBeDisabled()
    await expect(prepareButton).toHaveAttribute('aria-busy', 'true')
    await expect(prepareButton).toHaveText('Preparing review…')
    await expect(page.getByTestId('canonical-private-edit-preparation-preparing')).toContainText(
      'exact approved plan',
    )
    await expect.poll(() => preparationRequests.length).toBe(1)
    expect(rawInternalRequestCount).toBe(0)

    const request = preparationRequests[0]!
    expect(request.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(request.internalToken).toBeNull()
    expect(request.idempotencyKey).toMatch(/^canonical-private-edit:[a-f0-9]{8}$/)
    expect(request.url).toContain(
      '/v1/edit-executions/packages/package-canonical-approval-browser/canonical-private-edit-preparation',
    )
    expect(request.body).toEqual({
      workspaceId: scope.workspaceId,
      expectedProjectId: identity.projectId,
      expectedEditSessionId: identity.editSessionId,
      expectedSnapshotId: 'snapshot-canonical-approval-browser',
      expectedSnapshotHash: '3'.repeat(64),
      expectedPackageHash: '6'.repeat(64),
      purpose: 'prepare_canonical_private_edit_review',
    })
    expect(JSON.stringify(request.body)).not.toMatch(
      /internalToken|credential|storagePath|signedUrl|publicUrl|componentRefs|jobs|tools|command|provider|price|sourceBytes|bytesBase64/i,
    )

    releasePreparation()
    await expect(status).toHaveAttribute('data-journey-stage', 'private_review_ready')
    await expect(status).toContainText('Private review ready')
    await expect(page.getByTestId('canonical-private-edit-preparation-submit')).toHaveCount(0)
    expect(rawInternalRequestCount).toBe(0)
    await expectNoHorizontalOverflow(page)
  })

  test('plays the exact private review, records structured changes, and reopens immutable history', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 })
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-private-review-browser')
    const identity = {
      projectId: fixture.project.id,
      editSessionId: fixture.edit.editSessionId,
    }
    const reviewMediaBytes = Buffer.from('canonical-private-review-browser-playwright-mp4')
    const finalArtifactSha256 = createHash('sha256')
      .update(reviewMediaBytes)
      .digest('hex')
    const decisionManifestSha256 = '9'.repeat(64)
    const mediaRequests: Array<{
      authorization: string | null
      internalToken: string | null
      url: string
    }> = []
    const historyRequests: Array<{
      authorization: string | null
      internalToken: string | null
      url: string
    }> = []
    const decisionRequests: Array<{
      authorization: string | null
      internalToken: string | null
      idempotencyKey: string | null
      body: Record<string, unknown>
      url: string
    }> = []
    let revisionRecorded = false

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalEditJourney: revisionRecorded
              ? canonicalRevisionRequestedJourneyFixture(
                  identity.projectId,
                  identity.editSessionId,
                  finalArtifactSha256,
                  decisionManifestSha256,
                )
              : canonicalPrivateReviewReadyJourneyFixture(
                  identity.projectId,
                  identity.editSessionId,
                  finalArtifactSha256,
                ),
          },
          warnings: [],
        }),
      })
    })
    await page.route(
      '**/v1/edit-executions/private-review-assemblies/review-canonical-approval-browser/media?*',
      async (route) => {
        mediaRequests.push({
          authorization: await route.request().headerValue('authorization'),
          internalToken: await route.request().headerValue('x-reeditpro-internal-token'),
          url: route.request().url(),
        })
        await route.fulfill({
          body: reviewMediaBytes,
          headers: {
            'cache-control': 'private, no-store, max-age=0',
            'content-disposition': 'inline; filename="reeditpro-private-review.mp4"',
            'content-length': String(reviewMediaBytes.byteLength),
            'content-type': 'video/mp4',
            'x-reeditpro-artifact-sha256': finalArtifactSha256,
            'x-reeditpro-review-assembly-id': 'review-canonical-approval-browser',
            'x-reeditpro-review-manifest-sha256': '7'.repeat(64),
          },
          status: 200,
        })
      },
    )
    await page.route(
      '**/v1/edit-executions/private-review-assemblies/review-canonical-approval-browser/canonical-decision',
      async (route) => {
        const body = route.request().postDataJSON() as Record<string, unknown>
        decisionRequests.push({
          authorization: await route.request().headerValue('authorization'),
          internalToken: await route.request().headerValue('x-reeditpro-internal-token'),
          idempotencyKey: await route.request().headerValue('idempotency-key'),
          body,
          url: route.request().url(),
        })
        revisionRecorded = true
        await route.fulfill({
          contentType: 'application/json',
          status: 201,
          body: JSON.stringify({
            ok: true,
            data: {
              canonicalPrivateReviewDecision: canonicalPrivateReviewDecisionReceiptFixture(
                identity.projectId,
                identity.editSessionId,
                finalArtifactSha256,
                'request_revision',
              ),
            },
            warnings: [],
          }),
        })
      },
    )
    await page.route(
      '**/v1/edit-executions/private-review-history/review-canonical-approval-browser/file?*',
      async (route) => {
        historyRequests.push({
          authorization: await route.request().headerValue('authorization'),
          internalToken: await route.request().headerValue('x-reeditpro-internal-token'),
          url: route.request().url(),
        })
        await route.fulfill({
          body: reviewMediaBytes,
          headers: {
            'cache-control': 'private, no-store, max-age=0',
            'content-disposition': 'inline; filename="reeditpro-private-review.mp4"',
            'content-length': String(reviewMediaBytes.byteLength),
            'content-type': 'video/mp4',
            'x-reeditpro-artifact-sha256': finalArtifactSha256,
            'x-reeditpro-review-assembly-id': 'review-canonical-approval-browser',
            'x-reeditpro-review-decision-manifest-sha256': decisionManifestSha256,
          },
          status: 200,
        })
      },
    )

    await gotoRoute(page, fixture.editPath)

    const status = page.getByTestId('canonical-journey-status')
    const reviewPanel = page.getByTestId('canonical-private-review')
    await expect(status).toHaveAttribute('data-journey-stage', 'private_review_ready')
    await expect(reviewPanel).toHaveAttribute('data-mode', 'current')
    await expect(reviewPanel).toContainText('Watch before you decide')

    await page.getByTestId('canonical-private-review-load').click()
    await expect.poll(() => mediaRequests.length).toBe(1)
    const mediaRequest = mediaRequests[0]!
    expect(mediaRequest.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(mediaRequest.internalToken).toBeNull()
    const mediaUrl = new URL(mediaRequest.url)
    expect(mediaUrl.pathname).toBe(
      '/v1/edit-executions/private-review-assemblies/review-canonical-approval-browser/media',
    )
    expect(Object.fromEntries(mediaUrl.searchParams.entries())).toEqual({
      workspaceId: scope.workspaceId,
      packageRecordId: 'package-canonical-approval-browser',
      expectedFinalArtifactSha256: finalArtifactSha256,
      expectedProjectId: identity.projectId,
      expectedEditSessionId: identity.editSessionId,
      expectedManifestSha256: '7'.repeat(64),
      purpose: 'read_canonical_private_review_media',
    })
    expect(mediaRequest.url).not.toMatch(
      /artifactId|jobId|expectedAssetId|credential|signedUrl|publicUrl|storagePath/i,
    )
    await expect(page.getByTestId('canonical-private-review-player')).toBeVisible()
    await expect(page.getByLabel('ReeditPro private review video')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download review' })).toBeVisible()
    await expect(page.getByTestId('canonical-private-review-accept')).toBeEnabled()

    const revisionSummary =
      'Tighten the opening pace, keep the source order, and make the captions smaller.'
    await page.getByLabel(/Revision direction/i).fill(revisionSummary)
    await page.getByTestId('canonical-private-review-request-revision').click()
    await expect.poll(() => decisionRequests.length).toBe(1)

    const decisionRequest = decisionRequests[0]!
    expect(decisionRequest.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(decisionRequest.internalToken).toBeNull()
    expect(decisionRequest.idempotencyKey).toMatch(
      /^canonical-private-review-decision:[a-f0-9]{64}$/,
    )
    expect(decisionRequest.url).toContain(
      '/v1/edit-executions/private-review-assemblies/review-canonical-approval-browser/canonical-decision',
    )
    expect(decisionRequest.body).toEqual({
      workspaceId: scope.workspaceId,
      expectedProjectId: identity.projectId,
      expectedEditSessionId: identity.editSessionId,
      packageRecordId: 'package-canonical-approval-browser',
      expectedManifestSha256: '7'.repeat(64),
      expectedFinalArtifactSha256: finalArtifactSha256,
      purpose: 'record_canonical_private_review_decision',
      decision: 'request_revision',
      revisionIntent: {
        summary: revisionSummary,
        changeCategories: ['pacing', 'caption', 'source_order'],
        mustPreserve: [
          'source_order',
          'source_meaning',
          'important_clips',
          'approved_aspect_ratio',
          'edit_preferences',
          'edit_brief',
        ],
        requiresReplanning: true,
        requiresFreshEstimateAndApproval: true,
      },
    })
    expect(JSON.stringify(decisionRequest.body)).not.toMatch(
      /artifactId|jobId|expectedAssetId|credential|token|signedUrl|publicUrl|storagePath|provider|price/i,
    )

    await expect(status).toHaveAttribute('data-journey-stage', 'revision_requested')
    await expect(status).toContainText('Changes are saved')
    await expect(status).toContainText('fresh plan, estimate, approval, and private review')
    await expect(reviewPanel).toHaveAttribute('data-mode', 'history')
    await expect(page.getByTestId('canonical-private-review-decision')).toHaveCount(0)
    await expect(page.getByText(revisionSummary, { exact: true })).toBeVisible()
    await expect(page.getByText(/previous private review stays as context only/i)).toBeVisible()
    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await expect(page).toHaveURL(/\?view=preferences$/)
    await expect(page.getByTestId('current-edit-preferences-locked')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Apply to this edit' })).toBeDisabled()
    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
    await expect(page).not.toHaveURL(/\?view=preferences$/)

    await status.getByRole('button', { name: 'Refresh saved workflow status' }).click()
    await expect(page.getByTestId('canonical-private-review-load')).toBeVisible()
    await page.getByTestId('canonical-private-review-load').click()
    await expect.poll(() => historyRequests.length).toBe(1)
    const historyRequest = historyRequests[0]!
    expect(historyRequest.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(historyRequest.internalToken).toBeNull()
    const historyUrl = new URL(historyRequest.url)
    expect(Object.fromEntries(historyUrl.searchParams.entries())).toEqual({
      workspaceId: scope.workspaceId,
      packageRecordId: 'package-canonical-approval-browser',
      expectedFinalArtifactSha256: finalArtifactSha256,
      expectedDecisionManifestSha256: decisionManifestSha256,
      purpose: 'download_canonical_private_review_history_artifact',
    })
    await expect(page.getByTestId('canonical-private-review-player')).toBeVisible()
    await expect(reviewPanel).toContainText('Reopen this review version')
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
  })

  test('presents revision plan v2 with a fresh estimate and requires a new approval', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 })
    const identity = {
      projectId: 'canonical-project-revision-browser',
      editSessionId: 'canonical-edit-revision-browser',
    }
    const finalArtifactSha256 = '5'.repeat(64)
    const decisionManifestSha256 = '6'.repeat(64)
    const revisionRequests: Array<{
      authorization: string | null
      internalToken: string | null
      idempotencyKey: string | null
      body: Record<string, unknown>
    }> = []
    const approvalRequests: Array<{
      authorization: string | null
      idempotencyKey: string | null
      body: Record<string, unknown>
    }> = []
    let replacementPresented = false
    let replacementApproved = false
    let maximumCredits = 0
    let executionRequestCount = 0
    let releasePresentation!: () => void
    const presentationGate = new Promise<void>((resolve) => {
      releasePresentation = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      const journey = replacementPresented
        ? canonicalReplacementPlanJourneyFixture(
            identity.projectId,
            identity.editSessionId,
            maximumCredits,
            replacementApproved,
          )
        : canonicalRevisionRequestedJourneyFixture(
            identity.projectId,
            identity.editSessionId,
            finalArtifactSha256,
            decisionManifestSha256,
          )
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: journey },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/edit-preferences/planning-authority?*', async (route) => {
      expect(route.request().method()).toBe('GET')
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            authority: exactRevisionPreferenceAuthorityFixture(
              identity.projectId,
              identity.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })
    await page.route(
      '**/v1/projects/*/edit-sessions/*/canonical-revision-plan-presentations',
      async (route) => {
        const body = route.request().postDataJSON() as Record<string, unknown>
        revisionRequests.push({
          authorization: await route.request().headerValue('authorization'),
          internalToken: await route.request().headerValue('x-reeditpro-internal-token'),
          idempotencyKey: await route.request().headerValue('idempotency-key'),
          body,
        })
        const canonicalPlan = asRecord(body.canonicalPlan)
        const estimate = asRecord(canonicalPlan.estimate)
        const lineItems = estimate.lineItems as Array<{ estimatedCredits: number }>
        maximumCredits = lineItems.reduce(
          (total, item) => total + item.estimatedCredits,
          Number(estimate.fallbackAllowanceCredits),
        )
        await presentationGate
        replacementPresented = true
        await route.fulfill({
          contentType: 'application/json',
          status: 201,
          body: JSON.stringify({
            ok: true,
            data: {
              canonicalRevisionPlanPresentation:
                canonicalRevisionPlanPresentationReceiptFixture(
                  identity.projectId,
                  identity.editSessionId,
                ),
            },
            warnings: [],
          }),
        })
      },
    )
    await page.route(
      '**/v1/edit-plans/plan-canonical-revision-browser-v2/canonical-approval',
      async (route) => {
        approvalRequests.push({
          authorization: await route.request().headerValue('authorization'),
          idempotencyKey: await route.request().headerValue('idempotency-key'),
          body: route.request().postDataJSON() as Record<string, unknown>,
        })
        replacementApproved = true
        await route.fulfill({
          contentType: 'application/json',
          status: 201,
          body: JSON.stringify({
            ok: true,
            data: {
              canonicalPlanApproval: canonicalReplacementPlanApprovalReceiptFixture(
                identity.projectId,
                identity.editSessionId,
                maximumCredits,
              ),
            },
            warnings: [],
          }),
        })
      },
    )
    await page.route('**/v1/edit-executions/**', async (route) => {
      executionRequestCount += 1
      await route.abort()
    })

    await gotoRoute(page, '/sign-in')
    await page.evaluate(async () => {
      const harness = await import('/tests/e2e/fixtures/mount-canonical-revision-plan-browser-harness.ts')
      harness.mountCanonicalRevisionPlanBrowserHarness()
    })

    const harness = page.getByTestId('canonical-revision-plan-browser-harness')
    const prepare = harness.getByTestId('canonical-revision-plan-prepare')
    await expect(harness.getByTestId('canonical-journey-status')).toHaveAttribute(
      'data-journey-stage',
      'revision_requested',
    )
    await expect(prepare).toBeEnabled()
    await prepare.click()
    await expect(prepare).toBeDisabled()
    await expect(prepare).toHaveAttribute('aria-busy', 'true')
    await expect(prepare).toHaveText('Preparing revised plan…')
    await expect(harness.getByTestId('canonical-planning-save-saving')).toBeVisible()
    await expect.poll(() => revisionRequests.length).toBe(1)

    const revisionRequest = revisionRequests[0]!
    expect(revisionRequest.authorization).toBe('Bearer canonical-journey-playwright-token')
    expect(revisionRequest.internalToken).toBeNull()
    expect(revisionRequest.idempotencyKey).toMatch(
      /^canonical-revision-plan-presentation:[a-f0-9]{8}$/,
    )
    expect(Object.keys(revisionRequest.body).sort()).toEqual([
      'canonicalPlan',
      'expectedDecisionManifestSha256',
      'expectedFinalArtifactSha256',
      'expectedPackageRecordId',
      'expectedReviewAssemblyId',
      'orderedSourceItems',
      'purpose',
      'workspaceId',
    ])
    const canonicalPlan = asRecord(revisionRequest.body.canonicalPlan)
    const components = asRecord(canonicalPlan.components)
    const compiledIntent = asRecord(components.compiledIntent)
    expect('revisionAuthority' in revisionRequest.body).toBe(false)
    expect('revisionIntentHash' in compiledIntent).toBe(false)
    expect('priorApprovedSnapshotId' in compiledIntent).toBe(false)
    expect('reviewDecisionId' in compiledIntent).toBe(false)
    expect(JSON.stringify(revisionRequest.body)).not.toMatch(
      /storagePath|source-must-not-cross|signedUrl|publicUrl|sourceBytes|bytesBase64|internalToken/i,
    )
    expect(executionRequestCount).toBe(0)

    releasePresentation()
    await expect(harness.getByTestId('canonical-planning-save-plan-published-waiting-for-approval')).toContainText(
      'previous approval was not reused',
    )
    await expect(harness.getByTestId('canonical-journey-status')).toHaveAttribute(
      'data-journey-stage',
      'plan_approval_required',
    )
    const approve = harness.getByTestId('plan-review-approve')
    await expect(approve).toBeEnabled()
    await expect(approve).toHaveText('Approve plan')
    await approve.click()
    await expect.poll(() => approvalRequests.length).toBe(1)
    expect(approvalRequests[0]?.body).toEqual({
      workspaceId: scope.workspaceId,
      expectedProjectId: identity.projectId,
      expectedEditSessionId: identity.editSessionId,
      expectedPlanVersion: 2,
      expectedPlanHash: '8'.repeat(64),
      expectedEstimateId: 'estimate-canonical-revision-browser-v2',
      expectedEstimateHash: 'd'.repeat(64),
      expectedMaximumCredits: maximumCredits,
    })
    await expect(harness.getByTestId('canonical-plan-approval-approved')).toContainText(
      'Plan and credits approved',
    )
    await expect(harness.getByTestId('canonical-journey-status')).toHaveAttribute(
      'data-journey-stage',
      'approved_snapshot_available',
    )
    expect(executionRequestCount).toBe(0)
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps Current Edit Preferences locked after the approved handoff is recovered', async ({ page }) => {
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-preferences-lock')
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalEditJourney: canonicalPackagedJourneyFixture(
              fixture.project.id,
              fixture.edit.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, fixture.editPath)
    await expect(page.getByTestId('canonical-journey-status')).toHaveAttribute(
      'data-journey-stage',
      'execution_in_progress',
    )
    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await expect(page).toHaveURL(/\?view=preferences$/)
    await expect(page.getByTestId('current-edit-preferences-locked')).toBeVisible()
    await expect(page.getByTestId('current-edit-preferences-form')).toContainText(
      'Request a revision in Chat',
    )
    await expect(page.getByRole('button', { name: 'Apply to this edit' })).toBeDisabled()
  })

  test('rehydrates an accepted private review without reopening source preparation', async ({ page }) => {
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-review-accepted-reload')
    await installExactEditPreferenceAuthority(page, [fixture])
    let planningMutationCount = 0

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalEditJourney: canonicalPrivateReviewAcceptedJourneyFixture(
              fixture.project.id,
              fixture.edit.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoff', async (route) => {
      planningMutationCount += 1
      await route.abort()
    })

    const expectRecoveredApproval = async () => {
      await expect(page.getByTestId('canonical-journey-status')).toHaveAttribute(
        'data-journey-stage',
        'private_review_accepted',
      )
      await expect(page.getByTestId('editor-header')).toContainText('Review approved')
      await expect(page.getByTestId('editor-header')).toContainText('Estimate in plan')
      await expect(page.getByTestId('editor-stage')).toHaveAttribute(
        'data-editor-stage',
        'private_review',
      )
      await expect(page.getByRole('heading', { name: 'Review approved' })).toBeVisible()
      await expect(page.getByRole('button', { name: /^Prepare source$/i })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /^Create edit plan$/i })).toHaveCount(0)
      await expect(page.getByTestId('editor-stage')).toContainText(
        'Sharing, delivery, and release remain gated',
      )
    }

    await gotoRoute(page, fixture.editPath)
    await expectRecoveredApproval()
    expect(planningMutationCount).toBe(0)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expectRecoveredApproval()
    expect(planningMutationCount).toBe(0)
  })

  test('shows loading, bounded execution progress, and an accessible manual refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'execution-progress')
    let requestCount = 0
    let seenAuthorization = ''
    let releaseFirstResponse!: () => void
    const firstResponseGate = new Promise<void>((resolve) => {
      releaseFirstResponse = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      requestCount += 1
      seenAuthorization = await route.request().headerValue('authorization') ?? ''
      if (requestCount === 1) await firstResponseGate
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: executionJourney(fixture.project.id, fixture.edit.editSessionId) },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, '/dashboard')
    await page.goto(fixture.editPath, { waitUntil: 'domcontentloaded' })
    await expect.poll(() => requestCount).toBe(1)
    await expect(page.getByTestId('canonical-journey-status-loading')).toBeVisible()
    releaseFirstResponse()

    const status = page.getByTestId('canonical-journey-status')
    await expect(status).toBeVisible()
    await expect(status).toHaveAttribute('data-journey-stage', 'execution_in_progress')
    await expect(status).toContainText('Preparing private review')
    await expect(status).toContainText('2 of 4 preparation steps are complete')
    await expect(status).toContainText('does not start editing, spend credits, or publish the video')
    await expect(status).not.toContainText(/\/v1\/|[a-f0-9]{64}|packageRecordId|snapshotId|provider|filesystem|credential/i)

    const progress = status.getByRole('progressbar')
    await expect(progress).toHaveAttribute('aria-valuemin', '0')
    await expect(progress).toHaveAttribute('aria-valuenow', '2')
    await expect(progress).toHaveAttribute('aria-valuemax', '4')

    const refresh = status.getByRole('button', { name: 'Refresh saved workflow status' })
    await expect(refresh).toHaveAttribute('title', 'Refresh saved workflow status')
    await refresh.click()
    await expect.poll(() => requestCount).toBeGreaterThan(1)
    expect(seenAuthorization).toBe('Bearer canonical-journey-playwright-token')

    await expectNoGenerationBeforeApproval(page)
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('fails closed on foreign workflow identity without exposing a retry loop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'foreign-identity')

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      const journey = executionJourney(fixture.project.id, fixture.edit.editSessionId)
      ;(journey.identity as Record<string, unknown>).workspaceId = 'workspace-foreign'
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: journey },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, fixture.editPath)
    const rejected = page.getByTestId('canonical-journey-status-invalid-response')
    await expect(rejected).toBeVisible()
    await expect(rejected).toContainText('Saved workflow needs verification')
    await expect(rejected).toContainText('No editing, credit, or publishing action started')
    await expect(rejected.getByRole('button', { name: /Retry saved workflow status/i })).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('clears the prior recovered status when the named-edit identity changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const firstFixture = createSourceReadyNamedEdit('identity-route-a')
    const secondFixture = createSourceReadyNamedEdit('identity-route-b')
    await installSourceReadyNamedEditFixtures(page, [firstFixture, secondFixture])
    let secondRequestCount = 0
    let releaseSecondResponse!: () => void
    const secondResponseGate = new Promise<void>((resolve) => {
      releaseSecondResponse = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      const isSecondEdit = route.request().url().includes(secondFixture.edit.editSessionId)
      const fixture = isSecondEdit ? secondFixture : firstFixture
      const journey = executionJourney(fixture.project.id, fixture.edit.editSessionId)
      if (isSecondEdit) {
        secondRequestCount += 1
        journey.workGraphProgress.completedJobCount = 1
        journey.workGraphProgress.pendingJobCount = 3
        journey.workGraphProgress.requiredIncompleteJobCount = 3
        await secondResponseGate
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: journey },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, firstFixture.editPath)
    const status = page.getByTestId('canonical-journey-status')
    await expect(status).toContainText('2 of 4 preparation steps are complete')

    await page.evaluate((path) => {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, secondFixture.editPath)
    await expect.poll(() => secondRequestCount).toBe(1)
    await expect(page.getByTestId('canonical-journey-status-loading')).toBeVisible()
    await expect(status).toHaveCount(0)

    releaseSecondResponse()
    await expect(page.getByTestId('canonical-journey-status')).toContainText('1 of 4 preparation steps are complete')
    await expectNoGenerationBeforeApproval(page)
  })
})

async function installSourceReadyNamedEdit(page: Page, label: string) {
  const fixture = createSourceReadyNamedEdit(label)
  await installSourceReadyNamedEditFixtures(page, [fixture])
  return fixture
}

function createSourceReadyNamedEdit(label: string) {
  const normalized = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const projectId = `canonical-project-${normalized}`
  const editSessionId = `canonical-edit-${normalized}`
  const now = '2026-07-13T12:00:00.000Z'
  const project: LocalProjectRecord = {
    id: projectId,
    workspaceId: scope.workspaceId,
    name: `Canonical journey ${label}`,
    category: 'storytelling',
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const editPath = `/projects/${projectId}/edits/${editSessionId}`
  const edit: LocalInternalProjectHandoff = {
    id: editSessionId,
    workspaceId: scope.workspaceId,
    projectId,
    editSessionId,
    projectName: project.name,
    editName: `Workflow state ${label}`,
    category: project.category,
    editorPath: editPath,
    stage: 'source_uploaded',
    sourceFileCount: 1,
    sourceMediaAssets: [{
      mediaAssetId: `media-${normalized}`,
      sourceSequenceItemId: `sequence-${normalized}`,
      uploadedClipId: `clip-${normalized}`,
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storageBucket: 'source-media',
      storagePath: `private/source/${normalized}.mp4`,
      fileName: `${normalized}.mp4`,
      mimeType: 'video/mp4',
      byteSize: 4096,
      checksumSha256: 'a'.repeat(64),
      sourceMetadata: {
        probeStatus: 'probed',
        source: 'local_ffprobe',
        durationSeconds: 2,
        width: 720,
        height: 1280,
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
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
  return { edit, editPath, project }
}

async function installSourceReadyNamedEditFixtures(
  page: Page,
  fixtures: ReturnType<typeof createSourceReadyNamedEdit>[],
) {
  const now = '2026-07-13T12:00:00.000Z'
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(scope)

  await page.addInitScript((input) => {
    window.localStorage.setItem(input.projectStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      projects: input.projects,
      savedAt: input.now,
    }))
    window.localStorage.setItem(input.handoffStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      handoffs: input.edits,
      savedAt: input.now,
    }))
  }, {
    edits: fixtures.map((fixture) => fixture.edit),
    handoffStorageKey: buildLocalProjectHandoffStorageKey(scope),
    now,
    projects: fixtures.map((fixture) => fixture.project),
    projectStorageKey: buildLocalProjectStorageKey(scope),
    scope,
    scopeFingerprint,
  })
}

async function installExactEditPreferenceAuthority(
  page: Page,
  fixtures: ReturnType<typeof createSourceReadyNamedEdit>[],
) {
  const authorities = new Map(fixtures.map((fixture) => [
    fixture.edit.editSessionId,
    exactEditPreferenceAuthorityFixture(fixture.project.id, fixture.edit.editSessionId),
  ]))
  const requestCounts = { readCount: 0 }

  await page.route('**/v1/projects/*/edit-sessions/*/edit-preferences/planning-authority?*', async (route) => {
    const url = new URL(route.request().url())
    const match = url.pathname.match(
      /^\/v1\/projects\/([^/]+)\/edit-sessions\/([^/]+)\/edit-preferences\/planning-authority$/,
    )
    const projectId = match?.[1] ? decodeURIComponent(match[1]) : ''
    const editSessionId = match?.[2] ? decodeURIComponent(match[2]) : ''
    const authority = authorities.get(editSessionId)
    if (
      route.request().method() !== 'GET'
      || url.searchParams.get('workspaceId') !== scope.workspaceId
      || !authority
      || authority.projectId !== projectId
    ) {
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({
          ok: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Exact preference authority was not found.' },
          warnings: [],
        }),
      })
      return
    }

    requestCounts.readCount += 1
    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify({
        ok: true,
        data: { authority },
        warnings: [],
      }),
    })
  })

  return {
    get readCount() {
      return requestCounts.readCount
    },
    get updateCount() {
      return 0
    },
  }
}

function exactEditPreferenceAuthorityFixture(projectId: string, editSessionId: string) {
  const values = {
    editLevel: 'pro' as const,
    workflowType: 'social_short_viral_clip' as const,
    cleanupPreference: 'balanced_cleanup' as const,
    visualPreference: 'more_stroke_motion' as const,
    moodStyle: 'emotional' as const,
    creditPreference: 'balanced' as const,
    targetPlatform: 'custom' as const,
  }
  const now = '2026-07-13T12:00:00.000Z'
  return {
    schemaVersion: 'canonical-exact-edit-planning-authority-read-v1',
    sourceAuthority: 'private_exact_edit_preference_compatibility',
    runtimeSource: 'private_internal',
    authorityReadReceiptId: `canonical-exact-edit-read-${editSessionId}`,
    workspaceId: scope.workspaceId,
    projectId,
    editSessionId,
    recordRevision: 1,
    preferenceRevision: 0,
    planningInputRevision: 0,
    preferenceFingerprintSha256: '7'.repeat(64),
    values,
    baseline: {
      values,
      preferenceSnapshotId: `server-preference-${editSessionId}`,
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

function exactRevisionPreferenceAuthorityFixture(
  projectId: string,
  editSessionId: string,
) {
  const values = {
    editLevel: 'pro' as const,
    workflowType: 'product_demo' as const,
    cleanupPreference: 'preserve_natural' as const,
    visualPreference: 'no_extra_visuals' as const,
    moodStyle: 'clean' as const,
    creditPreference: 'balanced' as const,
    targetPlatform: 'youtube' as const,
  }
  const now = '2026-07-13T12:00:00.000Z'
  return {
    schemaVersion: 'canonical-exact-edit-planning-authority-read-v1',
    sourceAuthority: 'private_exact_edit_preference_compatibility',
    runtimeSource: 'private_internal',
    authorityReadReceiptId: 'canonical-exact-edit-read-revision-v2',
    workspaceId: scope.workspaceId,
    projectId,
    editSessionId,
    recordRevision: 7,
    preferenceRevision: 0,
    planningInputRevision: 0,
    preferenceFingerprintSha256: '7'.repeat(64),
    values,
    baseline: {
      values,
      preferenceSnapshotId: 'server-revision-preference-snapshot',
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
      aspectRatio: '16:9',
      confirmationId: 'canonical-revision-frame',
      confirmedAt: now,
      authorityDigestSha256: '6'.repeat(64),
    },
    lifecyclePhase: 'revision_requested',
    locked: true,
    currentApplicationState: 'not_selected',
    currentApplicationId: null,
    readAt: now,
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  }
}

function canonicalReplacementPlanJourneyFixture(
  projectId: string,
  editSessionId: string,
  maximumCredits: number,
  approved: boolean,
) {
  const snapshotId = 'snapshot-canonical-revision-browser-v2'
  return {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    stage: approved ? 'approved_snapshot_available' : 'plan_approval_required',
    nextAction: approved
      ? {
          code: 'request_execution_package',
          actor: 'authenticated_user',
          method: 'POST',
          routeTemplate: `/v1/approved-snapshots/${snapshotId}/canonical-execution-package`,
        }
      : {
          code: 'approve_canonical_plan',
          actor: 'authenticated_user',
          method: 'POST',
          routeTemplate:
            '/v1/edit-plans/plan-canonical-revision-browser-v2/canonical-approval',
        },
    planningHandoff: {
      handoffId: 'handoff-canonical-revision-browser-v2',
      handoffHash: '9'.repeat(64),
      canonicalPlanComponentsHash: 'a'.repeat(64),
      publicationStatus: 'published',
    },
    plan: {
      planId: 'plan-canonical-revision-browser-v2',
      planVersion: 2,
      status: approved ? 'approved' : 'presented',
      planHash: '8'.repeat(64),
      estimateId: 'estimate-canonical-revision-browser-v2',
      estimateStatus: approved ? 'approved' : 'presented',
      estimateHash: 'd'.repeat(64),
      approvedMaximumCredits: maximumCredits,
      workItemCount: 1,
    },
    ...(approved
      ? {
          approval: {
            approvalId: 'approval-canonical-revision-browser-v2',
            snapshotId,
            snapshotHash: 'e'.repeat(64),
            reservationId: 'reservation-canonical-revision-browser-v2',
            reservationStatus: 'reserved',
            reservedCredits: maximumCredits,
            jobCount: 1,
            readyJobCount: 1,
            blockedJobCount: 0,
          },
        }
      : {}),
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

function canonicalRevisionPlanPresentationReceiptFixture(
  projectId: string,
  editSessionId: string,
) {
  return {
    schemaVersion: 'canonical-revision-plan-presentation-receipt-v1',
    source: 'canonical_revision_plan_presentation_coordinator_service',
    purpose: 'present_canonical_revision_plan',
    disposition: 'replacement_plan_presented',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
      reviewAssemblyId: 'review-canonical-approval-browser',
    },
    replacementPlan: {
      planId: 'plan-canonical-revision-browser-v2',
      planVersion: 2,
      planHash: '8'.repeat(64),
      priorPlanVersion: 1,
      freshEstimatePresented: true,
      freshApprovalRequired: true,
    },
    authority: {
      exactRevisionDecisionRevalidated: true,
      immutablePriorSnapshotPreserved: true,
      immutablePriorReviewPreserved: true,
      lockedPreferenceEvidenceReusedWithoutMutation: true,
    },
    boundaries: {
      approvalRecorded: false,
      snapshotCreated: false,
      creditReservationMutated: false,
      customerWalletMutated: false,
      workGraphStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      billingStarted: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawRevisionAuthorityReturned: false,
    jobOrToolDetailsReturned: false,
    pathOrCredentialReturned: false,
    replayed: false,
    testOnly: true,
  }
}

function canonicalReplacementPlanApprovalReceiptFixture(
  projectId: string,
  editSessionId: string,
  maximumCredits: number,
) {
  return {
    schemaVersion: 'canonical-plan-approval-receipt-v1',
    source: 'canonical_plan_approval_coordinator_service',
    disposition: 'approved_now',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    plan: {
      planId: 'plan-canonical-revision-browser-v2',
      planVersion: 2,
      status: 'approved',
      planHash: '8'.repeat(64),
      estimateId: 'estimate-canonical-revision-browser-v2',
      estimateStatus: 'approved',
      estimateHash: 'd'.repeat(64),
      approvedMaximumCredits: maximumCredits,
    },
    approval: {
      approvalId: 'approval-canonical-revision-browser-v2',
      snapshotId: 'snapshot-canonical-revision-browser-v2',
      snapshotHash: 'e'.repeat(64),
      reservationId: 'reservation-canonical-revision-browser-v2',
      reservationStatus: 'reserved',
      reservedCredits: maximumCredits,
      jobCount: 1,
      readyJobCount: 1,
      blockedJobCount: 0,
    },
    boundaries: {
      approvedSnapshotAvailable: true,
      syntheticPrivateCreditReservation: true,
      jobRecordsDerived: true,
      paidBillingExecuted: false,
      customerWalletMutation: false,
      jobExecutionStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawAuthorityReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function executionJourney(projectId: string, editSessionId: string) {
  return {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    stage: 'execution_in_progress',
    nextAction: {
      code: 'prepare_private_edit_review',
      actor: 'authenticated_user',
      method: 'POST',
      routeTemplate: '/v1/edit-executions/packages/package-canonical-ui/canonical-private-edit-preparation',
    },
    planningHandoff: {
      handoffId: 'handoff-canonical-ui',
      handoffHash: 'b'.repeat(64),
      canonicalPlanComponentsHash: 'c'.repeat(64),
      publicationStatus: 'published',
    },
    publicationRequest: {
      candidateId: 'candidate-canonical-ui',
      candidateHash: 'd'.repeat(64),
      publicationRequestHash: 'e'.repeat(64),
      publicationStatus: 'published',
    },
    plan: {
      planId: 'plan-canonical-ui',
      planVersion: 2,
      status: 'approved',
      planHash: '1'.repeat(64),
      estimateId: 'estimate-canonical-ui',
      estimateStatus: 'approved',
      estimateHash: '2'.repeat(64),
      approvedMaximumCredits: 72,
      workItemCount: 4,
    },
    approval: {
      approvalId: 'approval-canonical-ui',
      snapshotId: 'snapshot-canonical-ui',
      snapshotHash: '3'.repeat(64),
      reservationId: 'reservation-canonical-ui',
      reservationStatus: 'reserved',
      reservedCredits: 72,
      jobCount: 4,
      readyJobCount: 1,
      blockedJobCount: 3,
    },
    execution: {
      packageRecordId: 'package-canonical-ui',
      packageHash: '4'.repeat(64),
      snapshotId: 'snapshot-canonical-ui',
      purpose: 'private_internal_execution_handoff',
    },
    workGraphProgress: {
      packageRecordId: 'package-canonical-ui',
      approvedPlanSnapshotId: 'snapshot-canonical-ui',
      checkpointHash: '5'.repeat(64),
      checkpointSequence: 2,
      status: 'advancing_private_test_work_graph',
      runFinished: false,
      updatedAt: '2026-07-13T12:00:00.000Z',
      totalJobCount: 4,
      completedJobCount: 2,
      capabilityBlockedJobCount: 0,
      dependencyBlockedJobCount: 0,
      pendingJobCount: 2,
      requiredIncompleteJobCount: 2,
      allRequiredJobsCompleted: false,
      nextRequiredGate: 'canonical_private_work_graph_advancement',
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

function canonicalPlanningHandoffFixture(projectId: string, editSessionId: string) {
  return {
    schemaVersion: 'canonical-planning-handoff-response-v1',
    source: 'canonical_planning_handoff_service',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
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
    handoffId: 'canonical-ui-plan-handoff',
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

function canonicalApprovalJourneyFixture(projectId: string, editSessionId: string, approved: boolean) {
  const plan = {
    planId: 'plan-canonical-approval-browser',
    planVersion: 1,
    status: approved ? 'approved' : 'presented',
    planHash: '1'.repeat(64),
    estimateId: 'estimate-canonical-approval-browser',
    estimateStatus: approved ? 'approved' : 'presented',
    estimateHash: '2'.repeat(64),
    approvedMaximumCredits: 38,
    workItemCount: 5,
  }
  const approval = {
    approvalId: 'approval-canonical-approval-browser',
    snapshotId: 'snapshot-canonical-approval-browser',
    snapshotHash: '3'.repeat(64),
    reservationId: 'reservation-canonical-approval-browser',
    reservationStatus: 'reserved',
    reservedCredits: 38,
    jobCount: 5,
    readyJobCount: 1,
    blockedJobCount: 4,
  }
  return {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    stage: approved ? 'approved_snapshot_available' : 'plan_approval_required',
    nextAction: approved
      ? {
          code: 'request_execution_package',
          actor: 'authenticated_user',
          method: 'POST',
          routeTemplate: '/v1/approved-snapshots/snapshot-canonical-approval-browser/canonical-execution-package',
        }
      : {
          code: 'approve_canonical_plan',
          actor: 'authenticated_user',
          method: 'POST',
          routeTemplate: '/v1/edit-plans/plan-canonical-approval-browser/canonical-approval',
        },
    planningHandoff: {
      handoffId: 'handoff-canonical-approval-browser',
      handoffHash: '4'.repeat(64),
      canonicalPlanComponentsHash: '5'.repeat(64),
      publicationStatus: 'published',
    },
    plan,
    ...(approved ? { approval } : {}),
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

function canonicalApprovalReceiptFixture(projectId: string, editSessionId: string) {
  return {
    schemaVersion: 'canonical-plan-approval-receipt-v1',
    source: 'canonical_plan_approval_coordinator_service',
    disposition: 'approved_now',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    plan: {
      planId: 'plan-canonical-approval-browser',
      planVersion: 1,
      status: 'approved',
      planHash: '1'.repeat(64),
      estimateId: 'estimate-canonical-approval-browser',
      estimateStatus: 'approved',
      estimateHash: '2'.repeat(64),
      approvedMaximumCredits: 38,
    },
    approval: {
      approvalId: 'approval-canonical-approval-browser',
      snapshotId: 'snapshot-canonical-approval-browser',
      snapshotHash: '3'.repeat(64),
      reservationId: 'reservation-canonical-approval-browser',
      reservationStatus: 'reserved',
      reservedCredits: 38,
      jobCount: 5,
      readyJobCount: 1,
      blockedJobCount: 4,
    },
    boundaries: {
      approvedSnapshotAvailable: true,
      syntheticPrivateCreditReservation: true,
      jobRecordsDerived: true,
      paidBillingExecuted: false,
      customerWalletMutation: false,
      jobExecutionStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawAuthorityReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
  }
}

function canonicalPackagedJourneyFixture(projectId: string, editSessionId: string) {
  return {
    ...canonicalApprovalJourneyFixture(projectId, editSessionId, true),
    stage: 'execution_in_progress',
    nextAction: {
      code: 'prepare_private_edit_review',
      actor: 'authenticated_user',
      method: 'POST',
      routeTemplate:
        '/v1/edit-executions/packages/package-canonical-approval-browser/canonical-private-edit-preparation',
    },
    execution: {
      packageRecordId: 'package-canonical-approval-browser',
      packageHash: '6'.repeat(64),
      snapshotId: 'snapshot-canonical-approval-browser',
      purpose: 'private_internal_execution_handoff',
    },
  }
}

function canonicalPrivateReviewReadyJourneyFixture(
  projectId: string,
  editSessionId: string,
  finalArtifactSha256 = '8'.repeat(64),
) {
  return {
    ...canonicalPackagedJourneyFixture(projectId, editSessionId),
    stage: 'private_review_ready',
    nextAction: {
      code: 'record_private_review_decision',
      actor: 'authenticated_user',
      method: 'POST',
      routeTemplate:
        '/v1/edit-executions/private-review-assemblies/review-canonical-approval-browser/canonical-decision',
    },
    review: {
      reviewAssemblyId: 'review-canonical-approval-browser',
      manifestSha256: '7'.repeat(64),
      finalArtifactSha256,
    },
  }
}

function canonicalPrivateReviewAcceptedJourneyFixture(
  projectId: string,
  editSessionId: string,
) {
  const reviewReady = canonicalPrivateReviewReadyJourneyFixture(projectId, editSessionId)
  const decisionManifestSha256 = '9'.repeat(64)
  return {
    ...reviewReady,
    stage: 'private_review_accepted',
    nextAction: {
      code: 'await_public_delivery_authorization',
      actor: 'internal_service',
      method: 'GET',
      routeTemplate:
        `/v1/projects/${projectId}/edit-sessions/${editSessionId}/canonical-journey`,
    },
    review: {
      ...reviewReady.review,
      decision: 'accept_private_internal_review',
      decisionStatus: 'private_internal_review_accepted',
      decisionManifestSha256,
      privateHistoryDownload: {
        method: 'GET',
        routeTemplate:
          '/v1/edit-executions/private-review-history/' +
          'review-canonical-approval-browser/file',
        query: {
          workspaceId: scope.workspaceId,
          packageRecordId: 'package-canonical-approval-browser',
          expectedDecisionManifestSha256: decisionManifestSha256,
          expectedFinalArtifactSha256: reviewReady.review.finalArtifactSha256,
          purpose: 'download_canonical_private_review_history_artifact',
        },
      },
    },
  }
}

function canonicalRevisionRequestedJourneyFixture(
  projectId: string,
  editSessionId: string,
  finalArtifactSha256: string,
  decisionManifestSha256: string,
) {
  const reviewReady = canonicalPrivateReviewReadyJourneyFixture(
    projectId,
    editSessionId,
    finalArtifactSha256,
  )
  return {
    ...reviewReady,
    stage: 'revision_requested',
    nextAction: {
      code: 'prepare_replacement_plan',
      actor: 'planning_client',
      method: 'POST',
      routeTemplate:
        `/v1/projects/${projectId}/edit-sessions/${editSessionId}/canonical-planning-handoff`,
    },
    review: {
      ...reviewReady.review,
      decision: 'request_revision',
      decisionStatus: 'canonical_revision_requested',
      decisionManifestSha256,
      privateHistoryDownload: {
        method: 'GET',
        routeTemplate:
          '/v1/edit-executions/private-review-history/' +
          'review-canonical-approval-browser/file',
        query: {
          workspaceId: scope.workspaceId,
          packageRecordId: 'package-canonical-approval-browser',
          expectedDecisionManifestSha256: decisionManifestSha256,
          expectedFinalArtifactSha256: finalArtifactSha256,
          purpose: 'download_canonical_private_review_history_artifact',
        },
      },
    },
  }
}

function canonicalPrivateReviewDecisionReceiptFixture(
  projectId: string,
  editSessionId: string,
  finalArtifactSha256: string,
  decision: 'accept_private_internal_review' | 'request_revision',
) {
  const revisionRequested = decision === 'request_revision'
  return {
    schemaVersion: 'canonical-private-review-decision-coordinator-receipt-v1',
    source: 'canonical_private_review_decision_coordinator_service',
    purpose: 'record_canonical_private_review_decision',
    disposition: 'decision_recorded',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
      packageRecordId: 'package-canonical-approval-browser',
      reviewAssemblyId: 'review-canonical-approval-browser',
    },
    authority: {
      reviewManifestSha256: '7'.repeat(64),
      finalArtifactSha256,
      exactReviewAuthorityRevalidated: true,
      immutableApprovedSnapshotPreserved: true,
      immutableReviewManifestPreserved: true,
    },
    decision: {
      value: decision,
      status: revisionRequested
        ? 'canonical_revision_requested'
        : 'private_internal_review_accepted',
      revisionRequested,
      requiresReplanning: revisionRequested,
      requiresFreshEstimateAndApproval: revisionRequested,
    },
    readiness: {
      privateReviewDecisionRecorded: true,
      publicExportReady: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      nextRequiredGate: revisionRequested
        ? 'canonical_revision_plan_compilation_and_fresh_approval'
        : 'private_internal_acceptance_recorded_public_delivery_blocked',
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
    decidedAt: '2026-07-13T18:00:00.000Z',
    testOnly: true,
  }
}

function canonicalPrivateEditPreparationReceiptFixture(
  projectId: string,
  editSessionId: string,
) {
  return {
    schemaVersion: 'canonical-private-edit-preparation-receipt-v1',
    source: 'canonical_private_edit_preparation_coordinator_service',
    purpose: 'prepare_canonical_private_edit_review',
    disposition: 'private_review_ready',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
      packageRecordId: 'package-canonical-approval-browser',
      approvedPlanSnapshotId: 'snapshot-canonical-approval-browser',
    },
    authority: {
      packageHash: '6'.repeat(64),
      snapshotHash: '3'.repeat(64),
      exactApprovedAuthorityRevalidated: true,
      serverDerivedWorkGraphOnly: true,
    },
    progress: {
      totalJobCount: 5,
      completedJobCount: 5,
      blockedJobCount: 0,
      allRequiredJobsCompleted: true,
      retryAvailable: false,
      userReviewRequired: false,
    },
    review: {
      reviewAssemblyId: 'review-canonical-approval-browser',
      manifestSha256: '7'.repeat(64),
      finalArtifactSha256: '8'.repeat(64),
      finalArtifactByteLength: 4096,
      readyForPrivateReview: true,
    },
    readiness: {
      privateReviewReady: true,
      nextRequiredGate: 'canonical_private_review_user_decision_or_revision',
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
    boundaries: {
      approvedPrivateExecutionRequested: true,
      browserSuppliedJobsAccepted: false,
      browserSuppliedToolsAccepted: false,
      rawExecutionAuthorityReturned: false,
      jobOrToolDetailsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      publicArtifactCreated: false,
      publicDeliveryStarted: false,
      productionRenderStarted: false,
      customerPriceMutation: false,
      customerCreditMutation: false,
      walletMutation: false,
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
    completedAt: '2026-07-13T16:00:00.000Z',
    testOnly: true,
  }
}

function canonicalExecutionPackageRequestReceiptFixture(
  projectId: string,
  editSessionId: string,
) {
  return {
    schemaVersion: 'canonical-execution-package-request-receipt-v1',
    source: 'canonical_execution_package_request_coordinator_service',
    purpose: 'request_canonical_execution_package',
    disposition: 'package_available',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    executionPackage: {
      packageRecordId: 'package-canonical-approval-browser',
      packageHash: '6'.repeat(64),
      approvedPlanSnapshotId: 'snapshot-canonical-approval-browser',
      snapshotHash: '3'.repeat(64),
      status: 'canonical_authority_packaged_runtime_blocked',
      createdAt: '2026-07-13T15:00:00.000Z',
    },
    boundaries: {
      executionPackageAvailable: true,
      approvedSnapshotMutated: false,
      creditReservationMutated: false,
      workGraphStarted: false,
      workerDispatchStarted: false,
      jobExecutionStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      paidBillingExecuted: false,
      customerWalletMutation: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawAuthorityReturned: false,
    jobOrToolDetailsReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
  }
}
