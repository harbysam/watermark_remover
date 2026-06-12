import cv2
import numpy as np
from pathlib import Path


def _decode_image(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError('Gecersiz gorsel dosyasi.')
    return image


def _decode_mask(data: bytes, shape: tuple[int, ...]) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    mask = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise ValueError('Gecersiz maske dosyasi.')

    if mask.shape[:2] != shape[:2]:
        mask = cv2.resize(mask, (shape[1], shape[0]), interpolation=cv2.INTER_NEAREST)

    return (mask > 127).astype(np.uint8) * 255


def _border_ring(mask: np.ndarray, outer_iter: int = 4) -> np.ndarray:
    kernel = np.ones((3, 3), np.uint8)
    outer = cv2.dilate(mask, kernel, iterations=outer_iter)
    return cv2.subtract(outer, mask)


def _rng_from_image(image: np.ndarray, mask: np.ndarray) -> np.random.Generator:
    ys, xs = np.where(mask > 0)
    if len(ys) == 0:
        seed = 0
    else:
        sample = image[ys[0], xs[0]].astype(np.uint32)
        seed = int(sample.sum()) ^ int(len(ys)) ^ int(image.shape[0]) ^ int(image.shape[1])
    return np.random.default_rng(seed % (2**32))


def _patch_fill_from_border(image: np.ndarray, mask: np.ndarray, ring: np.ndarray) -> np.ndarray:
    border_y, border_x = np.where(ring > 0)
    mask_y, mask_x = np.where(mask > 0)
    result = image.copy()

    if len(border_y) == 0 or len(mask_y) == 0:
        return result

    rng = _rng_from_image(image, mask)
    picks = rng.integers(0, len(border_y), size=len(mask_y))
    result[mask_y, mask_x] = image[border_y[picks], border_x[picks]]
    return result


def _match_border_noise(
    source: np.ndarray,
    filled: np.ndarray,
    mask: np.ndarray,
    ring: np.ndarray,
) -> np.ndarray:
    ring_pixels = source[ring > 0].astype(np.float64)
    if len(ring_pixels) == 0:
        return filled

    std = np.maximum(np.std(ring_pixels, axis=0), 0.5)
    result = filled.astype(np.float64)
    mask_idx = mask > 0
    ys, xs = np.where(mask_idx)
    rng = _rng_from_image(source, mask)
    noise = rng.normal(0, 1, size=(len(ys), 3)) * std
    result[mask_idx] = np.clip(result[mask_idx] + noise * 0.9, 0, 255)
    return result.astype(np.uint8)


def _texture_score(image: np.ndarray, ring: np.ndarray) -> float:
    ring_pixels = image[ring > 0].astype(np.float64)
    if len(ring_pixels) == 0:
        return 0.0
    return float(np.mean(np.std(ring_pixels, axis=0)))


def remove_watermark(image_bytes: bytes, mask_bytes: bytes) -> np.ndarray:
    original = _decode_image(image_bytes)
    mask = _decode_mask(mask_bytes, original.shape)

    if not np.any(mask):
        return original

    kernel = np.ones((3, 3), np.uint8)
    # Yari saydam watermark kenarlarini da kapsa
    mask = cv2.dilate(mask, kernel, iterations=4)

    ring = _border_ring(mask, outer_iter=5)
    texture = _texture_score(original, ring)

    inpaint_ns = cv2.inpaint(original, mask, inpaintRadius=8, flags=cv2.INPAINT_NS)
    inpaint_telea = cv2.inpaint(original, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    patch_fill = _patch_fill_from_border(original, mask, ring)

    if texture >= 6:
        # Grain/doku var: border'dan patch + hafif inpaint
        filled = cv2.addWeighted(patch_fill, 0.65, inpaint_ns, 0.35, 0)
    else:
        # Duz alan: inpaint agirlikli
        filled = cv2.addWeighted(inpaint_ns, 0.6, inpaint_telea, 0.4, 0)

    filled = _match_border_noise(original, filled, mask, ring)

    result = original.copy()
    result[mask > 0] = filled[mask > 0]
    return result


def encode_image(image: np.ndarray, filename: str) -> tuple[bytes, str, str]:
    ext = Path(filename).suffix.lower()
    stem = Path(filename).stem

    if ext in ('.jpg', '.jpeg'):
        ok, buffer = cv2.imencode(
            '.jpg',
            image,
            [cv2.IMWRITE_JPEG_QUALITY, 100],
        )
        mime = 'image/jpeg'
        output_name = f'{stem}{ext}'
    elif ext == '.webp':
        ok, buffer = cv2.imencode(
            '.webp',
            image,
            [cv2.IMWRITE_WEBP_QUALITY, 100],
        )
        mime = 'image/webp'
        output_name = f'{stem}.webp'
    else:
        ok, buffer = cv2.imencode(
            '.png',
            image,
            [cv2.IMWRITE_PNG_COMPRESSION, 1],
        )
        mime = 'image/png'
        output_name = f'{stem}.png'

    if not ok:
        raise ValueError('Gorsel kaydedilemedi.')

    return buffer.tobytes(), mime, output_name


def encode_png(image: np.ndarray) -> bytes:
    data, _, _ = encode_image(image, 'output.png')
    return data
