#!/usr/bin/env bash
set -euo pipefail

# Deploys, but never executes, the private scale-from-zero terms/access
# finalizer. It verifies one immutable human-intent object and one pinned
# Secret Manager version without reading or printing the credential value.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-terms-finalization'
readonly SERVICE_ACCOUNT_ID='weeditpro-sam31-terms-sa'
readonly SERVICE_ACCOUNT="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly BUILD_ID='98c7df64-1b6c-490c-8d39-f1d836e1a8c7'
readonly SOURCE_COMMIT='dd5b9de4dde063328f1d0d3ca1713959f8444aa3'
readonly SOURCE_TREE='c421e8115ac2e03d12bfe19bf76601784d59feed'
readonly IMAGE_TAG="sam31-terms-${SOURCE_COMMIT:0:16}"
readonly IMAGE_DIGEST='sha256:4945f14a5b4735557eb8e4a9b70bf81b7fb0c0cc364bc664bd5659184a0c19f3'
readonly IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-workers/weeditpro-sam31-authorized-terms-finalization@${IMAGE_DIGEST}"
readonly IMAGE_TAGGED="${REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-workers/weeditpro-sam31-authorized-terms-finalization:${IMAGE_TAG}"
readonly IMAGE_BUILDER='projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com'
readonly CLOUD_BUILDER_DIGEST='sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147'
readonly INTENT_PREFIX='private/sam3_1/terms-intent/v1'
readonly CREDENTIAL_AUTHORITY_ID='weeditpro-sam31-hf-secret-version-authority-v1'
readonly CONFIRMATION='deploy-weeditpro-sam31-authorized-terms-finalization-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_AUTHORIZED_TERMS_FINALIZATION_JOB_DEPLOY:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact job-deployment confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'

intent_id="${WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_ID:-}"
intent_hash="${WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_SHA256:-}"
intent_generation="${WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_GENERATION:-}"
intent_etag="${WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_ETAG:-}"
intent_length="${WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_BYTE_LENGTH:-}"
secret_resource="${WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME:-}"

[[ "${intent_id}" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,219}$ \
  && "${intent_id}" != *'..'* \
  && "${intent_hash}" =~ ^[a-f0-9]{64}$ ]] \
  || fail 'canonical human terms-intent reference is invalid'
[[ "${intent_generation}" =~ ^[1-9][0-9]{0,30}$ ]] \
  || fail 'human terms-intent generation is invalid'
[[ -n "${intent_etag}" ]] || fail 'human terms-intent ETag is missing'
[[ "${intent_length}" =~ ^[1-9][0-9]{0,6}$ \
  && "${intent_length}" -le 524288 ]] \
  || fail 'human terms-intent byte length is invalid'
[[ "${secret_resource}" =~ ^projects/${PROJECT_ID}/secrets/(HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)/versions/[1-9][0-9]*$ ]] \
  || fail 'pinned checkpoint credential version is invalid'

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
    and .results.images[0].name == $image
    and .results.images[0].digest == $digest
    and (.sourceProvenance.fileHashes | to_entries | length) == 1
    and any(
      .sourceProvenance.fileHashes[]?.fileHash[]?;
      .type == "SHA256" and (.value | length) > 20
    )
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
    and (
      .discovery_summary.discovery[0].discovery.lastScanTime
      | type == "string" and length > 10
    )
    and ([
      (.package_vulnerability_summary.vulnerabilities // {})
      | to_entries[]?.value[]?
    ] | length) == 0
  ' <<<"${image_observation}" >/dev/null \
  || fail 'immutable image scan or SLSA evidence is not release-clean'

intent_object="${INTENT_PREFIX}/${intent_id}-${intent_hash:0:24}.json"
intent_metadata="$(gcloud storage objects describe \
  "gs://${CONTROL_BUCKET}/${intent_object}#${intent_generation}" \
  --project="${PROJECT_ID}" --format=json)"
[[ "$(jq -r '.generation' <<<"${intent_metadata}")" \
    == "${intent_generation}" \
  && "$(jq -r '.etag' <<<"${intent_metadata}")" == "${intent_etag}" \
  && "$(jq -r '.size' <<<"${intent_metadata}")" == "${intent_length}" \
  && "$(jq -r '.content_type' <<<"${intent_metadata}")" \
    == 'application/json' ]] \
  || fail 'human terms-intent object metadata changed'
