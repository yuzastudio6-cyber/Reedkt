import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { accessSync, constants } from 'node:fs'
import { createRequire } from 'node:module'
import { delimiter, join } from 'node:path'

import {
  hashProductionContainerQualificationValue,
  type ProductionContainerQualificationObservation,
  type ProductionContainerQualificationProbeAdapter,
} from './production-container-qualification-contract'

const requireFromProbe = createRequire(import.meta.url)
const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_MAX_BUFFER = 256 * 1024

export function createLiveProductionContainerQualificationProbeAdapter(input: {
  timeoutMs?: number
  maxBuffer?: number
} = {}): ProductionContainerQualificationProbeAdapter {
  const timeoutMs = boundedInteger(input.timeoutMs, DEFAULT_TIMEOUT_MS, 250, 15_000)
  const maxBuffer = boundedInteger(
    input.maxBuffer,
    DEFAULT_MAX_BUFFER,
    16 * 1024,
    1024 * 1024,
  )
  const pythonCommand = findPythonCommand(timeoutMs)

  return Object.freeze({
    inspectCommand(
      request: Parameters<ProductionContainerQualificationProbeAdapter['inspectCommand']>[0],
    ): ProductionContainerQualificationObservation {
      if (request.presenceOnly) {
        const executable = findExecutable(request.command)
        return observation(Boolean(executable), {
          kind: 'bounded_source_owned_command_presence_probe',
          command: request.command,
          executableIdentityHash: executable ? hashText(executable) : null,
        })
      }
      try {
        const output = execFileSync(request.command, request.args, {
          encoding: 'utf8',
          timeout: timeoutMs,
          maxBuffer,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: sanitizedProbeEnvironment(),
        })
        const present = request.expectedPattern
          ? request.expectedPattern.test(output)
          : true
        return observation(present, {
          kind: 'bounded_source_owned_command_probe',
          command: request.command,
          args: request.args,
          outputHash: hashText(output),
          outputBytes: Buffer.byteLength(output),
        })
      } catch (error) {
        return observation(false, sanitizedFailureEvidence(
          'bounded_source_owned_command_probe',
          error,
        ))
      }
    },
    inspectPythonImport(
      request: Parameters<ProductionContainerQualificationProbeAdapter['inspectPythonImport']>[0],
    ): ProductionContainerQualificationObservation {
      if (!pythonCommand) {
        return observation(false, {
          kind: 'bounded_python_import_probe',
          failureCode: 'python_runtime_not_available',
        })
      }
      try {
        const output = execFileSync(pythonCommand, [
          '-I',
          '-B',
          '-c',
          [
            'import importlib',
            'import importlib.metadata',
            `module = importlib.import_module(${JSON.stringify(request.importName)})`,
            `name = ${JSON.stringify(request.packageName)}`,
            'try:',
            '  version = importlib.metadata.version(name)',
            'except Exception:',
            '  version = getattr(module, "__version__", "version-unavailable")',
            'print(str(version)[:160])',
          ].join('\n'),
        ], {
          encoding: 'utf8',
          timeout: timeoutMs,
          maxBuffer,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: sanitizedProbeEnvironment(),
        })
        return observation(true, {
          kind: 'bounded_python_import_probe',
          packageName: request.packageName,
          importName: request.importName,
          versionEvidenceHash: hashText(output.trim()),
        })
      } catch (error) {
        return observation(false, sanitizedFailureEvidence(
          'bounded_python_import_probe',
          error,
        ))
      }
    },
    inspectNodePackage(
      request: Parameters<ProductionContainerQualificationProbeAdapter['inspectNodePackage']>[0],
    ): ProductionContainerQualificationObservation {
      try {
        const resolvedPath = requireFromProbe.resolve(request.packageJsonPath)
        const packageJson = requireFromProbe(request.packageJsonPath) as {
          name?: unknown
          version?: unknown
        }
        return observation(true, {
          kind: 'bounded_node_package_metadata_probe',
          packageName: request.packageName,
          resolvedIdentityHash: hashText(resolvedPath),
          declaredName: typeof packageJson.name === 'string'
            ? packageJson.name.slice(0, 160)
            : 'name-unavailable',
          declaredVersion: typeof packageJson.version === 'string'
            ? packageJson.version.slice(0, 160)
            : 'version-unavailable',
        })
      } catch (error) {
        return observation(false, sanitizedFailureEvidence(
          'bounded_node_package_metadata_probe',
          error,
        ))
      }
    },
  })
}

function findExecutable(command: string): string | undefined {
  if (!/^[A-Za-z0-9._+-]{1,128}$/u.test(command)) return undefined
  for (const directory of String(process.env.PATH ?? '').split(delimiter).filter(Boolean)) {
    const candidate = join(directory, command)
    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch {
      // The next fixed PATH directory may contain the executable.
    }
  }
  return undefined
}

function observation(
  present: boolean,
  evidence: unknown,
): ProductionContainerQualificationObservation {
  return {
    present,
    evidenceHash: hashProductionContainerQualificationValue({
      present,
      evidence,
      rawOutputPersisted: false,
      localPathProjected: false,
      credentialOrSecretProjected: false,
    }),
  }
}

function findPythonCommand(timeoutMs: number): string | undefined {
  for (const candidate of ['python3', 'python']) {
    try {
      execFileSync(candidate, ['-I', '-B', '-c', 'import sys; print(sys.version_info[0])'], {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 16 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: sanitizedProbeEnvironment(),
      })
      return candidate
    } catch {
      // The next fixed candidate may exist.
    }
  }
  return undefined
}

function sanitizedProbeEnvironment(): NodeJS.ProcessEnv {
  const allowed = [
    'PATH',
    'HOME',
    'LANG',
    'LC_ALL',
    'NODE_PATH',
    'PYTHONPATH',
    'LD_LIBRARY_PATH',
    'NVIDIA_VISIBLE_DEVICES',
  ]
  return Object.fromEntries(allowed.flatMap((name) =>
    process.env[name] === undefined ? [] : [[name, process.env[name]]]))
}

function sanitizedFailureEvidence(kind: string, error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code ?? 'probe_failed')
    : 'probe_failed'
  return {
    kind,
    failureCode: code.replace(/[^A-Za-z0-9_.-]/gu, '_').slice(0, 80),
    rawErrorPersisted: false,
  }
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error('Container qualification probe limit is invalid.')
  }
  return value
}
