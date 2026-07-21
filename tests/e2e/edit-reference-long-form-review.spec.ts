import { expect, test, type Route } from '@playwright/test'
import type {
  EditReferenceDetailData,
  EditReferenceListData,
  PreferenceLongFormStudySummary,
} from '../../src/types/edit-reference'
import { EDIT_REFERENCE_SAFETY_FLAGS } from '../../src/types/edit-reference'
import type {
  EditReferenceLongFormReviewSpecialistId,
  EditReferenceLongFormStudyReviewData,
  EditReferenceLongFormStudyReviewDecision,
  EditReferenceLongFormStudyReviewSelectionData,
} from '../../src/types/edit-reference-long-form-review'
import { EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION } from '../../src/types/edit-reference-long-form-review'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const workspaceId = 'workspace-long-form-review-ui'
const referenceId = 'edit-reference-long-form-review-ui'
const studyId = 'study-long-form-review-ui'
const assetId = 'preference-asset-long-form-review-ui'

test.describe('Edit Reference long-form review', () => {
  test('keeps an unavailable library distinct from an empty library and offers retry', async ({ page }) => {
    let listAttempts = 0
    await page.route('**/v1/edit-references**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fallback()
        return
      }
      listAttempts += 1
      await route.abort('connectionrefused')
    })

    await gotoRoute(page, '/preferences')
    const unavailable = page.getByTestId('edit-reference-library-unavailable')
    await expect(unavailable).toBeVisible()
    await expect(unavailable).toContainText('Your saved preferences have not been changed')
    await expect(page.getByTestId('edit-reference-empty-state')).toHaveCount(0)
    await expect(page.getByText('Failed to fetch')).toHaveCount(0)

    await page.getByTestId('retry-edit-reference-library').click()
    await expect.poll(() => listAttempts).toBeGreaterThanOrEqual(2)
    await expect(unavailable).toBeVisible()
  })

  test('reviews every studied area progressively, preserves a retry draft, and never silently creates or applies guidance', async ({ page }) => {
    test.setTimeout(90_000)
    page.setDefaultTimeout(12_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    const completedDetail = detailFixture()
    const asset = completedDetail.detail.assets[0]
    expect(asset).toBeTruthy()
    if (!asset) throw new Error('Reference-video asset is missing.')
    const baseReview = reviewFixture(completedDetail, asset.id)
    const selectedDecisions = baseReview.findings.map<EditReferenceLongFormStudyReviewDecision>((finding, index) => ({
      schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
      findingId: finding.findingId,
      decision: index < 2 ? 'adapt' : 'context_only',
    }))
    const selectedDetail = structuredClone(completedDetail)
    selectedDetail.detail.study.status = 'evidence_ready'
    selectedDetail.detail.study.evidenceStatus = 'evidence_ready'
    selectedDetail.detail.study.revision += 1
    selectedDetail.detail.reference.evidenceStatus = 'evidence_ready'
    selectedDetail.detail.nextAction = 'generate_preference_dna'
    const selectedReview: EditReferenceLongFormStudyReviewData = {
      ...baseReview,
      studyRevision: selectedDetail.detail.study.revision,
      findings: baseReview.findings.map((finding, index) => ({
        ...finding,
        selectedDecision: index < 2 ? 'adapt' : 'context_only',
      })),
      selection: {
        status: 'selected',
        decisions: selectedDecisions,
        selectedAt: '2026-07-20T21:00:00.000Z',
        adaptedFindingCount: 2,
        contextOnlyFindingCount: 5,
        avoidedFindingCount: 0,
        notApplicableFindingCount: 0,
      },
    }
    let selected = false
    let saveAttemptCount = 0

    await page.route('**/v1/edit-references**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await fulfillPreflight(route)
        return
      }
      const pathname = new URL(route.request().url()).pathname
      if (pathname === `/v1/edit-references/${referenceId}`) {
        await fulfillOk(route, selected ? selectedDetail : completedDetail)
        return
      }
      const list: EditReferenceListData = {
        references: [{
          reference: (selected ? selectedDetail : completedDetail).detail.reference,
          currentStudy: (selected ? selectedDetail : completedDetail).detail.study,
          messageCount: 1,
          applicationCount: 0,
        }],
        persistence: 'backend_local_private',
        productionPersistence: 'blocked_by_migration_baseline',
        safety: EDIT_REFERENCE_SAFETY_FLAGS,
      }
      await fulfillOk(route, list)
    })
    await page.route(new RegExp(`/v1/edit-reference-studies/${studyId}/assets/${asset.id}/long-form-study/review(?:\\?|$)`), async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await fulfillPreflight(route)
        return
      }
      if (route.request().method() === 'GET') {
        await fulfillOk(route, selected ? selectedReview : baseReview)
        return
      }
      saveAttemptCount += 1
      if (saveAttemptCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({ error: { code: 'EDIT_REFERENCE_REVIEW_RETRY', message: 'The review could not be saved yet.' } }),
        })
        return
      }
      selected = true
      const response: EditReferenceLongFormStudyReviewSelectionData = {
        review: selectedReview,
        detail: selectedDetail,
      }
      await fulfillOk(route, response)
    })

    await gotoRoute(page, `/preferences?reference=${completedDetail.detail.reference.id}`)
    const card = page.getByTestId(`edit-reference-long-form-study-${asset.id}`)
    await expect(card).toContainText('Ready for review')
    await expect(card).toContainText('Full-video study verified')
    await card.getByRole('button', { name: 'Review findings' }).click()
    expect(saveAttemptCount).toBe(0)

    const review = page.getByTestId('edit-reference-long-form-review')
    await expect(review).toBeVisible()
    await expect(review.getByRole('heading', { name: 'Choose what ReEditPro should learn' })).toBeFocused()
    await expect(review).toContainText('Finding 1 of 7')
    await review.getByRole('radio', { name: /Adapt the principle/ }).check()

    await review.getByRole('button', { name: 'Close' }).click()
    await expect(review.getByRole('alert')).toContainText('Discard unsaved review choices?')
    await review.getByRole('button', { name: 'Keep reviewing' }).click()
    await expect(review.getByRole('radio', { name: /Adapt the principle/ })).toBeChecked()

    await review.getByRole('button', { name: 'Next' }).click()
    await review.getByRole('radio', { name: /Adapt the principle/ }).check()
    for (let index = 2; index < 7; index += 1) {
      await review.getByRole('button', { name: 'Next' }).click()
      await review.getByRole('radio', { name: /Keep as context/ }).check()
    }
    await expect(review).toContainText('7 of 7 choices complete')
    const unsafeAdapt = review.getByRole('radio', { name: /Adapt the principle/ })
    await expect(unsafeAdapt).toBeDisabled()
    await expect(review).toContainText('exact graphic layout')

    await review.getByRole('checkbox', { name: /adapt principles, not copy exact shots/i }).check()
    await review.getByRole('checkbox', { name: /story and factual-safety limits/i }).check()
    const save = review.getByTestId('save-edit-reference-long-form-review')
    await expect(save).toBeEnabled()
    await save.click()
    await expect(review.getByRole('alert')).toContainText('The review could not be saved yet.')
    await expect(review.getByRole('radio', { name: /Keep as context/ })).toBeChecked()
    await save.click()

    await expect(review).toContainText('Review saved')
    await expect(review).toContainText('2 adapted · 5 context only')
    await expect(review.getByTestId('save-edit-reference-long-form-review')).toHaveCount(0)
    await expect(page.getByTestId('edit-reference-dna-action')).toContainText('Your editing guidance is ready')
    await expect(page.getByTestId('edit-reference-dna-review')).toHaveCount(0)
    await expect(page.getByTestId('edit-reference-target-ready')).toHaveCount(0)

    await page.reload()
    const restoredCard = page.getByTestId(`edit-reference-long-form-study-${asset.id}`)
    await restoredCard.getByRole('button', { name: 'Review findings' }).click()
    await expect(page.getByTestId('edit-reference-long-form-review')).toContainText('Review saved')
    await expect(page.getByTestId('edit-reference-long-form-review')).toContainText('Saved review choices are read-only')

    for (const viewport of [
      { width: 1024, height: 900 },
      { width: 768, height: 900 },
      { width: 375, height: 812 },
    ]) {
      await setViewport(page, viewport.width, viewport.height)
      await expect(page.getByTestId('edit-reference-long-form-review')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })
})

