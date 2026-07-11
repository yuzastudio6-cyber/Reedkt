import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

import {
  getProfessionalToolAdapterBinaryRunnerCommand,
  type ProductionToolId,
} from '../tool-registry'
import type { ProductionToolReadinessSpec } from '../workers/production-readiness'
import type {
  ToolRuntimeEvidenceProbeMode,
  ToolRuntimeEvidenceProbeResult,
} from './tool-runtime-evidence-types'

const requireFromHere = createRequire(import.meta.url)
const MAX_CAPTURED_OUTPUT_BYTES = 64 * 1024
const PROBE_TIMEOUT_MS = 5_000

interface ProbeTarget {
  probeKind: ToolRuntimeEvidenceProbeResult['probeKind']
  target: string
  args?: string[]
  expectedPattern?: string
}

function targetsForSpec(toolId: ProductionToolId, spec: ProductionToolReadinessSpec): ProbeTarget[] {
  const declaredTargets: ProbeTarget[] = [
    ...spec.commandChecks.map((check) => ({
      probeKind: 'command_version' as const,
      target: check.command,
      args: [...check.versionArgs],
      expectedPattern: check.expectedPattern,
    })),
    ...spec.nodePackageChecks.map((check) => ({
      probeKind: 'node_package_resolution' as const,
      target: check.importName,
    })),
    ...spec.pythonImportChecks.map((check) => ({
      probeKind: 'python_module_spec' as const,
      target: check.importName,
    })),
  ]
  const registeredBinary = getProfessionalToolAdapterBinaryRunnerCommand(toolId)
  if (registeredBinary && !declaredTargets.some((target) => (
    target.probeKind === 'command_version' && target.target === registeredBinary.commandName
  ))) {
    declaredTargets.push({
      probeKind: 'command_version',
      target: registeredBinary.commandName,
      args: toolId === 'gpac_mp4box_packaging_validation' ? ['-version'] : ['--version'],
    })
  }

  return declaredTargets
}

function boundedFirstLine(value: string): string | undefined {
  const firstLine = value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) return undefined
  return Array.from(firstLine)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint >= 32 && codePoint !== 127
    })
    .join('')
    .slice(0, 240)
}

function baseResult(
  target: ProbeTarget,
  checkedAt: string,
  presenceProbeExecuted = true,
): Pick<
  ToolRuntimeEvidenceProbeResult,
  | 'probeKind'
  | 'target'
  | 'expectedPattern'
  | 'checkedAt'
  | 'source'
  | 'presenceProbeExecuted'
  | 'networkAccessed'
  | 'credentialsRead'
  | 'packageCodeImported'
  | 'toolOperationExecuted'
  | 'mediaProcessed'
  | 'publicArtifactCreated'
> {
  return {
    probeKind: target.probeKind,
    target: target.target,
    expectedPattern: target.expectedPattern,
    checkedAt,
    source: 'server_safe_local_presence_probe',
    presenceProbeExecuted,
    networkAccessed: false,
    credentialsRead: false,
    packageCodeImported: false,
    toolOperationExecuted: false,
    mediaProcessed: false,
    publicArtifactCreated: false,
  }
}

function disabledResult(target: ProbeTarget, checkedAt: string): ToolRuntimeEvidenceProbeResult {
  return {
    ...baseResult(target, checkedAt, false),
    status: 'not_checked',
    summary: 'Safe local presence probing was disabled; no package, module, or command check ran.',
  }
}

