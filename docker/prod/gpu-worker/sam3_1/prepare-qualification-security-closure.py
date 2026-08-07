"""Fetch the exact reviewed SAM 3.1 security-remediation closure.

This runs only in the source-bound Cloud Build capsule preparation step. It
rejects redirects, transformed responses, byte-length drift, and digest drift
before writing any package into the private build closure.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
import urllib.error
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Reject every redirect so credentials and provenance cannot drift."""

    def redirect_request(
        self,
        request: urllib.request.Request,
        file_pointer: object,
        code: int,
        message: str,
        headers: object,
        new_url: str,
    ) -> None:
        del new_url
        raise urllib.error.HTTPError(
            request.full_url,
            code,
            "redirect refused",
            headers,
            file_pointer,
        )


ENTRIES = (
    (
        "https://files.pythonhosted.org/packages/7f/3e/5db95bcf282c52709639744ca2a8b149baccf648e39c8cc87553df9eae0c/urllib3-2.7.0-py3-none-any.whl",
        "private-dependency-closure/dependency-closure/wheelhouse/urllib3-2.7.0-py3-none-any.whl",
        131_087,
        "9fb4c81ebbb1ce9531cce37674bbc6f1360472bc18ca9a553ede278ef7276897",
    ),
    (
        "https://security.ubuntu.com/ubuntu/pool/main/o/openssl/openssl_3.0.13-0ubuntu3.12_amd64.deb",
        "private-dependency-closure/dependency-closure/os-security-updates/openssl_3.0.13-0ubuntu3.12_amd64.deb",
        1_002_894,
        "321b30ad5a1c3783cb3d73ae439f824f6d3874d76a93a62f4a984959b490aa7b",
    ),
    (
        "https://security.ubuntu.com/ubuntu/pool/main/o/openssl/libssl3t64_3.0.13-0ubuntu3.12_amd64.deb",
        "private-dependency-closure/dependency-closure/os-security-updates/libssl3t64_3.0.13-0ubuntu3.12_amd64.deb",
        1_942_240,
        "6a963adb1106fca567d24d4a1e5da0bad25de79ac2564cd1ba846e677e1c951b",
    ),
    (
        "https://security.ubuntu.com/ubuntu/pool/main/o/openssl/libssl-dev_3.0.13-0ubuntu3.12_amd64.deb",
        "private-dependency-closure/dependency-closure/os-security-updates/libssl-dev_3.0.13-0ubuntu3.12_amd64.deb",
        2_407_824,
        "9a5cf7bc8e876ef4498ddf0180b6fafe0e52c2a8da2f06f8bc78c2a6fc92ec58",
    ),
)


def main() -> None:
    opener = urllib.request.build_opener(NoRedirect())
    for url, destination, expected_bytes, expected_sha256 in ENTRIES:
        destination_path = Path(destination)
        if destination_path.exists() or not destination_path.parent.is_dir():
            raise SystemExit("exact dependency destination changed")
        request = urllib.request.Request(
            url,
            headers={
                "Accept-Encoding": "identity",
                "User-Agent": "WeEditPro-SAM31-Qualification/1",
            },
            method="GET",
        )
        with opener.open(request, timeout=60) as response:
            if response.status != 200 or response.geturl() != url:
                raise SystemExit("exact dependency transport changed")
            if response.headers.get("Content-Encoding", "identity") != "identity":
                raise SystemExit("encoded dependency response refused")
            body = response.read(expected_bytes + 1)
        if len(body) != expected_bytes:
            raise SystemExit("exact dependency byte length changed")
        if hashlib.sha256(body).hexdigest() != expected_sha256:
            raise SystemExit("exact dependency SHA-256 changed")
        destination_path.write_bytes(body)


if __name__ == "__main__":
    main()
