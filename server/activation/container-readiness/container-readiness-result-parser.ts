import { basename } from 'node:path'
import {
  containerReadinessExpectedToolsByImage,
  containerReadinessImageOrder,
  getAllExpectedReadinessTools,
  getExpectedToolsForImage,
} from './container-readiness-expected-tools'
import { forbiddenReadinessLogPatterns } from './container-readiness-policy'
import type {
  ContainerReadinessExpectedTool,
  ContainerReadinessImageId,
  ContainerReadinessStatus,
  ContainerReadinessToolId,
  ParsedContainerReadinessLog,
  ParsedContainerReadinessToolResult,
} from './container-readiness-types'

const passPattern = /(^|\b)(passed|version check passed|import check passed|readiness passed)(\b|$)/i
const missingPattern = /(^|\b)(missing|not found|command not found|module not found)(\b|$)/i
const failedPattern = /(^|\b)(import failed|readiness failed|failed)(\b|$)/i
const blockedPattern = /(^|\b)(blocked)(\b|$)/i
const manualReviewPattern = /needs_license_review|pending_manual_review|manual review/i
const sourceInstallReviewPattern = /source_install_review_required|source install review/i
const modelWeightMissingPattern = /model_weight_missing|model weight missing/i
const modelWeightBlockedPattern = /model_weight_blocked|model weight blocked/i

export function parseContainerReadinessLog(logText: string, sourceName = ''): ParsedContainerReadinessLog {
  const imageId = inferReadinessImageId(sourceName, logText)
  const expectedTools = imageId ? getExpectedToolsForImage(imageId) : getAllExpectedReadinessTools()
  const toolResults = parseToolResults(logText, expectedTools)
  const forbiddenFindings = forbiddenReadinessLogPatterns
    .filter((finding) => finding.pattern.test(logText))
    .map((finding) => `${finding.id}: ${finding.summary}`)
  const blockers = [
    ...forbiddenFindings,
    ...toolResults
      .filter((result) => ['blocked', 'failed', 'model_weight_blocked'].includes(result.status))
      .map((result) => `${result.toolId} readiness is ${result.status}.`),
  ]
  const warnings = [
    ...toolResults
      .filter((result) => ['pending_manual_review', 'source_install_review_required', 'model_weight_missing', 'optional_missing'].includes(result.status))
      .map((result) => `${result.toolId} readiness is ${result.status}.`),
  ]

  if (!imageId) warnings.push('Could not infer image id from readiness log name or contents.')

  const parsedStatus = statusFromToolResults(toolResults, blockers, warnings, logText)

  return {
    parsedStatus,
    imageId,
    imageName: detectImageName(logText),
    imageDigest: detectImageDigest(logText),
    toolResults,
    blockers,
    warnings,
    forbiddenFindings,
    nextActions: nextActionsFor(parsedStatus, imageId, blockers),
  }
}

export function inferReadinessImageId(sourceName: string, logText: string): ContainerReadinessImageId | undefined {
  const haystack = `${basename(sourceName)}\n${logText}`.toLowerCase()
  return containerReadinessImageOrder.find((imageId) => {
    const role = imageId.replace(/-/g, '_')
    return haystack.includes(imageId) ||
      haystack.includes(role) ||
      haystack.includes(`reeditpro-${imageId}`) ||
      haystack.includes(`docker/prod/${imageId}/dockerfile`)
  })
}

function parseToolResults(
  logText: string,
  expectedTools: ContainerReadinessExpectedTool[],
): ParsedContainerReadinessToolResult[] {
  const lines = logText.split(/\r?\n/)
  const results = new Map<ContainerReadinessToolId, ParsedContainerReadinessToolResult>()

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    for (const tool of expectedTools) {
      if (!tool.aliases.some((alias) => lowerLine.includes(alias))) continue
      const status = statusFromLine(line, tool)
      if (!status) continue
      results.set(tool.toolId, {
        toolId: tool.toolId,
        status,
        sourceLine: line.trim(),
      })
    }
  }

  return [...results.values()]
}

function statusFromLine(
  line: string,
  tool: ContainerReadinessExpectedTool,
): ContainerReadinessStatus | undefined {
  if (modelWeightBlockedPattern.test(line)) return 'model_weight_blocked'
  if (modelWeightMissingPattern.test(line)) return 'model_weight_missing'
  if (sourceInstallReviewPattern.test(line)) return 'source_install_review_required'
  if (manualReviewPattern.test(line)) return 'pending_manual_review'
  if (blockedPattern.test(line)) return tool.modelWeightRelated ? 'model_weight_blocked' : 'blocked'
  if (failedPattern.test(line)) return 'failed'
  if (missingPattern.test(line)) return tool.optionalForNonGpuStaging ? 'optional_missing' : 'missing'
  if (passPattern.test(line)) return 'passed'
  return undefined
}

function statusFromToolResults(
  toolResults: ParsedContainerReadinessToolResult[],
  blockers: string[],
  warnings: string[],
  logText: string,
): ContainerReadinessStatus {
  if (blockers.length > 0) return 'blocked'
  if (toolResults.some((result) => result.status === 'missing' || result.status === 'failed')) return 'failed'
  if (warnings.length > 0) return 'warning'
  if (toolResults.some((result) => result.status === 'passed') || /readiness passed|passed/i.test(logText)) return 'passed'
  return 'not_checked'
}

function detectImageName(logText: string): string | undefined {
  return logText.match(/(?:image|container image|naming to)[:\s]+([A-Za-z0-9./:_-]+reeditpro[A-Za-z0-9./:_-]*)/i)?.[1]
}

function detectImageDigest(logText: string): string | undefined {
  return logText.match(/sha256:([a-f0-9]{32,64})/i)?.[0]
}

function nextActionsFor(
  status: ContainerReadinessStatus,
  imageId: ContainerReadinessImageId | undefined,
  blockers: string[],
): string[] {
  if (blockers.length > 0) return ['Stop using this readiness evidence until forbidden or failed findings are resolved.']
  if (!imageId) return ['Attach this readiness log to a known production image before Phase 23 decisions.']
  if (status === 'passed') return ['Record this readiness evidence for Phase 23 image push review.']
  if (status === 'warning') return ['Review warning-only manual items before continuing to later activation phases.']
  return ['Provide a complete human-run readiness log for this image.']
}

export function buildParsedReadinessLogFromText(input: {
  logText: string
  sourceName?: string
}): ParsedContainerReadinessLog {
  return parseContainerReadinessLog(input.logText, input.sourceName)
}

export function expectedToolIdsForImage(imageId: ContainerReadinessImageId): ContainerReadinessToolId[] {
  return containerReadinessExpectedToolsByImage[imageId].map((tool) => tool.toolId)
}
