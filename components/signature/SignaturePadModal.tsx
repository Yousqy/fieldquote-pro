'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Eraser, PenLine, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { buildSignatureUploadPath, submitSignature } from '@/lib/signatureUtils'

interface SignaturePadModalProps {
  open: boolean
  documentId: string
  userId: string
  clientName: string
  totalAmount: number
  onClose: () => void
  onAccept: (signatureUrl: string) => void | Promise<void>
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function SignaturePadModal({
  open,
  documentId,
  userId,
  clientName,
  totalAmount,
  onClose,
  onAccept,
}: SignaturePadModalProps) {
  const sigCanvasRef = useRef<SignatureCanvas | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const clearCanvas = () => {
    sigCanvasRef.current?.clear()
    setError('')
  }

  const handleAccept = async () => {
    const canvas = sigCanvasRef.current
    if (!canvas || canvas.isEmpty()) {
      setError('Please sign above before continuing.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const dataUrl = canvas.getTrimmedCanvas().toDataURL('image/png')
      await submitSignature(dataUrl, {
        upload: async (blob) => {
          const path = buildSignatureUploadPath(userId, documentId)
          const { data, error } = await supabase.storage
            .from('signatures')
            .upload(path, blob, { contentType: 'image/png' })

          if (error) throw new Error(error.message)

          const { data: publicUrlData } = supabase.storage
            .from('signatures')
            .getPublicUrl(data.path)

          return publicUrlData.publicUrl
        },
        onAccept,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save signature.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-slate-900"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Customer Signature</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="select-none rounded-full p-2 text-slate-500 transition-transform active:scale-95 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{clientName || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Grand Total</p>
                <p className="text-lg font-extrabold text-blue-600">
                  {formatMoney(totalAmount)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Signature</p>
              <button
                onClick={clearCanvas}
                className="flex select-none items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-transform active:scale-95 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Eraser className="h-4 w-4" />
                Clear Canvas
              </button>
            </div>

            <div className="relative mt-2 h-56 w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-medium tracking-wide text-slate-300">
                  Sign Above
                </span>
              </div>
              <div className="absolute inset-0">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#1e293b"
                  backgroundColor="transparent"
                  minWidth={1.5}
                  maxWidth={3}
                  canvasProps={{
                    className: 'h-full w-full touch-none',
                    'aria-label': 'Signature pad',
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              Use your finger to sign above
            </p>

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-transform active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={saving}
                className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <PenLine className="h-5 w-5 animate-pulse" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {saving ? 'Uploading…' : 'Accept & Sign'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
