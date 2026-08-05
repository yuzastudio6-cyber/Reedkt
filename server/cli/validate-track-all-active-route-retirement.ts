import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
} from '../edit-skills/track-all/track-all-capability-manifest'
import { TRACK_ALL_RUNTIME_BINDINGS } from '../edit-skills/track-all/track-all-work-graph'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'

const repositoryRoot = process.cwd()
const runtimeRoot = resolve(repositoryRoot, 'server/edit-skills/track-all')

function listTypescriptFiles(directory: string): string[] {
  const output: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name)
    if (entry.isDirectory()) output.push(...listTypescriptFiles(absolutePath))
    else if (entry.isFile() && entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.generated.ts')) output.push(absolutePath)
  }
  return output.sort()
}

const files = listTypescriptFiles(runtimeRoot)
const sourceRecords = files.map((path) => ({
  path: path.slice(repositoryRoot.length + 1),
  source: readFileSync(path, 'utf8'),
}))
const activeImplementationSources = sourceRecords.filter((record) =>
  !record.path.endsWith('track-all-capability-manifest.ts') &&
  !record.path.includes('track-all-qualification'))

for (const record of activeImplementationSources) {
  if (/from\s+['"][^'"]*sam2|import\s*\([^)]*sam2/iu.test(record.source)) {
    throw new Error(`Track All active runtime imports SAM2: ${record.path}.`)
  }
  if (/canonical-track-all-sam3_1-orchestra-binding/iu.test(record.source)) {
    throw new Error(`Track All active runtime imports the superseded orchestra binding: ${record.path}.`)
  }
  if (/tracking_masking_future_planning/iu.test(record.source)) {
    throw new Error(`Track All active runtime imports the retired planning skill: ${record.path}.`)
  }
}

for (const artifactSchemaPath of [
  'server/edit-skills/track-all/track-all-active-artifact-contracts.ts',
  'server/edit-skills/track-all/track-all-schemas.ts',
]) {
  const source = sourceRecords.find((record) => record.path === artifactSchemaPath)?.source
  if (!source || /\.passthrough\s*\(/u.test(source)) {
    throw new Error(`Track All active artifact schemas are missing or unrestricted: ${artifactSchemaPath}.`)
  }
}

const unsupported = new Set(TRACK_ALL_CAPABILITY_MANIFEST.unsupportedJobTypes.map((job) => job.jobType))
for (const jobType of [
  'track_all.sam2_new_execution',
  'track_all.sam2_fallback',
  'track_all.raw_chat_to_gpu',
  'track_all.caller_selected_model',
  'track_all.caller_selected_gpu',
  'track_all.caller_selected_command',
  'track_all.outside_authorized_range_mutation',
]) {
  if (!unsupported.has(jobType)) throw new Error(`Track All retirement manifest lost ${jobType}.`)
}

if (TRACK_ALL_CAPABILITY_MANIFEST.toolRoutes.some((route) =>
  route.operationIds.some((operationId) => /sam2/iu.test(operationId)))) {
  throw new Error('Track All manifest exposes SAM2 through an active route.')
}
if (!TRACK_ALL_CAPABILITY_MANIFEST.toolRoutes.some((route) =>
  route.operationIds.includes(TRACK_ALL_SAM_OPERATION_V2))) {
  throw new Error('Track All manifest lost the forward-only SAM 3.1 V2 operation.')
}
if (TRACK_ALL_RUNTIME_BINDINGS.some((binding) =>
  binding.definition.adapterClass === 'production_worker_adapter')) {
  throw new Error('Track All exposes a production binding before production qualification.')
}
if (TRACK_ALL_RUNTIME_BINDINGS.some((binding) =>
  /sam2|caller_selected|raw_chat/iu.test(binding.definition.operationId))) {
  throw new Error('Track All runtime bindings expose a retired or caller-selected operation.')
}

const publicPlugin = readFileSync(
  resolve(runtimeRoot, 'track-all-edit-skill-plugin.ts'),
  'utf8',
)
if (/from\s+['"]\.\/private\//u.test(publicPlugin)) {
  throw new Error('Track All public plugin directly imports private mini-skills.')
}

const registrySource = readFileSync(
  resolve(repositoryRoot, 'server/edit-skills/registry.ts'),
  'utf8',
)
const registrations = registrySource.match(/registerTrackAllSkill\s*\(/gu) ?? []
if (registrations.length !== 1) {
  throw new Error(`Expected exactly one Track All runtime registration; found ${registrations.length}.`)
}

const activeSourceHash = hashSkillValue(sourceRecords.map((record) => ({
  path: record.path,
  sha256: createHash('sha256').update(record.source).digest('hex'),
})))

console.log(JSON.stringify({
  status: 'ok',
  activeRuntimeRoot: 'server/edit-skills/track-all',
  activeTypescriptFileCount: sourceRecords.length,
  activeSourceHash,
  sam2ActiveImports: 0,
  sam2ActiveRoutes: 0,
  supersededOrchestraBindingImports: 0,
  legacyPlanningSkillImports: 0,
  productionWorkerBindings: 0,
  authoritativeRuntimeRegistrations: registrations.length,
  publicPluginPrivateMiniSkillImports: 0,
  forwardOnlySamOperation: TRACK_ALL_SAM_OPERATION_V2,
}))
