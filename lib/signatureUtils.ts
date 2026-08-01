export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Invalid data URL')
  const mime = match[1] || 'image/png'
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function buildSignatureUploadPath(userId: string, documentId: string): string {
  return `${userId}/${documentId}-${Date.now()}.png`
}

export interface SubmitSignatureDeps {
  upload: (blob: Blob) => Promise<string>
  onAccept: (url: string) => void | Promise<void>
}

export async function submitSignature(
  dataUrl: string | null,
  deps: SubmitSignatureDeps
): Promise<string> {
  if (!dataUrl) throw new Error('Please sign above before continuing.')
  const blob = dataUrlToBlob(dataUrl)
  const url = await deps.upload(blob)
  await deps.onAccept(url)
  return url
}
