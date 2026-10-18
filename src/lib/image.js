// Client-side photo shrinking for listing uploads (user's spec, 2026-10-17).
// Photos are resized + re-encoded as JPEG in the browser BEFORE upload so
// each stored photo is at most ~300 KB (10 photos per post ≈ max ~3 MB).
// This massively stretches the free storage tier and speeds up page loads.

export const MAX_PHOTO_BYTES = 300 * 1024
const MAX_DIMENSION = 1600

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

// Returns a File ready for upload: a compressed JPEG when possible,
// otherwise the original file (e.g. undecodable formats like HEIC on
// some desktop browsers — same behaviour as before this helper existed).
export async function compressImage(file, maxBytes = MAX_PHOTO_BYTES) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file
  if (file.type === 'image/gif') return file
  let loaded
  try {
    loaded = await loadImage(file)
  } catch {
    return file
  }
  const { img, url } = loaded
  try {
    let width = img.naturalWidth || MAX_DIMENSION
    let height = img.naturalHeight || MAX_DIMENSION
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))

    const qualities = [0.82, 0.74, 0.66, 0.58, 0.5, 0.44]
    let blob = null
    for (let attempt = 0; attempt < qualities.length; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      blob = await canvasToBlob(canvas, qualities[attempt])
      if (!blob || blob.size <= maxBytes) break
      // Still too big: shrink dimensions as well as quality on later passes.
      if (attempt >= 2) {
        width = Math.max(320, Math.round(width * 0.8))
        height = Math.max(320, Math.round(height * 0.8))
      }
    }
    if (!blob) return file
    // If the original was already small enough and compression didn't help,
    // keep the original untouched.
    if (file.size <= maxBytes && blob.size >= file.size) return file
    const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}
