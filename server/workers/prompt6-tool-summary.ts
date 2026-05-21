import type { ServiceContext } from '../types'
import { runToolReadinessChecks } from './tool-readiness-runner'
import { WORKER_TOOL_NAMES, type ToolReadinessCheckResult, type WorkerToolName } from './tool-readiness-types'

export type Prompt6ToolStatus = 'available' | 'unavailable'

export interface Prompt6ToolSummary {
  prompt6Ready: boolean
  required: Record<'ffmpeg' | 'ffprobe', Prompt6ToolStatus>
  optional: Record<string, Prompt6ToolStatus>
  notes: string[]
  checks: Array<{
    toolName: WorkerToolName
    status: ToolReadinessCheckResult['status']
    required: boolean
    version?: string
    binaryPath?: string
    summary: string
    errorCode?: string
  }>
}

const PROMPT6_REQUIRED_TOOLS = ['ffmpeg', 'ffprobe'] as const

export async function createPrompt6ToolSummary(context: ServiceContext): Promise<Prompt6ToolSummary> {
  const readiness = await runToolReadinessChecks(context, {
    recordResults: false,
    requiredTools: [...PROMPT6_REQUIRED_TOOLS],
  })
  const checksByTool = new Map(readiness.checks.map((check) => [check.toolName, check]))
  const required = Object.fromEntries(
    PROMPT6_REQUIRED_TOOLS.map((toolName) => [toolName, toPrompt6Status(checksByTool.get(toolName))]),
  ) as Record<'ffmpeg' | 'ffprobe', Prompt6ToolStatus>
  const optionalToolNames = WORKER_TOOL_NAMES.filter((toolName) => !PROMPT6_REQUIRED_TOOLS.includes(toolName as typeof PROMPT6_REQUIRED_TOOLS[number]))
  const optional = Object.fromEntries(
    optionalToolNames.map((toolName) => [toolName, toPrompt6Status(checksByTool.get(toolName))]),
  )
  const prompt6Ready = required.ffmpeg === 'available' && required.ffprobe === 'available'
  const notes = buildNotes(prompt6Ready, checksByTool)

  return {
    prompt6Ready,
    required,
    optional,
    notes,
    checks: readiness.checks.map((check) => ({
      toolName: check.toolName,
      status: check.status,
      required: check.required,
      version: check.version,
      binaryPath: check.binaryPath,
      summary: check.summary,
      errorCode: check.errorCode,
    })),
  }
}

function toPrompt6Status(check: ToolReadinessCheckResult | undefined): Prompt6ToolStatus {
  return check?.status === 'passed' ? 'available' : 'unavailable'
}

function buildNotes(
  prompt6Ready: boolean,
  checksByTool: Map<WorkerToolName, ToolReadinessCheckResult>,
): string[] {
  const notes = prompt6Ready
    ? ['Prompt 6 can run basic FFmpeg/FFprobe smoke tests.']
    : ['Prompt 6 is blocked until FFmpeg and FFprobe are available on the host or in the Docker worker image.']

  if (checksByTool.get('remotion')?.status !== 'passed') {
    notes.push('Remotion compositor tests remain blocked until a later Remotion worker milestone installs it.')
  }
  if (checksByTool.get('sharp_libvips')?.status !== 'passed') {
    notes.push('Sharp/libvips image worker tests remain blocked until a later image worker milestone installs it.')
  }

  notes.push('No providers, rendering, media transforms, Stripe, Supabase, or secrets are used by this summary.')
  return notes
}
