import type { ApprovedPlanRepoOwnershipAudit, MissingContractInventory } from './approved-plan-validation-types'

export function buildMissingContractInventory(repoOwnershipAudit: ApprovedPlanRepoOwnershipAudit): MissingContractInventory {
  const missingContracts = repoOwnershipAudit.filesInspected.filter((item) => !item.present)
  const blockingMissingContracts = missingContracts.filter((item) => item.blockingForPhase52E)
  return {
    inventoryId: 'phase52e_missing_contract_inventory',
    missingContracts,
    blockingMissingContracts,
    warnings: missingContracts.length ? missingContracts.map((item) => `${item.path}: ${item.followUp}`) : [],
    blockers: blockingMissingContracts.map((item) => `${item.path}: ${item.impact}`),
  }
}
