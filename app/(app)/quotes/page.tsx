import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, FileText, Plus } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabaseAuth'
import type { Client, Document } from '@/types/database'

const statusBadge: Record<Document['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  pending_signature: { label: 'Needs Signature', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
  signed: { label: 'Signed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400' },
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const formatDate = (value?: string | null) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function QuotesPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const clientIds = [...new Set((docs ?? []).map((d) => d.client_id).filter(Boolean))]
  let clientMap = new Map<string, Client>()
  if (clientIds.length > 0) {
    const { data: clientRows } = await supabase.from('clients').select('*').in('id', clientIds)
    clientMap = new Map((clientRows ?? []).map((c) => [c.id, c]))
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Quotes</h1>
        <Link
          href="/quotes/new"
          className="flex select-none items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Quote
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">{error.message}</p>
      )}

      {(docs ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <FileText className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">No quotes yet</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create your first quote and capture a signature on-site.
          </p>
          <Link
            href="/quotes/new"
            className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Create a Quote
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {(docs ?? []).map((doc) => {
            const badge = statusBadge[doc.status]
            const client = doc.client_id ? clientMap.get(doc.client_id) : undefined

            return (
              <li key={doc.id}>
                <Link
                  href={`/quotes/${doc.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 transition-transform active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                          {doc.doc_number}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        {client?.client_name ?? 'Unknown client'} · {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(doc.total_amount)}
                      </p>
                      <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
