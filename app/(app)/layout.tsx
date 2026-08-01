import { redirect } from 'next/navigation'
import MobileLayout from '@/components/layout/MobileLayout'
import SubscriptionGuard from '@/components/auth/SubscriptionGuard'
import { createServerSupabase } from '@/lib/supabaseAuth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <MobileLayout>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </MobileLayout>
  )
}
