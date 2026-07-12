export type EditReferenceCopyRiskKind =
  | 'exact_shot_order'
  | 'exact_timing'
  | 'exact_graphic_layout'
  | 'exact_music_or_sfx'
  | 'creator_or_brand_identity'
  | 'reference_as_project_footage'

const COPY_RISK_PATTERNS: Array<{ kind: EditReferenceCopyRiskKind; patterns: RegExp[] }> = [
  { kind: 'exact_shot_order', patterns: [/\bshot[ -]?for[ -]?shot\b/i, /\b(?:same|exact) shot order\b/i, /\bcopy (?:the )?shots?\b/i] },
  { kind: 'exact_timing', patterns: [/\b(?:same|exact) timecodes?\b/i, /\b(?:same|exact) timing\b/i, /\bmatch (?:the )?timing exactly\b/i] },
  { kind: 'exact_graphic_layout', patterns: [/\b(?:same|exact) (?:ui |graphic )?layout\b/i, /\brecreate (?:the )?(?:ui |graphic )?layout\b/i, /\bcopy (?:the )?(?:ui |graphic )?layout\b/i] },
  { kind: 'exact_music_or_sfx', patterns: [/\buse (?:the )?same song\b/i, /\b(?:same|exact) (?:music|sfx|sound effects?)\b/i, /\bcopy (?:the )?lyrics\b/i, /\buse (?:the )?same lyrics\b/i] },
  { kind: 'creator_or_brand_identity', patterns: [/\b(?:same|copy|recreate) (?:creator|brand|logo|person|identity)\b/i, /\blook exactly like\b/i, /\bimitate (?:the )?creator\b/i] },
  { kind: 'reference_as_project_footage', patterns: [/\buse (?:the )?reference (?:video )?as (?:project )?footage\b/i, /\breuse (?:the )?reference video\b/i, /\bput (?:the )?reference video in\b/i] },
]

export function detectEditReferenceCopyRisks(values: string[]): EditReferenceCopyRiskKind[] {
  const risks = new Set<EditReferenceCopyRiskKind>()
  for (const text of values) {
    for (const candidate of COPY_RISK_PATTERNS) {
      for (const pattern of candidate.patterns) {
        const match = pattern.exec(text)
        if (match && !hasEditReferenceNegationNear(text, match.index)) risks.add(candidate.kind)
      }
    }
  }
  return [...risks]
}

export function hasEditReferenceNegationNear(text: string, matchIndex: number): boolean {
  const prefix = text.slice(Math.max(0, matchIndex - 72), matchIndex).toLowerCase()
  return /(?:do not|don't|never|avoid|without|must not|should not|cannot|can't|not)\b[^.!?]{0,60}$/.test(prefix)
}
