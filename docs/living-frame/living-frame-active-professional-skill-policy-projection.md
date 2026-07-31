# Living Frame Active Professional-Skill Policy Projection

`living-frame-active-professional-skill-policy-projection-v1` is a namespaced,
byte-free, non-executable projection of the owner-approved Living Frame policy
delta. It does not edit the shared Professional Skill registry.

## Frozen observed definition

The feature branch currently contains exactly one
`motion.living_frame_storytelling` definition among 110 observed Professional
Skill definitions. The count is a branch fingerprint, not a product cap or a
claim about the canonical backend checkout. The shared definition has no
explicit version field, so the projection freezes that absence, the complete
definition snapshot, and SHA-256
`c5c1190db98624c7e22eb2c26731eb43a04d274f1459779b9bb10307bb1d6537`.

Its current execution surface remains:

- `hiddenAdapterToolNames: []`;
- `backendIntents: []`;
- `executionModes: ['plan_only']`; and
- the four existing QA gates.

Any change to the observed count, definition digest, current gate order, tool
surface, backend intent surface, or execution mode makes this feature-branch
compiler fail closed. The later canonical one-writer must reconcile the current
backend registry state rather than treating 110 as an invariant.

## Additive ordered gate delta

The projection records, but does not publish, these exact gates:

1. `owner_scope_amendment_required`
2. `paused_character_and_mechanical_routes_non_admissible`
3. `complete_time_postrender_visual_evidence_required`
4. `separate_verified_audio_evidence_required`
5. `kimi_primary_terra_fallback_head_qa_recommendation_required`
6. `n_plus_one_repair_and_reinspection_required`
7. `canonical_private_review_required`

The projected gate-set digest covers the existing four gates followed by this
ordered seven-gate delta. The projection also binds the exact current
`living-frame-owner-scope-amendment-v1` digest.

## Authority boundary

This contract is policy evidence only. It grants no registry, planner
selection, publication, approved-snapshot, tool, provider, runtime, dispatch,
cost, QA-approval, private-review, public-delivery, or production authority.
It does not register an operation, choose a provider, create an asset, run a
worker, approve QA, or charge a customer.

`currentCanonicalRegistryAlreadyEmitsDelta` remains `false` and
`canonicalConsumptionPending` remains `true`. A later clean canonical
one-writer change must version the single shared Living Frame definition,
publish the exact gate-set digest through selection and approved-snapshot
lineage, and run the complete canonical Professional Skill registry/planner
regression.
