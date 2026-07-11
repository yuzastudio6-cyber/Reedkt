import type {
  AssetAnalysisReport,
  AssetUsageRole,
  MediaKind,
  PriorityLevel,
  SourceAssetAudioPolicy,
  SourceLibraryAsset,
  SourceLibraryState,
  SourceLibrarySummary,
} from '../../types'
import { MOCK_CREATED_AT, type MockFootagePrepResult } from '../footage-prep'

function sourceLibraryId(projectId: string) {
  return `${projectId}-source-library`
}

function humanize(value: string) {
  return value.replaceAll('_', ' ')
}

function titleCase(value: string) {
  return humanize(value).replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function tagFromMediaKind(mediaKind: MediaKind) {
  return mediaKind.replaceAll('_', '-')
}

export function getDefaultPriorityForRole(role: AssetUsageRole): PriorityLevel {
  if (role === 'main_footage') return 'must_follow'
  if (role === 'b_roll' || role === 'overlay' || role === 'screenshot' || role === 'logo') return 'prefer'
  if (role === 'do_not_use') return 'do_not_use'
  return 'optional'
}

export function getDefaultAudioPolicyForRole(role: AssetUsageRole): SourceAssetAudioPolicy {
  if (role === 'main_footage') return 'keep_main_audio'
  if (role === 'b_roll') return 'mute_asset_audio'
  if (role === 'music') return 'duck_under_speech'
  if (role === 'sfx') return 'mix_with_main_audio'
  if (role === 'overlay' || role === 'screenshot' || role === 'logo' || role === 'reference_only' || role === 'do_not_use') {
    return 'reference_only'
  }

  return 'ai_decides'
}

export function getSourceAssetLabel(report: AssetAnalysisReport): string {
  const labelFromSummary = report.summary?.match(/Mock analysis for (.*?);/)?.[1]?.trim()

  if (labelFromSummary) return labelFromSummary
  if (report.detectedUsageRole && report.detectedUsageRole !== 'unknown') return titleCase(report.detectedUsageRole)
  return report.mediaAssetId
}

function qualityTags(report: AssetAnalysisReport) {
  return report.qualityFlags.map((flag) => flag.type.replaceAll('_', '-'))
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.filter(Boolean))).sort()
}

function createSourceLibraryAsset(params: {
  sourceLibraryId: string
  report: AssetAnalysisReport
  index: number
}): SourceLibraryAsset {
  const aiSuggestedRole = params.report.detectedUsageRole ?? 'unknown'
  const tags = uniqueTags([
    tagFromMediaKind(params.report.mediaKind),
    aiSuggestedRole.replaceAll('_', '-'),
    ...qualityTags(params.report),
  ])

  return {
    id: `${params.sourceLibraryId}-asset-${String(params.index + 1).padStart(3, '0')}`,
    projectId: params.report.projectId,
    workspaceId: params.report.workspaceId,
    userId: params.report.userId,
    sourceLibraryId: params.sourceLibraryId,
    mediaAssetId: params.report.mediaAssetId,
    label: getSourceAssetLabel(params.report),
    mediaKind: params.report.mediaKind,
    aiSuggestedRole,
    userRole: aiSuggestedRole,
    priority: getDefaultPriorityForRole(aiSuggestedRole),
    reviewStatus: 'ai_suggested',
    audioPolicy: getDefaultAudioPolicyForRole(aiSuggestedRole),
    tags,
    aiSummary: params.report.summary,
    qualityFlagIds: params.report.qualityFlags.map((flag) => flag.id),
    assetAnalysisReportId: params.report.id,
    operationIds: [],
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeSourceLibrary(state: SourceLibraryState): SourceLibrarySummary {
  return {
    totalAssets: state.assets.length,
    confirmedAssets: state.assets.filter((asset) => asset.reviewStatus === 'user_confirmed').length,
    modifiedAssets: state.assets.filter((asset) => asset.reviewStatus === 'user_modified').length,
    doNotUseAssets: state.assets.filter((asset) => asset.reviewStatus === 'do_not_use' || asset.userRole === 'do_not_use').length,
    mainFootageAssets: state.assets.filter((asset) => asset.userRole === 'main_footage').length,
    bRollAssets: state.assets.filter((asset) => asset.userRole === 'b_roll').length,
    overlayAssets: state.assets.filter((asset) => asset.userRole === 'overlay' || asset.userRole === 'screenshot').length,
    logoAssets: state.assets.filter((asset) => asset.userRole === 'logo').length,
    audioAssets: state.assets.filter((asset) => asset.userRole === 'music' || asset.userRole === 'sfx').length,
    referenceOnlyAssets: state.assets.filter((asset) => asset.userRole === 'reference_only').length,
    needsReviewAssets: state.assets.filter((asset) => asset.reviewStatus === 'needs_review' || asset.userRole === 'unknown').length,
  }
}

export function buildSourceLibraryFromFootagePrepResult(result: MockFootagePrepResult): SourceLibraryState {
  const id = sourceLibraryId(result.cleanupPlan.projectId)
  const assets = result.assetAnalysisReports.map((report, index) =>
    createSourceLibraryAsset({
      sourceLibraryId: id,
      report,
      index,
    }),
  )

  return {
    sourceLibrary: {
      id,
      projectId: result.cleanupPlan.projectId,
      workspaceId: result.cleanupPlan.workspaceId,
      userId: result.cleanupPlan.userId,
      footagePrepSessionId: result.footagePrepSession.id,
      cleanAssemblyId: result.cleanAssembly.id,
      status: 'ai_suggested',
      assetIds: assets.map((asset) => asset.id),
      operationIds: [],
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
    },
    assets,
    operations: [],
    updatedAt: MOCK_CREATED_AT,
  }
}
