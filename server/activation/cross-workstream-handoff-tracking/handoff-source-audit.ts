import { existsSync } from 'node:fs'
import { buildGoNoGoSourceAudit } from '../controlled-internal-test-go-no-go'
import type { CrossWorkstreamSourceAudit } from './cross-workstream-handoff-types'

export function buildCrossWorkstreamSourceAudit(createdAt = new Date()): CrossWorkstreamSourceAudit {
  const base = buildGoNoGoSourceAudit(createdAt)
  const crossChatDocsPresentNow = existsSync('docs/cross-chat')
  return {
    ...base,
    auditId: 'phase52h_repo_ownership_audit',
    duplicateHandoffTrackingImplementationDetected: false,
    phase52GBaseCrossChatDocsPresent: false,
    phase52HCreatesCrossChatDocs: crossChatDocsPresentNow,
    findings: [
      'Phase 52H is owned by the shared system coordination / cross-workstream handoff tracking layer.',
      'Phase 52H tracks owner responses and intake templates only; it does not execute owner prompts or workstream runtimes.',
      'docs/cross-chat was absent on the Phase 52G base and is introduced here for coordination docs.',
      'Explicit owner workstreams remain out of scope for this chat.',
    ],
  }
}
