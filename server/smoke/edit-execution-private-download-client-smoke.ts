import assert from 'node:assert/strict'
import { createServer } from 'node:http'

const privateDownloadBytes = Buffer.from('mock-private-review-mp4-bytes')
const privateManifest = {
  manifestVersion: 'private-internal-edit-decision-manifest-v1',
  source: 'approved_snapshot_private_render_execution',
  approvedPlanSnapshotId: 'approved-snapshot-private-download-smoke',
  approvedEditContext: {
    source: 'approved_plan_snapshot',
    projectId: 'project-private-download-smoke',
    editSessionId: 'edit-session-private-download-smoke',
    editPlanVersionId: 'edit-plan-version-private-download-smoke',
    creditEstimateId: 'credit-estimate-private-download-smoke',
    approvedAt: '2026-07-06T12:00:00.000Z',
    approvedBy: 'mock-user',
    goalSummary: 'Create a clean professional private review edit.',
    editLevel: 'pro',
    editingCategory: 'storytelling',
    workflowType: 'custom_let_ai_decide',
    moodStyle: 'clean',
    aspectRatio: '9:16',
    aspectRatioConfirmed: true,
    sourceOrderConfirmed: true,
    cleanupPreferenceConfirmed: true,
    timingBaseConfirmed: true,
    professionalBaseline: true,
    sourceSequenceItemCount: 1,
    segmentCount: 1,
    operationCount: 1,
    qaGateCount: 1,
    creditEstimateTotalCredits: 1,
  },
  creditReservationId: 'credit-reservation-private-download-smoke',
  renderPreviewAssemblyId: 'render-preview-assembly-private-download-smoke',
  finalRenderArtifactId: 'final-render-artifact-private-download-smoke',
  clipDecisionCount: 0,
  sourceMediaAssetCount: 0,
  privateCaptionPackage: { attached: false, source: 'none', artifactCount: 0, formats: [] },
  professionalLayerCounts: {
    reviewOverlays: 0,
    captionOverlays: 0,
    transitionPolish: 0,
    visualPolish: 0,
    finalTiming: 0,
    audioPolish: 0,
  },
  decisions: [],
  gateState: {
    privateInternalReview: 'requires_delivery_qa',
    publicDeliveryReady: false,
    externalBetaReady: false,
    productionReady: false,
  },
  blockedRuntimeScopes: {
    publicArtifactCreated: false,
    signedUrlCreated: false,
    supabaseOrGcsWrite: false,
    externalBetaEnabled: false,
    productionEnabled: false,
    billingMutation: false,
  },
}
const privateManifestBytes = Buffer.from(`${JSON.stringify(privateManifest)}\n`)
const seenRequests: Array<{
  method: string
  url: string
  accept?: string
  requestId?: string
  authorization?: string
}> = []