intent_json="$(gcloud storage cat \
  "gs://${CONTROL_BUCKET}/${intent_object}#${intent_generation}" \
  --project="${PROJECT_ID}")"
jq -e --arg id "${intent_id}" --arg hash "${intent_hash}" '
  .schemaVersion == "canonical-sam3_1-authorized-human-terms-intent-v1"
  and .source
    == "canonical_weeditpro_authorized_human_terms_acceptance_owner"
  and .evidenceClass == "authenticated_authorized_human_action"
  and .intentId == $id and .intentVersion == 1 and .intentHash == $hash
  and .sourceRepository == "https://github.com/facebookresearch/sam3.git"
  and .checkpointRepository == "facebook/sam3.1"
  and .licenseIdentity == "SAM License"
  and .licenseLastUpdated == "2025-11-19"
  and .acceptanceSurface == "official_hugging_face_gated_repository"
  and .repositoryGating == "manual"
  and .contactInformationSharingAcceptedByAuthorizedHuman == true
  and .approvedUseCase
    == "private_commercial_video_editing_segmentation_and_tracking"
  and .militaryWarfareNuclearEspionageOrWeaponsUseAllowed == false
  and .boundary.directBrowserLoginAutomated == false
  and .boundary.termsAcceptedByAutomation == false
  and .boundary.callerTokenPathUrlOrCredentialAccepted == false
  and .boundary.thirdPartyMirrorAccepted == false
  and .boundary.browserOrWorkerSecretIncluded == false
  and .authority.authenticatedHumanAcceptanceEvidenceOnly == true
  and .authority.officialRepositoryAccessVerified == false
  and .authority.termsAcceptanceFinalized == false
  and .authority.modelOrCheckpointDownloaded == false
  and .authority.imageBuildAuthorized == false
  and .authority.gpuRuntimeAuthorized == false
  and .authority.customerCreditsMutated == false
  and .authority.qaApproved == false
  and .authority.publicDeliveryAuthorized == false
  and .authority.productionReady == false
  ' <<<"${intent_json}" >/dev/null \
  || fail 'canonical human terms intent is not admissible'

secret_name="${secret_resource#projects/${PROJECT_ID}/secrets/}"
secret_name="${secret_name%%/versions/*}"
secret_version="${secret_resource##*/versions/}"
secret_observation="$(gcloud secrets versions describe "${secret_version}" \
  --secret="${secret_name}" --project="${PROJECT_ID}" --format=json)"
jq -e --arg secret "${secret_name}" --arg version "${secret_version}" '
  (.name | endswith("/secrets/" + $secret + "/versions/" + $version))
  and .state == "ENABLED"
  and (.createTime | type == "string" and length > 10)
  and (.etag | type == "string" and length > 0)
  ' <<<"${secret_observation}" >/dev/null \
  || fail 'pinned checkpoint credential version is not enabled'
credential_authority_payload="$(jq -cS '
  {name, state, createTime, etag}
  ' <<<"${secret_observation}")"
credential_authority_hash="$(printf '%s' "${credential_authority_payload}" \
  | shasum -a 256 | awk '{print $1}')"
[[ "${credential_authority_hash}" =~ ^[a-f0-9]{64}$ ]] \
  || fail 'credential version authority digest is invalid'

if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_ID}" \
    --project="${PROJECT_ID}" \
    --display-name='WeEditPro SAM 3.1 terms finalization' \
    --description='Private gated-access verification only; no checkpoint download or inference'
fi
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/logging.logWriter --condition=None --quiet >/dev/null
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  gcloud storage buckets add-iam-policy-binding "gs://${CONTROL_BUCKET}" \
    --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="${role}" \
    --condition="expression=resource.name.startsWith('projects/_/buckets/${CONTROL_BUCKET}/objects/private/sam3_1/'),title=weeditpro_sam31_terms_prefix,description=SAM_3_1_terms_records_only" \
    --quiet >/dev/null
done
gcloud secrets add-iam-policy-binding "${secret_name}" \
  --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/secretmanager.secretAccessor --condition=None --quiet >/dev/null

