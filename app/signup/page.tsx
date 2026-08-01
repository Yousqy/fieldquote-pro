'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HardHat, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const inputClasses =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export default function SignupPage() {
  const router = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            business_name: businessName.trim() || null,
            phone: phone.trim() || null,
          },
        },
      })

      if (error) throw error

      if (data.session) {
        router.replace('/quotes')
        router.refresh()
      } else {
        setConfirmationSent(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="bg-blue-600 px-6 pb-16 pt-12 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <HardHat className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold leading-tight">Create your account</h1>
        <p className="mt-2 text-blue-100">Start quoting and collecting signatures in minutes.</p>
      </header>

      <main className="-mt-8 flex-1 px-6 pb-12">
        {confirmationSent ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Check your email</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We sent a confirmation link to <span className="font-semibold">{email}</span>.
              Confirm your email, then sign in to get started.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20"
          >
            <label htmlFor="business-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Business Name
            </label>
            <input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="ABC Electric, LLC"
              className={`${inputClasses} mt-2`}
            />

            <label htmlFor="phone" className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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

            <label htmlFor="email" className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={`${inputClasses} mt-2`}
            />

            <label htmlFor="password" className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={`${inputClasses} mt-2`}
            />

            {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email.trim() || password.length < 8}
              className="mt-6 flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <UserPlus className="h-5 w-5" />
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
              Free 3-day trial. No credit card required.
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
