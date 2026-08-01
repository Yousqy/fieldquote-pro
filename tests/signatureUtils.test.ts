import { describe, expect, it, vi } from 'vitest'
import {
  buildSignatureUploadPath,
  dataUrlToBlob,
  submitSignature,
} from '../lib/signatureUtils'

const sampleDataUrl = `data:image/png;base64,${Buffer.from('signature-bytes').toString('base64')}`

describe('dataUrlToBlob', () => {
  it('converts a base64 PNG data URL into a Blob', async () => {
    const blob = dataUrlToBlob(sampleDataUrl)
    expect(blob.type).toBe('image/png')
    expect(await blob.text()).toBe('signature-bytes')
  })

  it('rejects malformed data URLs', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow()
    expect(() => dataUrlToBlob('data:image/png;base64,%%%')).toThrow()
  })
})

describe('buildSignatureUploadPath', () => {
  it('scopes uploads under the user id with the document id', () => {
    const path = buildSignatureUploadPath('user-1', 'doc-42')
    expect(path).toMatch(/^user-1\/doc-42-\d+\.png$/)
  })
})

describe('submitSignature', () => {
  it('rejects an empty signature with a user-facing error', async () => {
    await expect(
      submitSignature(null, { upload: vi.fn(), onAccept: vi.fn() })
    ).rejects.toThrow('Please sign above before continuing.')
  })

  it('uploads the blob, forwards the URL, and returns it', async () => {
    const upload = vi.fn().mockResolvedValue('https://cdn.fieldquotepro.app/sig.png')
    const onAccept = vi.fn()

    const url = await submitSignature(sampleDataUrl, { upload, onAccept })

    expect(url).toBe('https://cdn.fieldquotepro.app/sig.png')
    expect(upload).toHaveBeenCalledWith(expect.any(Blob))
    expect(onAccept).toHaveBeenCalledWith('https://cdn.fieldquotepro.app/sig.png')
  })

  it('propagates upload failures so the UI can show them', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('upload failed'))
    await expect(
      submitSignature(sampleDataUrl, { upload, onAccept: vi.fn() })
    ).rejects.toThrow('upload failed')
  })
})
