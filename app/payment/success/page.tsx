import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Payment Received</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Thank you! Your payment has been processed successfully. The contractor will be
          notified shortly.
        </p>
      </div>
    </div>
  )
}
