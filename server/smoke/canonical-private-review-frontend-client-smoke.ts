import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'

import type { CanonicalEditJourney } from '../../src/lib/canonical-edit-journey'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const identity = {
  workspaceId: 'workspace-private-review-client',
  projectId: 'project-private-review-client',
  editSessionId: 'edit-private-review-client',
}
const reviewAssemblyId = 'review-private-review-client'
const packageRecordId = 'package-private-review-client'
const manifestSha256 = '7'.repeat(64)
const decisionManifestSha256 = '9'.repeat(64)
const mediaBytes = Buffer.from('canonical-private-review-client-smoke-mp4-bytes')
const finalArtifactSha256 = createHash('sha256').update(mediaBytes).digest('hex')
const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-private-review-client',
  workspaceId: identity.workspaceId,
}

const currentJourney: CanonicalEditJourney = {
  identity,
  stage: 'private_review_ready',
  privateReviewMediaAuthority: {
    mode: 'current',
    reviewAssemblyId,
    packageRecordId,
    expectedManifestSha256: manifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
  },
  privateReviewDecisionAuthority: {
    reviewAssemblyId,
    packageRecordId,
    expectedManifestSha256: manifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
  },
  inspectionOnly: true,
  testOnly: true,
}
const historyJourney: CanonicalEditJourney = {
  ...currentJourney,
  stage: 'private_review_accepted',
  privateReviewMediaAuthority: {
    mode: 'history',
    reviewAssemblyId,
    packageRecordId,
    expectedDecisionManifestSha256: decisionManifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
  },
  privateReviewDecisionAuthority: undefined,
}

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
let responseMode: 'valid' | 'foreign' = 'valid'
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
      ? JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
      : undefined
    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      internalToken: request.headers['x-reeditpro-internal-token'] as string | undefined,
      idempotencyKey: request.headers['idempotency-key'] as string | undefined,
      body,
    })

    if (request.method === 'GET') {
      const history = request.url?.includes('/private-review-history/') ?? false
      response.statusCode = 200
      response.setHeader('content-type', 'video/mp4')
      response.setHeader('content-length', String(mediaBytes.byteLength))
      response.setHeader('content-disposition', 'inline; filename="canonical-private-review.mp4"')
      response.setHeader('cache-control', 'private, no-store, max-age=0')
      response.setHeader('x-reeditpro-artifact-sha256', finalArtifactSha256)
      response.setHeader('x-reeditpro-review-assembly-id', reviewAssemblyId)
      if (history) {
        response.setHeader(
          'x-reeditpro-review-decision-manifest-sha256',
          decisionManifestSha256,
        )
      } else {
        response.setHeader('x-reeditpro-review-manifest-sha256', manifestSha256)
      }
      response.end(mediaBytes)
      return
    }

    const decision = body?.decision === 'request_revision'
      ? 'request_revision' as const
      : 'accept_private_internal_review' as const
    response.statusCode = 201
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        canonicalPrivateReviewDecision: receiptFixture({
          decision,
          workspaceId: responseMode === 'foreign'
            ? 'workspace-foreign'
            : identity.workspaceId,
        }),
      },
      warnings: [],
    }))
  })
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'private-review-client-token'

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const {
    loadCanonicalPrivateReviewMedia,
    recordCanonicalPrivateReviewDecision,
  } = await import('../../src/lib/canonical-private-review-client')

  const mediaRoute = getApiRouteById('editExecution.canonicalPrivateReviewMedia.read')
  assert.equal(
    mediaRoute?.path,
    '/v1/edit-executions/private-review-assemblies/:reviewAssemblyId/media',
  )
  assert.equal(mediaRoute?.method, 'GET')
  assert.equal(mediaRoute?.status, 'frontend_safe_ready')
  assert.equal(mediaRoute?.requiresServiceRole, false)
  assert.equal(mediaRoute?.requiresProviderSecret, false)
  assert.equal(mediaRoute?.requiresStripeSecret, false)

  const decisionRoute = getApiRouteById(
    'editExecution.canonicalPrivateReviewDecision.create',
  )
  assert.equal(
    decisionRoute?.path,
    '/v1/edit-executions/private-review-assemblies/:reviewAssemblyId/canonical-decision',
  )
  assert.equal(decisionRoute?.status, 'frontend_safe_ready')
  assert.equal(decisionRoute?.requiresServiceRole, false)

  const input = {
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    journey: currentJourney,
  }
  const firstMedia = loadCanonicalPrivateReviewMedia(input)
  const duplicateMedia = loadCanonicalPrivateReviewMedia(input)
  const mismatchedMedia = loadCanonicalPrivateReviewMedia({
    ...input,
    journey: {
      ...currentJourney,
      privateReviewMediaAuthority: {
        ...currentJourney.privateReviewMediaAuthority!,
        expectedManifestSha256: 'a'.repeat(64),
      },
    },
  })
  assert.equal(duplicateMedia, firstMedia)
  assert.notEqual(mismatchedMedia, firstMedia)
  const media = await firstMedia
  const mismatched = await mismatchedMedia
  assert.equal(media.status, 'ready')
  assert.equal(mismatched.status, 'invalid_response')
  if (media.status === 'ready') {
    assert.equal(media.media.mode, 'current')
    assert.equal(media.media.fileName, 'canonical-private-review.mp4')
    assert.equal(media.media.byteSize, mediaBytes.byteLength)
    assert.equal(await media.media.blob.text(), mediaBytes.toString('utf8'))
  }
  assert.equal(requests.length, 2)
  assert.equal(requests[0]?.method, 'GET')
  assert.equal(requests[0]?.authorization, 'Bearer private-review-client-token')
  assert.equal(requests[0]?.internalToken, undefined)
  const currentUrl = new URL(requests[0]!.url!, 'http://127.0.0.1')
  assert.equal(
    currentUrl.pathname,
    `/v1/edit-executions/private-review-assemblies/${reviewAssemblyId}/media`,
  )
  assert.deepEqual(Object.fromEntries(currentUrl.searchParams.entries()), {
    workspaceId: identity.workspaceId,
    packageRecordId,
    expectedFinalArtifactSha256: finalArtifactSha256,
    expectedProjectId: identity.projectId,
    expectedEditSessionId: identity.editSessionId,
    expectedManifestSha256: manifestSha256,
    purpose: 'read_canonical_private_review_media',
  })
  assert.doesNotMatch(
    requests[0]!.url!,
    /artifactId|jobId|expectedAssetId|credential|signedUrl|publicUrl|storagePath/i,
  )
  assert.match(requests[1]!.url!, new RegExp(`expectedManifestSha256=${'a'.repeat(64)}`))

  const history = await loadCanonicalPrivateReviewMedia({ ...input, journey: historyJourney })
  assert.equal(history.status, 'ready')
  if (history.status === 'ready') assert.equal(history.media.mode, 'history')
  assert.equal(requests.length, 3)
  assert.match(requests[2]!.url!, /\/private-review-history\//)
  assert.match(requests[2]!.url!, /expectedDecisionManifestSha256=/)

  const accepted = await recordCanonicalPrivateReviewDecision({
    ...input,
    decision: 'accept_private_internal_review',
  })
  assert.equal(accepted.status, 'recorded')
  if (accepted.status === 'recorded') {
    assert.equal(accepted.receipt.revisionRequested, false)
    assert.equal(accepted.receipt.requiresReplanning, false)
  }
  assert.equal(requests.length, 4)
  const acceptanceRequest = requests[3]!
  assert.equal(acceptanceRequest.method, 'POST')
  assert.equal(acceptanceRequest.authorization, 'Bearer private-review-client-token')
  assert.equal(acceptanceRequest.internalToken, undefined)
  assert.match(
    acceptanceRequest.idempotencyKey ?? '',
    /^canonical-private-review-decision:[a-f0-9]{64}$/,
  )
  assert.deepEqual(acceptanceRequest.body, {
    workspaceId: identity.workspaceId,
    expectedProjectId: identity.projectId,
    expectedEditSessionId: identity.editSessionId,
    packageRecordId,
    expectedManifestSha256: manifestSha256,
    expectedFinalArtifactSha256: finalArtifactSha256,
    purpose: 'record_canonical_private_review_decision',
    decision: 'accept_private_internal_review',
  })

  const revision = await recordCanonicalPrivateReviewDecision({
    ...input,
    decision: 'request_revision',
    revisionSummary:
      'Tighten the opening pace, keep the source order, and make captions smaller.',
  })
  assert.equal(revision.status, 'recorded')
  if (revision.status === 'recorded') {
    assert.equal(revision.receipt.revisionRequested, true)
    assert.equal(revision.receipt.requiresFreshEstimateAndApproval, true)
  }
  assert.equal(requests.length, 5)
  const revisionIntent = requests[4]?.body?.revisionIntent as Record<string, unknown>
  assert.deepEqual(revisionIntent.changeCategories, ['pacing', 'caption', 'source_order'])
  assert.deepEqual(revisionIntent.mustPreserve, [
    'source_order',
    'source_meaning',
    'important_clips',
    'approved_aspect_ratio',
    'edit_preferences',
    'edit_brief',
  ])
  assert.equal(revisionIntent.requiresReplanning, true)
  assert.equal(revisionIntent.requiresFreshEstimateAndApproval, true)
  assert.doesNotMatch(
    JSON.stringify(requests[4]?.body),
    /artifactId|jobId|expectedAssetId|credential|token|signedUrl|publicUrl|storagePath|provider|price/i,
  )

  const structuralRevision = await recordCanonicalPrivateReviewDecision({
    ...input,
    decision: 'request_revision',
    revisionSummary:
      'Change the aspect ratio to 16:9 and reorder the clips while preserving their meaning.',
  })
  assert.equal(structuralRevision.status, 'recorded')
  assert.equal(requests.length, 6)
  const structuralRevisionIntent = requests[5]?.body?.revisionIntent as Record<string, unknown>
  assert.deepEqual(
    structuralRevisionIntent.changeCategories,
    ['source_order', 'aspect_ratio'],
  )
  assert.deepEqual(structuralRevisionIntent.mustPreserve, [
    'source_meaning',
    'important_clips',
    'edit_preferences',
    'edit_brief',
  ])

  const exactCaptionRevision = await recordCanonicalPrivateReviewDecision({
    ...input,
    decision: 'request_revision',
    revisionSummary:
      'Replace the approved caption with: The verified final caption.',
    captionReplacementText: 'The verified final caption.',
  })
  assert.equal(exactCaptionRevision.status, 'recorded')
  assert.equal(requests.length, 7)
  const exactCaptionIntent =
    requests[6]?.body?.revisionIntent as Record<string, unknown>
  assert.deepEqual(exactCaptionIntent.changeCategories, ['caption'])
  assert.deepEqual(exactCaptionIntent.mustPreserve, [
    'source_order',
    'source_meaning',
    'important_clips',
    'approved_aspect_ratio',
    'edit_preferences',
    'edit_brief',
  ])
  assert.equal(
    exactCaptionIntent.captionReplacementText,
    'The verified final caption.',
  )

  responseMode = 'foreign'
  const foreign = await recordCanonicalPrivateReviewDecision({
    ...input,
    decision: 'accept_private_internal_review',
  })
  assert.equal(foreign.status, 'invalid_response')

  const beforeInvalid = requests.length
  const invalid = await loadCanonicalPrivateReviewMedia({
    ...input,
    journey: { ...currentJourney, identity: { ...identity, editSessionId: 'foreign-edit' } },
  })
  assert.equal(invalid.status, 'blocked')
  assert.equal(requests.length, beforeInvalid)
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log('Canonical private review frontend client smoke passed.')

function receiptFixture(input: {
  decision: 'accept_private_internal_review' | 'request_revision'
  workspaceId: string
}) {
  const revisionRequested = input.decision === 'request_revision'
  return {
    schemaVersion: 'canonical-private-review-decision-coordinator-receipt-v1',
    source: 'canonical_private_review_decision_coordinator_service',
    purpose: 'record_canonical_private_review_decision',
    disposition: 'decision_recorded',
    identity: {
      ...identity,
      workspaceId: input.workspaceId,
      packageRecordId,
      reviewAssemblyId,
    },
    authority: {
      reviewManifestSha256: manifestSha256,
      finalArtifactSha256,
      exactReviewAuthorityRevalidated: true,
      immutableApprovedSnapshotPreserved: true,
      immutableReviewManifestPreserved: true,
    },
    decision: {
      value: input.decision,
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

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
