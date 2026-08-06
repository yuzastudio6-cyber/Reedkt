export type ProfessionalBackendPreparationIntentLike = {
  intentKind?: string
  requestedModelUse?: string
  generationType?: string
}

export type ProfessionalBackendPreparationSummary = {
  id: string
  label: string
  summary: string
}

function summaryForIntent(intent: ProfessionalBackendPreparationIntentLike): ProfessionalBackendPreparationSummary {
  if (intent.intentKind === 'adapter_tool_bundle') {
    return {
      id: 'private-worker-handoff',
      label: 'Private preparation handoff',
      summary: 'Approved edit activities can move to private preparation after approval and review record checks.',
    }
  }

  if (intent.intentKind === 'provider_asset') {
    if (intent.generationType === 'sfx_asset' || intent.generationType === 'music_asset') {
      return {
        id: 'audio-asset-preparation',
        label: 'Audio asset preparation',
        summary: 'Sound and music requests are planned, but audio generation waits for approval and safety gates.',
      }
    }

    return {
      id: 'creative-asset-preparation',
      label: 'Creative asset preparation',
      summary: 'Generated asset requests are planned, but AI asset preparation waits for approval and safety gates.',
    }
  }

  if (intent.requestedModelUse === 'visual_understanding') {
    return {
      id: 'source-understanding',
      label: 'Source understanding',
      summary: 'Visual context can be reviewed as part of the approved planning path.',
    }
  }

  if (intent.requestedModelUse === 'tool_code' || intent.requestedModelUse === 'remotion_draft') {
    return {
      id: 'private-review-build-notes',
      label: 'Private review build notes',
      summary: 'Structured build guidance can be prepared for the private review path after approval.',
    }
  }

  return {
    id: 'edit-planning-reasoning',
    label: 'Edit planning reasoning',
    summary: 'The main edit plan can be prepared from the upload, prompt, and approved context.',
  }
}

export function summarizeProfessionalBackendPreparation(
  intents: readonly ProfessionalBackendPreparationIntentLike[] | undefined,
  limit = 4,
): ProfessionalBackendPreparationSummary[] {
  const summaries = new Map<string, ProfessionalBackendPreparationSummary>()
  ;(intents ?? []).forEach((intent) => {
    const summary = summaryForIntent(intent)
    if (!summaries.has(summary.id)) {
      summaries.set(summary.id, summary)
    }
  })

  return Array.from(summaries.values()).slice(0, limit)
}
