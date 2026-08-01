'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, CreditCard, LogOut, Save } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/types/database'

const TRIAL_DAYS = 3
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000

const inputClasses =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export default function SettingsPanel({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (error) throw new Error(error.message)
        if (data) {
          setProfile(data)
          setBusinessName(data.business_name ?? '')
          setPhone(data.phone ?? '')
          setTaxRate(String(data.default_tax_rate ?? 0))
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessName.trim() || null,
          phone: phone.trim() || null,
          default_tax_rate: Number(taxRate) || 0,
        })
        .eq('id', userId)
      if (error) throw new Error(error.message)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700" />
      </div>
    )
  }

  const trialEndAt = profile?.created_at ? new Date(profile.created_at).getTime() + TRIAL_MS : 0
  const trialActive = profile?.created_at != null && Date.now() < trialEndAt
  const subscriptionActive = profile?.subscription_status === 'active'

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Settings</h1>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {subscriptionActive
                ? 'Subscription Active'
                : trialActive
                  ? `Trial Active (${TRIAL_DAYS}-day)`
                  : 'Subscription Required'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {profile?.subscription_status ?? 'no subscription'}
            </p>
          </div>
        </div>
        {profile?.stripe_customer_id && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Stripe customer: {profile.stripe_customer_id}
          </p>
        )}
      </section>

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label htmlFor="business-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Business Name
          </label>
          <input
            id="business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your Business Name"
            className={`${inputClasses} mt-2`}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Phone (for SMS links)
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={`${inputClasses} mt-2`}
          />
        </div>

        <div>
          <label htmlFor="tax-rate" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Default Tax Rate (%)
          </label>
          <input
            id="tax-rate"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className={`${inputClasses} mt-2`}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
          </p>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <CalendarClock className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      <button
        onClick={handleSignOut}
        className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition-transform active:scale-[0.98] dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}
