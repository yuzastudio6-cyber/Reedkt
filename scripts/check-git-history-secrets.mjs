import { spawn } from 'node:child_process'

const MAX_SCANNED_BLOB_BYTES = 4 * 1024 * 1024
const placeholderPattern = /(?:not-a-real|placeholder|redacted|example-only|dummy-secret)/i
const secretPatterns = [
  { id: 'private_key', pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/ },
  { id: 'github_token', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { id: 'slack_token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { id: 'aws_access_key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'google_api_key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { id: 'stripe_secret', pattern: /\bsk_(?:live|test)_[0-9A-Za-z]{20,}\b/ },
  { id: 'provider_secret', pattern: /\bsk-[A-Za-z0-9_-]{24,}\b/ },
]
const sensitiveAssignmentPattern = /^\s*(?:export\s+)?(SUPABASE_SERVICE_ROLE_KEY|REEDITPRO_INTERNAL_SERVICE_TOKEN|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|[A-Z0-9_]+(?:API_KEY|SIGNING_SECRET|PRIVATE_KEY))\s*=\s*([^\r\n]*)$/
const { DEVELOPER_DIR: _developerDir, ...baseGitEnv } = process.env
const gitEnv = { ...baseGitEnv, COPYFILE_DISABLE: '1' }

const requestedRefs = process.argv
  .filter((argument) => argument.startsWith('--ref='))
  .map((argument) => argument.slice('--ref='.length).trim())
  .filter(Boolean)
const refsToScan = requestedRefs.length > 0 ? requestedRefs : ['HEAD']

// Inspect each unique blob reachable from the checked branch once. CI runs on
// every pushed/PR branch, so HEAD coverage is both complete for that branch and
// practical. Additional refs may be supplied explicitly with --ref=<ref>.
// Avoid --all here: Codex checkpoint refs are local implementation artifacts,
// not pushable repository history, and can contain hundreds of thousands of
// duplicate objects.
const objectListing = await runGitText(['rev-list', '--objects', ...refsToScan])
const pathsByObject = new Map()
for (const line of objectListing.split('\n')) {
  const match = line.match(/^([a-f0-9]{40})(?:\s+(.+))?$/)
  if (!match) continue
  const [, objectId, filePath] = match
  if (!filePath) continue
  const paths = pathsByObject.get(objectId) ?? new Set()
  paths.add(filePath)
  pathsByObject.set(objectId, paths)
}

const objectIds = [...pathsByObject.keys()]
const checks = await runGitBatchCheck(objectIds)
const blobIds = checks
  .filter(({ objectId, type, size }) =>
    type === 'blob' && size <= MAX_SCANNED_BLOB_BYTES && pathsByObject.has(objectId))
  .map(({ objectId }) => objectId)

const findings = new Map()
await scanGitBlobs(blobIds, (objectId, content) => {
  // Binary objects are not environment/config source and converting them to
  // text creates noisy accidental token-shaped matches.
  if (content.includes(0)) return
  const text = content.toString('utf8')
  const filePaths = pathsByObject.get(objectId) ?? new Set(['unknown'])

  for (const line of text.split(/\r?\n/)) {
    for (const { id, pattern } of secretPatterns) {
      const match = line.match(pattern)
      if (!match || placeholderPattern.test(match[0])) continue
      for (const filePath of filePaths) recordFinding(objectId, filePath, id)
    }

    const assignment = line.match(sensitiveAssignmentPattern)
    if (!assignment) continue
    const value = stripMatchingQuotes(assignment[2].trim())
    if (
      value &&
      !/^\$\{[^}]+\}$/.test(value) &&
      !/^\$\([^\r\n]+\)$/.test(value) &&
      !placeholderPattern.test(value)
    ) {
      for (const filePath of filePaths) {
        recordFinding(objectId, filePath, `nonempty_${assignment[1].toLowerCase()}`)
      }
    }
  }
})

if (findings.size > 0) {
  console.error(`Git history secret scan found ${findings.size} reachable finding(s). Values are intentionally redacted.`)
  for (const finding of findings.values()) {
    console.error(`${finding.objectId.slice(0, 12)} ${finding.filePath} [${finding.category}]`)
  }
  process.exitCode = 1
} else {
  console.log(JSON.stringify({
    ok: true,
    reachableHistoryScanned: true,
    refsScanned: refsToScan,
    uniqueReachableBlobsScanned: blobIds.length,
    maxBlobBytes: MAX_SCANNED_BLOB_BYTES,
    secretValuesPrinted: false,
  }))
}

function recordFinding(objectId, filePath, category) {
  const key = `${objectId}:${filePath}:${category}`
  findings.set(key, { objectId, filePath, category })
}

function stripMatchingQuotes(value) {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1)
  }
  return value
}

async function runGitText(args) {
  const result = await runGit(args)
  return result.stdout.toString('utf8')
}

async function runGitBatchCheck(objectIdsToCheck) {
  if (objectIdsToCheck.length === 0) return []
  const result = await runGit(
    ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'],
    `${objectIdsToCheck.join('\n')}\n`,
  )
  return result.stdout.toString('utf8').trim().split('\n').flatMap((line) => {
    const match = line.match(/^([a-f0-9]{40}) (\S+) (\d+)$/)
    return match ? [{ objectId: match[1], type: match[2], size: Number(match[3]) }] : []
  })
}

async function scanGitBlobs(objectIdsToScan, onBlob) {
  if (objectIdsToScan.length === 0) return
  const child = spawn('git', ['cat-file', '--batch'], {
    env: gitEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let stderrBytes = 0
  child.stderr.on('data', (chunk) => { stderrBytes += chunk.length })

  let buffered = Buffer.alloc(0)
  let header
  child.stdout.on('data', (chunk) => {
    buffered = Buffer.concat([buffered, chunk])
    while (true) {
      if (!header) {
        const newline = buffered.indexOf(0x0a)
        if (newline < 0) return
        const headerText = buffered.subarray(0, newline).toString('utf8')
        buffered = buffered.subarray(newline + 1)
        const match = headerText.match(/^([a-f0-9]{40}) blob (\d+)$/)
        if (!match) throw new Error('Git batch output contained an unexpected object header.')
        header = { objectId: match[1], size: Number(match[2]) }
      }

      if (buffered.length < header.size + 1) return
      const content = buffered.subarray(0, header.size)
      buffered = buffered.subarray(header.size + 1)
      onBlob(header.objectId, content)
      header = undefined
    }
  })

  child.stdin.end(`${objectIdsToScan.join('\n')}\n`)
  const exitCode = await new Promise((resolve) => child.once('close', resolve))
  if (exitCode !== 0 || header || buffered.length > 0) {
    console.error('Git history scan could not complete. Git output is intentionally omitted to avoid accidental secret disclosure.')
    if (stderrBytes > 0) console.error(`git_stderr_bytes=${stderrBytes}`)
    process.exit(2)
  }
}

async function runGit(args, input) {
  const child = spawn('git', args, {
    env: gitEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const stdoutChunks = []
  let stderrBytes = 0
  child.stdout.on('data', (chunk) => stdoutChunks.push(chunk))
  child.stderr.on('data', (chunk) => { stderrBytes += chunk.length })
  child.stdin.end(input)
  const exitCode = await new Promise((resolve) => child.once('close', resolve))
  if (exitCode !== 0) {
    console.error('Git history scan could not complete. Git output is intentionally omitted to avoid accidental secret disclosure.')
    if (stderrBytes > 0) console.error(`git_stderr_bytes=${stderrBytes}`)
    process.exit(2)
  }
  return { stdout: Buffer.concat(stdoutChunks) }
}
