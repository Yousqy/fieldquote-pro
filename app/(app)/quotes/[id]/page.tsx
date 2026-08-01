import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabaseAuth'
import QuoteActions from '@/components/quotes/QuoteActions'

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  pending_signature: { label: 'Needs Signature', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
  signed: { label: 'Signed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400' },
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

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc || doc.user_id !== user.id) notFound()

  const [clientRes, itemsRes, profileRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', doc.client_id).single(),
    supabase
      .from('document_items')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const client = clientRes.data
  const items = itemsRes.data ?? []
  const profile = profileRes.data

  const badge = statusBadge[doc.status] ?? statusBadge.draft

  return (
    <div className="space-y-4 p-4">
      <Link
        href="/quotes"
        className="inline-flex select-none items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All Quotes
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{doc.doc_number}</p>
            <h1 className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {doc.doc_type === 'invoice' ? 'Invoice' : 'Quote'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {client?.client_name ?? 'Client removed'}
              {client?.client_phone ? ` · ${client.client_phone}` : ''}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Created {formatDate(doc.created_at)}
              {doc.paid_at ? ` · Paid ${formatDate(doc.paid_at)}` : ''}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Line Items</h2>
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {items.length === 0 && (
            <li className="py-3 text-sm text-slate-500 dark:text-slate-400">No line items.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.description}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatQty(item.quantity)} × {formatMoney(item.unit_price)}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(item.subtotal)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(doc.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Tax</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(doc.tax_amount)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Total Due</span>
            <span className="text-xl font-extrabold text-blue-600">
              {formatMoney(doc.total_amount)}
            </span>
          </div>
        </div>
      </section>

      {doc.signature_png_url && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Customer Signature</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.signature_png_url}
            alt="Customer signature"
            className="mt-3 h-20 rounded-xl border border-slate-100 bg-slate-50 object-contain dark:border-slate-700 dark:bg-slate-800"
          />
        </section>
      )}

      <QuoteActions document={doc} client={client ?? undefined} businessName={profile?.business_name ?? 'Your Business'} />
    </div>
  )
}
