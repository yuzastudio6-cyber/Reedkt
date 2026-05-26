import assert from 'node:assert/strict'
import { sanitizeLogPayload } from '../observability'
import {
  artifactRetentionPolicy,
  auditLogEventTypes,
  buildSanitizedAuditEvent,
  exportDeliveryPolicy,
} from '../privacy-retention'
import {
  assertNoPersistentSignedUrls,
  assertNoRawPromptExecution,
  buildSecurityReviewReport,
  detectFrontendBackendBoundaryFindings,
} from '../security-review'

const secretPayload = { nested: { serviceRoleKey: 'secret-value' } }
const secretSanitized = sanitizeLogPayload(secretPayload)
assert.equal((secretSanitized.sanitized as typeof secretPayload).nested.serviceRoleKey, '[REDACTED]', 'nested secrets should be redacted')

const signedUrlSanitized = sanitizeLogPayload({ signedUrl: 'https://storage.example/file?signature=abc' })
assert.equal((signedUrlSanitized.sanitized as { signedUrl: string }).signedUrl, '[REDACTED]', 'signed URLs should be redacted')

const promptSanitized = sanitizeLogPayload({ rawPrompt: 'make this viral' })
assert.equal((promptSanitized.sanitized as { rawPrompt: string }).rawPrompt, '[REDACTED]', 'raw prompts should be redacted')

assert.throws(() => assertNoPersistentSignedUrls({ signed_url: 'https://storage.example/file?signature=abc' }), /signed URL/i)
assert.throws(() => assertNoRawPromptExecution({ rawPrompt: 'execute this chat text' }), /Raw prompt/i)

const frontendFindings = detectFrontendBackendBoundaryFindings([
  { path: 'src/components/Unsafe.tsx', content: "import x from '../../server/workers/render'" },
])
assert.ok(frontendFindings.length > 0, 'frontend/backend boundary policy should flag server worker imports')

for (const rule of Object.values(artifactRetentionPolicy)) {
  assert.equal(rule.defaultPrivate, true, `${rule.retentionClass} should default private`)
}

assert.equal(exportDeliveryPolicy.persistSignedUrlAsSourceOfTruth, false, 'delivery policy must forbid persistent signed URLs')
assert.ok(auditLogEventTypes.includes('kill_switch_toggled'), 'audit log policy should include kill switch events')
assert.throws(() => buildSanitizedAuditEvent({
  eventType: 'worker_job_created',
  occurredAt: new Date().toISOString(),
  actorType: 'worker',
  sanitizedSummary: { rawPrompt: 'do this' },
}), /forbidden sensitive fields/i)

const securityReport = buildSecurityReviewReport()
assert.ok(securityReport.blockers.length > 0, 'security report should include blockers before human review')
assert.ok(securityReport.nextActions.length > 0, 'security report should include next actions')

console.log('production-security-privacy-smoke passed')
