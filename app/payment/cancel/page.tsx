import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <XCircle className="h-9 w-9" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Payment Canceled</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your payment was not completed. You can retry anytime using the payment link you
          received.
        </p>
      </div>
    </div>
  )
}
