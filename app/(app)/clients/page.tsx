import { redirect } from 'next/navigation'
import ClientManager from '@/components/clients/ClientManager'
import { createServerSupabase } from '@/lib/supabaseAuth'

export default async function ClientsPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ClientManager userId={user.id} />
}
