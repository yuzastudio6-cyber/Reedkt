import type {
  CharacterConsistencyPlan,
  ClarifyingQuestion,
  CompiledEditingIntent,
  DocumentaryFactSafetyPlan,
  FactClaimStatus,
  FactSafetyPlanItem,
  FactSafetyVisualTreatment,
  PlannerInput,
  VisualAssetPlanItem,
} from '../types/reeditpro'

const documentaryKeywords = [
  'scam',
  'fraud',
  'allegation',
  'alleged',
  'investigation',
  'evidence',
  'lawsuit',
  'charge',
  'charged',
  'arrest',
  'arrested',
  'convicted',
  'money stolen',
  'victims',
  'exposed',
  'case',
  'timeline',
]

const organizationSuffixes = /\b([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3}\s+(?:LLC|Inc|Corp|Company|Co|Foundation|Agency|Studio|Bank|University|Group))\b/g
const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g
const moneyPattern = /(?:\$|USD\s*)\d[\d,]*(?:\.\d+)?(?:\s*(?:k|m|million|billion))?/gi

const excludedNames = new Set([
  'ReeditPro',
  'Graphic Design',
  'Real Motion',
  'Stroke Motion',
  'Visual Explain',
  'Veo Lite',
  'Wan Hailuo',
  'TikTok Reels',
])

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function combinedText(input: PlannerInput, compiledIntent?: CompiledEditingIntent) {
  return [
    input.projectName,
    input.customInstructions,
    compiledIntent?.goalSummary,
    ...(compiledIntent?.mustFollowRules ?? []),
    ...(compiledIntent?.avoidRules ?? []),
    ...(compiledIntent?.requirements.map((requirement) => requirement.text) ?? []),
  ].filter(Boolean).join(' ')
}

function isFictionalScenario(text: string) {
  return /\b(fictional|fiction|made up|hypothetical|roleplay|demo scenario|sample story)\b/i.test(text)
}

function hasDocumentarySignal(input: PlannerInput, compiledIntent: CompiledEditingIntent | undefined, text: string) {
  return input.editingCategory === 'documentary_case_study' ||
    compiledIntent?.resolvedSettings.editingCategory === 'documentary_case_study' ||
    documentaryKeywords.some((keyword) => text.toLowerCase().includes(keyword))
}

function extractPeople(text: string) {
  return uniqueStrings(text.match(namePattern) ?? [])
    .filter((name) => !excludedNames.has(name))
    .slice(0, 5)
}

function extractOrganizations(text: string) {
  return uniqueStrings(Array.from(text.matchAll(organizationSuffixes)).map((match) => match[1]))
    .slice(0, 4)
}

function extractMoneyClaims(text: string) {
  return uniqueStrings(text.match(moneyPattern) ?? []).slice(0, 4)
}

function claimStatusForText(text: string, fictional: boolean): FactClaimStatus {
  if (fictional) {
    return 'fictional'
  }

  if (/\b(verified|confirmed|convicted|court found|official record)\b/i.test(text)) {
    return 'verified_fact'
  }

  if (/\b(charged|charge|lawsuit|sued|arrested)\b/i.test(text)) {
    return 'charge'
  }

  if (/\b(according to|source says|reported|report says|claimed by)\b/i.test(text)) {
    return 'claim_by_source'
  }

  if (/\b(opinion|i think|my view|commentary)\b/i.test(text)) {
    return 'opinion'
  }

  if (/\b(alleged|allegation|accused|scam|fraud|exposed|stole|stolen)\b/i.test(text)) {
    return 'allegation'
  }

  return 'unknown'
}

function sourceNeededForStatus(status: FactClaimStatus) {
  return status === 'unknown' || status === 'allegation' || status === 'charge' || status === 'claim_by_source'
}

function safeWordingForStatus(status: FactClaimStatus, claimText: string) {
  if (status === 'fictional') {
    return `Fictional scenario: ${claimText}`
  }

  if (status === 'verified_fact') {
    return `Verified by provided source: ${claimText}`
  }

  if (status === 'charge') {
    return `Legal-status claim, present carefully: ${claimText}`
  }

  if (status === 'claim_by_source') {
    return `According to the provided source: ${claimText}`
  }

  if (status === 'opinion') {
    return `Opinion or interpretation: ${claimText}`
  }

  if (status === 'allegation') {
    return `Alleged or claimed: ${claimText}`
  }

  return `Unverified/source-needed: ${claimText}`
}

