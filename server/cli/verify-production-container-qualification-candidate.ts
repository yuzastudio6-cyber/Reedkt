const MAX_CANDIDATE_BYTES = 2 * 1024 * 1024

if (
  process.env.REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION !== 'true' ||
  process.env.REEDITPRO_CONTAINER_HOST_VERIFICATION_MODE !== 'local_git_and_docker_inspect'
) {
  console.error(JSON.stringify({
    ok: false,
    errorCode: 'explicit_local_host_verification_confirmation_required',
  }))
  process.exit(2)
}

try {
  const rawCandidate = await readBoundedStdin(MAX_CANDIDATE_BYTES)
  const candidate = JSON.parse(rawCandidate) as unknown
  const [contract, liveAdapter] = await Promise.all([
    import('../workers/readiness-validation/production-container-qualification-independent-verification'),
    import('../workers/readiness-validation/production-container-qualification-live-host-adapter'),
  ])
  const receipt = contract.verifyProductionContainerQualificationWithHostAdapter({
    candidate,
    adapter: liveAdapter.createLiveProductionContainerQualificationHostAdapter(),
  })
  console.log(JSON.stringify(receipt, null, 2))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    errorCode: sanitizedErrorCode(error),
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
    if (size > maxBytes) throw new Error('candidate_receipt_too_large')
    chunks.push(buffer)
  }
  if (size === 0) throw new Error('candidate_receipt_missing')
  const value = Buffer.concat(chunks).toString('utf8')
  if (value.includes('\0')) throw new Error('candidate_receipt_invalid')
  return value
}

function sanitizedErrorCode(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'host_verification_failed'
  const safe = raw.replace(/[^A-Za-z0-9_.-]/gu, '_').slice(0, 100)
  return safe || 'host_verification_failed'
}