function completedStudySummary(referenceAssetId: string): PreferenceLongFormStudySummary {
  return {
    schemaVersion: 'edit-reference-long-form-study-summary-v1',
    runId: 'run-e2e-complete-review',
    runRevision: 42,
    planId: 'plan-e2e-complete-review',
    planDigestSha256: '1'.repeat(64),
    sourceBindingDigestSha256: '2'.repeat(64),
    referenceAssetId,
    state: 'completed',
    durationClass: 'long',
    sourceDurationSeconds: 7_200,
    sourceSizeBytes: 14_000_000_000,
    sourceHasAudio: true,
    chunkCount: 12,
    completedWorkItemCount: 96,
    totalWorkItemCount: 96,
    runningWorkItemCount: 0,
    retryWaitWorkItemCount: 0,
    blockedWorkItemCount: 0,
    progressPercent: 100,
    temporalCoverageRatio: 1,
    fullyStudied: true,
    phaseLabel: 'Full-video study complete',
    etaLowerRemainingSeconds: 0,
    etaUpperRemainingSeconds: 0,
    etaConfidence: 'observed_medium',
    operatorReviewRequired: false,
    controls: {
      canPause: false,
      canResume: false,
      canCancel: false,
      canRecover: false,
      pauseCompletesCurrentBoundedStep: true,
      completedCheckpointsPreserved: true,
    },
    originalRemainsImmutable: true,
    analysisProxyProfile: 'reeditpro-analysis-proxy-v1',
    fullTemporalCoverageRequired: true,
    globalReconciliationRequired: true,
    coverageQaRequired: true,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    updatedAt: '2026-07-20T20:00:00.000Z',
  }
}