function treatmentForClaim(status: FactClaimStatus, claimText: string): FactSafetyVisualTreatment {
  if (status === 'fictional') {
    return 'timeline_card'
  }

  if (/\$|USD|money|payment|stolen|amount/i.test(claimText)) {
    return status === 'verified_fact' ? 'money_trail_graphic' : 'needs_user_confirmation'
  }

  if (status === 'verified_fact') {
    return 'evidence_board_card'
  }

  if (status === 'charge' || status === 'claim_by_source') {
    return 'document_card'
  }

  if (status === 'opinion') {
    return 'source_attribution_card'
  }

  if (status === 'allegation' || status === 'unknown') {
    return 'neutral_name_card'
  }

  return 'needs_user_confirmation'
}

function severityForStatus(status: FactClaimStatus): FactSafetyPlanItem['severity'] {
  if (status === 'unknown') {
    return 'blocking'
  }

  if (status === 'allegation' || status === 'charge') {
    return 'high'
  }

  if (status === 'claim_by_source') {
    return 'medium'
  }

  return 'low'
}

function clarifyingQuestionForClaim(id: string, status: FactClaimStatus, people: string[]): ClarifyingQuestion | undefined {
  if (!sourceNeededForStatus(status)) {
    return undefined
  }

  return {
    id: `${id}-question`,
    question: people.length > 0
      ? 'Are these names and claims verified by your source, or should I present them as allegations?'
      : 'Is this claim verified by your source, or should I present it as an allegation/source-needed item?',
    reason: 'Claim status changes wording, visual treatment, and whether ReeditPro can use stronger evidence visuals.',
    priority: status === 'unknown' ? 'blocking' : 'recommended',
    blocksPlanning: status === 'unknown',
    suggestedAnswers: ['Verified by source', 'Allegation/claim only', 'Mixed or unsure'],
  }
}

function claimItem(params: {
  id: string
  claimText: string
  peopleMentioned: string[]
  organizationsMentioned: string[]
  status: FactClaimStatus
  sourceLabel?: string
}): FactSafetyPlanItem {
  const { claimText, id, organizationsMentioned, peopleMentioned, sourceLabel, status } = params
  const sourceNeeded = sourceNeededForStatus(status)

  return {
    id,
    claimText,
    peopleMentioned,
    organizationsMentioned,
    claimStatus: status,
    sourceNeeded,
    sourceLabel,
    safeWording: safeWordingForStatus(status, claimText),
    visualTreatment: treatmentForClaim(status, claimText),
    avoidRules: [
      'Do not present allegations as verified facts.',
      'Do not show real people committing alleged acts.',
      'Do not use fake mugshots, handcuffs, jail visuals, guilty labels, or demonizing imagery unless verified and approved.',
      'Do not create defamatory or guilt-implying visual treatment.',
      'Do not use aggressive marks over faces when claim status is unknown or allegation.',
    ],
    clarifyingQuestion: clarifyingQuestionForClaim(id, status, peopleMentioned),
    qaChecks: [
      'Claim status label is respected in wording and visuals.',
      'Source-needed claims stay neutral.',
      'Real named people are not shown in misleading action scenes.',
      'Prompt plans include fact-safety notes.',
    ],
    severity: severityForStatus(status),
  }
}

