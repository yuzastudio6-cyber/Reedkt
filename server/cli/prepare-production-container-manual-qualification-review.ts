const MAX_HOST_RECEIPT_BYTES = 2 * 1024 * 1024

if (process.env.REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION !== 'true') {
  console.error(JSON.stringify({
    ok: false,
    errorCode: 'explicit_manual_review_preparation_confirmation_required',
  }))
  process.exit(2)
}

try {
  const rawReceipt = await readBoundedStdin(MAX_HOST_RECEIPT_BYTES)
  const hostVerification = JSON.parse(rawReceipt) as unknown
  const [reviewPackageContract, liveAdapter] = await Promise.all([
    import('../workers/readiness-validation/production-container-manual-qualification-review-package'),
    import('../workers/readiness-validation/production-container-qualification-live-host-adapter'),
  ])
  const liveHostAdapter = liveAdapter.createLiveProductionContainerQualificationHostAdapter()
  const reviewPackage = reviewPackageContract
    .buildProductionContainerManualQualificationReviewPackage({
      hostVerification,
      sourceAdapter: { inspectSource: () => liveHostAdapter.inspectSource() },
    })
  console.log(JSON.stringify(reviewPackage, null, 2))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    errorCode: sanitizedErrorCode(error),
    reviewerDecisionAccepted: false,
    productionImageQualified: false,
    deployedReleaseQualified: false,
    productionReady: false,
  }))
  process.exitCode = 1
}

async function readBoundedStdin(maxBytes: number): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
    size += buffer.byteLength
    if (size > maxBytes) throw new Error('host_verification_receipt_too_large')
    chunks.push(buffer)
  }
  if (size === 0) throw new Error('host_verification_receipt_missing')
  const value = Buffer.concat(chunks).toString('utf8')
  if (value.includes('\0')) throw new Error('host_verification_receipt_invalid')
  return value
}

function sanitizedErrorCode(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'manual_review_preparation_failed'
  const safe = raw.replace(/[^A-Za-z0-9_.-]/gu, '_').slice(0, 100)
  return safe || 'manual_review_preparation_failed'
}