function detailFixture(): EditReferenceDetailData {
  const now = '2026-07-20T20:00:00.000Z'
  const initialGoals = [
    'visual_language', 'story_and_pacing', 'captions', 'color', 'audio_and_sfx', 'graphics',
  ] as const
  return {
    detail: {
      reference: {
        id: referenceId,
        workspaceId,
        name: 'Long documentary preference',
        description: 'A complete documentary study ready for explicit review.',
        status: 'active',
        initialGoals: [...initialGoals],
        currentStudyId: studyId,
        revision: 3,
        createdAt: now,
        updatedAt: now,
        runtimeSource: 'backend_local_private',
        evidenceStatus: 'ready_to_study',
        dnaStatus: 'not_generated',
        qaStatus: 'not_run',
      },
      study: {
        id: studyId,
        workspaceId,
        editReferenceId: referenceId,
        title: 'Long documentary preference',
        status: 'ready_to_study',
        initialGoals: [...initialGoals],
        revision: 5,
        createdAt: now,
        updatedAt: now,
        runtimeSource: 'backend_local_private',
        evidenceStatus: 'ready_to_study',
        dnaStatus: 'not_generated',
        qaStatus: 'not_run',
      },
      messages: [{
        id: 'message-long-form-review-ui',
        workspaceId,
        editReferenceId: referenceId,
        studySessionId: studyId,
        role: 'assistant',
        content: 'The complete reference is studied. Review what should transfer before creating reusable guidance.',
        sequence: 1,
        runtimeSource: 'deterministic_evidence',
        createdAt: now,
      }],
      evidence: [{
        id: 'evidence-long-form-review-ui',
        workspaceId,
        editReferenceId: referenceId,
        studySessionId: studyId,
        sourceType: 'reference_video_metadata',
        category: 'all_goals',
        title: 'Long documentary reference',
        summary: 'A private long-form documentary reference.',
        revision: 1,
        confidence: 1,
        confidenceBasis: 'metadata_verified',
        transferability: 'requires_user_review',
        mediaMetadata: { durationSeconds: 7_200, width: 3_840, height: 2_160, hasAudio: true, orientation: 'landscape' },
        provenance: {
          runtimeSource: 'user_input',
          sourceEvidenceIds: [],
          privateAssetId: 'private-media-long-form-review-ui',
          sourceLabel: 'Long documentary reference.mp4',
          rightsBasis: 'reference_only',
          mediaStudyStatus: 'media_studied_local_partial',
          toolIds: [],
          skillIds: [],
          fallbackUsed: false,
          notes: ['Original media remains private and unchanged.'],
        },
        createdAt: now,
        updatedAt: now,
      }],
      assets: [{
        id: assetId,
        workspaceId,
        editReferenceId: referenceId,
        studySessionId: studyId,
        privateAssetId: 'private-media-long-form-review-ui',
        storageObjectRecordId: 'storage-long-form-review-ui',
        mediaAssetId: 'media-long-form-review-ui',
        assetKind: 'reference_video_metadata',
        label: 'Long documentary reference.mp4',
        rightsBasis: 'reference_only',
        mediaStudyStatus: 'media_studied_local_partial',
        mediaMetadata: { durationSeconds: 7_200, width: 3_840, height: 2_160, hasAudio: true, orientation: 'landscape' },
        longFormStudy: completedStudySummary(assetId),
        createdAt: now,
      }],
      skillRuns: [],
      dnaVersions: [],
      dnaQaResults: [],
      applications: [],
      usageLogs: [],
      nextAction: 'review_study_findings',
      safety: EDIT_REFERENCE_SAFETY_FLAGS,
    },
    replayed: false,
  }
}

