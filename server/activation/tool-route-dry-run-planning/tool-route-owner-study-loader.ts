import {
  TOOL_ROUTE_DRY_RUN_PR_STACK,
  pathRecord,
} from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteOwnerStudyContext,
  ToolRouteOwnerStudyContract,
} from './tool-route-dry-run-planning-types'

const OWNER_STUDIES = [
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
] as const

function studyContract(
  owner: (typeof OWNER_STUDIES)[number],
): ToolRouteOwnerStudyContract {
  const base = `docs/tool-studies/${owner.slug}`
  const paths = {
    toolStudy: `${base}-tool-study.md`,
    capabilityMap: `${base}-capability-map.md`,
    combinationMap: `${base}-tool-combination-map.md`,
    routingPolicy: `${base}-routing-policy.md`,
    handoffContract: `${base}-handoff-contract.md`,
    gapMap: `${base}-internal-beta-gap-map.md`,
    blockedUseRegister: `${base}-blocked-use-register.md`,
    validationResults: `docs/prompt-tool-study-0-${owner.slug}-validation-results.md`,
    implementationPrompt: `docs/implementation-prompts/prompt-tool-study-0-${owner.slug}.md`,
    diagnostics: `scripts/validation/tool-study-${owner.slug}-diagnostics.mjs`,
  }
  const requiredPaths = Object.entries(paths).map(([key, path]) =>
    pathRecord(path, true, `${owner.owner} ${key} source contract.`),
  )
  const activeBlockers = requiredPaths
    .filter((file) => !file.exists)
    .map((file) => `missing_owner_study_contract:${owner.owner}:${file.path}`)

  return {
    owner: owner.owner,
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    mergeSha: owner.mergeSha,
    requiredPaths,
    capabilityMapPath: paths.capabilityMap,
    routingPolicyPath: paths.routingPolicy,
    handoffContractPath: paths.handoffContract,
    blockedUseRegisterPath: paths.blockedUseRegister,
    validationResultsPath: paths.validationResults,
    implementationPromptPath: paths.implementationPrompt,
    executionAllowed: false,
    ownerReviewOnly: true,
    activeBlockers,
  }
}

export function loadToolRouteOwnerStudyContext(): ToolRouteOwnerStudyContext {
  const studies = OWNER_STUDIES.map(studyContract)
  const activeBlockers = studies.flatMap((study) => study.activeBlockers)
  const mergedOwnerStudyPrs = TOOL_ROUTE_DRY_RUN_PR_STACK.filter((entry) =>
    entry.title.includes('TOOL-STUDY-0'),
  )
  if (mergedOwnerStudyPrs.length !== OWNER_STUDIES.length) {
    activeBlockers.push(`unexpected_owner_study_pr_count:${mergedOwnerStudyPrs.length}`)
  }

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    studies,
    completedStudyCount: studies.filter((study) => study.status === 'passed').length,
    requiredStudyCount: 6,
    allRequiredStudiesPresent: activeBlockers.length === 0,
    activeBlockers,
  }
}
