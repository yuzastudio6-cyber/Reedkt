import type { OwnerResponseTemplate } from './cross-workstream-handoff-types'

export function buildOwnerResponseTemplate(): OwnerResponseTemplate {
  return {
    templateId: 'phase52h_owner_response_template',
    format: 'json',
    fields: {
      responseId: 'owner-response-<workstream>-<YYYYMMDD>',
      workstream: '<one of the 12 Phase 52G workstream IDs>',
      ownerChat: '<owning chat/workstream>',
      sourcePhase: '52G',
      sourceRunId: 'phase52g-20260606T033152',
      handoffPacketRef: '<private gs:// prompt packet reference>',
      responseStatus: 'pending | accepted | accepted_with_blockers | blocked | rejected | superseded | needs_clarification',
      ownerDecision: '<short decision>',
      acceptedScope: [],
      blockedScope: [],
      nextPrompt: '<next owner prompt or pause reason>',
      evidenceRefs: [],
      blockers: [],
      risks: [],
      contractsChanged: false,
      supabaseUpdateClassification: {
        updateRequired: 'owner_response_pending',
        updateStatus: 'ready_for_staging_review',
        environmentTouched: 'staging',
        sqlExecuted: false,
        migrationDeployed: false,
        nextSupabaseAction: 'milestone sync only through Phase 51D contract',
      },
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadMediaAllowed: false,
      publicArtifactAllowed: false,
      rawPromptExecutionAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      createdAt: '<ISO timestamp>',
      updatedAt: '<ISO timestamp>',
    },
    instructions: [
      'Copy this shape into the owner response artifact or follow-up prompt.',
      'Reference private gs:// artifacts, committed docs, or PRs only; do not include secrets or signed URLs.',
      'Set contractsChanged=true only when the owner intentionally changes a contract and provides evidence.',
      'Keep production, external beta, public artifacts, raw prompt execution, and runtime execution false.',
    ],
    prohibitedActions: [
      'Do not execute owner prompt packets.',
      'Do not execute tools, workers, models, providers, media processing, web search, browser capture, map rendering, migrations, Docker, Cloud Run, production, external beta, or broad media.',
      'Do not expose secrets, DB URLs, signed URLs, API keys, or public artifact URLs as source of truth.',
    ],
  }
}