function reviewFixture(detail: EditReferenceDetailData, referenceAssetId: string): EditReferenceLongFormStudyReviewData {
  const specialists: ReadonlyArray<{ id: EditReferenceLongFormReviewSpecialistId; title: string }> = [
    { id: 'visual_language', title: 'Visual hierarchy and composition' },
    { id: 'story_editorial', title: 'Story structure and editorial rhythm' },
    { id: 'speech_pacing', title: 'Speech-led pacing' },
    { id: 'caption_design', title: 'Caption behavior' },
    { id: 'color_treatment', title: 'Color treatment' },
    { id: 'audio_sound_design', title: 'Music and sound restraint' },
    { id: 'graphics_motion', title: 'Graphics and motion language' },
  ]
  return {
    editReferenceId: detail.detail.reference.id,
    studySessionId: detail.detail.study.id,
    studyRevision: detail.detail.study.revision,
    referenceAssetId,
    sourceLabel: 'Long documentary reference.mp4',
    reviewPackageId: 'edit-reference-long-form-review-e2e',
    reviewPackageDigestSha256: 'a'.repeat(64),
    reviewAuthority: 'controlled_review_only',
    sourceDurationSeconds: 7_200,
    sourceHasAudio: true,
    chunkCount: 12,
    semanticWindowCount: 36,
    checkpointCount: 252,
    findings: specialists.map((specialist, index) => ({
      findingId: `finding-e2e-${specialist.id}`,
      specialistId: specialist.id,
      title: specialist.title,
      status: 'analyzed',
      summary: `Generalized ${specialist.title.toLowerCase()} principles were found across the complete reference timeline.`,
      confidence: index === 3 ? 0.72 : 0.88,
      semanticWindowCount: 36,
      copyRiskKinds: specialist.id === 'graphics_motion' ? ['exact_graphic_layout'] : [],
      canAdapt: specialist.id !== 'graphics_motion',
      requiresUserSelection: true,
    })),
    selection: {
      status: 'needs_selection',
      decisions: [],
      adaptedFindingCount: 0,
      contextOnlyFindingCount: 0,
      avoidedFindingCount: 0,
      notApplicableFindingCount: 0,
    },
    boundaries: {
      originalRemainsImmutable: true,
      rawMediaPersisted: false,
      rawProviderPayloadPersisted: false,
      rawTranscriptPersisted: false,
      recognizedOcrTextPersisted: false,
      localFilePathPersisted: false,
      signedUrlPersisted: false,
      userSelectionRequired: true,
      automaticPreferenceDnaCreationAllowed: false,
      automaticPreferenceApplicationAllowed: false,
      approvedSnapshotMutationAllowed: false,
      planOrEstimateMutationAllowed: false,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
      productionReady: false,
    },
    persistence: 'backend_local_private_segmented',
    productionPersistence: 'blocked_by_migration_baseline',
  }
}

async function fulfillOk(route: Route, data: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: corsHeaders,
    body: JSON.stringify({ ok: true, data, warnings: [] }),
  })
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, idempotency-key, x-reeditpro-workspace-id',
}

async function fulfillPreflight(route: Route): Promise<void> {
  await route.fulfill({
    status: 204,
    headers: corsHeaders,
    body: '',
  })
}
