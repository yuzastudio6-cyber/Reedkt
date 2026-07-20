import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const identity = {
  workspaceId: 'workspace-long-form-delivery-client',
  projectId: 'project-long-form-delivery-client',
  editSessionId: 'edit-long-form-delivery-client',
  approvedPlanSnapshotId: 'snapshot-long-form-delivery-client',
  packageRecordId: 'package-long-form-delivery-client',
}
const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-long-form-delivery-client',
  workspaceId: identity.workspaceId,
}
const reviewPacketHash = 'a'.repeat(64)
const masterSha256 = 'b'.repeat(64)
const videoEvidenceHash = 'c'.repeat(64)
const audioEvidenceHash = 'd'.repeat(64)
const decisionHash = '1'.repeat(64)
const mediaBytes = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from('ftypisom'),
  Buffer.alloc(244, 7),
])
const clientAuthority = {
  scope,
  projectId: identity.projectId,
  editSessionId: identity.editSessionId,
  approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
  packageRecordId: identity.packageRecordId,
}
const discoveryAuthority = {
  scope,
  projectId: identity.projectId,
  editSessionId: identity.editSessionId,
  approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
}

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
let responseMode: 'valid' | 'foreign' | 'extra_internal' = 'valid'
const requests: Array<{
  method?: string
  url?: string
  authorization?: string
  range?: string
  idempotencyKey?: string
  body?: Record<string, unknown>
}> = []

const server = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  request.on('end', () => {
    const body = chunks.length > 0
      ? JSON.parse(Buffer.concat(chunks).toString('utf8')) as
        Record<string, unknown>
      : undefined
    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      range: request.headers.range,
      idempotencyKey: typeof request.headers['idempotency-key'] === 'string'
        ? request.headers['idempotency-key']
        : undefined,
      body,
    })
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    if (
      request.method === 'GET' &&
      path.endsWith('/professional-long-form-customer-delivery')
    ) {
      const receipt = discoveryFixture({
        workspaceId: responseMode === 'foreign'
          ? 'workspace-foreign'
          : identity.workspaceId,
      }) as Record<string, unknown>
      if (responseMode === 'extra_internal') receipt.queue = ['hidden-job']
      response.statusCode = 200
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({
        ok: true,
        data: {
          professionalLongFormCustomerDeliveryDiscovery: receipt,
        },
        warnings: [],
      }))
      return
    }
    if (request.method === 'GET' && path.endsWith('/quality-review')) {
      const receipt = reviewFixture({
        workspaceId: responseMode === 'foreign'
          ? 'workspace-foreign'
          : identity.workspaceId,
      }) as Record<string, unknown>
      if (responseMode === 'extra_internal') receipt.jobId = 'hidden-job'
      response.statusCode = 200
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({
        ok: true,
        data: {
          professionalLongFormCustomerDeliveryQualityReview: receipt,
        },
        warnings: [],
      }))
      return
    }
    if (request.method === 'POST' && path.endsWith('/quality-decision')) {
      const revision = body?.decision ===
        'request_customer_delivery_revision'
      response.statusCode = 201
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({
        ok: true,
        data: {
          professionalLongFormCustomerDeliveryQualityDecision:
            decisionFixture(revision),
        },
        warnings: [],
      }))
      return
    }
    const range = parseRange(request.headers.range)
    if (!range) {
      response.statusCode = 416
      response.end()
      return
    }
    const bytes = mediaBytes.subarray(range.start, range.end + 1)
    response.statusCode = 206
    response.setHeader('content-type', 'video/mp4')
    response.setHeader('content-length', String(bytes.byteLength))
    response.setHeader(
      'content-range',
      `bytes ${range.start}-${range.end}/${mediaBytes.byteLength}`,
    )
    response.setHeader('accept-ranges', 'bytes')
    response.setHeader('cache-control', 'private, no-store, max-age=0')
    response.setHeader('x-reeditpro-artifact-sha256', masterSha256)
    if (path.endsWith('/quality-review/media')) {
      response.setHeader(
        'x-reeditpro-quality-review-packet-sha256',
        reviewPacketHash,
      )
    } else {
      response.setHeader('x-reeditpro-quality-decision-sha256', decisionHash)
      response.setHeader(
        'x-reeditpro-private-download-delivery-id',
        'private-download-long-form-client',
      )
    }
    response.end(bytes)
  })
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'long-form-delivery-client-token'

