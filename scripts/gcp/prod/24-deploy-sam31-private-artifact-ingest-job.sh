#!/usr/bin/env bash
set -euo pipefail

# Deploys but never executes the network-isolated, scale-from-zero SAM 3.1
# reviewed-ingest job. Exact publication, terms, and review records must exist.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-private-artifact-ingest'
readonly SERVICE_ACCOUNT_ID='weeditpro-sam31-private-ingest-sa'
readonly SERVICE_ACCOUNT="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly MODEL_BUCKET='reeditpro-production-reeditpro-model-artifacts'
readonly NETWORK='weeditpro-gpu-private'
readonly SUBNET='weeditpro-gpu-private-us-central1'
readonly BUILD_ID='031bf059-0d4e-4957-8d38-5f01e6b76d22'
readonly SOURCE_COMMIT='1a1c59682d26307929e6b1aa3d9cf70649548d34'
readonly SOURCE_TREE='78bf6b723b9a8757f02f258fef8c1cc69ba91a9c'
readonly IMAGE_TAG="sam31-private-ingest-${SOURCE_COMMIT:0:16}"
readonly IMAGE_DIGEST='sha256:41305e2751bb418506313068c10658b6f3755d795b43c4b540cd76be87be4436'
readonly IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-workers/weeditpro-sam31-private-artifact-ingest@${IMAGE_DIGEST}"
readonly IMAGE_TAGGED="${REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-workers/weeditpro-sam31-private-artifact-ingest:${IMAGE_TAG}"
readonly IMAGE_BUILDER='projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com'
readonly CLOUD_BUILDER_DIGEST='sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147'
readonly CONFIRMATION='deploy-weeditpro-sam31-private-artifact-ingest-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_PRIVATE_ARTIFACT_INGEST_JOB_DEPLOY:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact job-deployment confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'

publication_id="${WEEDITPRO_SAM31_PUBLICATION_ID:-}"
publication_hash="${WEEDITPRO_SAM31_PUBLICATION_SHA256:-}"
review_id="${WEEDITPRO_SAM31_REVIEW_BUNDLE_ID:-}"
review_hash="${WEEDITPRO_SAM31_REVIEW_BUNDLE_SHA256:-}"
[[ "${publication_id}" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
  && "${publication_id}" != *'..'* \
  && "${publication_hash}" =~ ^[a-f0-9]{64}$ \
  && "${review_id}" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
  && "${review_id}" != *'..'* \
  && "${review_hash}" =~ ^[a-f0-9]{64}$ ]] \
  || fail 'canonical publication/review references are invalid'

build_observation="$(gcloud builds describe "${BUILD_ID}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
jq -e \
  --arg image "${IMAGE_TAGGED}" \
  --arg digest "${IMAGE_DIGEST}" \
  --arg source_commit "${SOURCE_COMMIT}" \
  --arg source_tree "${SOURCE_TREE}" \
  --arg builder "${IMAGE_BUILDER}" \
  --arg cloud_builder "${CLOUD_BUILDER_DIGEST}" '
    .status == "SUCCESS"
    and .serviceAccount == $builder
    and .substitutions._IMAGE == $image
    and .substitutions._SOURCE_COMMIT_SHA == $source_commit
    and .substitutions._SOURCE_TREE_HASH == $source_tree
    and .options.requestedVerifyOption == "VERIFIED"
    and .options.sourceProvenanceHash == ["SHA256"]
    and .results.buildStepImages == [$cloud_builder]
    and (.results.images | length) == 1
    and .results.images[0].digest == $digest
  ' <<<"${build_observation}" >/dev/null \
  || fail 'source-bound Cloud Build provenance changed'

image_observation="$(gcloud artifacts docker images describe "${IMAGE}" \
  --project="${PROJECT_ID}" --show-package-vulnerability --format=json)"
