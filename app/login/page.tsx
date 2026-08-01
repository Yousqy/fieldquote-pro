'use client'

import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HardHat, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const inputClasses =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/quotes'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      router.replace(next)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign in.')
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
        <h1 className="mt-6 text-3xl font-extrabold leading-tight">FieldQuote Pro</h1>
        <p className="mt-2 text-blue-100">Quotes. Signed. Paid. Right from the job site.</p>
      </header>

      <main className="-mt-8 flex-1 px-6 pb-12">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your contractor account.</p>

          <label htmlFor="email" className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`${inputClasses} mt-2`}
          />

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-6 flex h-12 w-full select-none items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <LogIn className="h-5 w-5" />
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          New to FieldQuote Pro?{' '}
          <Link href="/signup" className="font-semibold text-blue-600">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  )
}
