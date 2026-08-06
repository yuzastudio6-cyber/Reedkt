import assert from 'node:assert/strict'

import {
  buildProfessionalLongFormCustomerDeliveryWorkGraph,
} from '../edit-architecture/professional-long-form-customer-delivery-package'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const snapshotId = 'snapshot-customer-delivery-graph-smoke'
const sourcePrivateMasterQaJobId = 'source-private-master-qa-job-smoke'

const retained = buildGraph(2)
assert.equal(retained.summary.chunkCount, 2)
assert.equal(retained.summary.totalJobCount, 9)
assert.equal(retained.workItems.length, 9)
assert.equal(retained.workItems[0]?.kind, 'validate_private_review_master_qa')
assert.deepEqual(
  retained.workItems[0]?.satisfiedReviewDependencyJobIds,
  [sourcePrivateMasterQaJobId],
)
assert.equal(
  retained.workItems.filter((item) =>
    item.kind === 'encode_customer_delivery_h264_chunk').length,
  2,
)
assert.equal(
  retained.workItems.filter((item) =>
    item.kind === 'qa_customer_delivery_h264_chunk').length,
  2,
)
assert.equal(
  retained.workItems.find((item) =>
    item.kind === 'mux_customer_delivery_h264_aac_master')
    ?.dependencyJobIds.length,
  2,
)
assert.equal(
  retained.workItems.find((item) =>
    item.kind === 'encode_customer_delivery_h264_chunk')
    ?.toolPlan.toolId,
  'remotion',
)
assert.equal(
  retained.workItems.find((item) =>
    item.kind === 'mux_customer_delivery_h264_aac_master')
    ?.toolPlan.toolId,
  'ffmpeg',
)
assert.ok(retained.workItems.every((item) => !item.executionAuthorized))

const maximum = buildGraph(124)
assert.equal(maximum.summary.chunkCount, 124)
assert.equal(maximum.summary.totalJobCount, 253)
assert.equal(maximum.workItems.length, 253)
assert.equal(maximum.workItems.at(-1)?.canonicalOrder, 252)
assert.equal(maximum.summary.maximumDependencyCount, 124)
assert.equal(
  maximum.workItems.find((item) =>
    item.kind === 'mux_customer_delivery_h264_aac_master')
    ?.dependencyJobIds.length,
  124,
)
assert.equal(
  new Set(maximum.workItems.map((item) => item.jobId)).size,
  253,
)
assert.equal(
  new Set(maximum.workItems.map((item) => item.workItemId)).size,
  253,
)
assert.ok(maximum.workItems.every((item, index) =>
  item.canonicalOrder === index && !item.executionAuthorized))

assert.throws(
  () => buildProfessionalLongFormCustomerDeliveryWorkGraph({
    deliverySeedHash: sha256AuthorityValue('invalid-order'),
    approvedPlanSnapshotId: snapshotId,
    sourcePrivateMasterQaJobId,
    chunks: [
      chunk(2, 2),
      chunk(1, 2),
    ].map((value, index) => index === 0
      ? { ...value, chunkIndex: 1 }
      : { ...value, chunkIndex: 1 }),
    continuousProgramAudioSha256: sha256AuthorityValue('audio-invalid'),
  }),
  /every ordered reviewed chunk/u,
)

assert.throws(
  () => buildGraph(125),
  /every ordered reviewed chunk/u,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'professional-long-form-customer-delivery-graph-smoke-v1',
  retainedChunkCount: retained.summary.chunkCount,
  retainedDeliveryJobCount: retained.summary.totalJobCount,
  maximumChunkCount: maximum.summary.chunkCount,
  maximumDeliveryJobCount: maximum.summary.totalJobCount,
  maximumFinalCanonicalOrder: maximum.workItems.at(-1)?.canonicalOrder,
  maximumMuxDependencyCount: maximum.summary.maximumDependencyCount,
  customerDeliveryMediaExecutionVerified: false,
  customerBillingAuthorized: false,
  publicDeliveryAuthorized: false,
  productReady: false,
  productionReady: false,
}, null, 2))

function buildGraph(chunkCount: number) {
  return buildProfessionalLongFormCustomerDeliveryWorkGraph({
    deliverySeedHash: sha256AuthorityValue({
      domain: 'customer-delivery-graph-smoke',
      chunkCount,
    }),
    approvedPlanSnapshotId: snapshotId,
    sourcePrivateMasterQaJobId,
    chunks: Array.from({ length: chunkCount }, (_unused, index) =>
      chunk(index + 1, chunkCount)),
    continuousProgramAudioSha256: sha256AuthorityValue({
      domain: 'customer-delivery-program-audio-smoke',
      chunkCount,
    }),
  })
}

function chunk(chunkIndex: number, chunkCount: number) {
  return {
    chunkId: `reviewed-customer-delivery-chunk-${chunkIndex}`,
    chunkIndex,
    chunkCount,
    artifactSha256: sha256AuthorityValue({
      domain: 'reviewed-customer-delivery-chunk-artifact',
      chunkIndex,
      chunkCount,
    }),
  }
}
