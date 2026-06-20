import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

function runGit(args, options = {}) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  try {
    return {
      ok: true,
      output: execFileSync('git', args, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
      }).trim(),
    }
  } catch (error) {
    return {
      ok: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function runCommand(command, args) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim(),
    }
  } catch (error) {
    return {
      ok: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function splitLines(value) {
  return value ? value.split('\n').filter(Boolean) : []
}

function uniqueSorted(values) {
  return [...new Set(values)].sort()
}

function groupDuplicates(values) {
  const valuesByKey = new Map()
  for (const value of values) {
    if (!value) continue
    valuesByKey.set(value, (valuesByKey.get(value) ?? 0) + 1)
  }

  return [...valuesByKey.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort()
}

function buildAliasConflicts(studyCards, reconciliationResults) {
  const aliasTargets = new Map()

  for (const studyCard of studyCards) {
    const target = studyCard.toolId ?? studyCard.externalToolId
    for (const alias of studyCard.aliases) {
      const targets = aliasTargets.get(alias) ?? new Set()
      targets.add(target)
      aliasTargets.set(alias, targets)
    }
  }

  for (const result of reconciliationResults) {
    const target = result.toolId ?? result.externalToolId
    for (const alias of result.aliases) {
      const targets = aliasTargets.get(alias) ?? new Set()
      targets.add(target)
      aliasTargets.set(alias, targets)
    }
  }

  return [...aliasTargets.entries()]
    .filter(([, targets]) => targets.size > 1)
    .map(([alias, targets]) => ({
      alias,
      targets: [...targets].sort(),
    }))
    .sort((left, right) => left.alias.localeCompare(right.alias))
}

function scanGithubPrs() {
  const ghVersion = runCommand('gh', ['--version'])
  if (!ghVersion.ok) {
    return {
      githubPrScanAvailable: false,
      githubPrScanError: ghVersion.error,
      relevantOpenPrs: [],
    }
  }

  const prList = runCommand('gh', [
    'pr',
    'list',
    '--state',
    'open',
    '--limit',
    '50',
    '--json',
    'number,title,headRefName,baseRefName,updatedAt',
  ])
  if (!prList.ok) {
    return {
      githubPrScanAvailable: false,
      githubPrScanError: prList.error,
      relevantOpenPrs: [],
    }
  }

  const relevantPattern = /(tool|registry|tool-calling|study|card|worker|router|runtime|contract|supabase|qa|fallback|adapter|docker|proof|install)/i
  const prs = JSON.parse(prList.output)
  const relevantOpenPrs = prs
    .filter((pr) => relevantPattern.test(`${pr.title} ${pr.headRefName} ${pr.baseRefName}`))
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      headRefName: pr.headRefName,
      baseRefName: pr.baseRefName,
      updatedAt: pr.updatedAt,
    }))

  return {
    githubPrScanAvailable: true,
    githubPrScanError: null,
    relevantOpenPrs,
  }
}

const fetchAllowed = process.env.REEDITPRO_REFRESH_GATE_ALLOW_FETCH === '1'
const fetchResult = fetchAllowed ? runGit(['fetch', '--all', '--prune']) : { ok: false, output: '', error: null }

const currentBranch = runGit(['branch', '--show-current']).output
const headCommit = runGit(['rev-parse', 'HEAD']).output
const statusShort = splitLines(runGit(['status', '--short']).output)
const recentLog = splitLines(runGit(['log', '--oneline', '-5']).output)
const changedFiles = splitLines(runGit(['diff', '--name-only']).output)
const stagedFiles = splitLines(runGit(['diff', '--cached', '--name-only']).output)
const upstreamResult = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
const upstreamBranch = upstreamResult.ok ? upstreamResult.output : null
const mergeBaseResult = upstreamBranch ? runGit(['merge-base', 'HEAD', upstreamBranch]) : { ok: false, output: '' }
const upstreamHeadResult = upstreamBranch ? runGit(['rev-parse', upstreamBranch]) : { ok: false, output: '' }
const mergeBase = mergeBaseResult.ok ? mergeBaseResult.output : null
const upstreamHead = upstreamHeadResult.ok ? upstreamHeadResult.output : null
const staleAgainstUpstream = Boolean(upstreamBranch && mergeBase && upstreamHead && mergeBase !== upstreamHead)

