import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'

import type { CanonicalEditJourney } from '../../src/lib/canonical-edit-journey'
import {
  canonicalPlanApprovalReadyForPresentedPlan,
  recoverCanonicalPresentedPlanIdentity,
} from '../../src/lib/canonical-plan-approval-readiness'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const identity = {
  workspaceId: 'workspace-exact-review-lifecycle-client',
  projectId: 'project-exact-review-lifecycle-client',
  editSessionId: 'edit-exact-review-lifecycle-client',
}
const reviewAssemblyId = 'review-exact-review-lifecycle-client'
const packageRecordId = 'package-exact-review-lifecycle-client'
const priorSnapshotId = 'snapshot-exact-review-lifecycle-client-v1'
const decisionManifestSha256 = '9'.repeat(64)
const finalBytes = Buffer.from([
  0x00, 0x00, 0x00, 0x18,
  0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d,
  0x00, 0x00, 0x02, 0x00,
  0x69, 0x73, 0x6f, 0x6d,
  0x6d, 0x70, 0x34, 0x32,
])
const finalArtifactSha256 =
  createHash('sha256').update(finalBytes).digest('hex')
const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-exact-review-lifecycle-client',
  workspaceId: identity.workspaceId,
}
const revisionJourney: CanonicalEditJourney = {
  identity,
  stage: 'revision_requested',
  privateReviewMediaAuthority: {
    mode: 'history',
    reviewAssemblyId,
    packageRecordId,
    expectedDecisionManifestSha256: decisionManifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
  },
  plan: {
    version: 1,
    status: 'approved',
    estimateStatus: 'approved',
    maximumCredits: 24,
    workItemCount: 5,
  },
  review: {
    decision: 'request_revision',
    decisionStatus: 'canonical_revision_requested',
  },
  inspectionOnly: true,
  testOnly: true,
}
const acceptedJourney: CanonicalEditJourney = {
  ...revisionJourney,
  stage: 'private_review_accepted',
  privateReviewMediaAuthority: {
    mode: 'history',
    reviewAssemblyId,
    packageRecordId,
    expectedDecisionManifestSha256: decisionManifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
  },
  privateFinalDownloadAuthority: {
    reviewAssemblyId,
    packageRecordId,
    expectedDecisionManifestSha256: decisionManifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
    routeTemplate:
      `/v1/edit-executions/private-review-assemblies/${reviewAssemblyId}` +
      '/accepted-final-artifact',
  },
  review: {
    decision: 'accept_private_internal_review',
    decisionStatus: 'private_internal_review_accepted',
  },
}
const presentedJourney: CanonicalEditJourney = {
  identity,
  stage: 'plan_approval_required',
  approvalAuthority: {
    planId: 'plan-exact-review-lifecycle-client-v1',
    estimateId: 'estimate-exact-review-lifecycle-client-v1',
    expectedPlanHash: '6'.repeat(64),
    expectedEstimateHash: '8'.repeat(64),
  },
  plan: {
    version: 1,
    status: 'presented',
    estimateStatus: 'presented',
    maximumCredits: 24,
    workItemCount: 5,
  },
  inspectionOnly: true,
  testOnly: true,
}

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
const requests: Array<{
  method?: string
  url?: string
  authorization?: string
  internalToken?: string
  idempotencyKey?: string
  body?: Record<string, unknown>
}> = []

