import type { OwnerAcceptanceChecklist } from './runtime-unlock-roadmap-types'

export function buildOwnerAcceptanceChecklist(): OwnerAcceptanceChecklist {
  return {
    checklistId: 'phase53a_owner_acceptance_checklist',
    requiredItems: [
      'Confirm workstream owner and ownership boundaries.',
      'Confirm accepted scope and blocked scope.',
      'Confirm current unlock ladder stage.',
      'Run repo audit only; do not implement runtime behavior in the audit prompt.',
      'List source-of-truth docs, code contracts, manifests, and private artifacts.',
      'List required dry-run, generated/local fixture, staging fixture, and controlled private sample gates.',
      'Confirm Supabase update classification and whether milestone sync only is sufficient.',
      'Confirm production, external beta, paid production, broad media, public artifacts, signed URL source-of-truth, and raw prompt execution remain blocked.',
    ],
    phase53BHandling: [
      'Phase 53B may intake owner acceptance responses after owner chats respond.',
      'If owners have not responded, Phase 53B should pause pending owner repo audits.',
      'Phase 53B must not execute runtime work.',
    ],
  }
}