const {
  listExplicitToolStudyCards,
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const studyCards = listExplicitToolStudyCards()
const reconciliationResults = listRuntimeIdReconciliationResults()
const duplicateSystemPaths = [
  'server/tool-calling/production-tool-registry.ts',
  'server/tool-calling/tool-registry.ts',
  'server/tool-calling/tool-qa-policy.ts',
  'server/tool-calling/tool-fallback-policy.ts',
  'server/tool-calling/production-worker-router.ts',
]
const duplicateSystemsCreated = duplicateSystemPaths.filter((filePath) => existsSync(filePath))
const duplicateStudyCardIds = [
  ...groupDuplicates(studyCards.map((studyCard) => studyCard.toolId)),
  ...groupDuplicates(studyCards.map((studyCard) => studyCard.externalToolId)),
].sort()
const duplicateAliases = buildAliasConflicts(studyCards, reconciliationResults)
const pendingExternalTools = reconciliationResults
  .filter((result) => result.status === 'pending_production_tool_registry_expansion')
  .map((result) => result.externalToolId ?? result.inputToolId)
  .sort()
const pendingExternalToolsNowFirstClass = pendingExternalTools
  .filter((toolId) => productionToolIds.has(toolId))
  .sort()

const toolCallingPathPatterns = [
  /^server\/tool-calling\//,
  /^docs\/tool-calling\//,
  /^server\/tool-registry\//,
  /^server\/workers\/production\//,
  /^src\/backend\/contracts\/production-tool-runtime-contracts\.ts$/,
  /^database\/migration-drafts\//,
  /^database\/test-sql\//,
  /^docs\/open-source-tool-stack\//,
  /^docs\/track-a\//,
  /^docs\/cross-chat\//,
  /^package\.json$/,
  /^package-lock\.json$/,
]
const changedToolCallingPaths = uniqueSorted(
  changedFiles.filter((filePath) => toolCallingPathPatterns.some((pattern) => pattern.test(filePath))),
)
const stagedToolCallingPaths = uniqueSorted(
  stagedFiles.filter((filePath) => toolCallingPathPatterns.some((pattern) => pattern.test(filePath))),
)

const packageLockChanged = changedFiles.includes('package-lock.json')
const packageLockStaged = stagedFiles.includes('package-lock.json')
const warnings = []
const blockingReasons = []

if (duplicateSystemsCreated.length > 0) {
  blockingReasons.push(`duplicate local system files exist: ${duplicateSystemsCreated.join(', ')}`)
}
if (duplicateStudyCardIds.length > 0) {
  blockingReasons.push(`duplicate study card IDs exist: ${duplicateStudyCardIds.join(', ')}`)
}
if (duplicateAliases.length > 0) {
  blockingReasons.push(`duplicate aliases map to conflicting IDs: ${duplicateAliases.map((item) => item.alias).join(', ')}`)
}
if (pendingExternalToolsNowFirstClass.length > 0) {
  blockingReasons.push(`pending external tools are now first-class ProductionToolIds: ${pendingExternalToolsNowFirstClass.join(', ')}`)
}
if (packageLockStaged) {
  blockingReasons.push('package-lock.json is staged')
}
if (staleAgainstUpstream) {
  warnings.push(`branch is stale against upstream ${upstreamBranch}`)
}
if (packageLockChanged) {
  warnings.push('package-lock.json has an unstaged change; keep it out of tool-calling milestone commits unless explicitly intended')
}
if (!fetchAllowed) {
  warnings.push('fetch skipped; rerun with REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1 when network refresh is safe')
}

const githubPrScan = scanGithubPrs()
const continueAllowed = blockingReasons.length === 0

console.log(JSON.stringify({
  ok: continueAllowed,
  currentBranch,
  upstreamBranch,
  headCommit,
  mergeBase,
  upstreamHead,
  staleAgainstUpstream,
  statusShort,
  recentLog,
  changedFiles,
  stagedFiles,
  changedToolCallingPaths,
  stagedToolCallingPaths,
  packageLockChanged,
  packageLockStaged,
  duplicateSystemsCreated,
  duplicateStudyCardIds,
  duplicateAliases,
  pendingExternalTools,
  pendingExternalToolsNowFirstClass,
  fetchAttempted: fetchAllowed,
  fetchSkipped: !fetchAllowed,
  fetchOk: fetchAllowed ? fetchResult.ok : null,
  fetchError: fetchAllowed && !fetchResult.ok ? fetchResult.error : null,
  githubPrScanAvailable: githubPrScan.githubPrScanAvailable,
  githubPrScanError: githubPrScan.githubPrScanError,
  relevantOpenPrs: githubPrScan.relevantOpenPrs,
  continueAllowed,
  blockingReasons,
  warnings,
}, null, 2))

if (!continueAllowed) {
  process.exitCode = 1
}
