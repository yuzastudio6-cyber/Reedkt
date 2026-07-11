import { buildProfessionalToolArchitectureProgramMap } from '../tool-registry'

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

const output = argValue('output') ?? 'text'
const map = buildProfessionalToolArchitectureProgramMap()

if (output === 'json') {
  console.log(JSON.stringify(map, null, 2))
} else {
  console.log('Professional tool architecture program map')
  console.log(`productionRegistryTools=${map.summary.productionRegistryToolCount}`)
  console.log(`launchCoreRegistryTools=${map.summary.launchCoreRegistryToolCount}`)
  console.log(`boundedInternalAdapterContracts=${map.summary.boundedInternalAdapterContractCount}`)
  console.log(`professionalSkills=${map.summary.professionalSkillCount}`)
  console.log(`professionalSkillFamilies=${map.summary.professionalSkillFamilyCount}`)
  console.log(`hiddenSkillAdapterNames=${map.summary.hiddenSkillAdapterNameCount}`)
  console.log(`skillArchitectureIntegratedToolNames=${map.summary.skillArchitectureIntegratedToolNameCount}`)
  console.log(`boundedBackendAdapterWired=${map.summary.boundedBackendAdapterWiredCount}`)
  console.log(`ownerLaneSourceTruthAccepted=${map.summary.ownerLaneSourceTruthAcceptedToolCount}`)
  console.log(`launchCoreOutsideBoundedAdapters=${map.summary.launchCoreRegistryOnlyWiredCount}`)
  console.log(`ownerLaneRegistrySupportAccepted=${map.summary.ownerLaneRegistrySupportAcceptedToolCount}`)
  console.log(`skillReferenceOnly=${map.summary.skillReferenceOnlyToolNameCount}`)
  console.log(`registryNamedOnly=${map.summary.registryNamedOnlyToolCount}`)
  console.log(`promotionBacklogItems=${map.summary.promotionBacklogItemCount}`)
  console.log(`registryNamedOnlyModelManifestLane=${map.summary.registryNamedOnlyModelManifestLaneCount}`)
  console.log(`registryNamedOnlyScopeDecision=${map.summary.registryNamedOnlyScopeDecisionCount}`)
  console.log(`registryNamedOnlyEvaluationHold=${map.summary.registryNamedOnlyEvaluationHoldCount}`)
  console.log(`productReadyTools=${map.summary.productReadyToolCount}`)
  console.log(`frontendExecutableTools=${map.summary.frontendExecutableToolCount}`)
  console.log('')
  console.log('sourceTruthStatusCounts:')
  for (const [status, count] of Object.entries(map.summary.sourceTruthStatusCounts)) {
    console.log(`- ${status}=${count}`)
  }
  console.log('')
  for (const group of map.groups) {
    console.log(`# ${group.title}`)
    console.log(`id=${group.groupId}`)
    console.log(`entries=${group.entryCount}`)
    console.log(`productReady=${group.productReadyCount}`)
    console.log(`frontendExecutable=${group.frontendExecutionAllowedCount}`)
    console.log(group.purpose)
    console.log(`boundary=${group.boundary}`)
    console.log(`tools=${group.requestedToolNames.join(', ')}`)
    console.log('')
  }
  console.log('notes:')
  for (const note of map.summary.notes) console.log(`- ${note}`)
  if (map.summary.hiddenSkillAdapterNamesWithoutBoundedContracts.length) {
    console.log('')
    console.log('hiddenSkillAdapterNamesWithoutBoundedContracts:')
    console.log(map.summary.hiddenSkillAdapterNamesWithoutBoundedContracts.join(', '))
  }
  if (map.promotionBacklog.length) {
    console.log('')
    console.log('promotionBacklog:')
    for (const item of map.promotionBacklog) {
      console.log(`- ${item.requestedToolName}: tier=${item.implementationTier}; path=${item.promotionPath}; next=${item.recommendedNextGate}`)
    }
  }
}
