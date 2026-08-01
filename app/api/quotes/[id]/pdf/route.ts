import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseAuth'
import { renderQuotePdf } from '@/lib/pdf/renderQuotePdf'
import type { Client } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (doc.user_id !== user.id) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const [clientRes, itemsRes, profileRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', doc.client_id).single(),
    supabase
      .from('document_items')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const fallbackClient: Client = {
    id: doc.client_id ?? '',
    user_id: doc.user_id,
    client_name: 'Valued Customer',
    client_email: '',
    client_phone: '',
    address: '',
    created_at: null,
  }

  const client = clientRes.data ?? fallbackClient

  try {
    const pdf = await renderQuotePdf({
      document: doc,
      client,
      items: itemsRes.data ?? [],
      profile: profileRes.data ?? undefined,
      issueDate: doc.created_at ?? undefined,
    })

    const filename = encodeURIComponent(`${doc.doc_number}.pdf`)

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate PDF'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
