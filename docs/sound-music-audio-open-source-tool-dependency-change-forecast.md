# Sound/Music/Audio Open-Source Tool Dependency Change Forecast

Forecast-only dependency impact plan for the 16 approved SOUND install-planning candidates. No dependency change was made.

Decision: `sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install`

```json sound-oss-tools-2-dependency-change-forecast
{
  "phase": "SOUND-OSS-TOOLS-2",
  "decision": "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
  "candidateCount": 16,
  "forecast": [
    {
      "toolId": "librosa",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "audioread",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "pydub",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "scipy_signal",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "resampy",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "pyloudnorm",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "audioflux",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": true,
      "macOsLinuxParityRisk": "medium",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "music21",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "pretty_midi",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "mido",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "noisereduce",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "signalsmith_stretch",
      "likelyDependencyLocation": [
        "Dockerfile_or_system_package_notes_later",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": false,
      "systemPackageInstallationNeededLater": true,
      "dockerBaseImageChangeNeededLater": true,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": true,
      "macOsLinuxParityRisk": "medium",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "pedalboard",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": true,
      "macOsLinuxParityRisk": "medium",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "pydub_effects",
      "likelyDependencyLocation": [
        "none",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": false,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": false,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "likelyDependencyLocation": [
        "none",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": false,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": false,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    },
    {
      "toolId": "mir_eval",
      "likelyDependencyLocation": [
        "requirements.txt_or_pyproject.toml",
        "python_lockfile_later_if_adopted",
        "CI docs"
      ],
      "packageLockChangeExpectedLater": false,
      "pythonLockfileNeededLater": true,
      "systemPackageInstallationNeededLater": false,
      "dockerBaseImageChangeNeededLater": false,
      "ciImageChangeNeededLater": true,
      "nativeBuildToolsNeeded": false,
      "macOsLinuxParityRisk": "low",
      "gpuOrModelDownloadsOutOfScope": true,
      "laterInstallNeedsSeparateApproval": true,
      "status": "forecast_only"
    }
  ],
  "runtimeFlags": {
    "dependencyMutationAllowed": false,
    "toolExecutionAllowed": false,
    "audioProcessingAllowed": false,
    "mediaProcessingAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "installCompletionClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  }
}
```
