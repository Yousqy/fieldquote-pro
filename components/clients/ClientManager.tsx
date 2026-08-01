'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Mail, Phone, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { fetchClients } from '@/lib/dbService'
import type { Client } from '@/types/database'

const inputClasses =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export default function ClientManager({ userId }: { userId: string }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      setClients(await fetchClients(userId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [userId])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setFormError('')
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          client_name: name.trim(),
          client_phone: phone.trim() || null,
          client_email: email.trim() || null,
          address: address.trim() || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      setClients((prev) => [...prev, data])
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setShowForm(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to add client.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Delete ${client.client_name}?`)) return
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      setClients((prev) => prev.filter((c) => c.id !== client.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete client.')
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Clients</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex select-none items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client name *"
            className={inputClasses}
          />
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className={inputClasses}
          />
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClasses}
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            className={inputClasses}
          />
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? 'Adding…' : 'Add Client'}
          </button>
        </form>
      )}

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Users className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">No clients yet</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add the customers you quote most.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{client.client_name}</p>
                <div className="mt-1 space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {client.client_phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {client.client_phone}
                    </p>
                  )}
                  {client.client_email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5" />
                      {client.client_email}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(client)}
                aria-label={`Delete ${client.client_name}`}
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