const server = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  request.on('end', () => {
    const body = chunks.length > 0
      ? JSON.parse(
          Buffer.concat(chunks).toString('utf8'),
        ) as Record<string, unknown>
      : undefined
    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      internalToken:
        request.headers['x-reeditpro-internal-token'] as string | undefined,
      idempotencyKey:
        request.headers['idempotency-key'] as string | undefined,
      body,
    })

    if (request.method === 'GET') {
      response.statusCode = 200
      response.setHeader('content-type', 'video/mp4')
      response.setHeader('content-length', String(finalBytes.byteLength))
      response.setHeader(
        'content-disposition',
        `attachment; filename="weeditpro-private-final-${reviewAssemblyId}.mp4"`,
      )
      response.setHeader('cache-control', 'private, no-store, max-age=0')
      response.setHeader(
        'x-reeditpro-artifact-sha256',
        finalArtifactSha256,
      )
      response.setHeader(
        'x-reeditpro-review-decision-manifest-sha256',
        decisionManifestSha256,
      )
      response.setHeader(
        'x-reeditpro-review-assembly-id',
        reviewAssemblyId,
      )
      response.end(finalBytes)
      return
    }

    response.statusCode = 201
    response.setHeader('content-type', 'application/json')
    if (request.url?.endsWith('/source-led-plan-presentations')) {
      response.end(JSON.stringify({
        ok: true,
        data: {
          canonicalSourceLedPlanPresentation:
            sourceLedPlanPresentationFixture(),
        },
        warnings: [],
      }))
      return
    }
    response.end(JSON.stringify({
      ok: true,
      data: {
        canonicalSourceLedCaptionRevisionPlanPresentation:
          revisionPresentationFixture(),
      },
      warnings: [],
    }))
  })
})