function commandProbe(target: ProbeTarget, checkedAt: string): ToolRuntimeEvidenceProbeResult {
  const result = spawnSync(target.target, target.args ?? [], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
      LANG: 'C',
      LC_ALL: 'C',
    },
    maxBuffer: MAX_CAPTURED_OUTPUT_BYTES,
    shell: false,
    timeout: PROBE_TIMEOUT_MS,
  })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const observedVersion = boundedFirstLine(output)

  if (result.error && 'code' in result.error && result.error.code === 'ENOENT') {
    return {
      ...baseResult(target, checkedAt),
      status: 'absent',
      summary: `${target.target} is not present in the current backend process PATH.`,
    }
  }

  if (result.error) {
    return {
      ...baseResult(target, checkedAt),
      status: 'check_failed',
      summary: `${target.target} presence probe failed without executing a tool operation.`,
    }
  }

  if (target.expectedPattern && !output.toLowerCase().includes(target.expectedPattern.toLowerCase())) {
    return {
      ...baseResult(target, checkedAt),
      status: 'check_failed',
      observedVersion,
      summary: `${target.target} launched, but its bounded output did not match the server-owned readiness pattern.`,
    }
  }

  return {
    ...baseResult(target, checkedAt),
    status: 'present',
    observedVersion,
    summary: `${target.target} is present in the current backend process runtime; no media or product operation ran.`,
  }
}

function nodeResolutionProbe(target: ProbeTarget, checkedAt: string): ToolRuntimeEvidenceProbeResult {
  try {
    requireFromHere.resolve(target.target)
    return {
      ...baseResult(target, checkedAt),
      status: 'present',
      summary: `${target.target} resolves from the current backend Node runtime; package code was not imported.`,
    }
  } catch {
    return {
      ...baseResult(target, checkedAt),
      status: 'absent',
      summary: `${target.target} does not resolve from the current backend Node runtime.`,
    }
  }
}

function pythonModuleSpecProbe(target: ProbeTarget, checkedAt: string): ToolRuntimeEvidenceProbeResult {
  const rootModuleName = target.target.split(/[.,]/u)[0]?.trim()
  if (!rootModuleName) {
    return {
      ...baseResult(target, checkedAt),
      status: 'check_failed',
      summary: 'Python module presence target is invalid.',
    }
  }

  const script = [
    'import importlib.util, sys',
    'name = sys.argv[1]',
    'try:',
    '    found = importlib.util.find_spec(name) is not None',
    'except Exception:',
    '    raise SystemExit(2)',
    'raise SystemExit(0 if found else 1)',
  ].join('\n')
  const result = spawnSync('python3', ['-I', '-c', script, rootModuleName], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
      LANG: 'C',
      LC_ALL: 'C',
    },
    maxBuffer: MAX_CAPTURED_OUTPUT_BYTES,
    shell: false,
    timeout: PROBE_TIMEOUT_MS,
  })

  if (result.error && 'code' in result.error && result.error.code === 'ENOENT') {
    return {
      ...baseResult(target, checkedAt),
      status: 'absent',
      summary: 'python3 is unavailable, so the server could not verify this module in the current runtime.',
    }
  }

  if (result.error || result.status === 2 || result.status === null) {
    return {
      ...baseResult(target, checkedAt),
      status: 'check_failed',
      summary: `${target.target} Python module-spec probe failed without importing package code.`,
    }
  }

  if (result.status !== 0) {
    return {
      ...baseResult(target, checkedAt),
      status: 'absent',
      summary: `${target.target} is not discoverable in the isolated current backend Python runtime.`,
    }
  }

  return {
    ...baseResult(target, checkedAt),
    status: 'present',
    summary: `${target.target} is discoverable in the isolated current backend Python runtime; package code was not imported.`,
  }
}

export function collectSafeLocalToolPresenceProbes(input: {
  toolId: ProductionToolId
  spec: ProductionToolReadinessSpec
  probeMode: ToolRuntimeEvidenceProbeMode
  checkedAt: string
}): ToolRuntimeEvidenceProbeResult[] {
  const targets = targetsForSpec(input.toolId, input.spec)
  if (input.probeMode === 'disabled') {
    return targets.map((target) => disabledResult(target, input.checkedAt))
  }

  return targets.map((target) => {
    if (target.probeKind === 'command_version') return commandProbe(target, input.checkedAt)
    if (target.probeKind === 'node_package_resolution') return nodeResolutionProbe(target, input.checkedAt)
    return pythonModuleSpecProbe(target, input.checkedAt)
  })
}
