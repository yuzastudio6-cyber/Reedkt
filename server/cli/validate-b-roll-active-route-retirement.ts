import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import { editSkillCapabilityRegistry } from '../edit-skills/internal-fixture-runtime'
import {
  BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
  BROLL_PROVIDER_OPERATION_ID,
  BROLL_PROVIDER_ROUTE_ID,
} from '../providers/google/gemini-omni-broll/b-roll-provider-authority-v5'

const root = process.cwd()
const retiredRoutePattern = /(?:^|[._/-])(?:wan|hailuo|veo|kling|stock(?:_library)?|provider_gateway|generic_generated_video)(?:$|[._/-])/iu
const retiredImportPattern = /(?:wan|hailuo|veo|kling|sam2|sam3|sam-2|sam-3|track-all|stock-library)/iu
const retiredEnvironmentPattern = /(?:WAN|HAILUO|VEO|KLING|SAM2|SAM3|STOCK_LIBRARY)/u
const brollFilePattern = /b[-_]?roll|broll/iu

type RouteSurface = {
  routeKey: string
  routeKind: string
  operationIds: readonly string[]
}

function assertActiveRoutes(routes: readonly RouteSurface[]): void {
  const allowedOperations = new Set([
    'tool.ffprobe.inspect_approved_media.v1',
    'tool.ffmpeg.execute_approved_media_recipe.v1',
    'tool.remotion.render_approved_composition.v1',
    'b_roll.source.existing_project_clip.v1',
    'b_roll.source.approved_user_asset.v1',
    'b_roll.no_action.v1',
    BROLL_PROVIDER_OPERATION_ID,
  ])
  for (const route of routes) {
    for (const operationId of route.operationIds) {
      assert.equal(
        retiredRoutePattern.test(`${route.routeKey}/${operationId}`),
        false,
        `Retired B-roll route returned: ${route.routeKey} -> ${operationId}`,
      )
      assert.equal(
        allowedOperations.has(operationId),
        true,
        `Unknown B-roll active route returned: ${operationId}`,
      )
    }
  }
}

async function sourceFiles(target: string): Promise<string[]> {
  const absolute = path.join(root, target)
  const targetStat = await stat(absolute)
  if (targetStat.isFile()) return [target]
  const output: string[] = []
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const child = path.join(target, entry.name)
    if (entry.isDirectory()) output.push(...await sourceFiles(child))
    else if (/\.(?:ts|tsx|js|mjs)$/u.test(entry.name)) output.push(child)
  }
  return output
}

async function allRepositoryFiles(target = '.'): Promise<string[]> {
  const absolute = path.join(root, target)
  const output: string[] = []
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    if (entry.isDirectory() && ['.git', 'node_modules', 'dist'].includes(entry.name)) continue
    const child = path.join(target, entry.name)
    if (entry.isDirectory()) output.push(...await allRepositoryFiles(child))
    else output.push(child)
  }
  return output
}

async function assertActiveSourceBoundaries(): Promise<{
  scannedFiles: number
  environmentKeys: string[]
}> {
  const targets = [
    'server/edit-skills/b-roll',
    'server/providers/google/gemini-omni-broll',
    'server/services/canonical-broll-plan-component-service.ts',
    'server/cli/gemini-omni-b-roll-canary.ts',
  ]
  const files = (await Promise.all(targets.map(sourceFiles))).flat().sort()
  const environmentKeys = new Set<string>()
  const importPattern = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/gu
  const environmentPattern = /process\.env\.([A-Z][A-Z0-9_]*)/gu
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8')
    for (const match of source.matchAll(importPattern)) {
      assert.equal(
        retiredImportPattern.test(match[1] ?? ''),
        false,
        `B-roll active runtime imports a retired route or tracking implementation: ${file}`,
      )
    }
    for (const match of source.matchAll(environmentPattern)) {
      const key = match[1] ?? ''
      environmentKeys.add(key)
      assert.equal(
        retiredEnvironmentPattern.test(key),
        false,
        `B-roll active runtime reads retired environment authority ${key}: ${file}`,
      )
    }
  }
  return { scannedFiles: files.length, environmentKeys: [...environmentKeys].sort() }
}

