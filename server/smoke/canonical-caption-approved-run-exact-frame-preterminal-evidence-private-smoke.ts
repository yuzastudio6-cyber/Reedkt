import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import {
  parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
} from '../captions-specialist/caption-broll-approved-run-exact-frame-professional-inspection'
import {
  createCanonicalCaptionApprovedRunExactFramePreterminalEvidence,
  createCanonicalCaptionApprovedRunExactFramePreterminalRepository,
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence,
} from '../services/canonical-caption-approved-run-exact-frame-preterminal-evidence-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'

const rootInput = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_EXECUTION_EVIDENCE_ROOT?.trim() ?? ''
const expectedRunPackageSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_RUN_INSPECTION_PACKAGE_SHA256?.trim() ?? ''
const expectedReceiptDigestSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_EXACT_FRAME_INSPECTION_RECEIPT_DIGEST_SHA256
  ?.trim() ?? ''
if (!rootInput || ![expectedRunPackageSha256, expectedReceiptDigestSha256]
  .every((value) => /^[a-f0-9]{64}$/u.test(value))) {
  throw new Error(
    'Private preterminal persistence requires the exact evidence root and both accepted SHA-256 bindings.',
  )
}
const root = resolve(rootInput)
const baselineDirectory = join(root, 'caption-broll-approved-private-inspection')
const exactDirectory = join(root, 'caption-broll-approved-exact-frame-review')
const readJson = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8')) as unknown

const approvedRunInspectionPackage = await readJson(
  join(baselineDirectory, 'inspection-package.json')) as {
  packageSha256?: string
}
assert.equal(approvedRunInspectionPackage.packageSha256,
  expectedRunPackageSha256)
const exactFrameInspectionReceiptValue = await readJson(
  join(exactDirectory,
    'exact-frame-professional-direct-inspection-receipt.json'))
const exactFrameInspectionPackage = await readJson(
  join(exactDirectory, 'inspection-package.json'))
const fullMotionExactFrameReview = await readJson(
  join(exactDirectory, 'full-motion-exact-frame-binding.json'))
const reducedMotionExactFrameReview = await readJson(
  join(exactDirectory, 'reduced-motion-exact-frame-binding.json'))
const exactFrameInspectionReceipt =
  parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
    exactFrameInspectionReceiptValue, {
      inspectionPackage: exactFrameInspectionPackage,
      fullMotionExactFrameReview,
      reducedMotionExactFrameReview,
    })
assert.equal(exactFrameInspectionReceipt.receiptDigestSha256,
  expectedReceiptDigestSha256)

const evidence =
  createCanonicalCaptionApprovedRunExactFramePreterminalEvidence({
    evidenceId:
      'caption.broll.approved-run.v14.exact-frame-preterminal-evidence',
    approvedRunInspectionPackage,
    exactFrameInspectionReceipt,
  })
const repository =
  createCanonicalCaptionApprovedRunExactFramePreterminalRepository({
    objectPort: createCanonicalPrivateLocalJsonObjectPort({
      localStorageRoot: root,
    }),
  })
const disposition = await repository.persistEvidenceCreateOnly({ evidence })
const reread = await repository.rereadEvidence({
  ownerUserId: evidence.canonicalScope.ownerUserId,
  workspaceId: evidence.canonicalScope.workspaceId,
  approvedSnapshotRef: evidence.approvedSnapshotRef,
  outputId: evidence.canonicalScope.outputId,
  exactFrameInspectionReceiptRef: evidence.exactFrameInspectionReceiptRef,
})
assert.deepEqual(
  parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(reread),
  evidence)

console.log(JSON.stringify({
  smoke:
    'canonical_caption_approved_run_exact_frame_preterminal_evidence_private',
  status: 'passed',
  persistenceDisposition: disposition,
  evidenceId: evidence.evidenceId,
  evidenceDigestSha256: evidence.evidenceDigestSha256,
  approvedRunInspectionPackageRef:
    evidence.approvedRunInspectionPackageRef,
  exactFrameInspectionReceiptRef: evidence.exactFrameInspectionReceiptRef,
  approvedSnapshotRef: evidence.approvedSnapshotRef,
  executionPackageRef: evidence.executionPackageRef,
  confirmedOutputFrameRef: evidence.confirmedOutputFrameRef,
  approvedCaptionJobCount:
    evidence.approvedRunCoverage.approvedCaptionJobCount,
  approvedBrollWorkItemCount:
    evidence.approvedRunCoverage.approvedBrollWorkItemCount,
  exactFrameRenderedFrameCount:
    evidence.approvedRunCoverage.exactFrameRenderedFrameCount,
  sourcePictureQualityQualified: evidence.sourcePictureQualityQualified,
  terminalRunEvidenceEligible: evidence.terminalRunEvidenceEligible,
  firstRemainingGateCode: evidence.firstRemainingGateCode,
  providerCallMadeByCaption: evidence.providerCallMadeByCaption,
  finalQaApprovalGranted: evidence.finalQaApprovalGranted,
  publicDeliveryGranted: evidence.publicDeliveryGranted,
  productionAuthorityGranted: evidence.productionAuthorityGranted,
}, null, 2))
