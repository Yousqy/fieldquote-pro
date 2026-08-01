import { redirect } from 'next/navigation'
import CatalogManager from '@/components/catalog/CatalogManager'
import { createServerSupabase } from '@/lib/supabaseAuth'

export default async function CatalogPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <CatalogManager userId={user.id} />
}
