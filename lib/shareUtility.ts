const BUSINESS_URL = 'https://fieldquotepro.app'
const DEFAULT_BUSINESS_NAME = 'FieldQuote Pro'

export interface SmsQuoteOptions {
  phone: string
  clientName: string
  totalAmount: number
  quoteId: string
  stripeLink?: string | null
  businessName: string
}

export interface ShareQuoteData {
  clientName: string
  totalAmount: number
  quoteId: string
  businessName: string
  stripeLink?: string | null
  viewUrl?: string
  title?: string
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const sanitizePhone = (phone: string) => phone.replace(/[^\d+]/g, '')

const isIos = () =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)

export function buildQuoteMessage({
  clientName,
  totalAmount,
  quoteId,
  stripeLink,
  businessName,
}: Omit<SmsQuoteOptions, 'phone'>): string {
  const parts = [
    `Hi ${clientName}, here is your quote for ${formatMoney(totalAmount)} from ${businessName}.`,
    `Review & approve: ${BUSINESS_URL}/view/${quoteId}`,
  ]
  if (stripeLink) {
    parts.push(`Pay deposit: ${stripeLink}`)
  }
  return parts.join(' ')
}

export function generateSmsLink(
  phone: string,
  clientName: string,
  totalAmount: number,
  quoteId: string,
  stripeLink: string | null,
  businessName: string = DEFAULT_BUSINESS_NAME
): string {
  const cleanPhone = sanitizePhone(phone)
  const body = buildQuoteMessage({ clientName, totalAmount, quoteId, stripeLink, businessName })
  const separator = isIos() ? '&' : '?'
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(body)}`
}

export const isNativeShareSupported = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export type ShareLinkResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareLink({
  title,
  text,
  url,
}: {
  title: string
  text: string
  url: string
}): Promise<ShareLinkResult> {
  if (isNativeShareSupported()) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export async function triggerNativeShare(quoteData: ShareQuoteData): Promise<boolean> {
  const viewUrl = quoteData.viewUrl ?? `${BUSINESS_URL}/view/${quoteData.quoteId}`
  const text = buildQuoteMessage({
    clientName: quoteData.clientName,
    totalAmount: quoteData.totalAmount,
    quoteId: quoteData.quoteId,
    stripeLink: quoteData.stripeLink,
    businessName: quoteData.businessName,
  })

  if (!isNativeShareSupported()) {
    try {
      await navigator.clipboard?.writeText(text)
    } catch {
      return false
    }
    return false
  }

  try {
    await navigator.share({ title: quoteData.title ?? 'Quote', text, url: viewUrl })
    return true
  } catch {
    return false
  }
}