async function assertNoRetiredBrollRuntimeFiles(): Promise<number> {
  const files = await allRepositoryFiles()
  const conflicts = files.filter((file) =>
    brollFilePattern.test(path.basename(file)) && retiredImportPattern.test(path.basename(file)))
  assert.deepEqual(conflicts, [], 'Retired provider-specific B-roll files re-entered the repository.')
  return files.length
}

async function assertOneRuntimeRegistration(): Promise<void> {
  const files = await sourceFiles('server')
  const duplicateRegistrations: string[] = []
  const admittedReadOnlyIntegrationSurfaces = new Set([
    'server/captions-specialist/caption-broll-owner-read-adapter.ts',
    'server/services/canonical-broll-caption-owner-service.ts',
  ])
  for (const file of files) {
    if (
      file.startsWith('server/edit-skills/b-roll/') ||
      file === 'server/edit-skills/registry.ts' ||
      file === 'server/cli/validate-b-roll-active-route-retirement.ts' ||
      file.startsWith('server/smoke/')
    ) continue
    const source = await readFile(path.join(root, file), 'utf8')
    if (admittedReadOnlyIntegrationSurfaces.has(file)) {
      assert.doesNotMatch(
        source,
        /registerBrollSkill|registerManifest\s*\(|createBrollCanonicalPrivateRuntimeBindings|BrollCanonicalPrivateExecutionCoordinator/u,
        `Read-only B-roll integration surface became runtime-capable: ${file}`,
      )
      assert.match(
        source,
        /runtimeOrDispatchAuthorityGranted:\s*(?:z\.literal\()?false/u,
        `Read-only B-roll integration surface lacks a closed runtime boundary: ${file}`,
      )
      continue
    }
    if (/registerBrollSkill|skillKey:\s*['"]b_roll['"]/u.test(source)) {
      duplicateRegistrations.push(file)
    }
  }
  assert.deepEqual(
    duplicateRegistrations,
    [],
    'A duplicate orchestra-callable B-roll runtime registration exists.',
  )
  const manifests = editSkillCapabilityRegistry.listManifests()
    .filter((manifest) => manifest.skillKey === 'b_roll')
  assert.equal(manifests.length, 1)
  assert.equal(manifests[0]?.manifestHash, BROLL_CAPABILITY_MANIFEST.manifestHash)
}

async function assertPackageScripts(): Promise<number> {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>
  }
  const scripts = Object.entries(packageJson.scripts ?? {})
    .filter(([key, command]) => brollFilePattern.test(`${key}/${command}`))
  assert.ok(scripts.some(([key]) => key === 'smoke:b-roll-retirement'))
  for (const [key, command] of scripts) {
    assert.equal(retiredImportPattern.test(`${key}/${command}`), false)
    if (command.startsWith('npm run ')) continue
    assert.match(
      command,
      /^tsx server\/(?:cli\/(?:generate-b-roll|gemini-omni-b-roll|qualify-b-roll|validate-b-roll)|smoke\/(?:b-roll-|canonical-caption-broll-|captions-specialist-broll-))/u,
      `B-roll package script ${key} does not resolve to the canonical implementation or its evidence.`,
    )
  }
  return scripts.length
}

async function assertHistoricalCompatibilitySurfaces(): Promise<{
  metadataSkillCount: number
}> {
  const fixtureSource = await readFile(
    path.join(root, 'src/lib/mock-creative-skill-records.ts'),
    'utf8',
  )
  const legacyEntry = fixtureSource.match(
    /skillKey:\s*'b_roll_planning',[\s\S]{0,1200}?createdAt:\s*mockCreativeSkillTimestamp/um,
  )?.[0]
  assert.ok(legacyEntry, 'Historical B-roll catalog entry is missing.')
  assert.match(legacyEntry, /lifecycleStatus:\s*'superseded'/u)
  assert.match(legacyEntry, /routeStatus:\s*'not_routed'/u)
  assert.match(legacyEntry, /runtimeReadiness:\s*'docs_only'/u)

  const seed = JSON.parse(await readFile(path.join(
    root,
    'docs/creative-skills/manifests/creative-skill-catalog-canonical-seed-manifest.json',
  ), 'utf8')) as {
    skills?: Array<{ family_key?: string; metadata_json?: { runtime_enabled?: boolean } }>
  }
  const metadataSkills = (seed.skills ?? []).filter((skill) => skill.family_key === 'b_roll')
  assert.ok(metadataSkills.length > 0)
  assert.equal(
    metadataSkills.every((skill) => skill.metadata_json?.runtime_enabled === false),
    true,
    'Historical Creative Skill B-roll metadata must never become runtime authority.',
  )

  for (const file of [
    'docs/creative-skills/b-roll-planning-contract.md',
    'docs/creative-skills/b-roll-planning-contract-checklist.md',
  ]) {
    const source = await readFile(path.join(root, file), 'utf8')
    assert.match(source, /Status: historical doctrine; runtime superseded/u)
    assert.match(source, /docs\/edit-skills\/b-roll\/architecture\.md/u)
  }
  return { metadataSkillCount: metadataSkills.length }
}

assert.equal(BROLL_CAPABILITY_MANIFEST.skillKey, 'b_roll')
assert.equal(BROLL_CAPABILITY_MANIFEST.skillVersion, '1.0.0')
assert.equal(BROLL_PROVIDER_OPERATION_ID, 'provider.google.generate_b_roll_candidate.v1')
assert.equal(BROLL_PROVIDER_ROUTE_ID, 'gemini_omni_flash')
assert.equal(BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS, 'gemini-omni-flash-preview')
assert.equal(BROLL_CAPABILITY_MANIFEST.attemptPolicy.alternateProviderFallbackAllowed, false)
assertActiveRoutes([
  ...BROLL_CAPABILITY_MANIFEST.toolRoutes,
  ...BROLL_CAPABILITY_MANIFEST.fallbackRoutes,
  ...BROLL_CAPABILITY_MANIFEST.lowerCostRoutes,
])
assert.equal(
  BROLL_CAPABILITY_MANIFEST.toolRoutes
    .filter((route) => route.routeKind === 'provider')
    .every((route) =>
      route.operationIds.length === 1 && route.operationIds[0] === BROLL_PROVIDER_OPERATION_ID),
  true,
)

for (const retiredOperation of [
  'provider.wan.generate_b_roll.v1',
  'provider.hailuo.generate_b_roll.v1',
  'provider.veo.generate_b_roll.v1',
  'provider.kling.generate_b_roll.v1',
  'provider.stock_library.search_b_roll.v1',
]) {
  assert.throws(() => assertActiveRoutes([{
    routeKey: `retired_${retiredOperation}`,
    routeKind: 'provider',
    operationIds: [retiredOperation],
  }]), /Retired B-roll route returned/u)
}

await assertOneRuntimeRegistration()
const sourceBoundary = await assertActiveSourceBoundaries()
const repositoryFileCount = await assertNoRetiredBrollRuntimeFiles()
const packageScriptCount = await assertPackageScripts()
const historical = await assertHistoricalCompatibilitySurfaces()

console.log(JSON.stringify({
  status: 'ok',
  canonicalSkill: `${BROLL_CAPABILITY_MANIFEST.skillKey}@${BROLL_CAPABILITY_MANIFEST.skillVersion}`,
  manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
  providerOperation: BROLL_PROVIDER_OPERATION_ID,
  providerRoute: BROLL_PROVIDER_ROUTE_ID,
  configuredModelAlias: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
  activeProviderFallbacks: 0,
  retiredProviderFixturesRejected: 5,
  activeRuntimeRegistrations: 1,
  activeSourceFilesScanned: sourceBoundary.scannedFiles,
  activeEnvironmentKeys: sourceBoundary.environmentKeys,
  repositoryFilesScanned: repositoryFileCount,
  brollPackageScripts: packageScriptCount,
  historicalMetadataSkills: historical.metadataSkillCount,
  trackAllImplementationImported: false,
}, null, 2))
