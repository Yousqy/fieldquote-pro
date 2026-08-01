import { notFound } from 'next/navigation'
import { HardHat } from 'lucide-react'
import { supabaseServer } from '@/lib/supabaseServer'

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
  pending_signature: { label: 'Awaiting Approval', className: 'bg-amber-100 text-amber-700' },
  signed: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-700' },
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const formatQty = (quantity: number) =>
  Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2)

const formatDate = (value?: string | null) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function ViewQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: doc, error } = await supabaseServer
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) notFound()

  const [clientRes, itemsRes, profileRes] = await Promise.all([
    supabaseServer.from('clients').select('*').eq('id', doc.client_id).single(),
    supabaseServer
      .from('document_items')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: true }),
    supabaseServer.from('profiles').select('*').eq('id', doc.user_id).single(),
  ])

  const client = clientRes.data
  const items = itemsRes.data ?? []
  const profile = profileRes.data

  const badge = statusBadge[doc.status] ?? statusBadge.draft
  const businessName = profile?.business_name ?? 'FieldQuote Pro'

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-blue-600 px-6 pb-14 pt-10 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
          <HardHat className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold leading-tight">{businessName}</h1>
        <p className="mt-1 text-sm text-blue-100">
          {doc.doc_number} · {doc.doc_type === 'invoice' ? 'Invoice' : 'Quote'}
        </p>
      </header>

      <main className="mx-auto -mt-6 max-w-md px-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Prepared for</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{client?.client_name}</p>
              <p className="text-xs text-slate-400">Issued {formatDate(doc.created_at)}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Details</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {items.length === 0 && <li className="py-3 text-sm text-slate-500">No line items.</li>}
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatQty(item.quantity)} × {formatMoney(item.unit_price)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatMoney(item.subtotal)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatMoney(doc.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Tax</span>
              <span className="font-semibold text-slate-900">{formatMoney(doc.tax_amount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span className="text-xl font-extrabold text-blue-600">
                {formatMoney(doc.total_amount)}
              </span>
            </div>
          </div>
        </section>

        {doc.stripe_payment_link && (
          <a
            href={doc.stripe_payment_link}
            className="mt-4 flex select-none items-center justify-center rounded-2xl bg-green-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-600/25 transition-transform active:scale-[0.98]"
          >
            Pay Now
          </a>
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
          This {doc.doc_type} is valid for 30 days. Work will begin upon customer acceptance.
          Questions? Contact {businessName}.
        </p>
      </main>
    </div>
  )
}
