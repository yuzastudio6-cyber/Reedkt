import {
  buildTrackaContainerDockerBuildBlockerResolutionReports,
  readTrackaContainerDockerBuildBlockerResolutionArtifacts,
  summarizeTrackaContainerDockerBuildBlockerResolution,
} from '../activation/open-source-tool-stack-tracka-container-docker-build-blocker-resolution'

console.log(
  summarizeTrackaContainerDockerBuildBlockerResolution(
    readTrackaContainerDockerBuildBlockerResolutionArtifacts() ??
      buildTrackaContainerDockerBuildBlockerResolutionReports(),
  ),
)
