'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenLine } from 'lucide-react'
import SignaturePadModal from '@/components/signature/SignaturePadModal'
import { updateQuoteStatus } from '@/lib/dbService'
import type { Client, Document } from '@/types/database'

interface SignScreenProps {
  document: Document
  client?: Client
  userId: string
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function SignScreen({ document, client, userId }: SignScreenProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const handleAccepted = async (signatureUrl: string) => {
    setError('')
    try {
      await updateQuoteStatus(document.id, 'signed', signatureUrl)
      router.push(`/quotes/${document.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save the signature.')
      setOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{document.doc_number}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">Capture Signature</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Have your customer approve{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">{client?.client_name ?? 'Client removed'}</span>{' '}
          for{' '}
          <span className="font-bold text-blue-600">{formatMoney(document.total_amount)}</span>.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-6 flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.98]"
        >
          <PenLine className="h-5 w-5" />
          Open Signature Pad
        </button>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </section>

      <p className="px-2 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        The signature is uploaded securely and stamped onto the PDF. You can send the signed
        quote via SMS right after.
      </p>

      <SignaturePadModal
        open={open}
        documentId={document.id}
        userId={userId}
        clientName={client?.client_name ?? ''}
        totalAmount={document.total_amount}
        onClose={() => setOpen(false)}
        onAccept={handleAccepted}
      />
    </div>
  )
}
