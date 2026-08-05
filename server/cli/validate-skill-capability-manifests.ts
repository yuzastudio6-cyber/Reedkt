import {
  editSkillArtifactSchemaRegistry,
  editSkillCapabilityRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillReferenceCatalog,
  editSkillRuntimeBindingRegistry,
  editSkillWorkGraphJobDefinitions,
} from '../edit-skills/internal-fixture-runtime'
import { validateSkillCapabilityManifests } from '../edit-skills/core/skill-capability-validator'

const result = validateSkillCapabilityManifests({
  registry: editSkillCapabilityRegistry,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
  artifacts: editSkillArtifactSchemaRegistry,
  catalog: editSkillReferenceCatalog,
  runtimeBindings: editSkillRuntimeBindingRegistry,
  workGraphJobs: editSkillWorkGraphJobDefinitions,
})

console.log(JSON.stringify({
  status: 'ok',
  manifestCount: result.manifestCount,
  manifestHashes: result.manifestHashes,
}, null, 2))
