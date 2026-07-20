import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createPrivateRetainedReviewOutputDirectory,
  finalizePrivateRetainedReviewOutput,
  hardenPrivateRetainedReviewOutputTree,
  inspectPrivateRetainedReviewOutput,
  writePrivateRetainedReviewJsonCreateOnly,
} from '../internal-testing/private-retained-review-output'

const fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-private-retained-review-'))
const finalVideoFileName = 'professional-review.mp4'

try {
  const accepted = await buildFixture('accepted', Buffer.from('bounded-private-review-video'))
  const broadModeInspection = await inspectPrivateRetainedReviewOutput({
    outputRoot: accepted.outputRoot,
    finalVideoFileName,
    expectedRootIdentity: accepted.identity,
  })
  assert.equal(broadModeInspection.status, 'privacy_permissions_blocked')
  assert.equal(broadModeInspection.privateReviewReady, false)
  assert.equal(broadModeInspection.artifactIntegrityVerified, true)
  assert.equal(broadModeInspection.reviewContractVerified, true)
  assert.equal(broadModeInspection.filesystemModeBoundaryVerified, false)
  assert.equal(modeBits((await stat(join(accepted.outputRoot, finalVideoFileName))).mode), 0o644)
  assert.equal(modeBits((await stat(join(accepted.outputRoot, 'caption-overlays'))).mode), 0o755)

  const finalized = await finalizePrivateRetainedReviewOutput({
    outputRoot: accepted.outputRoot,
    finalVideoFileName,
    expectedRootIdentity: accepted.identity,
  })
  assert.equal(finalized.status, 'private_retained_review_verified')
  assert.equal(finalized.privateReviewReady, true)
  assert.equal(finalized.filesystemModeBoundaryVerified, true)
  assert.equal(finalized.artifactIntegrityVerified, true)
  assert.equal(finalized.reviewContractVerified, true)
  assert.equal(finalized.userCreativeReviewRequired, true)
  assert.equal(finalized.productReadyClaim, false)
  assert.equal(finalized.canonicalProductPipelineReady, false)
  assert.equal(finalized.publicDeliveryAllowed, false)
  assert.equal(finalized.finalVideo?.checksumSha256, accepted.checksumSha256)
  assert.match(finalized.evidenceHash, /^[a-f0-9]{64}$/u)
  assert.equal(modeBits((await stat(accepted.outputRoot)).mode), 0o700)
  assert.equal(modeBits((await stat(join(accepted.outputRoot, 'caption-overlays'))).mode), 0o700)
  for (const relativePath of [
    finalVideoFileName,
    'approved-edit-plan.json',
    'timeline-manifest.json',
    'artifact-manifest.json',
    'final-qa-report.json',
    join('caption-overlays', 'caption-001.png'),
  ]) assert.equal(modeBits((await stat(join(accepted.outputRoot, relativePath))).mode), 0o600)

  await assert.rejects(
    () => createPrivateRetainedReviewOutputDirectory({ outputRoot: accepted.outputRoot }),
    (error: unknown) => apiReason(error) === 'private_directory_create_only_collision',
  )
  assert.deepEqual(
    await readFile(join(accepted.outputRoot, finalVideoFileName)),
    Buffer.from('bounded-private-review-video'),
  )

  await writeFile(join(accepted.outputRoot, finalVideoFileName), 'tampered-video')
  const tampered = await inspectPrivateRetainedReviewOutput({
    outputRoot: accepted.outputRoot,
    finalVideoFileName,
    expectedRootIdentity: accepted.identity,
  })
  assert.equal(tampered.status, 'artifact_integrity_blocked')
  assert.equal(tampered.privateReviewReady, false)
  assert.ok(tampered.blockingReasons.includes('private_review_final_artifact_content_changed'))

  const symlinkRoot = join(fixtureRoot, 'symlink-review')
  const symlinkOutput = await createPrivateRetainedReviewOutputDirectory({ outputRoot: symlinkRoot })
  const externalTarget = join(fixtureRoot, 'external-target.mp4')
  await writeFile(externalTarget, 'external-private-media', { mode: 0o644 })
  await chmod(externalTarget, 0o644)
  await symlink(externalTarget, join(symlinkRoot, finalVideoFileName))
  const symlinkInspection = await inspectPrivateRetainedReviewOutput({
    outputRoot: symlinkRoot,
    finalVideoFileName,
    expectedRootIdentity: symlinkOutput.identity,
  })
  assert.equal(symlinkInspection.status, 'unsafe_filesystem_entry_blocked')
  assert.deepEqual(symlinkInspection.blockingReasons, ['private_review_symbolic_link_refused'])
  await assert.rejects(
    () => hardenPrivateRetainedReviewOutputTree({
      outputRoot: symlinkRoot,
      expectedRootIdentity: symlinkOutput.identity,
    }),
    (error: unknown) => apiReason(error) === 'private_review_symbolic_link_refused',
  )
  assert.equal(await readFile(externalTarget, 'utf8'), 'external-private-media')
  assert.equal(modeBits((await stat(externalTarget)).mode), 0o644)

  const missingOutput = await createPrivateRetainedReviewOutputDirectory({
    outputRoot: join(fixtureRoot, 'missing-review'),
  })
  const missing = await inspectPrivateRetainedReviewOutput({
    outputRoot: missingOutput.outputRoot,
    finalVideoFileName,
    expectedRootIdentity: missingOutput.identity,
  })
  assert.equal(missing.status, 'required_evidence_missing')
  assert.equal(missing.privateReviewReady, false)

  const substitutedOutput = await buildFixture('substituted', Buffer.from('substitution-check'))
  const substitutedIdentity = await lstat(substitutedOutput.outputRoot)
  const wrongIdentity = {
    device: substitutedIdentity.dev,
    inode: substitutedIdentity.ino + 1,
  }
  const substituted = await inspectPrivateRetainedReviewOutput({
    outputRoot: substitutedOutput.outputRoot,
    finalVideoFileName,
    expectedRootIdentity: wrongIdentity,
  })
  assert.equal(substituted.status, 'unsafe_filesystem_entry_blocked')
  assert.deepEqual(substituted.blockingReasons, ['private_review_output_root_identity_changed'])

  const wholeEditCliSource = await readFile(
    join(process.cwd(), 'server/cli/internal-testing-real-video-whole-edit.ts'),
    'utf8',
  )
  assert.doesNotMatch(wholeEditCliSource, /rm\(outputRoot/u)
  assert.doesNotMatch(wholeEditCliSource, /mkdir\(outputRoot/u)
  assert.match(wholeEditCliSource, /createPrivateRetainedReviewOutputDirectory/u)
  assert.match(wholeEditCliSource, /writePrivateRetainedReviewJsonCreateOnly/u)
  assert.match(wholeEditCliSource, /finalizePrivateRetainedReviewOutput/u)
  assert.match(wholeEditCliSource, /internal-testing-reeditpro-final-runs/u)

  console.log(JSON.stringify({
    ok: true,
    verdict: 'PRIVATE_RETAINED_REVIEW_OUTPUT_CREATE_ONLY_MODE_INTEGRITY_REVIEW_GATE_ACCEPTED',
    accepted: {
      status: finalized.status,
      fileCount: finalized.fileCount,
      directoryCount: finalized.directoryCount,
      checksumSha256: finalized.finalVideo?.checksumSha256,
      evidenceHash: finalized.evidenceHash,
    },
    adversarial: {
      readOnlyBroadModeClassification: broadModeInspection.status,
      postPublicationTamper: tampered.status,
      symlink: symlinkInspection.status,
      missingEvidence: missing.status,
      rootIdentitySubstitution: substituted.status,
      createOnlyCollisionPreserved: true,
      externalSymlinkTargetUnchanged: true,
      destructiveLegacyOutputReplacementRemoved: true,
      realWholeEditCliWiredToPrivatePublicationBoundary: true,
    },
    productReady: false,
    canonicalProductPipelineReady: false,
    publicDeliveryAllowed: false,
    providerRequests: 0,
    cloudMutations: 0,
    supabaseMutations: 0,
    billingMutations: 0,
  }, null, 2))
} finally {
  await rm(fixtureRoot, { recursive: true, force: true })
}

async function buildFixture(directoryName: string, finalBytes: Buffer): Promise<{
  outputRoot: string
  identity: { device: number; inode: number }
  checksumSha256: string
}> {
  const outputRoot = join(fixtureRoot, directoryName)
  const created = await createPrivateRetainedReviewOutputDirectory({ outputRoot })
  const checksumSha256 = createHash('sha256').update(finalBytes).digest('hex')
  await writeFile(join(outputRoot, finalVideoFileName), finalBytes, { mode: 0o644 })
  await chmod(join(outputRoot, finalVideoFileName), 0o644)
  await mkdir(join(outputRoot, 'caption-overlays'), { mode: 0o755 })
  await chmod(join(outputRoot, 'caption-overlays'), 0o755)
  await writeFile(join(outputRoot, 'caption-overlays', 'caption-001.png'), 'png', { mode: 0o644 })
  await chmod(join(outputRoot, 'caption-overlays', 'caption-001.png'), 0o644)

  await Promise.all([
    writePrivateRetainedReviewJsonCreateOnly({
      outputRoot,
      fileName: 'approved-edit-plan.json',
      value: {
        decision: 'internal_testing_real_video_whole_edit_completed_ready_for_private_user_review',
        source: { private: true },
        approvals: {
          approvedSnapshotId: 'approved-snapshot-private-review',
          creditReservationId: 'credit-reservation-private-review',
        },
      },
    }),
    writePrivateRetainedReviewJsonCreateOnly({
      outputRoot,
      fileName: 'timeline-manifest.json',
      value: { approvedSnapshotId: 'approved-snapshot-private-review' },
    }),
    writePrivateRetainedReviewJsonCreateOnly({
      outputRoot,
      fileName: 'artifact-manifest.json',
      value: {
        private: true,
        sourceImmutable: true,
        artifacts: [{
          type: 'final_export',
          localFilePath: join(outputRoot, finalVideoFileName),
          checksum: checksumSha256,
          sizeBytes: finalBytes.byteLength,
          sourceOfTruth: true,
        }],
        publicDelivery: false,
        signedUrls: false,
        supabaseWrites: false,
        gcsWrites: false,
      },
    }),
    writePrivateRetainedReviewJsonCreateOnly({
      outputRoot,
      fileName: 'final-qa-report.json',
      value: {
        status: 'passed_technical_and_structured_intent_qa_pending_user_creative_review',
        outputSizeBytes: finalBytes.byteLength,
        outputChecksumSha256: checksumSha256,
        userCreativeReviewRequired: true,
        productReadyClaim: false,
      },
    }),
  ])
  return { outputRoot, identity: created.identity, checksumSha256 }
}

function apiReason(error: unknown): unknown {
  return typeof error === 'object'
    && error !== null
    && 'details' in error
    && typeof error.details === 'object'
    && error.details !== null
    && 'reason' in error.details
    ? error.details.reason
    : undefined
}

function modeBits(mode: number): number {
  return mode & 0o777
}
