// created: 2026-11-24T14:10:00-08:00 — shrink chat photos before upload so they don't hit 4MB

const MAX_EDGE = 1600
const TARGET_BYTES = 3.2 * 1024 * 1024

/** created: 2026-11-24T14:10:00-08:00 — resize/compress stills for chat + posts */
export async function prepareChatImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= TARGET_BYTES && file.type !== 'image/png') return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  let quality = 0.88
  let blob: Blob | null = null
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) break
    if (blob.size <= TARGET_BYTES) break
    quality -= 0.12
  }
  if (!blob) return file
  const name = file.name.replace(/\.\w+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}
