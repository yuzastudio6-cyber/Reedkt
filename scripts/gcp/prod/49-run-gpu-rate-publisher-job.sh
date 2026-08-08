#!/usr/bin/env bash
set -euo pipefail

# Executes one all-route account-effective GPU price publication with
# execution-only overrides. The deployed job remains unarmed before and after.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-gpu-rate-publisher'
readonly CONFIRMATION='run-weeditpro-gpu-rate-publisher-once-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_GPU_RATE_PUBLISHER_RUN:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact publisher execution confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
linked_account="$(gcloud billing projects describe "${PROJECT_ID}" \
  --format='value(billingAccountName)')"
[[ "${linked_account}" =~ ^billingAccounts/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$ ]] \
  || fail 'project-linked billing account is unavailable'

job_before="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e '
  (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_GPU_RATE_OPERATOR_ACTION",value:"disabled"}
  and .spec.template.spec.template.spec.maxRetries == 0
' <<<"${job_before}" >/dev/null || fail 'deployed publisher is not unarmed'
active_before="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_before}" == '0' ]] || fail 'a prior publisher execution is active'

overrides="WEEDITPRO_GPU_RATE_OPERATOR_ACTION=publish_all_routes"
overrides+=",WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME=${linked_account}"
execution="$(gcloud run jobs execute "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --tasks=1 --update-env-vars="${overrides}" \
  --wait --format=json --quiet)"
execution_name="$(jq -r '.metadata.name // empty' <<<"${execution}")"
[[ "${execution_name}" == projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB}/executions/* \
  || "${execution_name}" == "${JOB}-"* ]] || fail 'execution identity is invalid'
jq -e '
  (.status.failedCount // 0) == 0
  and (.status.cancelledCount // 0) == 0
  and (.status.runningCount // 0) == 0
  and (.status.succeededCount // 0) == 1
' <<<"${execution}" >/dev/null || fail 'publisher execution did not succeed'
short_execution="${execution_name##*/}"

receipt=''
for _attempt in {1..12}; do
  logs="$(gcloud logging read \
    "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"${JOB}\" AND labels.\"run.googleapis.com/execution_name\"=\"${short_execution}\"" \
    --project="${PROJECT_ID}" --limit=100 --order=asc --format=json)"
  receipt="$(jq -c '[.[]?.jsonPayload
    | select(.schemaVersion
      == "canonical-current-google-cloud-gpu-rate-authority-publication-receipt-v1")][0] // empty' \
    <<<"${logs}")"
  [[ -n "${receipt}" ]] && break
  sleep 5
done
[[ -n "${receipt}" ]] || fail 'canonical publication receipt is absent'
jq -e '
  [.routePublications[].routeId]
    == ["a100_80gb_heavy_primary", "l4_heavy_fallback", "l4_standard_primary"]
  and (.routePublications | length) == 3
  and .allCanonicalRoutesObservedBeforeAnyPersistence == true
  and .exactBillingAccountSkuRegionCurrencyTierAndPricePreserved == true
  and .createOnlyExactRereadCompletedForEveryRoute == true
  and .billingAccountIdentifierReturned == false
  and .callerPriceRouteDurationOrServiceFeeAccepted == false
  and .providerOrGpuJobStarted == false
  and .customerPricingOrServiceFeeAuthorityGranted == false
  and .walletOrCreditMutationAuthorityGranted == false
  and .productionAuthorityGranted == false
' <<<"${receipt}" >/dev/null || fail 'canonical publication authority changed'

job_after="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e '
  (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_GPU_RATE_OPERATOR_ACTION",value:"disabled"}
' <<<"${job_after}" >/dev/null || fail 'execution overrides persisted on the job'
active_after="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_after}" == '0' ]] || fail 'publisher did not scale back to zero'

printf '{"operation":"weeditpro_gpu_rate_publisher_run_v1",'
printf '"execution":"%s","canonicalReceipt":%s,' \
  "${short_execution}" "${receipt}"
printf '"operatorRemainsUnarmed":true,"runningOperatorTaskCount":0,'
printf '"canonicalGpuRouteCount":3,"billingAccountIdentifierReturned":false,'
printf '"customerCreditsMutated":false,"publicDeliveryAuthorized":false,'
printf '"productionAuthorityGranted":false}\n'
