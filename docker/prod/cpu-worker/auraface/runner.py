import base64
import hashlib
import importlib.metadata
import io
import json
import math
import os
import struct
import sys
import warnings
from datetime import datetime, timezone

MAXIMUM_REQUEST_BYTES = 24 * 1024 * 1024
MAXIMUM_IMAGE_BYTES = 8 * 1024 * 1024
MAXIMUM_DECODED_PIXELS = 40_000_000
PROTOCOL = 'living-frame-auraface-offline-runner-v1'
RESPONSE_PROTOCOL = 'living-frame-auraface-offline-runner-response-v1'
OPERATION = 'tool.transformers.measure_auraface_identity_continuity.v1'
PACKAGE_PROFILE = 'auraface_v1_cpu_continuity_measurement'
PREPROCESSING_SPEC_DIGEST = (
    '2660c1ec27667e691e9d1a84c0426fee'
    '95ccde4ddd35470e485ff5dcd4c6d614'
)
MODEL_ROOT = '/mnt/reeditpro/model-artifacts/auraface'
MODEL_REQUIREMENTS = {
    'embedding': {
        'path': f'{MODEL_ROOT}/glintr100.onnx',
        'size': 260_694_151,
        'sha256': (
            'a7933ea5330113b01c9b60351d8f4c33'
            '003f145d8470ac5f0e52ee2effe25c60'
        ),
    },
    'detector': {
        'path': f'{MODEL_ROOT}/scrfd_10g_bnkps.onnx',
        'size': 16_923_827,
        'sha256': (
            '5838f7fe053675b1c7a08b633df49e7a'
            'f5495cee0493c7dcf6697200b85b5b91'
        ),
    },
}
PACKAGE_IDENTITIES = {
    'insightface': '1.0.1',
    'numpy': '2.4.6',
    'onnx': '1.22.0',
    'onnxruntime': '1.28.0',
    'opencv-python-headless': '5.0.0.93',
    'scikit-image': '0.26.0',
}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def bounded_sha(value, label):
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in '0123456789abcdef' for character in value)
    ):
        raise ValueError(f'{label} is invalid')
    return value


def utc_now():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def canonical_bytes(value):
    return json.dumps(
        value,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=True,
    ).encode('utf-8')


def content_sha256(value):
    return hashlib.sha256(value).hexdigest()


def verify_packages():
    for package_name, expected_version in PACKAGE_IDENTITIES.items():
        actual_version = importlib.metadata.version(package_name)
        if actual_version != expected_version:
            raise ValueError('runtime package identity mismatch')


def verify_model(role):
    requirement = MODEL_REQUIREMENTS[role]
    path = requirement['path']
    stat = os.stat(path, follow_symlinks=False)
    if not os.path.isfile(path) or os.path.islink(path):
        raise ValueError('model artifact presentation is invalid')
    if stat.st_size != requirement['size']:
        raise ValueError('model artifact size is invalid')
    digest = hashlib.sha256()
    with open(path, 'rb') as model_file:
        while True:
            chunk = model_file.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    if digest.hexdigest() != requirement['sha256']:
        raise ValueError('model artifact digest is invalid')
    return path


def committed_image(value, label):
    packet = exact(
        value,
        [
            'contentType',
            'contentByteLength',
            'contentSha256',
            'contentBytesBase64',
        ],
        label,
    )
    content_type = packet['contentType']
    byte_length = packet['contentByteLength']
    if content_type not in ('image/png', 'image/jpeg'):
        raise ValueError(f'{label} content type is unsupported')
    if (
        not isinstance(byte_length, int)
        or isinstance(byte_length, bool)
        or not 64 <= byte_length <= MAXIMUM_IMAGE_BYTES
    ):
        raise ValueError(f'{label} byte length is invalid')
    bounded_sha(packet['contentSha256'], f'{label} digest')
    encoded = packet['contentBytesBase64']
    if not isinstance(encoded, str):
        raise ValueError(f'{label} bytes are invalid')
    raw = base64.b64decode(encoded.encode('ascii'), validate=True)
    if (
        len(raw) != byte_length
        or content_sha256(raw) != packet['contentSha256']
        or base64.b64encode(raw).decode('ascii') != encoded
    ):
        raise ValueError(f'{label} commitment does not match bytes')
    if content_type == 'image/png' and not raw.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError(f'{label} PNG signature is invalid')
    if content_type == 'image/jpeg' and not raw.startswith(b'\xff\xd8\xff'):
        raise ValueError(f'{label} JPEG signature is invalid')
    return raw


