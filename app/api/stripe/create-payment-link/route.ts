import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabase } from '@/lib/supabaseAuth'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CreatePaymentLinkBody {
  documentId: string
  amount: number
  clientName: string
  businessName: string
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  return new Stripe(secretKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Partial<CreatePaymentLinkBody>
    try {
      body = (await request.json()) as Partial<CreatePaymentLinkBody>
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { documentId, amount, clientName, businessName } = body

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }
    if (!clientName || typeof clientName !== 'string') {
      return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
    }
    if (!businessName || typeof businessName !== 'string') {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 })
    }

    const { data: doc, error: docError } = await supabaseServer
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${businessName} - Quote Payment`,
              description: `Payment for ${clientName} (${documentId})`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
      metadata: { documentId, clientName, userId: user.id },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a payment link' },
        { status: 500 }
      )
    }

    const { error } = await supabaseServer
      .from('documents')
      .update({ stripe_payment_link: session.url })
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: `Failed to save payment link: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
