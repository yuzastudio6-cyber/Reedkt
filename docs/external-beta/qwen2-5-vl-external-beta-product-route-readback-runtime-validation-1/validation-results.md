# QWEN2.5-VL Product Route Readback Runtime Validation Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_RUNTIME_VALIDATION_1`

Decision: `completed_qwen2_5_vl_product_route_readback_runtime_validation_fail_closed`

Execution: `completed_local_in_process_route_readback_runtime_validation_no_provider_or_remote_execution`

Validation status: `passed`

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run smoke:qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1`
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-readback-validation-confirmed-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`

Changed-file safety scan: `passed`

Staged safety scan: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`
