// Automatic photo check for profile avatars (owner's rule, 2026-10-18):
// avatars need NO admin approval, so an AI model screens each photo in
// the visitor's own browser BEFORE upload and blocks clear adult
// content (nsfwjs MobileNetV2, bundled locally — no photo ever leaves
// the device for this check and no external service is called).
//
// Blocking rule: Porn or Hentai score >= 0.45, or Sexy >= 0.80.
// Ordinary photos — portraits, houses, even normal beach shots — pass.
// The model + TensorFlow are lazy-loaded only when someone actually
// picks an avatar photo, so the main site bundle stays lean.

let modelPromise = null

function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [{ load }, { MobileNetV2Model }] = await Promise.all([
        import('nsfwjs/core'),
        import('nsfwjs/models/mobilenet_v2'),
      ])
      return load('MobileNetV2', { modelDefinitions: [MobileNetV2Model] })
    })()
  }
  return modelPromise
}

function loadImageEl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// Returns { ok: true } when the photo may be uploaded, or
// { ok: false } when the check blocks it. Throws when the checker
// itself could not run — the caller treats that as "not verified"
// and does not upload (fail closed, with a try-again message).
export async function checkImageFile(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImageEl(url)
    const model = await getModel()
    const predictions = await model.classify(img)
    const score = {}
    for (const p of predictions) score[p.className] = p.probability
    const blocked =
      (score.Porn ?? 0) >= 0.45 ||
      (score.Hentai ?? 0) >= 0.45 ||
      (score.Sexy ?? 0) >= 0.8
    return { ok: !blocked, score }
  } finally {
    URL.revokeObjectURL(url)
  }
}