def validate_request(value):
    request = exact(
        value,
        ['schemaVersion', 'operationId', 'packageProfile', 'payload'],
        'request',
    )
    if (
        request['schemaVersion'] != PROTOCOL
        or request['operationId'] != OPERATION
        or request['packageProfile'] != PACKAGE_PROFILE
    ):
        raise ValueError('request identity is unsupported')
    payload = exact(
        request['payload'],
        [
            'artifactRequirementSetDigestSha256',
            'modelBindingPacketDigestSha256',
            'preprocessingSpecDigestSha256',
            'referenceImage',
            'candidateImage',
        ],
        'payload',
    )
    bounded_sha(
        payload['artifactRequirementSetDigestSha256'],
        'artifact requirements digest',
    )
    bounded_sha(
        payload['modelBindingPacketDigestSha256'],
        'model binding packet digest',
    )
    if payload['preprocessingSpecDigestSha256'] != PREPROCESSING_SPEC_DIGEST:
        raise ValueError('preprocessing specification is unsupported')
    return {
        'request': request,
        'reference': committed_image(payload['referenceImage'], 'reference'),
        'candidate': committed_image(payload['candidateImage'], 'candidate'),
    }


def decode_image(raw):
    import cv2
    import numpy as np
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = MAXIMUM_DECODED_PIXELS
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as header:
            width, height = header.size
            orientation = header.getexif().get(274, 1)
    if (
        width < 64
        or height < 64
        or width * height > MAXIMUM_DECODED_PIXELS
        or orientation != 1
    ):
        raise ValueError('image header is unsupported')

    encoded = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if (
        image is None
        or len(image.shape) != 3
        or image.shape[2] != 3
        or image.shape[0] < 64
        or image.shape[1] < 64
        or image.shape[0] * image.shape[1] > MAXIMUM_DECODED_PIXELS
    ):
        raise ValueError('decoded image dimensions are unsupported')
    return image


def create_session(path):
    import onnxruntime

    options = onnxruntime.SessionOptions()
    options.execution_mode = onnxruntime.ExecutionMode.ORT_SEQUENTIAL
    options.graph_optimization_level = (
        onnxruntime.GraphOptimizationLevel.ORT_ENABLE_ALL
    )
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    options.enable_mem_pattern = True
    return onnxruntime.InferenceSession(
        path,
        sess_options=options,
        providers=['CPUExecutionProvider'],
    )


def load_models(detector_path, embedding_path):
    from insightface.model_zoo.arcface_onnx import ArcFaceONNX
    from insightface.model_zoo.scrfd import SCRFD

    detector = SCRFD(
        model_file=detector_path,
        session=create_session(detector_path),
    )
    detector.prepare(
        ctx_id=-1,
        input_size=(640, 640),
        det_thresh=0.5,
        nms_thresh=0.4,
    )
    embedding = ArcFaceONNX(
        model_file=embedding_path,
        session=create_session(embedding_path),
    )
    embedding.prepare(ctx_id=-1)
    return detector, embedding


def detect_one(detector, image):
    boxes, keypoints = detector.detect(
        image,
        input_size=(640, 640),
        max_num=0,
    )
    count = int(boxes.shape[0])
    if count != 1 or keypoints is None or keypoints.shape != (1, 5, 2):
        return count, None
    return count, keypoints[0].astype('float32', copy=True)


def normalized_embedding(model, image, keypoints):
    from insightface.utils.face_align import norm_crop
    import numpy as np

    aligned = norm_crop(image, keypoints, image_size=112)
    raw = model.get_feat(aligned).reshape(-1).astype(np.float32, copy=False)
    if raw.shape != (512,) or not np.isfinite(raw).all():
        raise ValueError('embedding output is invalid')
    norm = float(np.linalg.norm(raw))
    if not math.isfinite(norm) or norm <= 0:
        raise ValueError('embedding norm is invalid')
    normalized = np.ascontiguousarray(raw / norm, dtype=np.float32)
    if normalized.dtype.byteorder == '>':
        normalized = normalized.byteswap().newbyteorder('<')
    return normalized


def face_outcome(reference_count, candidate_count):
    if reference_count == 1 and candidate_count == 1:
        return 'exactly_one_face_each'
    if reference_count == 0 and candidate_count == 1:
        return 'reference_no_face'
    if reference_count == 1 and candidate_count == 0:
        return 'candidate_no_face'
    if reference_count > 1 and candidate_count == 1:
        return 'reference_multiple_faces'
    if reference_count == 1 and candidate_count > 1:
        return 'candidate_multiple_faces'
    return 'reference_and_candidate_face_count_invalid'


def inference_output_digest(image_digest, face_count, embedding_digest):
    return content_sha256(canonical_bytes({
        'embeddingDigestSha256': embedding_digest,
        'faceCount': face_count,
        'imageDigestSha256': image_digest,
        'preprocessingSpecDigestSha256': PREPROCESSING_SPEC_DIGEST,
    }))


def pack_embedding(value):
    little_endian = struct.pack('<512f', *[float(item) for item in value])
    return {
        'float32LeBase64': base64.b64encode(little_endian).decode('ascii'),
        'digestSha256': content_sha256(little_endian),
    }


def package_identity():
    return {
        'insightfaceVersion': PACKAGE_IDENTITIES['insightface'],
        'onnxruntimeVersion': PACKAGE_IDENTITIES['onnxruntime'],
        'opencvHeadlessVersion': PACKAGE_IDENTITIES[
            'opencv-python-headless'
        ],
        'preprocessingSpecDigestSha256': PREPROCESSING_SPEC_DIGEST,
    }


