'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarClock, Lock, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/types/database'

const TRIAL_DAYS = 3
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000
const WEEKLY_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? ''
const SUBSCRIPTION_CHECKOUT_URL = '/api/stripe/create-subscription-checkout'

export default function SubscriptionGuard({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw new Error(error.message)
        if (data) setProfile(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load subscription.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const trialEndAt = profile?.created_at
    ? new Date(profile.created_at).getTime() + TRIAL_MS
    : 0
  const trialValid = profile?.created_at != null && Date.now() < trialEndAt
  const isSubscribed = profile?.subscription_status === 'active'
  const unlocked = isSubscribed || trialValid

  const handleSubscribe = async () => {
    if (!WEEKLY_PRICE) {
      setError('Subscription pricing is not configured.')
      return
    }

    setStarting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const response = await fetch(SUBSCRIPTION_CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: WEEKLY_PRICE,
          email: user?.email,
          userId: user?.id,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Failed to start subscription.')
      window.location.assign(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start subscription.')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <CalendarClock className="h-8 w-8" />
      </span>

      <h1 className="mt-6 text-2xl font-extrabold leading-tight text-slate-900">
        Your 3-Day Free Trial Has Ended
      </h1>

      <p className="mt-3 text-base leading-relaxed text-slate-600">
        Subscribe for <span className="font-semibold text-slate-900">$14.99/week</span> to continue
        sending unlimited quotes &amp; getting paid on-site.
      </p>

      <ul className="mt-6 w-full max-w-xs space-y-2 text-left text-sm text-slate-600">
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          Unlimited quotes &amp; estimates
        </li>
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          E-signature capture on-site
        </li>
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          SMS payment links &amp; instant deposits
        </li>
      </ul>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubscribe}
        disabled={starting}
        className="mt-8 flex w-full max-w-xs select-none items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <Lock className="h-5 w-5" />
        {starting ? 'Starting subscription…' : 'Start $14.99/wk Subscription'}
      </button>

      <p className="mt-3 text-xs text-slate-400">Cancel anytime. No lock-in.</p>
    </div>
  )
}
