import { redirect } from 'next/navigation'
import QuoteBuilder from '@/components/builder/QuoteBuilder'
import { createServerSupabase } from '@/lib/supabaseAuth'

export default async function NewQuotePage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <QuoteBuilder userId={user.id} />
}