def completed_response(
    request,
    started_at,
    reference_count,
    candidate_count,
    reference_embedding,
    candidate_embedding,
):
    reference_packet = pack_embedding(reference_embedding)
    candidate_packet = pack_embedding(candidate_embedding)
    payload = request['payload']
    return {
        'schemaVersion': RESPONSE_PROTOCOL,
        'ok': True,
        'operationId': OPERATION,
        'packageIdentity': package_identity(),
        'requestEnvelopeSha256': content_sha256(canonical_bytes(request)),
        'terminalState': 'completed',
        'failureCode': 'none',
        'faceOutcome': 'exactly_one_face_each',
        'attemptAccepted': True,
        'detectorInferenceExecuted': True,
        'embeddingInferenceExecuted': True,
        'startedAt': started_at,
        'finishedAt': utc_now(),
        'referenceInferenceOutputDigestSha256': inference_output_digest(
            payload['referenceImage']['contentSha256'],
            reference_count,
            reference_packet['digestSha256'],
        ),
        'candidateInferenceOutputDigestSha256': inference_output_digest(
            payload['candidateImage']['contentSha256'],
            candidate_count,
            candidate_packet['digestSha256'],
        ),
        'embedding': {
            'dimension': 512,
            'referenceFloat32LeBase64': reference_packet['float32LeBase64'],
            'candidateFloat32LeBase64': candidate_packet['float32LeBase64'],
            'referenceDigestSha256': reference_packet['digestSha256'],
            'candidateDigestSha256': candidate_packet['digestSha256'],
        },
        'externalNetworkPerformed': False,
        'runtimeDownloadPerformed': False,
        'thresholdApplied': False,
        'identityDecisionCreated': False,
        'productionReady': False,
    }


def review_response(request, started_at, outcome):
    return {
        'schemaVersion': RESPONSE_PROTOCOL,
        'ok': True,
        'operationId': OPERATION,
        'packageIdentity': package_identity(),
        'requestEnvelopeSha256': content_sha256(canonical_bytes(request)),
        'terminalState': 'user_review_required',
        'failureCode': 'face_review_required',
        'faceOutcome': outcome,
        'attemptAccepted': True,
        'detectorInferenceExecuted': True,
        'embeddingInferenceExecuted': False,
        'startedAt': started_at,
        'finishedAt': utc_now(),
        'externalNetworkPerformed': False,
        'runtimeDownloadPerformed': False,
        'thresholdApplied': False,
        'identityDecisionCreated': False,
        'productionReady': False,
    }


def execute(validated, started_at):
    verify_packages()
    detector_path = verify_model('detector')
    embedding_path = verify_model('embedding')
    reference_image = decode_image(validated['reference'])
    payload = validated['request']['payload']
    identical_inputs = (
        payload['referenceImage']['contentSha256']
        == payload['candidateImage']['contentSha256']
    )
    candidate_image = (
        reference_image
        if identical_inputs
        else decode_image(validated['candidate'])
    )
    detector, embedding_model = load_models(detector_path, embedding_path)
    reference_count, reference_keypoints = detect_one(
        detector,
        reference_image,
    )
    candidate_count, candidate_keypoints = (
        (reference_count, reference_keypoints)
        if identical_inputs
        else detect_one(detector, candidate_image)
    )
    outcome = face_outcome(reference_count, candidate_count)
    if outcome != 'exactly_one_face_each':
        return review_response(validated['request'], started_at, outcome)
    reference_embedding = normalized_embedding(
        embedding_model,
        reference_image,
        reference_keypoints,
    )
    candidate_embedding = (
        reference_embedding.copy()
        if identical_inputs
        else normalized_embedding(
            embedding_model,
            candidate_image,
            candidate_keypoints,
        )
    )
    return completed_response(
        validated['request'],
        started_at,
        reference_count,
        candidate_count,
        reference_embedding,
        candidate_embedding,
    )


def main():
    started_at = utc_now()
    stage = 'REQUEST_VALIDATION_FAILED'
    try:
        raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
        if len(raw) > MAXIMUM_REQUEST_BYTES:
            raise ValueError('request exceeds ceiling')
        request = json.loads(raw.decode('utf-8'))
        validated = validate_request(request)
        stage = 'MODEL_OR_INFERENCE_FAILED'
        response = execute(validated, started_at)
        sys.stdout.write(json.dumps(
            response,
            sort_keys=True,
            separators=(',', ':'),
            ensure_ascii=True,
        ))
        return 0
    except Exception:
        sys.stderr.write('Private AuraFace CPU execution failed.\n')
        sys.stdout.write(json.dumps(
            {
                'schemaVersion': RESPONSE_PROTOCOL,
                'ok': False,
                'code': stage,
                'productionReady': False,
            },
            separators=(',', ':'),
        ))
        return 3


if __name__ == '__main__':
    raise SystemExit(main())
