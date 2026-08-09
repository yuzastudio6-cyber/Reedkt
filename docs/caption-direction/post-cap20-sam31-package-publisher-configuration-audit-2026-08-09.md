# Post-CAP-20 SAM 3.1 package-publisher configuration audit

Milestone: `POST-CAP-20-SAM31-PACKAGE-PUBLISHER-CONFIGURATION-AUDIT`

Status: `reviewed_source_bound_redeploy_required`

Target: `caption_specialist_private_internal_qualified`

## Outcome

A new read-only operator now verifies the exact canonical Cloud Run package-
publisher configuration before any metadata publication. It checks the fixed
project, region, job and service identity; single task and single container;
zero retry; bounded CPU, memory and timeout; digest-pinned image; private IAM;
zero active executions; and the complete desired package environment.

The operator has no build, deploy, update, execute, delete, storage-write,
provider, GPU, billing, customer-credit, public-delivery, or production path.
It deliberately does not claim source-bound Cloud Build provenance; the
existing reviewed deployment owner remains responsible for that evidence.

## Exact read-only observation

The audit compared this next private package candidate:

- qualification ID:
  `sam31-source-checkpoint-qualification-20260809-v1-latest-signed-image`;
- ingest receipt:
  `sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12` /
  `321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8`;
- independent artifact review:
  `sam31-private-artifact-review-e2195b3f9bab456ef89b681f` /
  `ccca3ebb7e9127e6a0f98b1724c50c885a85e2a6c4f46667726eea29dbff7807`;
- latest signed image release:
  `sam31-qualification-image-supply-chain-release-b9a8308b58618bcd69e44c86` /
  `e20534016952670b43898532f9e94247951fc0cbdd7e6e5450c6acf10232392f`;
- frozen candidate issue time: `2026-08-09T04:06:50Z`.

against the deployed Cloud Run job. The canonical job is generation `1`, has
zero active executions, uses the expected private service identity and an
immutable publisher image, and exposes no public principal. Its deployed
environment still selects:

- qualification ID `sam31-source-checkpoint-qualification-20260808-v1`; and
- image release
  `sam31-qualification-image-supply-chain-release-6ec1ae34ad33802bce797dd3`.

The exact disposition is `requires_reviewed_source_bound_redeploy`; the sole
blocker is `desired_package_inputs_not_deployed`. No package publication or
cloud mutation occurred.

Canonical observation SHA-256:
`6bb84825b40635a736503df2cb8d8996c90021ea9caa4ae7ec1f0c142b964ff0`.

## Next external boundary

When external Cloud Build/Run mutation is explicitly authorized, use only the
existing canonical sequence:

1. build the current source-bound package-publisher image;
2. deploy the fixed Cloud Run job with the exact candidate inputs above;
3. rerun the read-only configuration audit;
4. require `configuration_matches_pending_source_build_provenance` and retain
   the reviewed build/deployment provenance separately;
5. run the metadata-only publisher once and exact-reread its package; and
6. rerun the SAM launch-input preflight.

The later A100 execution remains a separate explicit-spend decision. This
audit does not authorize it.
