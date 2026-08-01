#!/usr/bin/python3
"""Remove the out-of-scope inherited SAM-2 distribution at image build time.

This fixed, argument-free build helper validates the complete installed file
set and exact direct-VCS revision before deleting only the known SAM-2 package,
metadata, and training trees. The controlled ComfyUI operation does not use
this distribution; ReeditPro's temporal-mask SAM2 operation has a separate
runtime, checkpoint, and canonical operation boundary.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import shutil

EXPECTED_NAME = "SAM-2"
EXPECTED_VERSION = "1.0"
EXPECTED_LICENSE = "Apache 2.0"
EXPECTED_REVISION = "2b90b9f5ceec907a1c18123530e92e794ad901a4"
EXPECTED_FILE_COUNT = 114
EXPECTED_FILE_LIST_SHA256 = (
    "e0056305b664ab9f54cf1b4a7f5886a6bcacb389195fe8f1c07aee3547b8e468"
)
SITE_PACKAGES = Path("/usr/local/lib/python3.10/dist-packages")
ALLOWED_PREFIXES = (
    "sam2/",
    "sam_2-1.0.dist-info/",
    "training/",
)
REMOVAL_ROOTS = (
    SITE_PACKAGES / "sam2",
    SITE_PACKAGES / "sam_2-1.0.dist-info",
    SITE_PACKAGES / "training",
)


def main() -> None:
    if os.getuid() != 0 or os.getgid() != 0:
        raise RuntimeError("Inherited SAM-2 removal requires build-root.")

    distribution = importlib.metadata.distribution("sam-2")
    metadata = distribution.metadata
    installed_files = sorted(
        str(path).replace("\\", "/")
        for path in distribution.files or ()
    )
    installed_file_list_sha256 = hashlib.sha256(
        "\n".join(installed_files).encode()
    ).hexdigest()
    if (
        metadata.get("Name") != EXPECTED_NAME
        or distribution.version != EXPECTED_VERSION
        or metadata.get("License") != EXPECTED_LICENSE
        or len(installed_files) != EXPECTED_FILE_COUNT
        or installed_file_list_sha256 != EXPECTED_FILE_LIST_SHA256
        or any(
            not relative_path.startswith(ALLOWED_PREFIXES)
            for relative_path in installed_files
        )
    ):
        raise RuntimeError(
            "Inherited SAM-2 distribution identity or file set changed."
        )

    direct_url_path = (
        SITE_PACKAGES / "sam_2-1.0.dist-info/direct_url.json"
    )
    direct_url = json.loads(direct_url_path.read_text(encoding="utf-8"))
    vcs_info = direct_url.get("vcs_info")
    if (
        not isinstance(vcs_info, dict)
        or vcs_info.get("vcs") != "git"
        or vcs_info.get("commit_id") != EXPECTED_REVISION
    ):
        raise RuntimeError(
            "Inherited SAM-2 direct-VCS revision changed."
        )

    for root in REMOVAL_ROOTS:
        if not root.is_dir() or root.parent != SITE_PACKAGES:
            raise RuntimeError(
                "Inherited SAM-2 removal root changed."
            )
    for root in REMOVAL_ROOTS:
        shutil.rmtree(root)

    try:
        importlib.metadata.distribution("sam-2")
    except importlib.metadata.PackageNotFoundError:
        pass
    else:
        raise RuntimeError(
            "Inherited SAM-2 distribution remains after removal."
        )
    if importlib.util.find_spec("sam2") is not None:
        raise RuntimeError("Inherited sam2 module remains importable.")
    if importlib.util.find_spec("training") is not None:
        raise RuntimeError("Inherited SAM-2 training module remains importable.")

    print(
        json.dumps(
            {
                "contract": (
                    "living-frame-comfyui-inherited-sam2-removal-v1"
                ),
                "status": "passed",
                "distributionCode": "sam-2",
                "distributionVersion": EXPECTED_VERSION,
                "sourceRevision": EXPECTED_REVISION,
                "installedFileCount": EXPECTED_FILE_COUNT,
                "installedFileListSha256": EXPECTED_FILE_LIST_SHA256,
                "distributionPresentAfterRemoval": False,
                "sam2ModuleImportableAfterRemoval": False,
                "trainingModuleImportableAfterRemoval": False,
                "modelWeightsLoaded": False,
                "runtimeAuthority": False,
                "productionReady": False,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
    )


if __name__ == "__main__":
    main()
