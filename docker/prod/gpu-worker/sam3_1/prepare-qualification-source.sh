#!/usr/bin/env bash
set -Eeuo pipefail

trap 'status=$?; printf "ERROR: SAM 3.1 source preparation failed at line %s (exit %s)\n" "${LINENO}" "${status}" >&2; exit "${status}"' ERR

readonly ROOT="${PWD}"
readonly WORK='/tmp/weeditpro-sam31-source-preparation'
readonly OUTPUT="${ROOT}/private-source-prep"
readonly SOURCE_REVISION='96914d2425f90a64f45ca977c2b5165418099543'
readonly SOURCE_TREE='573deb167702e014829a5b830de8ae62abe891d5'
readonly PATCHED_TREE='f3a58b95a0e460d76e1cf38abff0382a7307f67d'
readonly SOURCE_SHA256='5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
readonly PATCHED_SOURCE_SHA256='b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb'
readonly PATCH_SHA256='daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca'
readonly SOURCE_BYTES='73605120'
readonly COMMIT_TIME='2026-07-30T17:21:37-07:00'
readonly SOURCE_ARCHIVE="${ROOT}/private-staging/sam3-source.tar"
readonly PATCH_FILE="${ROOT}/patches/0001-reeditpro-gpu-decode.patch"
readonly PATCHED_ARCHIVE="${OUTPUT}/sam3-${SOURCE_REVISION}-reeditpro-gpu-decode.tar"

for command_name in bash cut git sha256sum stat tar; do
  command -v "${command_name}" >/dev/null \
    || { printf 'ERROR: missing pinned source-preparation utility: %s\n' \
      "${command_name}" >&2; exit 127; }
done

rm -rf "${WORK}" "${OUTPUT}"
mkdir -p "${WORK}/repository" "${OUTPUT}"
printf '%s  %s\n' "${SOURCE_SHA256}" "${SOURCE_ARCHIVE}" \
  | sha256sum --check --strict
test "$(stat --format='%s' "${SOURCE_ARCHIVE}")" = "${SOURCE_BYTES}"
test "$(sha256sum "${PATCH_FILE}" | cut -d' ' -f1)" = "${PATCH_SHA256}"

tar --extract --file "${SOURCE_ARCHIVE}" --directory "${WORK}/repository" \
  --strip-components=1 --no-same-owner --no-same-permissions
(
  cd "${WORK}/repository"
  git init --quiet
  git config user.name 'WeEditPro source preparation owner'
  git config user.email 'build-owner@weeditpro.invalid'
  git add --all
  test "$(git write-tree)" = "${SOURCE_TREE}"
  git apply --index "${PATCH_FILE}"
  test "$(git write-tree)" = "${PATCHED_TREE}"
  git archive --format=tar --prefix=sam3/ --mtime="${COMMIT_TIME}" \
    "${PATCHED_TREE}" > "${PATCHED_ARCHIVE}"
)

printf '%s  %s\n' "${PATCHED_SOURCE_SHA256}" "${PATCHED_ARCHIVE}" \
  | sha256sum --check --strict
test "$(stat --format='%s' "${PATCHED_ARCHIVE}")" = "${SOURCE_BYTES}"
chmod 0444 "${PATCHED_ARCHIVE}"
chmod 0555 "${OUTPUT}"

