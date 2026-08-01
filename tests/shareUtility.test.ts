import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  generateSmsLink,
  isNativeShareSupported,
  shareLink,
  triggerNativeShare,
} from '../lib/shareUtility'

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const stubNavigator = (nav: Record<string, unknown>) => vi.stubGlobal('navigator', nav)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateSmsLink', () => {
  it('uses ?body= on Android', () => {
    stubNavigator({ userAgent: ANDROID_UA })
    const link = generateSmsLink('1234567890', 'Jane', 254.5, 'qt1', null, 'Acme Electric')
    expect(link).toMatch(/^sms:1234567890\?body=/)
  })

  it('uses &body= on iOS', () => {
    stubNavigator({ userAgent: IOS_UA })
    const link = generateSmsLink('1234567890', 'Jane', 254.5, 'qt1', null, 'Acme Electric')
    expect(link).toMatch(/^sms:1234567890&body=/)
  })

  it('formats the quote message and encodes it', () => {
    stubNavigator({ userAgent: ANDROID_UA })
    const link = generateSmsLink('1234567890', 'Jane', 254.5, 'qt1', null, 'Acme Electric')
    const body = decodeURIComponent(link.split('body=')[1])
    expect(body).toContain('Hi Jane')
    expect(body).toContain('$254.50')
    expect(body).toContain('from Acme Electric')
    expect(body).toContain('https://fieldquotepro.app/view/qt1')
    expect(body).not.toContain('Pay deposit')
  })

  it('appends the Stripe deposit link when provided', () => {
    stubNavigator({ userAgent: ANDROID_UA })
    const link = generateSmsLink(
      '1234567890',
      'Jane',
      254.5,
      'qt1',
      'https://pay.stripe.com/link/abc',
      'Acme Electric'
    )
    const body = decodeURIComponent(link.split('body=')[1])
    expect(body).toContain('Pay deposit: https://pay.stripe.com/link/abc')
  })

  it('sanitizes phone formatting', () => {
    stubNavigator({ userAgent: ANDROID_UA })
    const link = generateSmsLink('(555) 123-4567', 'Jane', 100, 'qt1', null, 'Acme')
    expect(link).toMatch(/^sms:5551234567\?body=/)
  })
})

describe('triggerNativeShare', () => {
  it('uses the system share sheet when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ userAgent: IOS_UA, share })

    const shared = await triggerNativeShare({
      clientName: 'Jane',
      totalAmount: 100,
      quoteId: 'qt1',
      businessName: 'Acme',
    })

    expect(shared).toBe(true)
    expect(share).toHaveBeenCalledOnce()
    const payload = share.mock.calls[0][0]
    expect(payload.url).toBe('https://fieldquotepro.app/view/qt1')
    expect(payload.text).toContain('Hi Jane')
  })

  it('falls back to clipboard and returns false when share is unsupported', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ userAgent: 'node', clipboard: { writeText } })

    expect(isNativeShareSupported()).toBe(false)

    const shared = await triggerNativeShare({
      clientName: 'Jane',
      totalAmount: 100,
      quoteId: 'qt1',
      businessName: 'Acme',
    })

    expect(shared).toBe(false)
    expect(writeText).toHaveBeenCalledOnce()
  })

  it('reports false when the user cancels the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    stubNavigator({ userAgent: IOS_UA, share })

    const shared = await triggerNativeShare({
      clientName: 'Jane',
      totalAmount: 100,
      quoteId: 'qt1',
      businessName: 'Acme',
    })

    expect(shared).toBe(false)
  })
})

describe('shareLink', () => {
  const VIEW_URL = 'https://fieldquotepro.app/view/qt1'

  it('opens the system share sheet when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ userAgent: IOS_UA, share })

    const result = await shareLink({ title: 'QT-1', text: 'Hi Jane', url: VIEW_URL })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
    expect(share.mock.calls[0][0]).toMatchObject({ title: 'QT-1', url: VIEW_URL })
  })

  it('copies the link when the share sheet is unsupported', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ userAgent: 'node', clipboard: { writeText } })

    const result = await shareLink({ title: 'QT-1', text: 'Hi Jane', url: VIEW_URL })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(VIEW_URL)
  })

  it('returns cancelled when the user dismisses the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    stubNavigator({ userAgent: IOS_UA, share })

    const result = await shareLink({ title: 'QT-1', text: 'Hi Jane', url: VIEW_URL })

    expect(result).toBe('cancelled')
  })

  it('falls back to copying the link when the share sheet throws', async () => {
    const share = vi.fn().mockRejectedValue(new Error('Not allowed'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ userAgent: IOS_UA, share, clipboard: { writeText } })

    const result = await shareLink({ title: 'QT-1', text: 'Hi Jane', url: VIEW_URL })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(VIEW_URL)
  })

  it('returns failed when neither share nor clipboard is available', async () => {
    stubNavigator({ userAgent: 'node' })

    const result = await shareLink({ title: 'QT-1', text: 'Hi Jane', url: VIEW_URL })

    expect(result).toBe('failed')
  })
})
