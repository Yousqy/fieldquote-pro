import { redirect } from 'next/navigation'
import SettingsPanel from '@/components/settings/SettingsPanel'
import { createServerSupabase } from '@/lib/supabaseAuth'

export default async function SettingsPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <SettingsPanel userId={user.id} email={user.email ?? ''} />
}