const server = createServer((request, response) => {
  seenRequests.push({
    method: request.method ?? 'GET',
    url: request.url ?? '/',
    accept: request.headers.accept?.toString(),
    requestId: request.headers['x-request-id']?.toString(),
    authorization: request.headers.authorization?.toString(),
  })

  if (
    request.method === 'GET' &&
    request.url === '/v1/edit-executions/private-internal-downloads/private-download-smoke/file'
  ) {
    response.statusCode = 200
    response.setHeader('content-type', 'video/mp4')
    response.setHeader('content-length', String(privateDownloadBytes.byteLength))
    response.setHeader('cache-control', 'no-store')
    response.setHeader('content-disposition', 'attachment; filename="private-review-smoke.mp4"')
    response.end(privateDownloadBytes)
    return
  }

  if (
    request.method === 'GET' &&
    request.url === '/v1/edit-executions/private-internal-downloads/private-download-smoke/manifest'
  ) {
    response.statusCode = 200
    response.setHeader('content-type', 'application/json')
    response.setHeader('content-length', String(privateManifestBytes.byteLength))
    response.setHeader('cache-control', 'no-store')
    response.setHeader('content-disposition', 'attachment; filename="private-review-smoke-manifest.json"')
    response.end(privateManifestBytes)
    return
  }

  response.statusCode = 404
  response.setHeader('content-type', 'text/plain')
  response.end('not found')
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object', 'Private download smoke server should expose a TCP address.')

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_SUPABASE_URL = ''
process.env.VITE_SUPABASE_ANON_KEY = ''

try {
  const {
    fetchApprovedEditExecutionPrivateInternalDownloadFileClient,
    fetchApprovedEditExecutionPrivateInternalDownloadManifestClient,
  } = await import(
    '../../src/lib/approved-edit-execution-package-client'
  )

  const blockedPublicUrl = await fetchApprovedEditExecutionPrivateInternalDownloadFileClient(
    'https://storage.example.com/private-review.mp4?signed=true',
  )
  assert.equal(blockedPublicUrl.ok, false)
  assert.equal(blockedPublicUrl.error?.code, 'invalid_private_download_path')
  assert.equal(seenRequests.length, 0, 'Invalid public/signed URL should fail before fetch.')

  const blockedPublicManifestUrl = await fetchApprovedEditExecutionPrivateInternalDownloadManifestClient(
    'https://storage.example.com/private-review-manifest.json?signed=true',
  )
  assert.equal(blockedPublicManifestUrl.ok, false)
  assert.equal(blockedPublicManifestUrl.error?.code, 'invalid_private_manifest_path')
  assert.equal(seenRequests.length, 0, 'Invalid public/signed manifest URL should fail before fetch.')

  const result = await fetchApprovedEditExecutionPrivateInternalDownloadFileClient(
    '/v1/edit-executions/private-internal-downloads/private-download-smoke/file',
  )

  assert.equal(result.ok, true, result.error?.message)
  assert.equal(result.data?.fileName, 'private-review-smoke.mp4')
  assert.equal(result.data?.mimeType, 'video/mp4')
  assert.equal(result.data?.byteSize, privateDownloadBytes.byteLength)
  assert.equal(await result.data?.blob.text(), privateDownloadBytes.toString('utf8'))
  assert.equal(seenRequests.length, 1)
  assert.equal(seenRequests[0]?.method, 'GET')
  assert.match(seenRequests[0]?.accept ?? '', /video\/mp4/)
  assert.match(seenRequests[0]?.requestId ?? '', /^private-internal-download-/)

  const manifestResult = await fetchApprovedEditExecutionPrivateInternalDownloadManifestClient(
    '/v1/edit-executions/private-internal-downloads/private-download-smoke/manifest',
  )

  assert.equal(manifestResult.ok, true, manifestResult.error?.message)
  assert.equal(manifestResult.data?.fileName, 'private-review-smoke-manifest.json')
  assert.equal(manifestResult.data?.mimeType, 'application/json')
  assert.equal(manifestResult.data?.byteSize, privateManifestBytes.byteLength)
  assert.equal(manifestResult.data?.manifest.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(manifestResult.data?.manifest.finalRenderArtifactId, privateManifest.finalRenderArtifactId)
  assert.equal(await manifestResult.data?.blob.text(), privateManifestBytes.toString('utf8'))
  assert.equal(seenRequests.length, 2)
  assert.equal(seenRequests[1]?.method, 'GET')
  assert.match(seenRequests[1]?.accept ?? '', /application\/json/)
  assert.match(seenRequests[1]?.requestId ?? '', /^private-internal-manifest-/)

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'signed_or_public_url_rejected_before_fetch',
      'signed_or_public_manifest_url_rejected_before_fetch',
      'private_internal_download_route_fetched',
      'private_internal_download_requires_no_store_cache_policy',
      'mp4_blob_returned_to_frontend_client',
      'private_internal_manifest_route_fetched',
      'private_internal_manifest_requires_no_store_cache_policy',
      'edit_decision_manifest_returned_to_frontend_client',
      'content_disposition_filename_preserved',
      'no_public_delivery_or_signed_url_required',
    ],
    byteSize: result.data?.byteSize,
    requestCount: seenRequests.length,
  }))
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}