gcloud run jobs deploy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --image="${IMAGE}" --service-account="${SERVICE_ACCOUNT}" \
  --cpu=1 --memory=1Gi --tasks=1 --parallelism=1 \
  --max-retries=0 --task-timeout=15m --execution-environment=gen2 \
  --labels='app=weeditpro,operation=sam31-terms-finalization,release=prequalification,scale=zero' \
  --set-env-vars="WEEDITPRO_SAM31_AUTHORIZED_TERMS_FINALIZATION_CONFIRM=finalize-authorized-sam31-terms-once,WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_ID=${intent_id},WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_SHA256=${intent_hash},WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME=${secret_resource},WEEDITPRO_SAM31_HF_SECRET_VERSION_AUTHORITY_ID=${CREDENTIAL_AUTHORITY_ID},WEEDITPRO_SAM31_HF_SECRET_VERSION_AUTHORITY_SHA256=${credential_authority_hash}" \
  --quiet

job_observation="$(gcloud run jobs describe "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
jq -e \
  --arg image "${IMAGE}" \
  --arg service_account "${SERVICE_ACCOUNT}" \
  --arg intent_id "${intent_id}" \
  --arg intent_hash "${intent_hash}" \
  --arg secret_resource "${secret_resource}" \
  --arg credential_authority_id "${CREDENTIAL_AUTHORITY_ID}" \
  --arg credential_authority_hash "${credential_authority_hash}" '
  .metadata.labels.app == "weeditpro"
  and .metadata.labels.operation == "sam31-terms-finalization"
  and .metadata.labels.release == "prequalification"
  and .metadata.labels.scale == "zero"
  and .spec.template.spec.parallelism == 1
  and .spec.template.spec.taskCount == 1
  and .spec.template.spec.template.spec.maxRetries == 0
  and .spec.template.spec.template.spec.timeoutSeconds == "900"
  and .spec.template.spec.template.spec.serviceAccountName == $service_account
  and (.spec.template.spec.template.spec.containers | length) == 1
  and .spec.template.spec.template.spec.containers[0].image == $image
  and .spec.template.spec.template.spec.containers[0].resources.limits.cpu == "1"
  and .spec.template.spec.template.spec.containers[0].resources.limits.memory
    == "1Gi"
  and (
    [.spec.template.spec.template.spec.containers[0].env[]
      | {key: .name, value: .value}]
    | from_entries
  ) == {
    WEEDITPRO_SAM31_AUTHORIZED_TERMS_FINALIZATION_CONFIRM:
      "finalize-authorized-sam31-terms-once",
    WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_ID: $intent_id,
    WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_SHA256: $intent_hash,
    WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME: $secret_resource,
    WEEDITPRO_SAM31_HF_SECRET_VERSION_AUTHORITY_ID:
      $credential_authority_id,
    WEEDITPRO_SAM31_HF_SECRET_VERSION_AUTHORITY_SHA256:
      $credential_authority_hash
  }
  and (.spec.template.spec.template.spec.nodeSelector // {}) == {}
  and (.spec.template.metadata.annotations["run.googleapis.com/network-interfaces"]
    // "") == ""
  and (.spec.template.metadata.annotations["run.googleapis.com/vpc-access-egress"]
    // "") == ""
  ' <<<"${job_observation}" >/dev/null \
  || fail 'deployed terms-finalization job changed'

policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  fail 'terms-finalization job has a public IAM principal'
fi

printf '{"operation":"weeditpro_sam31_authorized_terms_finalization_job_deploy_v1",'
printf '"job":"projects/%s/locations/%s/jobs/%s",' \
  "${PROJECT_ID}" "${REGION}" "${JOB}"
printf '"immutableImage":"%s","minimumInstances":0,' "${IMAGE}"
printf '"credentialVersionAuthorityRef":{"id":"%s","version":1,' \
  "${CREDENTIAL_AUTHORITY_ID}"
printf '"contentHash":"sha256:%s"},' "${credential_authority_hash}"
printf '"jobExecuted":false,"checkpointBytesDownloaded":false,'
printf '"modelInstalledOnDeveloperMachine":false,"gpuStarted":false,'
printf '"customerCreditsMutated":false,"productionAuthorityGranted":false}\n'
