import type { ApprovedPlanSnapshot } from '../../types/edit-planning-db'
import {
  boundedInternalAdapterToolNames,
  boundedModelFoundationAdapterToolNames,
  boundedRenderPackagingAdapterToolNames,
  boundedVisionModelAdapterToolNames,
} from './bounded-adapter-tool-groups'

export const approvedSnapshotInternalTestAdapterToolNames = boundedInternalAdapterToolNames

const internalTestAdapterToolNameSet = new Set<string>(approvedSnapshotInternalTestAdapterToolNames)

const privateReviewPackagingAdapterToolNames = boundedRenderPackagingAdapterToolNames
const modelBackedVisionAdapterToolNameSet = new Set<string>(boundedVisionModelAdapterToolNames)
const modelFoundationAdapterToolNames = boundedModelFoundationAdapterToolNames

const internalTestAdapterToolNameAliases: Record<string, string> = {
  babylon_js: 'babylonjs',
  lottie: 'lottie_web',
  pixijs: 'pixi_js',
  three_js: 'three',
}

function normalizeAdapterToolName(toolName: string): string {
  const normalized = toolName.trim().toLowerCase()
  return internalTestAdapterToolNameAliases[normalized] ?? normalized
}

function professionalSkillAdapterToolNames(snapshot: ApprovedPlanSnapshot): string[] {
  const skillPlan = snapshot.professionalSkillPlan
  if (!skillPlan) return []

  return [
    ...(skillPlan.hiddenAdapterToolNames ?? []),
    ...(skillPlan.selectedSkills ?? []).flatMap((skill) => skill.hiddenAdapterToolNames ?? []),
  ]
}

function expandRequiredBackendAdapters(toolNames: string[]): string[] {
  const expanded = [...toolNames]
  const selected = new Set(toolNames)

  if (toolNames.some((toolName) => modelBackedVisionAdapterToolNameSet.has(toolName))) {
    expanded.push(...modelFoundationAdapterToolNames)
  }

  // Every approved private-review package needs render/container validation behind the scenes.
  // These stay hidden from user-facing copy and remain blocked by backend/runtime gates until approved.
  expanded.push(...privateReviewPackagingAdapterToolNames)

  return expanded.filter((toolName) => {
    if (!internalTestAdapterToolNameSet.has(toolName)) return false
    if (selected.has(toolName)) return true
    return (
      modelFoundationAdapterToolNames.includes(toolName as typeof modelFoundationAdapterToolNames[number]) ||
      privateReviewPackagingAdapterToolNames.includes(toolName as typeof privateReviewPackagingAdapterToolNames[number])
    )
  })
}

export function resolveApprovedSnapshotInternalTestAdapterToolNames(snapshot: ApprovedPlanSnapshot): string[] {
  const normalizedToolNames = professionalSkillAdapterToolNames(snapshot)
    .map((toolId) => normalizeAdapterToolName(String(toolId)))
    .filter((toolId) => internalTestAdapterToolNameSet.has(toolId))

  return Array.from(new Set(expandRequiredBackendAdapters(normalizedToolNames)))
}
