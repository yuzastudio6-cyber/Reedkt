import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024
const ignoredExtensions = /\.(?:avif|gif|ico|jpe?g|mov|mp3|mp4|pdf|png|ttf|wav|webm|webp|woff2?|zip)$/i
const placeholderPattern = /(?:not-a-real|placeholder|redacted|example-only|dummy-secret)/i
const secretPatterns = [
  { id: 'private_key', pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g },
  { id: 'github_token', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g },
  { id: 'slack_token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { id: 'aws_access_key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'google_api_key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { id: 'stripe_secret', pattern: /\bsk_(?:live|test)_[0-9A-Za-z]{20,}\b/g },
  { id: 'provider_secret', pattern: /\bsk-[A-Za-z0-9_-]{24,}\b/g },
]
const horizontalSpace = '[^\\S\\r\\n]'
const sensitiveAssignmentPattern = new RegExp(
  `^${horizontalSpace}*(?:export${horizontalSpace}+)?` +
  '(SUPABASE_SERVICE_ROLE_KEY|REEDITPRO_INTERNAL_SERVICE_TOKEN|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|[A-Z0-9_]+(?:API_KEY|SIGNING_SECRET|PRIVATE_KEY))' +
  `${horizontalSpace}*=${horizontalSpace}*([^\\r\\n]*)$`,
  'gm',
)

const { DEVELOPER_DIR: _developerDir, ...gitEnv } = process.env
const fileOutput = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
  encoding: 'utf8',
  env: gitEnv,
})
const files = [...new Set(fileOutput.split('\0').filter(Boolean))].sort()
const findings = []

for (const filePath of files) {
  if (ignoredExtensions.test(filePath)) continue
  const fileName = basename(filePath)
  if (/^\.env(?:\..+)?$/.test(fileName) && !fileName.endsWith('.example')) {
    findings.push({ filePath, line: 1, category: 'tracked_environment_file' })
    continue
  }

  let stats
  try {
    stats = statSync(filePath)
  } catch {
    continue
  }
  if (!stats.isFile() || stats.size > MAX_TEXT_FILE_BYTES) continue

  let content
  try {
    content = readFileSync(filePath, 'utf8')
  } catch {
    continue
  }
  if (content.includes('\0')) continue

  for (const { id, pattern } of secretPatterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (placeholderPattern.test(match[0])) continue
      findings.push({ filePath, line: lineNumberAt(content, match.index), category: id })
    }
  }

  sensitiveAssignmentPattern.lastIndex = 0
  let assignment
  while ((assignment = sensitiveAssignmentPattern.exec(content)) !== null) {
    const value = stripMatchingQuotes(assignment[2].trim())
    if (
      !value ||
      /^\$\{[^}]+\}$/.test(value) ||
      /^\$\([^\r\n]+\)$/.test(value) ||
      placeholderPattern.test(value)
    ) continue
    findings.push({
      filePath,
      line: lineNumberAt(content, assignment.index),
      category: `nonempty_${assignment[1].toLowerCase()}`,
    })
  }
}

const uniqueFindings = [...new Map(
  findings.map((finding) => [`${finding.filePath}:${finding.line}:${finding.category}`, finding]),
).values()]

if (uniqueFindings.length > 0) {
  console.error(`Repository secret scan failed with ${uniqueFindings.length} finding(s). Values are intentionally redacted.`)
  for (const finding of uniqueFindings) {
    console.error(`${finding.filePath}:${finding.line} [${finding.category}]`)
  }
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ ok: true, filesScanned: files.length, secretValuesPrinted: false }))
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length
}

function stripMatchingQuotes(value) {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1)
  }
  return value
}