try {
  const { getApiRouteById } = await import(
    '../../src/backend/api/api-route-registry'
  )
  const {
    discoverProfessionalLongFormCustomerDelivery,
    inspectProfessionalLongFormCustomerDeliveryQualityReview,
    readProfessionalLongFormCustomerDeliveryDownloadRange,
    readProfessionalLongFormCustomerDeliveryReviewRange,
    recordProfessionalLongFormCustomerDeliveryQualityDecision,
  } = await import(
    '../../src/lib/professional-long-form-customer-delivery-client'
  )

  const routes = [
    [
      'editExecution.professionalLongFormCustomerDeliveryDiscovery.read',
      '/professional-long-form-customer-delivery',
    ],
    [
      'editExecution.professionalLongFormCustomerDeliveryQualityReview.read',
      '/quality-review',
    ],
    [
      'editExecution.professionalLongFormCustomerDeliveryQualityReviewMedia.read',
      '/quality-review/media',
    ],
    [
      'editExecution.professionalLongFormCustomerDeliveryQualityDecision.create',
      '/quality-decision',
    ],
    [
      'editExecution.professionalLongFormCustomerDeliveryPrivateDownload.read',
      '/private-download/file',
    ],
  ] as const
  for (const [routeId, suffix] of routes) {
    const route = getApiRouteById(routeId)
    assert.ok(route?.path.endsWith(suffix), `${routeId} path must be registered.`)
    assert.equal(route?.status, 'frontend_safe_ready')
    assert.equal(route?.requiresServiceRole, false)
    assert.equal(route?.requiresProviderSecret, false)
    assert.equal(route?.requiresStripeSecret, false)
  }

  const reviewResult =
    await inspectProfessionalLongFormCustomerDeliveryQualityReview(
      clientAuthority,
    )
  assert.equal(reviewResult.status, 'ready')
  assert.equal(requests.length, 1)
  assert.equal(requests[0]?.authorization,
    'Bearer long-form-delivery-client-token')
  assert.equal(requests[0]?.method, 'GET')
  const reviewUrl = new URL(requests[0]!.url!, 'http://127.0.0.1')
  assert.equal(
    reviewUrl.pathname,
    `/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review`,
  )
  assert.deepEqual(Object.fromEntries(reviewUrl.searchParams), {
    workspaceId: identity.workspaceId,
    approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
  })
  assert.doesNotMatch(
    requests[0]!.url!,
    /job|tool|lease|attempt|cost|storage|path|credential|price|credit/i,
  )
  assert.equal(reviewResult.status === 'ready' &&
    reviewResult.review.commercialBoundary.secondExportEstimateCreated,
  false)
  assert.equal(reviewResult.status === 'ready' &&
    reviewResult.review.commercialBoundary.secondExportChargeCreated,
  false)
  assert.equal(reviewResult.status === 'ready' &&
    reviewResult.review.commercialBoundary.exportTimeCreditPromptAllowed,
  false)
  assert.equal(reviewResult.status === 'ready' &&
    reviewResult.review.boundaries.internalCostEvidenceReturned,
  false)

  assert.equal(reviewResult.status, 'ready')
  if (reviewResult.status !== 'ready') assert.fail('Review must be ready.')
  const reviewRange =
    await readProfessionalLongFormCustomerDeliveryReviewRange({
      authority: clientAuthority,
      review: reviewResult.review,
      start: 0,
      end: 31,
    })
  assert.equal(reviewRange.status, 'ready')
  if (reviewRange.status === 'ready') {
    assert.deepEqual(
      Buffer.from(reviewRange.range.bytes),
      mediaBytes.subarray(0, 32),
    )
    assert.equal(reviewRange.range.fullArtifactSha256, masterSha256)
  }
  assert.equal(requests.length, 2)
  assert.equal(requests[1]?.range, 'bytes=0-31')
  assert.equal(requests[1]?.authorization,
    'Bearer long-form-delivery-client-token')
  assert.match(requests[1]!.url!, /expectedReviewPacketHash=/)
  assert.match(requests[1]!.url!, /expectedMasterSha256=/)

  const beforeInvalidRange = requests.length
  const invalidRange =
    await readProfessionalLongFormCustomerDeliveryReviewRange({
      authority: clientAuthority,
      review: reviewResult.review,
      start: 0,
      end: mediaBytes.byteLength,
    })
  assert.equal(invalidRange.status, 'blocked')
  assert.equal(requests.length, beforeInvalidRange)

  const acceptanceAttestation = {
    entirePrivateMasterPlaybackReviewed: true as const,
    exactVideoQualityAccepted: true as const,
    exactAudioQualityAndSyncAccepted: true as const,
    knownQaReviewItemsAccepted: true as const,
    approvedIntentSatisfied: true as const,
    speechIntelligibilityDisposition:
      'manual_full_program_speech_review_accepted' as const,
    noPublicDeliveryRequested: true as const,
  }
  const accepted =
    await recordProfessionalLongFormCustomerDeliveryQualityDecision({
      ...clientAuthority,
      review: reviewResult.review,
      decision: 'accept_exact_private_customer_delivery',
      attestation: acceptanceAttestation,
    })
  assert.equal(accepted.status, 'recorded')
  assert.equal(requests.length, 3)
  assert.equal(requests[2]?.method, 'POST')
  assert.match(
    requests[2]?.idempotencyKey ?? '',
    /^professional-long-form-quality-decision:[a-f0-9]{64}$/u,
  )
  assert.deepEqual(requests[2]?.body, {
    workspaceId: identity.workspaceId,
    approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
    expectedReviewPacketHash: reviewPacketHash,
    expectedMasterSha256: masterSha256,
    expectedVideoObjectiveEvidenceHash: videoEvidenceHash,
    expectedAudioObjectiveEvidenceHash: audioEvidenceHash,
    decision: 'accept_exact_private_customer_delivery',
    attestation: acceptanceAttestation,
  })
  assert.doesNotMatch(
    JSON.stringify(requests[2]?.body),
    /job|tool|lease|attempt|cost|storage|filesystem|credential|provider|price|serviceFee|wallet|billing/i,
  )

  assert.equal(accepted.status, 'recorded')
  if (accepted.status !== 'recorded') assert.fail('Decision must be recorded.')
  const downloadRange =
    await readProfessionalLongFormCustomerDeliveryDownloadRange({
      authority: clientAuthority,
      decision: accepted.decision,
      start: 32,
      end: 63,
    })
  assert.equal(downloadRange.status, 'ready')
  if (downloadRange.status === 'ready') {
    assert.deepEqual(
      Buffer.from(downloadRange.range.bytes),
      mediaBytes.subarray(32, 64),
    )
    assert.equal(
      downloadRange.range.privateDownloadDeliveryId,
      'private-download-long-form-client',
    )
  }
  assert.equal(requests.length, 4)
  assert.equal(requests[3]?.range, 'bytes=32-63')
  assert.match(requests[3]!.url!, /expectedQualityDecisionHash=/)
  assert.match(requests[3]!.url!, /expectedMasterSha256=/)

  const revision =
    await recordProfessionalLongFormCustomerDeliveryQualityDecision({
      ...clientAuthority,
      review: reviewResult.review,
      decision: 'request_customer_delivery_revision',
      revisionReasonCodes: ['video_quality', 'av_sync'],
    })
  assert.equal(revision.status, 'recorded')
  assert.deepEqual(requests[4]?.body, {
    workspaceId: identity.workspaceId,
    approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
    expectedReviewPacketHash: reviewPacketHash,
    expectedMasterSha256: masterSha256,
    expectedVideoObjectiveEvidenceHash: videoEvidenceHash,
    expectedAudioObjectiveEvidenceHash: audioEvidenceHash,
    decision: 'request_customer_delivery_revision',
    revisionReasonCodes: ['video_quality', 'av_sync'],
    requiresFreshPlanEstimateAndApproval: true,
  })
  if (revision.status === 'recorded') {
    assert.equal(revision.decision.privateDownload, null)
    assert.equal(
      revision.decision.readiness
        .revisionRequiresFreshPlanEstimateAndApproval,
      true,
    )
  }

  const beforeDuplicateReasons = requests.length
  const duplicateReasons =
    await recordProfessionalLongFormCustomerDeliveryQualityDecision({
      ...clientAuthority,
      review: reviewResult.review,
      decision: 'request_customer_delivery_revision',
      revisionReasonCodes: ['video_quality', 'video_quality'],
    })
  assert.equal(duplicateReasons.status, 'blocked')
  assert.equal(requests.length, beforeDuplicateReasons)

  responseMode = 'foreign'
  const foreign =
    await inspectProfessionalLongFormCustomerDeliveryQualityReview(
      clientAuthority,
    )
  assert.equal(foreign.status, 'invalid_response')

  responseMode = 'extra_internal'
  const extraInternal =
    await inspectProfessionalLongFormCustomerDeliveryQualityReview(
      clientAuthority,
    )
  assert.equal(extraInternal.status, 'invalid_response')

  responseMode = 'valid'
  const discovered = await discoverProfessionalLongFormCustomerDelivery(
    discoveryAuthority,
  )
  assert.equal(discovered.status, 'ready')
  if (discovered.status !== 'ready') assert.fail('Discovery must be ready.')
  assert.equal(
    discovered.authority.packageRecordId,
    identity.packageRecordId,
  )
  assert.equal(
    discovered.discovery.stage,
    'customer_delivery_quality_review_ready',
  )
  assert.equal(discovered.discovery.review?.authority.masterSha256,
    masterSha256)
  const discoveryRequest = requests.at(-1)
  assert.equal(discoveryRequest?.method, 'GET')
  const discoveryUrl = new URL(
    discoveryRequest!.url!,
    'http://127.0.0.1',
  )
  assert.equal(
    discoveryUrl.pathname,
    `/v1/projects/${identity.projectId}/edit-sessions/${identity.editSessionId}/professional-long-form-customer-delivery`,
  )
  assert.deepEqual(Object.fromEntries(discoveryUrl.searchParams), {
    workspaceId: identity.workspaceId,
    approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
  })
  assert.doesNotMatch(
    JSON.stringify(discovered.discovery),
    /"(?:queueAggregate|queueDefinition|entries|events|jobId|workItemId|claimId|credentialSha256|attemptInternalCostEvidenceHash|localFilePath|storageObjectKey)"\s*:/u,
  )

  responseMode = 'foreign'
  const foreignDiscovery =
    await discoverProfessionalLongFormCustomerDelivery(discoveryAuthority)
  assert.equal(foreignDiscovery.status, 'invalid_response')

  responseMode = 'extra_internal'
  const extraInternalDiscovery =
    await discoverProfessionalLongFormCustomerDelivery(discoveryAuthority)
  assert.equal(extraInternalDiscovery.status, 'invalid_response')
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log(JSON.stringify({
  ok: true,
  schemaVersion:
    'professional-long-form-customer-delivery-frontend-client-smoke-v1',
  strictBrowserReviewReceiptVerified: true,
  exactNamedEditDeliveryDiscoveryVerified: true,
  preDecisionAuthenticatedRangeVerified: true,
  explicitAcceptanceAttestationVerified: true,
  privateDownloadAuthenticatedRangeVerified: true,
  secondExportEstimateCreated: false,
  secondExportChargeCreated: false,
  exportTimeCreditPromptAllowed: false,
  rawWorkerAuthorityReturned: false,
  productReady: false,
  productionReady: false,
}, null, 2))

function reviewFixture(input: { workspaceId: string }) {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-review-v1',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'present_exact_private_customer_delivery_for_authenticated_review',
    status: 'quality_review_required_private_download_blocked',
    identity: { ...identity, workspaceId: input.workspaceId },
    authority: {
      reviewPacketHash,
      masterSha256,
      masterByteSize: mediaBytes.byteLength,
      masterFrameCount: 3_870,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      mimeType: 'video/mp4',
      videoObjectiveEvidenceHash: videoEvidenceHash,
      audioObjectiveEvidenceHash: audioEvidenceHash,
    },
    reviewItems: reviewItems(),
    reviewMedia: reviewMediaDescriptor(),
    decision: null,
    privateDownload: null,
    readiness: readiness(false, false),
    commercialBoundary: commercialBoundary(),
    boundaries: boundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function discoveryFixture(input: { workspaceId: string }) {
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-discovery-v1',
    source:
      'canonical_professional_long_form_customer_delivery_discovery_service',
    purpose: 'discover_exact_private_customer_delivery_for_named_edit',
    stage: 'customer_delivery_quality_review_ready',
    identity: { ...identity, workspaceId: input.workspaceId },
    progress: {
      totalJobCount: 9,
      completedJobCount: 8,
      activeJobCount: 0,
      pendingJobCount: 1,
      completionPercent: 88,
      attentionRequired: false,
    },
    review: reviewFixture(input),
    readiness: {
      exactPackageDiscovered: true,
      exactSnapshotLineageVerified: true,
      qualityReviewReady: true,
      authenticatedQualityDecisionRecorded: false,
      revisionRequiresFreshPlanEstimateAndApproval: false,
      authenticatedPrivateDownloadReady: false,
      publicDeliveryAuthorized: false,
      productReady: false,
      productionReady: false,
    },
    commercialBoundary: commercialBoundary(),
    boundaries: {
      discoveryInspectionOnly: true,
      rawPackageReturned: false,
      rawQueueReturned: false,
      jobIdentityReturned: false,
      leaseOrAttemptReturned: false,
      internalCostEvidenceReturned: false,
      filesystemOrStoragePathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      renderStarted: false,
      customerCreditsMutated: false,
      publicDeliveryStarted: false,
      billingStarted: false,
      deploymentStarted: false,
    },
    persistence: persistence(),
    testOnly: true,
  }
}

function decisionFixture(revision: boolean) {
  const decision = decisionSummary(revision)
  return {
    schemaVersion:
      'professional-long-form-customer-delivery-browser-decision-v1',
    source:
      'canonical_professional_long_form_customer_delivery_browser_service',
    purpose:
      'record_exact_authenticated_private_customer_delivery_quality_decision',
    disposition: 'recorded',
    status: revision
      ? 'revision_requested_private_download_closed'
      : 'quality_accepted_private_download_reconciled',
    identity,
    authority: {
      reviewPacketHash,
      masterSha256,
      masterByteSize: mediaBytes.byteLength,
      masterFrameCount: 3_870,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      mimeType: 'video/mp4',
      videoObjectiveEvidenceHash: videoEvidenceHash,
      audioObjectiveEvidenceHash: audioEvidenceHash,
    },
    reviewItems: reviewItems(),
    reviewMedia: reviewMediaDescriptor(),
    decision,
    privateDownload: revision ? null : downloadDescriptor(),
    readiness: readiness(true, revision),
    commercialBoundary: commercialBoundary(),
    boundaries: boundaries(),
    persistence: persistence(),
    testOnly: true,
  }
}

function decisionSummary(revision: boolean) {
  return {
    value: revision
      ? 'request_customer_delivery_revision'
      : 'accept_exact_private_customer_delivery',
    decisionHash,
    decidedAt: '2026-07-19T18:00:00.000Z',
    revisionReasonCodes: revision ? ['video_quality', 'av_sync'] : [],
    privateDownloadReconciliationAuthorized: !revision,
    revisionRequired: revision,
    requiresFreshPlanEstimateAndApproval: revision,
  }
}

function reviewItems() {
  return [
    {
      itemId: 'review-item-video',
      category: 'decoded_video_integrity',
      automatedOutcome: 'needs_user_review',
      userDecisionRequired: true,
      automaticAcceptanceAllowed: false,
      safeSummaryCode: 'full_video_decode_requires_human_acceptance',
      evidenceHash: 'e'.repeat(64),
    },
    {
      itemId: 'review-item-audio',
      category: 'decoded_audio_quality_sync',
      automatedOutcome: 'needs_user_review',
      userDecisionRequired: true,
      automaticAcceptanceAllowed: false,
      safeSummaryCode: 'full_audio_quality_sync_requires_human_acceptance',
      evidenceHash: 'f'.repeat(64),
    },
    {
      itemId: 'review-item-speech',
      category: 'speech_intelligibility_attestation',
      automatedOutcome: 'not_automatically_analyzed',
      userDecisionRequired: true,
      automaticAcceptanceAllowed: false,
      safeSummaryCode:
        'speech_intelligibility_requires_manual_or_not_applicable_attestation',
      evidenceHash: '0'.repeat(64),
    },
  ]
}

function reviewMediaDescriptor() {
  return {
    method: 'GET',
    path:
      `/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/quality-review/media`,
    expectedReviewPacketHash: reviewPacketHash,
    expectedMasterSha256: masterSha256,
    byteSize: mediaBytes.byteLength,
    mimeType: 'video/mp4',
    authenticatedBearerRequired: true,
    byteRangesSupported: true,
    publicOrSignedUrlCreated: false,
    cachePolicy: 'private_no_store',
  }
}

function downloadDescriptor() {
  return {
    method: 'GET',
    path:
      `/v1/edit-executions/professional-long-form/customer-delivery-packages/${identity.packageRecordId}/private-download/file`,
    expectedQualityDecisionHash: decisionHash,
    expectedMasterSha256: masterSha256,
    byteSize: mediaBytes.byteLength,
    mimeType: 'video/mp4',
    authenticatedBearerRequired: true,
    byteRangesSupported: true,
    publicOrSignedUrlCreated: false,
    cachePolicy: 'private_no_store',
  }
}

function readiness(decisionRecorded: boolean, revision: boolean) {
  return {
    exactDecodedVideoQaReopened: true,
    exactDecodedAudioQaReopened: true,
    qualityReviewMediaReady: true,
    entireProgramPlaybackRequiredBeforeAcceptance: true,
    actualSpeechIntelligibilityAnalysisPerformed: false,
    authenticatedQualityDecisionRecorded: decisionRecorded,
    revisionRequiresFreshPlanEstimateAndApproval: revision,
    authenticatedPrivateDownloadReady: decisionRecorded && !revision,
    publicDeliveryAuthorized: false,
    productReady: false,
    productionReady: false,
  }
}

function commercialBoundary() {
  return {
    approvedFourKEstimateAndReservationReused: true,
    customerDeliveryCoveredByOriginalApprovedEstimate: true,
    secondExportEstimateCreated: false,
    secondExportChargeCreated: false,
    exportTimeEstimatePromptAllowed: false,
    exportTimeCreditPromptAllowed: false,
    customerPriceAuthorityIncluded: false,
    customerCreditAuthorityIncluded: false,
    serviceFeeAuthorityIncluded: false,
    customerCreditsMutated: false,
    walletMutationAuthorized: false,
    settlementAuthorized: false,
    billingAuthorized: false,
  }
}

function boundaries() {
  return {
    rawReviewPacketReturned: false,
    rawDecisionAuthorityReturned: false,
    queueLeaseOrAttemptReturned: false,
    jobOrToolDetailsReturned: false,
    internalCostEvidenceReturned: false,
    filesystemOrStoragePathReturned: false,
    credentialReturned: false,
    providerCallStarted: false,
    additionalRenderStarted: false,
    publicArtifactCreated: false,
    publicDeliveryStarted: false,
    billingStarted: false,
    deploymentStarted: false,
  }
}

function persistence() {
  return {
    privateLocal: true,
    tenantScoped: true,
    distributed: false,
    databaseBacked: false,
    productionAuthority: false,
  }
}

function parseRange(value: string | undefined) {
  const match = /^bytes=(\d+)-(\d+)$/u.exec(value ?? '')
  if (!match) return null
  const start = Number(match[1])
  const end = Number(match[2])
  if (start < 0 || end < start || end >= mediaBytes.byteLength) return null
  return { start, end }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
