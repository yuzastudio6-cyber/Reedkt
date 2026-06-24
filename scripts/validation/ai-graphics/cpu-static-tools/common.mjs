import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const proofStatuses = {
  passed: 'proof_passed',
  blockedMissingRuntime: 'proof_blocked_missing_runtime',
  blockedMissingPackage: 'proof_blocked_missing_package',
  failedUnexpectedError: 'proof_failed_unexpected_error',
}

export const falseRuntimeGates = {
  agentCanExecuteToolsNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  browserWebglCanvasRuntimeApprovedNow: false,
  gpuRuntimeApprovedNow: false,
  providerRuntimeApprovedNow: false,
  publicArtifactApprovedNow: false,
  signedUrlApprovedNow: false,
  runtimeReadyNow: false,
  internalBetaReadyNow: false,
  productionReadyNow: false,
}

export function hashString(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function hashJson(value) {
  return hashString(JSON.stringify(value))
}

export function summarizeModule(module) {
  return Object.keys(module)
    .filter((key) => !key.startsWith('_'))
    .sort()
    .slice(0, 16)
}

export function writeLocalArtifact(paths, fileName, content) {
  mkdirSync(paths.artifactRootAbs, { recursive: true })
  const artifactAbs = path.join(paths.artifactRootAbs, fileName)
  writeFileSync(artifactAbs, content)
  return `${paths.artifactRootRel}/${fileName}`
}

export async function importPackage(packageName) {
  try {
    return { importStatus: 'passed', module: await import(packageName) }
  } catch (error) {
    if (
      error?.code === 'ERR_MODULE_NOT_FOUND' ||
      /Cannot find package|Cannot find module/i.test(error?.message ?? '')
    ) {
      return {
        importStatus: 'blocked_missing_package',
        status: proofStatuses.blockedMissingPackage,
        blockedReason: `Package ${packageName} is not available from the current lockfile install.`,
        errorMessage: error.message,
      }
    }
    return {
      importStatus: 'failed_unexpected_error',
      status: proofStatuses.failedUnexpectedError,
      blockedReason: `Unexpected import error for ${packageName}.`,
      errorMessage: error?.stack ?? error?.message ?? String(error),
    }
  }
}

export function baseResult({ toolId, displayName, packageName }) {
  return {
    toolId,
    displayName,
    packageName,
    proofPhase: 'cpu_static_execution_proof_phase_0',
    importStatus: 'not_attempted',
    fixtureStatus: 'not_attempted',
    outputContractStatus: 'not_checked',
    status: proofStatuses.failedUnexpectedError,
    blockedReason: null,
    runtimeRequirementsDiscovered: [],
    localArtifactPaths: [],
    nextProofMilestone: 'cpu_static_execution_proof_phase_0_qa_review',
    ...falseRuntimeGates,
  }
}

export function missingPackageResult(metadata, imported) {
  return {
    ...baseResult(metadata),
    importStatus: imported.importStatus,
    fixtureStatus: 'blocked',
    outputContractStatus: 'blocked',
    status: proofStatuses.blockedMissingPackage,
    blockedReason: imported.blockedReason,
    errorMessage: imported.errorMessage,
    runtimeRequirementsDiscovered: ['dependency_install_from_lock_required'],
  }
}

export function unexpectedErrorResult(metadata, error) {
  return {
    ...baseResult(metadata),
    importStatus: 'failed_unexpected_error',
    fixtureStatus: 'failed_unexpected_error',
    outputContractStatus: 'failed_unexpected_error',
    status: proofStatuses.failedUnexpectedError,
    blockedReason: 'Unexpected proof runner error.',
    errorMessage: error?.stack ?? error?.message ?? String(error),
  }
}