function createClaimItems(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  visualAssetPlan?: VisualAssetPlanItem[]
  characterConsistencyPlan?: CharacterConsistencyPlan
}) {
  const { characterConsistencyPlan, compiledIntent, input, visualAssetPlan = [] } = params
  const text = combinedText(input, compiledIntent)
  const fictional = isFictionalScenario(text)
  const baseStatus = claimStatusForText(text, fictional)
  const people = uniqueStrings([
    ...extractPeople(text),
    ...(characterConsistencyPlan?.packs
      .filter((pack) => pack.realityStatus === 'real_named_person' || pack.realityStatus === 'unknown' || pack.realityStatus === 'public_figure')
      .map((pack) => pack.displayName) ?? []),
  ]).slice(0, 5)
  const organizations = extractOrganizations(text)
  const moneyClaims = extractMoneyClaims(text)
  const items: FactSafetyPlanItem[] = []

  if (moneyClaims.length > 0) {
    moneyClaims.forEach((money, index) => {
      items.push(claimItem({
        id: `fact-safety-money-${index + 1}`,
        claimText: `Money amount mentioned: ${money}`,
        organizationsMentioned: organizations,
        peopleMentioned: people,
        status: fictional ? 'fictional' : baseStatus === 'verified_fact' ? 'verified_fact' : baseStatus === 'claim_by_source' ? 'claim_by_source' : 'unknown',
      }))
    })
  }

  if (people.length > 0 || organizations.length > 0) {
    items.push(claimItem({
      id: 'fact-safety-names-claims',
      claimText: people.length > 0
        ? `Named people or parties appear in this case-story edit: ${people.join(', ')}.`
        : `Named organizations appear in this case-story edit: ${organizations.join(', ')}.`,
      organizationsMentioned: organizations,
      peopleMentioned: people,
      status: baseStatus,
    }))
  }

  if (/\b(scam|fraud|exposed|stole|stolen|victims?|lawsuit|charge|charged|arrested|investigation)\b/i.test(text)) {
    items.push(claimItem({
      id: 'fact-safety-core-claim',
      claimText: 'Case-study claim involving scam, fraud, legal status, investigation, or harm.',
      organizationsMentioned: organizations,
      peopleMentioned: people,
      status: fictional ? 'fictional' : baseStatus === 'verified_fact' ? 'verified_fact' : baseStatus === 'charge' ? 'charge' : 'allegation',
    }))
  }

  const evidenceAssets = visualAssetPlan.filter((asset) => ['fact_card', 'timeline_card', 'name_card'].includes(asset.assetType))
  if (items.length === 0 && (input.editingCategory === 'documentary_case_study' || evidenceAssets.length > 0)) {
    items.push(claimItem({
      id: 'fact-safety-general-case',
      claimText: 'Documentary or case-study edit includes names, claims, timeline, or evidence-style visuals.',
      organizationsMentioned: organizations,
      peopleMentioned: people,
      status: fictional ? 'fictional' : 'unknown',
    }))
  }

  return items.slice(0, 5)
}

export function createDocumentaryFactSafetyPlan(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  visualAssetPlan?: VisualAssetPlanItem[]
  characterConsistencyPlan?: CharacterConsistencyPlan
}): DocumentaryFactSafetyPlan {
  const { characterConsistencyPlan, compiledIntent, input, visualAssetPlan } = params
  const text = combinedText(input, compiledIntent)
  const active = hasDocumentarySignal(input, compiledIntent, text)
  const claimItems = active
    ? createClaimItems({ characterConsistencyPlan, compiledIntent, input, visualAssetPlan })
    : []
  const clarifyingQuestions = claimItems
    .map((item) => item.clarifyingQuestion)
    .filter((question): question is ClarifyingQuestion => Boolean(question))
    .slice(0, 2)

  return {
    id: `documentary-fact-safety-${input.editingCategory}-${input.editLevel}`,
    active,
    claimItems,
    globalRules: [
      'The frontend mock does not verify facts; source-needed claims must be marked and treated neutrally.',
      'Allegations, charges, and claims by source must not be presented as verified facts.',
      'Real named or unknown people use neutral cards, source cards, timelines, silhouettes, or stylized non-realistic figures unless verified and approved.',
      'Avoid sensational guilt imagery, fake evidence screenshots, and scenes showing alleged acts as fact.',
      input.editLevel === 'premium' ? 'Premium keeps Veo Lite final fallback only.' : 'Basic/Pro cannot use Veo for fact-safety fallback.',
    ],
    clarifyingQuestions,
    qaChecks: [
      'Allegations are labeled as allegations or source-needed claims.',
      'Real people are shown neutrally when claim status is unknown or alleged.',
      'Money amounts use safe wording when unverified.',
      'Source labels are included where needed.',
      'Custom user instructions do not override fact-safety rules.',
    ],
    notes: [
      active
        ? 'Fact-safety planning is active for this documentary/case-study style edit.'
        : 'Fact-safety planning is inactive because no documentary/case-study claim signal was detected.',
      'No web research, fact checking, or identity verification is performed in this frontend mock.',
    ],
  }
}
