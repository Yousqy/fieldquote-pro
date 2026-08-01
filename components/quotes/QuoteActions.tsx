'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  CreditCard,
  Download,
  MessageCircle,
  PenLine,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { buildQuoteMessage, generateSmsLink, shareLink } from '@/lib/shareUtility'
import type { Client, Document } from '@/types/database'

interface QuoteActionsProps {
  document: Document
  client?: Client
  businessName: string
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fieldquotepro.app'

export default function QuoteActions({ document, client, businessName }: QuoteActionsProps) {
  const router = useRouter()
  const [creatingLink, setCreatingLink] = useState(false)
  const [stripeLink, setStripeLink] = useState<string | null>(document.stripe_payment_link)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [sharing, setSharing] = useState(false)

  const viewUrl = `${appUrl}/view/${document.id}`
  const needsSignature = document.status === 'draft' || document.status === 'pending_signature'

  const handleShare = async () => {
    setSharing(true)
    setError('')
    const result = await shareLink({
      title: `${document.doc_number} from ${businessName}`,
      text: buildQuoteMessage({
        clientName: client?.client_name ?? 'there',
        totalAmount: document.total_amount,
        quoteId: document.id,
        stripeLink,
        businessName,
      }),
      url: viewUrl,
    })
    if (result === 'copied') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else if (result === 'failed') {
      setError('Unable to share this quote.')
    }
    setSharing(false)
  }

  const handleCreatePaymentLink = async () => {
    setCreatingLink(true)
    setError('')
    try {
      const response = await fetch('/api/stripe/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          amount: document.total_amount,
          clientName: client?.client_name ?? 'Client',
          businessName,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Failed to create payment link.')
      setStripeLink(data.url)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create payment link.')
    } finally {
      setCreatingLink(false)
    }
  }

  const handleCopyPaymentLink = async () => {
    if (!stripeLink) return
    try {
      await navigator.clipboard.writeText(stripeLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Unable to copy the payment link.')
    }
  }

  return (
    <div className="space-y-2">
      <section className="space-y-2">
        <a
          href={`/api/quotes/${document.id}/pdf`}
          className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Download className="h-4 w-4" />
          PDF
        </a>

        {stripeLink ? (
          <div className="flex gap-2">
            <button
              onClick={handleCopyPaymentLink}
              className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-bold text-white transition-transform active:scale-[0.98]"
            >
              {copied ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy Payment Link'}
            </button>
            {client?.client_phone && (
              <button
                onClick={() => {
                  if (!client?.client_phone) return
                  const sms = generateSmsLink(
                    client.client_phone,
                    client.client_name,
                    document.total_amount,
                    document.id,
                    stripeLink,
                    businessName
                  )
                  window.location.href = sms
                }}
                className="flex h-12 select-none items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-bold text-white transition-transform active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Text
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleCreatePaymentLink}
            disabled={creatingLink}
            className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {creatingLink ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {creatingLink ? 'Creating…' : 'Create Payment Link'}
          </button>
        )}

        {error && <p className="px-1 text-sm text-red-600">{error}</p>}
      </section>

      <div className="h-40" />

      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-md px-4">
        <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-transform active:scale-[0.98] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {copiedLink ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {copiedLink ? 'Link Copied' : 'Share Quote'}
          </button>

          {needsSignature && (
            <Link
              href={`/quotes/${document.id}/sign`}
              className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
            >
              <PenLine className="h-5 w-5" />
              Get Signature
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
