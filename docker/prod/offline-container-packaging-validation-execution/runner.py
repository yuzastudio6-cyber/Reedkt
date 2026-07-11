import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile

MAXIMUM_REQUEST_BYTES = 64 * 1024
MAXIMUM_ARTIFACT_BYTES = 1024 * 1024
PROTOCOL = 'offline-container-packaging-validation-execution-v1'
CONTAINER_PROTOCOL = 'offline-container-packaging-validation-execution-container-v1'
OPERATIONS = {
    'mkvtoolnix_container_validation': 'tool.mkvtoolnix_container_validation.validate_mkv_container.v1',
    'gpac_mp4box_packaging_validation': 'tool.gpac_mp4box_packaging_validation.validate_mp4_package.v1',
}
PACKAGE_IDENTITIES = {
    'mkvtoolnix_container_validation': {'packageName': 'mkvtoolnix', 'version': '74.0.0-1'},
    'gpac_mp4box_packaging_validation': {'packageName': 'gpac', 'version': '26.02.0'},
}
FIXED_ENV = {'HOME': '/tmp', 'LANG': 'C', 'LC_ALL': 'C', 'PATH': '/usr/bin:/bin'}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    tool_id = request['toolId']
    if request['schemaVersion'] != PROTOCOL or tool_id not in OPERATIONS or request['operationId'] != OPERATIONS[tool_id]:
        raise ValueError('request identity is unsupported')
    payload = exact(request['payload'], ['validationProfileId', 'expectedContainer', 'requireAudioVideoSync', 'requireCaptionIntegrity'], 'payload')
    expected = 'mkv' if tool_id == 'mkvtoolnix_container_validation' else 'mp4'
    if payload != {'validationProfileId': 'approved_private_packaging_validation_v1', 'expectedContainer': expected, 'requireAudioVideoSync': True, 'requireCaptionIntegrity': True}:
        raise ValueError('packaging validation policy is unsupported')
    return {'schemaVersion': PROTOCOL, 'toolId': tool_id, 'operationId': OPERATIONS[tool_id], 'payload': payload}


def run_fixed(arguments, timeout=60):
    result = subprocess.run(arguments, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=FIXED_ENV, timeout=timeout, check=False)
    if result.returncode != 0:
        raise ValueError('fixed packaging validation command failed')
    return result.stdout, result.stderr


def execute_mkvtoolnix():
    with tempfile.TemporaryDirectory(dir='/tmp') as directory:
        output_path = os.path.join(directory, 'approved-package.mkv')
        run_fixed(['/usr/bin/mkvmerge', '--output', output_path, '/app/approved-source.mp4', '/app/approved-caption.srt'])
        stdout, _ = run_fixed(['/usr/bin/mkvmerge', '--identification-format', 'json', '--identify', output_path])
        identity = json.loads(stdout.decode('utf-8'))
    track_types = sorted(track.get('type') for track in identity.get('tracks', []) if isinstance(track, dict))
    if identity.get('container', {}).get('recognized') is not True or track_types != ['audio', 'subtitles', 'video']:
        raise ValueError('mkvtoolnix package validation failed')
    document = {'container': 'mkv', 'recognized': True, 'trackTypes': track_types, 'trackCount': 3, 'audioVideoSyncRequired': True, 'captionIntegrityRequired': True, 'packagingAndIdentificationExecuted': True}
    return json_artifact(document), {'entrypoint': 'mkvmerge --output + --identify', 'packageWritten': True, 'containerRecognized': True, 'videoTrackVerified': True, 'audioTrackVerified': True, 'captionTrackVerified': True, 'trackCount': 3}


def execute_gpac():
    with tempfile.TemporaryDirectory(dir='/tmp') as directory:
        output_path = os.path.join(directory, 'approved-package.mp4')
        run_fixed(['/opt/reeditpro-gpac/bin/MP4Box', '-add', '/app/approved-source.mp4', '-add', '/app/approved-caption.srt:lang=en', '-new', output_path])
        stdout, stderr = run_fixed(['/opt/reeditpro-gpac/bin/MP4Box', '-info', output_path])
        info = (stdout + stderr).decode('utf-8', errors='strict')
    lowered = info.lower()
    if 'media type: vide:' not in lowered or 'media type: soun:' not in lowered or not any(value in lowered for value in ['media type: text:', 'media type: subt:']):
        raise ValueError('gpac package validation failed')
    document = {'container': 'mp4', 'recognized': True, 'trackTypes': ['audio', 'text', 'video'], 'trackCount': 3, 'audioVideoSyncRequired': True, 'captionIntegrityRequired': True, 'packagingAndIdentificationExecuted': True}
    return json_artifact(document), {'entrypoint': 'MP4Box -add + -info', 'packageWritten': True, 'containerRecognized': True, 'videoTrackVerified': True, 'audioTrackVerified': True, 'captionTrackVerified': True, 'trackCount': 3}


def json_artifact(document):
    data = json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    if not 2 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    return {'mimeType': 'application/json', 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


try:
    stage = 'REQUEST_VALIDATION_FAILED'; raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES: raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    stage = 'PACKAGING_VALIDATION_EXECUTION_FAILED'
    artifact, semantic = execute_mkvtoolnix() if request['toolId'] == 'mkvtoolnix_container_validation' else execute_gpac()
    response = {'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': request['toolId'], 'operationId': request['operationId'], 'status': 'actual_container_packaging_validation_operation_completed', 'packageIdentity': PACKAGE_IDENTITIES[request['toolId']], 'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(), 'artifact': artifact, 'semanticEvidence': {'actualPackageEntrypointExecuted': True, **semantic, 'approvedServerOwnedFixtureOnly': True, 'zeroNetworkRuntimeRequired': True}, 'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False}}
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private container packaging validation execution failed.\n'); sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':'))); sys.exit(3)
