import {
  buildOpenSourceToolStackDuckdbNativeRebuildReports,
  readOpenSourceToolStackDuckdbNativeRebuildArtifacts,
  summarizeOpenSourceToolStackDuckdbNativeRebuild,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-execution'

console.log(
  summarizeOpenSourceToolStackDuckdbNativeRebuild(
    readOpenSourceToolStackDuckdbNativeRebuildArtifacts() ?? buildOpenSourceToolStackDuckdbNativeRebuildReports(),
  ),
)