jq -e --arg digest "${IMAGE_DIGEST}" '
    .image_summary.digest == $digest
    and .image_summary.slsa_build_level == 3
    and .discovery_summary.discovery[0].discovery.analysisStatus
      == "FINISHED_SUCCESS"
    and (
      .discovery_summary.discovery[0].discovery
        .analysisCompleted.analysisType
      | contains(["NPM", "OS", "SECRET"])
    )
    and ([(.package_vulnerability_summary.vulnerabilities // {})
      | to_entries[]?.value[]?] | length) == 0
  ' <<<"${image_observation}" >/dev/null \
  || fail 'immutable image scan or SLSA evidence is not release-clean'

network_json="$(gcloud compute networks describe "${NETWORK}" \
  --project="${PROJECT_ID}" --format=json)"
subnet_json="$(gcloud compute networks subnets describe "${SUBNET}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
router_json="$(gcloud compute routers list --project="${PROJECT_ID}" \
  --regions="${REGION}" --format=json)"
jq -e --arg network "${NETWORK}" '
  .name == $network and .autoCreateSubnetworks == false
' <<<"${network_json}" >/dev/null || fail 'private network changed'
jq -e --arg subnet "${SUBNET}" '
  .name == $subnet and .privateIpGoogleAccess == true
  and .purpose == "PRIVATE" and .stackType == "IPV4_ONLY"
' <<<"${subnet_json}" >/dev/null || fail 'private subnet changed'
jq -e 'length == 0' <<<"${router_json}" >/dev/null \
  || fail 'private network unexpectedly has Cloud NAT'

publication_object="private/sam3_1/official-artifact-publication/v1/${publication_id}-${publication_hash:0:24}.json"
review_object="private/sam3_1/artifact-review/v1/${review_id}-${review_hash:0:24}.json"
publication_json="$(gcloud storage cat \
  "gs://${CONTROL_BUCKET}/${publication_object}" --project="${PROJECT_ID}")"
review_json="$(gcloud storage cat \
  "gs://${CONTROL_BUCKET}/${review_object}" --project="${PROJECT_ID}")"
jq -e --arg id "${publication_id}" --arg hash "${publication_hash}" '
  .schemaVersion
    == "canonical-sam3_1-official-artifact-publication-receipt-v1"
  and .evidenceClass == "canonical_private_publication"
  and .status
    == "published_pending_security_license_and_compatibility_review"
  and .publicationAttemptId == $id
  and .publicationReceiptHash == $hash
  and .authority.securityScanPassed == false
  and .authority.licenseReviewApproved == false
  and .authority.imageBuildAuthorized == false
  and .authority.gpuRuntimeAuthorized == false
' <<<"${publication_json}" >/dev/null \
  || fail 'official publication receipt is not admissible'
jq -e \
  --arg id "${review_id}" --arg hash "${review_hash}" \
  --arg publication_id "${publication_id}" \
  --arg publication_hash "${publication_hash}" '
  .schemaVersion == "canonical-sam3_1-private-artifact-review-bundle-v1"
  and .evidenceClass == "authenticated_private_owner_reread"
  and .status == "approved_for_private_artifact_ingest"
  and .reviewBundleId == $id and .reviewBundleHash == $hash
  and .officialArtifactPublicationRef.id == $publication_id
  and .officialArtifactPublicationRef.contentHash
    == ("sha256:" + $publication_hash)
  and .reviewBoundary.callerReviewClaimsAccepted == false
  and .authority.imageBuildAuthorized == false
  and .authority.gpuRuntimeAuthorized == false
' <<<"${review_json}" >/dev/null \
  || fail 'authenticated artifact review is not admissible'

terms_id="$(jq -er '.termsAcceptanceRef.id' <<<"${publication_json}")"
terms_hash="$(jq -er '.termsAcceptanceRef.contentHash' \
  <<<"${publication_json}")"
terms_hash="${terms_hash#sha256:}"
[[ "${terms_id}" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
  && "${terms_id}" != *'..'* \
  && "${terms_hash}" =~ ^[a-f0-9]{64}$ ]] \
  || fail 'publication terms reference is invalid'
terms_object="private/sam3_1/terms-acceptance/v1/${terms_id}-${terms_hash:0:24}.json"
terms_json="$(gcloud storage cat \
  "gs://${CONTROL_BUCKET}/${terms_object}" --project="${PROJECT_ID}")"
jq -e --arg id "${terms_id}" --arg hash "${terms_hash}" '
  .schemaVersion == "canonical-sam3_1-authorized-terms-acceptance-v1"
  and .evidenceClass == "canonical_private_reread"
  and .acceptanceRecordId == $id and .acceptanceRecordHash == $hash
  and .acceptedByAuthorizedOrganizationRepresentative == true
  and .authorizedRepresentativeAuthorityRereadVerified == true
  and .officialRepositoryAccessGrantedAndReread == true
  and .automatedAcceptanceUsed == false
  and .thirdPartyMirrorUsed == false
  and .browserOrWorkerSecretIncluded == false
' <<<"${terms_json}" >/dev/null \
  || fail 'authenticated terms acceptance is not admissible'

if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_ID}" \
    --project="${PROJECT_ID}" \
    --display-name='WeEditPro SAM 3.1 private artifact ingest' \
    --description='Network-isolated exact artifact reread; no inference or media processing'
fi
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/logging.logWriter --condition=None --quiet >/dev/null
for bucket in "${MODEL_BUCKET}" "${CONTROL_BUCKET}"; do
  gcloud storage buckets add-iam-policy-binding "gs://${bucket}" \
    --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/storage.objectViewer --quiet >/dev/null
done
gcloud storage buckets add-iam-policy-binding "gs://${CONTROL_BUCKET}" \
  --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/storage.objectCreator --quiet >/dev/null

gcloud run jobs deploy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --image="${IMAGE}" --service-account="${SERVICE_ACCOUNT}" \
  --cpu=2 --memory=2Gi --tasks=1 --parallelism=1 \
  --max-retries=0 --task-timeout=4h --execution-environment=gen2 \
  --network="${NETWORK}" --subnet="${SUBNET}" --vpc-egress=all-traffic \
  --set-env-vars="WEEDITPRO_SAM31_PRIVATE_ARTIFACT_INGEST_CONFIRM=prepare-reviewed-sam31-private-artifact-ingest,WEEDITPRO_SAM31_PUBLICATION_ID=${publication_id},WEEDITPRO_SAM31_PUBLICATION_SHA256=${publication_hash},WEEDITPRO_SAM31_REVIEW_BUNDLE_ID=${review_id},WEEDITPRO_SAM31_REVIEW_BUNDLE_SHA256=${review_hash}" \
  --quiet

policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  fail 'private artifact ingest job has a public IAM principal'
fi

printf '{"operation":"weeditpro_sam31_private_artifact_ingest_job_deploy_v1",'
printf '"job":"projects/%s/locations/%s/jobs/%s",' \
  "${PROJECT_ID}" "${REGION}" "${JOB}"
printf '"immutableImage":"%s","privateNetwork":"%s",' \
  "${IMAGE}" "${NETWORK}"
printf '"minimumInstances":0,"jobExecuted":false,'
printf '"modelInstalled":false,"gpuStarted":false,'
printf '"customerCreditsMutated":false,"productionAuthorityGranted":false}\n'
