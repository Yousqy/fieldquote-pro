'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Package, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { fetchCatalog } from '@/lib/dbService'
import type { CatalogItem } from '@/types/database'

const inputClasses =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function CatalogManager({ userId }: { userId: string }) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [unitType, setUnitType] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      setItems(await fetchCatalog(userId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load catalog.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [userId])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError('Enter a valid unit price.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const { data, error } = await supabase
        .from('catalog_items')
        .insert({
          user_id: userId,
          title: title.trim(),
          default_unit_price: parsedPrice,
          unit_type: unitType.trim() || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      setItems((prev) => [...prev, data])
      setTitle('')
      setPrice('')
      setUnitType('')
      setShowForm(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to add catalog item.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: CatalogItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete catalog item.')
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Catalog</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex select-none items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
        Saved items appear as one-tap buttons in the quote builder.
      </p>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item name (e.g. Receptacle 20A) *"
            className={inputClasses}
          />
          <div className="flex gap-3">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Unit price"
              className={inputClasses}
            />
            <input
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              placeholder="Unit (each, ft…)"
              className={inputClasses}
            />
          </div>
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Adding…' : 'Add Item'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Package className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">No catalog items</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add your most-quoted services for fast quoting.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {formatMoney(item.default_unit_price)}
                  {item.unit_type ? ` / ${item.unit_type}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item)}
                aria-label={`Delete ${item.title}`}
                className="select-none rounded-lg p-2 text-slate-400 transition-transform active:scale-95 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
