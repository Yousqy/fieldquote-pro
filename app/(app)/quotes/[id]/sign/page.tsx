import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabaseAuth'
import SignScreen from '@/components/quotes/SignScreen'

export default async function SignQuotePage({
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

  if (doc.status === 'signed' || doc.status === 'paid') {
    redirect(`/quotes/${id}`)
  }

  const { data: client } = await supabase.from('clients').select('*').eq('id', doc.client_id).single()

  return (
    <div className="space-y-4 p-4">
      <Link
        href={`/quotes/${id}`}
        className="inline-flex select-none items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quote
      </Link>
      <SignScreen document={doc} client={client ?? undefined} userId={user.id} />
    </div>
  )
}
