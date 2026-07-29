import assert from 'node:assert/strict'

import {
  assertLivingFrameComfyUiOfflinePackageSourceContract,
  getLivingFrameComfyUiOfflinePackageSourceContract,
  LivingFrameComfyUiOfflinePackageSourceContractError,
} from '../living-frame/living-frame-comfyui-offline-package-source-contract'

async function main(): Promise<void> {
  const contract =
    await getLivingFrameComfyUiOfflinePackageSourceContract()
  assert.equal(contract.sourceFiles.length, 6)
  assert.equal(contract.dependencyClosure.wheelArtifactCount, 35)
  assert.equal(
    contract.dependencyClosure.wheelArtifactTotalByteLength,
    486_459_097,
  )
  assert.equal(contract.sourceClosure.sourceArchiveCount, 3)
  assert.deepEqual(contract.offlineInstaller, {
    fixedBuildInputRoot: '/opt/reeditpro/build-inputs/comfyui',
    fixedTargetRoot: '/opt/reeditpro/gpu-operations/comfyui',
    fixedModelMountRoot: '/mnt/reeditpro/model-artifacts',
    fixedPrivateInputRoot: '/mnt/reeditpro/private-input',
    installerArgumentsAllowed: false,
    wheelhouseEntryCount: 35,
    wheelhouseTotalByteLength: 486_459_097,
    pythonVersion: '3.10.12',
    venvUsesSystemSitePackages: true,
    sourceArchiveHashesVerified: true,
    wheelHashesVerifiedByPip: true,
    customNodeDirectoriesExactlyTwo: true,
    installedLayoutVerifierExecutedByInstaller: true,
    imageContainsModelWeights: false,
    runtimeDownloadsAllowed: false,
  })
  assert.deepEqual(
    contract.capabilityAndCostBoundary
      .oneGpuAttemptCapabilityKeys,
    [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
    ],
  )
  assert.equal(
    contract.capabilityAndCostBoundary.auraFaceExecutionClass,
    'separate_optional_cpu_qa',
  )
  assert.equal(
    contract.capabilityAndCostBoundary
      .fiveSeparateGpuChargesCreated,
    false,
  )
  assert.equal(contract.boundaries.canonicalRouterAdmission, false)
  assert.equal(
    contract.boundaries.offlineInstallerSourceVerified,
    true,
  )
  assert.equal(
    contract.boundaries.installedLayoutVerifierSourceVerified,
    true,
  )
  assert.equal(
    contract.boundaries.installedLayoutVerifiedInBuiltImage,
    false,
  )
  assert.equal(
    contract.boundaries.fixedModelMountLayoutDeclared,
    true,
  )
  assert.equal(contract.boundaries.gpuExecutionObserved, false)
  assert.equal(contract.boundaries.actualCostEvidenceCreated, false)
  assert.equal(contract.boundaries.customerCreditAuthority, false)
  assert.equal(contract.boundaries.runtimeAuthority, false)
  assert.equal(contract.boundaries.productionReady, false)
  assert.match(contract.sourceDigestSha256, /^[a-f0-9]{64}$/u)
  assert.match(contract.contractDigestSha256, /^[a-f0-9]{64}$/u)
  assert.deepEqual(
    await assertLivingFrameComfyUiOfflinePackageSourceContract(
      structuredClone(contract),
    ),
    contract,
  )

  let adversarialAssertions = 0
  await rejects({
    ...structuredClone(contract),
    boundaries: {
      ...contract.boundaries,
      runtimeAuthority: true,
      productionAuthority: true,
      productionReady: true,
    },
  })
  adversarialAssertions += 1
  await rejects({
    ...structuredClone(contract),
    capabilityAndCostBoundary: {
      ...contract.capabilityAndCostBoundary,
      fiveSeparateGpuChargesCreated: true,
    },
  })
  adversarialAssertions += 1
  await rejects({
    ...structuredClone(contract),
    processContract: {
      ...contract.processContract,
      loopbackAddress: '0.0.0.0',
    },
  })
  adversarialAssertions += 1
  await rejects({
    ...structuredClone(contract),
    offlineInstaller: {
      ...contract.offlineInstaller,
      installerArgumentsAllowed: true,
      runtimeDownloadsAllowed: true,
    },
  })
  adversarialAssertions += 1
  await rejects({
    ...structuredClone(contract),
    sourceFiles: contract.sourceFiles.map((source, index) => ({
      ...source,
      contentSha256: index === 0
        ? '0'.repeat(64)
        : source.contentSha256,
    })),
  })
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 5)
  process.stdout.write(JSON.stringify({
    status: 'passed',
    sourceFileCount: contract.sourceFiles.length,
    lockedWheelCount:
      contract.dependencyClosure.wheelArtifactCount,
    lockedSourceArchiveCount:
      contract.sourceClosure.sourceArchiveCount,
    sharedGpuCapabilityCount:
      contract.capabilityAndCostBoundary
        .oneGpuAttemptCapabilityKeys.length,
    separateAuraFaceCpuQa: true,
    adversarialAssertions,
    runtimeImageBuilt: false,
    canonicalRouterAdmission: false,
    productionReady: false,
  }))
  process.stdout.write('\n')
}

async function rejects(value: unknown): Promise<void> {
  await assert.rejects(
    () =>
      assertLivingFrameComfyUiOfflinePackageSourceContract(value),
    (error: unknown) =>
      error instanceof
        LivingFrameComfyUiOfflinePackageSourceContractError
      && error.code === 'contract_mismatch',
  )
}

await main()
