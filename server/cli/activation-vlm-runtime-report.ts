import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import {
  buildVlmRuntimeStaticReports,
  writeVlmRuntimeJsonArtifact,
} from '../activation/vlm-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]
const reports = buildVlmRuntimeStaticReports()

if (writeArtifacts && artifactDir) {
  await mkdir(artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_runtime_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_model_asset_verification.json'), reports.assetVerification)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_generated_fixture_manifest.json'), reports.fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_prompt_template_manifest.json'), reports.promptTemplateManifest)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_runtime_results.json'), reports.runtimeResults)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_output_schema_validation_report.json'), reports.schemaValidationReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_object_region_qa_report.json'), reports.objectRegionQaReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_safe_zone_qa_report.json'), reports.safeZoneQaReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_hallucination_safety_report.json'), reports.hallucinationSafetyReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_runtime_cost_memory_report.json'), reports.costMemoryReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_generated_vlm_runtime_report.json'), reports.fullReport)
}

console.log(JSON.stringify(reports.fullReport, null, 2))
