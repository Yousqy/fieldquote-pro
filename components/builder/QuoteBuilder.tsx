'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PenLine, Plus, Save, Trash2, UserPlus, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { createQuoteWithItems, fetchCatalog, fetchClients } from '@/lib/dbService'
import {
  addCatalogItem,
  addCustomItem,
  createBlankItem,
  getValidItems,
  removeItem,
  updateItem,
  validateQuote,
} from '@/lib/quoteBuilderState'
import type { BuilderLineItem } from '@/lib/quoteBuilderState'
import { computeTotals, roundMoney } from '@/lib/money'
import type { CatalogItem, Client } from '@/types/database'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const generateDocNumber = () =>
  `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`

const parseNumber = (value: string, fallback: number) => {
  if (value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const inputClasses =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export default function QuoteBuilder({ userId }: { userId: string }) {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [items, setItems] = useState<BuilderLineItem[]>(() => [createBlankItem()])
  const [taxRate, setTaxRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [savingClient, setSavingClient] = useState(false)
  const [clientError, setClientError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [clientRows, catalogRows] = await Promise.all([
          fetchClients(userId),
          fetchCatalog(userId),
        ])
        setClients(clientRows)
        setCatalog(catalogRows)
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load quote data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const totals = useMemo(() => computeTotals(items, taxRate), [items, taxRate])

  const submitNewClient = async (e: FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) return

    setSavingClient(true)
    setClientError('')

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim() || null,
          client_email: clientEmail.trim() || null,
          address: clientAddress.trim() || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      setClients((prev) => [...prev, data])
      setSelectedClientId(data.id)
      setClientModalOpen(false)
      setClientName('')
      setClientPhone('')
      setClientEmail('')
      setClientAddress('')
    } catch (e) {
      setClientError(e instanceof Error ? e.message : 'Failed to add client.')
    } finally {
      setSavingClient(false)
    }
  }

  const persistQuote = async (status: 'draft' | 'pending_signature') => {
    const validationError = validateQuote(selectedClientId, items)
    if (validationError) {
      setError(validationError)
      return
    }

    const validItems = getValidItems(items)

    setSaving(true)
    setError('')

    try {
      const document = await createQuoteWithItems(
        {
          user_id: userId,
          client_id: selectedClientId,
          doc_number: generateDocNumber(),
          doc_type: 'quote',
          status,
          tax_rate: taxRate,
        },
        validItems.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }))
      )

      if (status === 'pending_signature') {
        router.push(`/quotes/${document.id}/sign`)
      } else {
        router.push(`/quotes/${document.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save quote.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">New Quote</h1>

      {loadError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">{loadError}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="client-select" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Client
        </label>
        <div className="mt-2 flex items-stretch gap-2">
          <select
            id="client-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={clients.length === 0}
            className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">
              {clients.length === 0 ? 'No clients yet' : 'Select a client…'}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.client_name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setClientModalOpen(true)}
            className="flex select-none items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Add Client
          </button>
        </div>
      </section>

      <section>
        <h2 className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Add</h2>
        {catalog.length === 0 ? (
          <p className="mt-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            No catalog items yet — add them from the Catalog tab.
          </p>
        ) : (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {catalog.map((item) => (
              <button
                key={item.id}
                onClick={() => setItems((prev) => addCatalogItem(prev, item))}
                className="flex select-none shrink-0 flex-col items-start gap-0.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 transition-transform active:scale-95 dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatMoney(item.default_unit_price)}
                  {item.unit_type ? ` / ${item.unit_type}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Line Items</h2>

        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <div className="flex items-start gap-2">
                <input
                  value={item.description}
                  onChange={(e) =>
                    setItems((prev) => updateItem(prev, item.id, { description: e.target.value }))
                  }
                  placeholder="Description (e.g. Receptacle 20A)"
                  className={inputClasses}
                />
                <button
                  onClick={() => setItems((prev) => removeItem(prev, item.id))}
                  aria-label="Remove item"
                  className="select-none rounded-lg p-3 text-slate-400 transition-transform active:scale-95 hover:bg-slate-200 hover:text-red-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2 flex items-end gap-2">
                <div className="w-20">
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Qty</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((prev) =>
                        updateItem(prev, item.id, {
                          quantity: parseNumber(e.target.value, 1),
                        })
                      )
                    }
                    className={inputClasses}
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Unit Price</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        updateItem(prev, item.id, {
                          unitPrice: parseNumber(e.target.value, 0),
                        })
                      )
                    }
                    className={inputClasses}
                  />
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatMoney(roundMoney(item.quantity * item.unitPrice))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setItems((prev) => addCustomItem(prev))}
          className="mt-3 flex w-full select-none items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-blue-600 transition-transform active:scale-[0.98] dark:border-slate-600 dark:text-blue-400"
        >
          <Plus className="h-4 w-4" />
          Custom Item
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Subtotal</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatMoney(totals.subtotal)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Tax Rate</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(parseNumber(e.target.value, 0))}
              className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-right text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">%</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Tax</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatMoney(totals.taxAmount)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
          <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Grand Total</span>
          <span className="text-2xl font-extrabold text-blue-600">
            {formatMoney(totals.totalAmount)}
          </span>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">{error}</p>}

      <div className="h-40" />

      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-md px-4">
        <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => persistQuote('draft')}
            disabled={saving}
            className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-transform active:scale-[0.98] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={() => persistQuote('pending_signature')}
            disabled={saving}
            className="flex h-12 select-none flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <PenLine className="h-4 w-4" />
            {saving ? 'Saving…' : 'Get Signature'}
          </button>
        </div>
      </div>

      {clientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setClientModalOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-2xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Client</h2>
              <button
                onClick={() => setClientModalOpen(false)}
                aria-label="Close"
                className="select-none rounded-full p-2 text-slate-500 transition-transform active:scale-95 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitNewClient} className="mt-4 space-y-3">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name *"
                className={inputClasses}
              />
              <input
                type="tel"
                inputMode="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Phone"
                className={inputClasses}
              />
              <input
                type="email"
                inputMode="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email"
                className={inputClasses}
              />
              <input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Address"
                className={inputClasses}
              />

              {clientError && <p className="text-sm text-red-600 dark:text-red-400">{clientError}</p>}

              <button
                type="submit"
                disabled={savingClient || !clientName.trim()}
                className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                {savingClient ? 'Adding…' : 'Add Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
