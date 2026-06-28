# Production Tool Cost Owner Coverage

RP-TOOLCOST-01 derives mock-safe metering coverage from the existing production tool registry. The production registry remains the source of truth; this milestone does not create a parallel registry.

## Coverage

- Production registry tool count: `49`.
- Production metering profile count: `49`.
- Each `ProductionToolId` has one `ProductionToolMeteringProfile`.
- Profile owner is derived from the registry `workerType`.
- Provider boundary is derived from the registry `executionMode`.
- Usage category is mapped from the registry category to the existing CREDITDATA/RATECARD usage categories.
- Runtime policy, production status, license/model-weight metadata, and worker type derive the default compute, quality, risk, and credit prerequisite flags.

Every profile keeps `serviceFeeIncluded = false`. Tool owners report actual internal tool/runtime/provider cost only. ReEditPro service/edit fee remains settlement-preview policy from RP-CREDITPOLICY-01 and RP-CREDITDATA-01.

RP-ESTIMATE-01 reuses these profiles for user-facing edit credit estimate previews. The estimate preview adds service fee separately and does not turn profile estimates into provider calls, worker execution, credit reservations, wallet mutations, ledger writes, render/export, or settlement.

## Boundary

This is mock-safe coverage only. It does not charge users, mutate wallets, reserve/spend/release/refund credits, write ledgers, execute settlement, call providers, execute workers, run render/export, create Supabase migrations, or add production persistence.

`smoke:production-tool-cost` asserts the 49/49 coverage count, owner/default/prerequisite fields, product edit level vs runtime compute level separation, and `serviceFeeIncluded = false`. `smoke:credit-estimate` asserts the estimate-preview bridge over this coverage.
