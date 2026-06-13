import { existsSync } from 'node:fs'
import type {
  ToolRouteFixtureOwner,
  ToolStudyFixtureEvidence,
  ToolStudyFixtureEvidenceContext,
} from './tool-route-fixture-planning-types'

const STUDY_DEFINITIONS: Array<{
  owner: ToolStudyFixtureEvidence['owner']
  slug: string
  mergeSha: string
}> = [
  {
    owner: 'WEB_SEARCH_CAPTURE',
    slug: 'web-search-capture',
    mergeSha: '51ba1d44965d758935241af7712779bb15d713c6',
  },
  {
    owner: 'MAP_GEOSPATIAL',
    slug: 'map-geospatial',
    mergeSha: 'c0c96030358d52852b712b9f239a3237490d25ec',
  },
  {
    owner: 'AI_TOOLS_CREATIVE_GRAPHICS',
    slug: 'ai-tools-creative-graphics',
    mergeSha: '05d429f6029136f0f55fe01375809071b588791c',
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    slug: 'track-a-render-export',
    mergeSha: '0ac258f939f403dbef438d3184408f28f874f26c',
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    slug: 'track-b-media-processing',
    mergeSha: '454d06caaf3b3349efa541f3ce50aac0bc0044aa',
  },
  {
    owner: 'SOUND_MUSIC_AUDIO',
    slug: 'sound-music-audio',
    mergeSha: 'f6283e63742d6999910d3887482dc3112da1e570',
  },
]

function validationPath(slug: string): string {
  return `docs/prompt-tool-study-0-${slug}-validation-results.md`
}

function promptPath(slug: string): string {
  return `docs/implementation-prompts/prompt-tool-study-0-${slug}.md`
}

function buildStudy(definition: typeof STUDY_DEFINITIONS[number]): ToolStudyFixtureEvidence {
  const capabilityMapPath = `docs/tool-studies/${definition.slug}-capability-map.md`
  const routingPolicyPath = `docs/tool-studies/${definition.slug}-routing-policy.md`
  const handoffContractPath = `docs/tool-studies/${definition.slug}-handoff-contract.md`
  const blockedUseRegisterPath = `docs/tool-studies/${definition.slug}-blocked-use-register.md`
  const sourceContracts = [
    `docs/tool-studies/${definition.slug}-tool-study.md`,
    capabilityMapPath,
    `docs/tool-studies/${definition.slug}-tool-combination-map.md`,
    routingPolicyPath,
    handoffContractPath,
    `docs/tool-studies/${definition.slug}-internal-beta-gap-map.md`,
    blockedUseRegisterPath,
    validationPath(definition.slug),
    promptPath(definition.slug),
  ]
  const activeBlockers = sourceContracts
    .filter((sourcePath) => !existsSync(sourcePath))
    .map((sourcePath) => `missing_owner_study_contract:${definition.owner}:${sourcePath}`)

  return {
    owner: definition.owner,
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    mergeSha: definition.mergeSha,
    sourceContracts,
    capabilityMapPath,
    routingPolicyPath,
    handoffContractPath,
    blockedUseRegisterPath,
    validationResultsPath: validationPath(definition.slug),
    implementationPromptPath: promptPath(definition.slug),
    ownerReviewOnly: true,
    executionAllowed: false,
    activeBlockers,
  }
}

export function loadToolStudyFixtureEvidenceContext(): ToolStudyFixtureEvidenceContext {
  const studies = STUDY_DEFINITIONS.map(buildStudy)
  const activeBlockers = studies.flatMap((study) => study.activeBlockers)

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    studies,
    completedStudyCount: studies.filter((study) => study.status === 'passed').length,
    requiredStudyCount: 6,
    allRequiredStudiesPresent: activeBlockers.length === 0,
    activeBlockers,
  }
}

export function findOwnerStudyPath(owner: ToolRouteFixtureOwner): string {
  const definition = STUDY_DEFINITIONS.find((study) => study.owner === owner)
  return definition ? `docs/tool-studies/${definition.slug}-tool-study.md` : 'not_applicable_internal_coordination_owner'
}
