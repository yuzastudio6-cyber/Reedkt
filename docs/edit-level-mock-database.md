# Edit Level MockDatabase

RP-EDITLEVEL-03 extends `MockDatabase` additively with local Edit Level collections:

- `editLevelProfileCatalog`
- `editLevelSelections`
- `editLevelRecommendations`
- `editLevelReadiness`
- `editLevelApplicationLogs`

The mock repository seeds `editLevelProfileCatalog` from the RP-EDITLEVEL-02 Normal, Premium, and Ultra Premium fixtures. Selection, recommendation, readiness, and application log records are local mock records only.

This MockDatabase layer has no runtime implementation outside local mock flows. It performs no Supabase read/write, file byte read, external URL fetch, provider/model call, media worker start, render job creation, or credit reservation/spend.

Recommended next prompt: `RP-EDITLEVEL-04 - UI Cards + Recommendation`.