await new Promise<void>((resolve) =>
  server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL =
  `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN =
  'exact-review-lifecycle-client-token'

try {
  const { getApiRouteById } = await import(
    '../../src/backend/api/api-route-registry'
  )
  const { presentCanonicalSourceLedCaptionRevision } = await import(
    '../../src/lib/canonical-source-led-caption-revision-client'
  )
  const { presentCanonicalSourceLedPlan } = await import(
    '../../src/lib/canonical-source-led-plan-presentation-client'
  )
  const { downloadCanonicalPrivateFinal } = await import(
    '../../src/lib/canonical-private-final-download-client'
  )

  const initialRoute = getApiRouteById(
    'planning.canonicalSourceLedPlanPresentation.create',
  )
  assert.equal(
    initialRoute?.path,
    '/v1/projects/:projectId/edit-sessions/:editSessionId/source-led-plan-presentations',
  )
  assert.equal(initialRoute?.runtimeMode, 'frontend_safe')
  assert.equal(initialRoute?.status, 'frontend_safe_ready')
  assert.equal(initialRoute?.requiresServiceRole, false)

  const sourceIds = [
    'media-exact-review-lifecycle-client-1',
    'media-exact-review-lifecycle-client-2',
  ]
  const initialInput = {
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    orderedMediaAssetIds: sourceIds,
    confirmedAspectRatio: '16:9' as const,
  }
  const firstInitialPlan = presentCanonicalSourceLedPlan(initialInput)
  const duplicateInitialPlan = presentCanonicalSourceLedPlan(initialInput)
  assert.equal(
    duplicateInitialPlan,
    firstInitialPlan,
    'Concurrent source-led plan presentations must share one browser request.',
  )
  const initialPlan = await firstInitialPlan
  assert.equal(
    initialPlan.status,
    'plan_published_waiting_for_approval',
  )
  assert.equal(initialPlan.presentedPlan?.planVersion, 1)
  assert.equal(initialPlan.receipt?.sourceCount, 2)
  assert.equal(initialPlan.receipt?.totalFrames, 480)
  assert.equal(initialPlan.receipt?.captionCueCount, 1)
  assert.equal(
    initialPlan.receipt?.captionCueAuthority,
    'confirmed_edit_brief_markers',
  )
  assert.equal(
    initialPlan.receipt?.publicationProfile,
    'bounded_private_composition',
  )
  const recoveredPresentedPlan =
    recoverCanonicalPresentedPlanIdentity(presentedJourney)
  assert.deepEqual(recoveredPresentedPlan, {
    planId: 'plan-exact-review-lifecycle-client-v1',
    planVersion: 1,
    planHash: '6'.repeat(64),
  })
  assert.equal(
    canonicalPlanApprovalReadyForPresentedPlan({
      backendConnected: true,
      journey: presentedJourney,
      publicationStatus: 'plan_published_waiting_for_approval',
      presentedPlan: recoveredPresentedPlan,
      visibleMaximumCredits: 24,
    }),
    true,
  )
  assert.equal(
    recoverCanonicalPresentedPlanIdentity({
      ...presentedJourney,
      stage: 'approved_snapshot_available',
    }),
    undefined,
  )
  assert.equal(requests.length, 1)
  assert.equal(requests[0]?.method, 'POST')
  assert.equal(
    requests[0]?.url,
    `/v1/projects/${identity.projectId}/edit-sessions/` +
      `${identity.editSessionId}/source-led-plan-presentations`,
  )
  assert.equal(
    requests[0]?.authorization,
    'Bearer exact-review-lifecycle-client-token',
  )
  assert.equal(requests[0]?.internalToken, undefined)
  assert.match(
    requests[0]?.idempotencyKey ?? '',
    /^canonical-source-led-plan:[a-f0-9]{64}$/,
  )
  assert.deepEqual(requests[0]?.body, {
    workspaceId: identity.workspaceId,
    purpose: 'present_server_derived_source_led_plan',
    orderedMediaAssetIds: sourceIds,
    confirmedAspectRatio: '16:9',
    sourceOrderConfirmed: true,
    preserveUnanalyzedSourceRanges: true,
  })
  assert.doesNotMatch(
    JSON.stringify(requests[0]?.body),
    /canonicalPlan|masterTimingPlan|estimate|workGraph|captionText|storagePath|credential|token/i,
  )

  const revisionRoute = getApiRouteById(
    'planning.canonicalSourceLedCaptionRevisionPlanPresentation.create',
  )
  assert.equal(
    revisionRoute?.path,
    '/v1/projects/:projectId/edit-sessions/:editSessionId/source-led-caption-revision-plan-presentations',
  )
  assert.equal(revisionRoute?.runtimeMode, 'frontend_safe')
  assert.equal(revisionRoute?.status, 'frontend_safe_ready')
  assert.equal(revisionRoute?.requiresServiceRole, false)

  const revisionInput = {
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    journey: revisionJourney,
  }
  const firstRevision =
    presentCanonicalSourceLedCaptionRevision(revisionInput)
  const duplicateRevision =
    presentCanonicalSourceLedCaptionRevision(revisionInput)
  assert.equal(
    duplicateRevision,
    firstRevision,
    'Concurrent exact revision requests must share one browser request.',
  )
  const revision = await firstRevision
  assert.equal(revision.status, 'ready')
  if (revision.status === 'ready') {
    assert.equal(revision.receipt.priorPlanVersion, 1)
    assert.equal(revision.receipt.replacementPlanVersion, 2)
    assert.equal(
      revision.receipt.priorReviewAssemblyId,
      reviewAssemblyId,
    )
  }
  assert.equal(requests.length, 2)
  assert.equal(requests[1]?.method, 'POST')
  assert.equal(
    requests[1]?.url,
    `/v1/projects/${identity.projectId}/edit-sessions/` +
      `${identity.editSessionId}/source-led-caption-revision-plan-presentations`,
  )
  assert.equal(
    requests[1]?.authorization,
    'Bearer exact-review-lifecycle-client-token',
  )
  assert.equal(requests[1]?.internalToken, undefined)
  assert.match(
    requests[1]?.idempotencyKey ?? '',
    /^canonical-source-led-caption-revision:[a-f0-9]{64}$/,
  )
  assert.deepEqual(requests[1]?.body, {
    workspaceId: identity.workspaceId,
    expectedPackageRecordId: packageRecordId,
    expectedReviewAssemblyId: reviewAssemblyId,
    expectedDecisionManifestSha256: decisionManifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
    purpose:
      'present_server_derived_source_led_caption_revision',
  })
  assert.doesNotMatch(
    JSON.stringify(requests[1]?.body),
    /canonicalPlan|timing|estimate|workGraph|captionReplacementText|storagePath|credential|token/i,
  )

  const finalInput = {
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    journey: acceptedJourney,
  }
  const firstDownload = downloadCanonicalPrivateFinal(finalInput)
  const duplicateDownload = downloadCanonicalPrivateFinal(finalInput)
  assert.equal(
    duplicateDownload,
    firstDownload,
    'Concurrent exact final downloads must share one browser request.',
  )
  const downloaded = await firstDownload
  assert.equal(downloaded.status, 'ready')
  if (downloaded.status === 'ready') {
    assert.equal(downloaded.download.byteSize, finalBytes.byteLength)
    assert.equal(
      downloaded.download.sha256,
      finalArtifactSha256,
    )
    assert.equal(
      Buffer.from(await downloaded.download.blob.arrayBuffer())
        .equals(finalBytes),
      true,
    )
    assert.equal(
      downloaded.download.fileName,
      `weeditpro-private-final-${reviewAssemblyId}.mp4`,
    )
  }
  assert.equal(requests.length, 3)
  const finalRequest = requests[2]!
  assert.equal(finalRequest.method, 'GET')
  assert.equal(
    finalRequest.authorization,
    'Bearer exact-review-lifecycle-client-token',
  )
  assert.equal(finalRequest.internalToken, undefined)
  const finalUrl = new URL(finalRequest.url!, 'http://127.0.0.1')
  assert.equal(
    finalUrl.pathname,
    `/v1/edit-executions/private-review-assemblies/` +
      `${reviewAssemblyId}/accepted-final-artifact`,
  )
  assert.deepEqual(
    Object.fromEntries(finalUrl.searchParams.entries()),
    {
      workspaceId: identity.workspaceId,
      packageRecordId,
      expectedDecisionManifestSha256: decisionManifestSha256,
      expectedFinalArtifactSha256: finalArtifactSha256,
      purpose:
        'download_accepted_canonical_private_final_artifact',
    },
  )
  assert.doesNotMatch(
    finalRequest.url!,
    /artifactId|jobId|expectedAssetId|credential|signedUrl|publicUrl|storagePath/i,
  )

  const beforeForged = requests.length
  const forged = await downloadCanonicalPrivateFinal({
    ...finalInput,
    journey: {
      ...acceptedJourney,
      identity: {
        ...acceptedJourney.identity,
        editSessionId: 'foreign-edit',
      },
    },
  })
  assert.equal(forged.status, 'blocked')
  assert.equal(requests.length, beforeForged)
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log(
  'Canonical source-led initial plan, revision, and final-download frontend client smoke passed.',
)

function sourceLedPlanPresentationFixture(): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-source-led-plan-presentation-v1',
    source: 'canonical_source_led_plan_presentation_service',
    identity: {
      ...identity,
      handoffId: 'handoff-exact-review-lifecycle-client-v1',
      handoffHash: '1'.repeat(64),
    },
    derivation: {
      sourceMetadataAuthority:
        'server_reverified_finalized_upload_ffprobe',
      editDirectionAuthority:
        'server_reverified_chat_preferences_and_optional_edit_brief',
      exactPreferenceAuthority:
        'server_reverified_exact_edit_preferences',
      chatDirectionAuthority: 'server_reverified_named_edit_chat',
      chatDirectionCount: 1,
      chatThreadRevision: 1,
      chatDirectionAuthorityDigestSha256: '7'.repeat(64),
      browserPlanAccepted: false,
      browserTimingAccepted: false,
      sourceRangePolicy: 'preserve_every_verified_source_frame',
      publicationProfile: 'bounded_private_composition',
      confirmedAspectRatio: '16:9',
      sourceCount: 2,
      totalFrames: 480,
      fps: 30,
      captionCueCount: 1,
      captionCueAuthority: 'confirmed_edit_brief_markers',
      requestAcceptedBrowserPlan: false,
      requestAcceptedBrowserTiming: false,
      requestAcceptedBrowserEstimate: false,
      requestAcceptedBrowserWorkGraph: false,
      sourceObjectReread: true,
      exactPreferenceReread: true,
      editBriefReread: true,
      chatDirectionReread: true,
    },
    publicationRequest: {
      schemaVersion:
        'canonical-plan-publication-request-inspection-v1',
      source: 'canonical_plan_publication_request_service',
      identity: {
        ...identity,
        handoffId: 'handoff-exact-review-lifecycle-client-v1',
        candidateId: 'candidate-exact-review-lifecycle-client-v1',
      },
      candidateHash: '2'.repeat(64),
      handoffHash: '1'.repeat(64),
      canonicalPlanComponentsHash: '3'.repeat(64),
      publicationBodyHash: '4'.repeat(64),
      publicationRequestHash: '5'.repeat(64),
      persistence: {
        privateLocal: true,
        tenantScoped: true,
        createOnly: true,
        checksumProtected: true,
        contentAddressed: true,
        distributed: false,
        productionAuthority: false,
      },
      permissions: {
        inspectionOnly: true,
        internalPublicationRequired: true,
        planMutation: false,
        snapshotCreation: false,
        creditReservation: false,
        toolExecution: false,
        providerCall: false,
        render: false,
      },
      requestBodyReturned: false,
      pathOrCredentialReturned: false,
      testOnly: true,
      publicationStatus: 'published',
      publication: {
        planId: 'plan-exact-review-lifecycle-client-v1',
        planningRequestId:
          'server-source-led-exact-review-lifecycle-client-v1',
        planVersion: 1,
        planStatus: 'presented',
        planHash: '6'.repeat(64),
        internalPublicationMayBeAttempted: false,
        fullRevalidationRequired: true,
        exactReplayOnlyAfterPublication: true,
      },
    },
    newlyPresented: true,
    permissions: {
      planPresentedForReview: true,
      approvalGranted: false,
      snapshotCreated: false,
      creditReserved: false,
      toolExecution: false,
      providerCall: false,
      render: false,
      delivery: false,
    },
    warnings: [
      'The backend derived this bounded plan from verified source authority.',
    ],
    testOnly: true,
  }
}

function revisionPresentationFixture(): Record<string, unknown> {
  return {
    schemaVersion:
      'canonical-source-led-caption-revision-presentation-v1',
    source:
      'canonical_source_led_caption_revision_plan_presentation_service',
    purpose:
      'present_server_derived_source_led_caption_revision',
    identity: {
      ...identity,
      priorReviewAssemblyId: reviewAssemblyId,
      priorApprovedSnapshotId: priorSnapshotId,
    },
    derivation: {
      exactRevisionDecisionReread: true,
      priorApprovedSnapshotReread: true,
      finalizedSourceObjectsReread: true,
      exactLockedPreferencesReread: true,
      immutableEditBriefReread: true,
      chatDirectionReread: true,
      chatDirectionCount: 1,
      chatThreadRevision: 2,
      chatDirectionAuthorityDigestSha256: 'd'.repeat(64),
      exactCaptionReplacementApplied: true,
      revisionIntentHash: 'a'.repeat(64),
      sourceCount: 1,
      captionCueCount: 1,
      browserPlanAccepted: false,
      browserTimingAccepted: false,
      browserEstimateAccepted: false,
      browserWorkGraphAccepted: false,
      browserCaptionTextAcceptedAtPlanning: false,
    },
    revisionPresentation: {
      schemaVersion:
        'canonical-revision-plan-presentation-receipt-v1',
      source:
        'canonical_revision_plan_presentation_coordinator_service',
      purpose: 'present_canonical_revision_plan',
      disposition: 'replacement_plan_presented',
      identity: {
        ...identity,
        reviewAssemblyId,
      },
      replacementPlan: {
        planId: 'plan-exact-review-lifecycle-client-v2',
        planVersion: 2,
        planHash: 'b'.repeat(64),
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
    },
    permissions: {
      replacementPlanPresented: true,
      freshApprovalRequired: true,
      snapshotCreated: false,
      creditReserved: false,
      workGraphStarted: false,
      toolExecutionStarted: false,
      renderStarted: false,
      deliveryStarted: false,
    },
    testOnly: true,
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
