import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'
import type { DocumentUpdate, ProfileUpdate, SubscriptionStatus } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const mapSubscriptionStatus = (status: Stripe.Subscription.Status): SubscriptionStatus => {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  return 'canceled'
}

const getCustomerId = (customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) => {
  if (typeof customer === 'string') return customer
  return customer?.id ?? null
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const documentId = session.metadata?.documentId

  if (documentId) {
    const update: DocumentUpdate = {
      status: 'paid',
      paid_at: new Date().toISOString(),
    }
    const { error } = await supabaseServer
      .from('documents')
      .update(update)
      .eq('id', documentId)

    if (error) {
      throw new Error(`Failed to mark document paid: ${error.message}`)
    }
  }

  const userId = session.metadata?.userId
  const customerId = getCustomerId(session.customer)

  if (userId && customerId) {
    const update: ProfileUpdate = { stripe_customer_id: customerId }
    const { error } = await supabaseServer
      .from('profiles')
      .update(update)
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to link Stripe customer: ${error.message}`)
    }
  }
}

async function updateProfileSubscription(
  customerId: string,
  status: SubscriptionStatus,
  subscriptionId: string
) {
  const update: ProfileUpdate = {
    subscription_status: status,
    stripe_subscription_id: subscriptionId,
  }
  const { error } = await supabaseServer
    .from('profiles')
    .update(update)
    .eq('stripe_customer_id', customerId)

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = getCustomerId(subscription.customer)
  if (!customerId) return

  await updateProfileSubscription(
    customerId,
    mapSubscriptionStatus(subscription.status),
    subscription.id
  )
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook configuration is incomplete' },
      { status: 400 }
    )
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature header' }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid signature'
    return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = getCustomerId(subscription.customer)
        if (customerId) {
          await updateProfileSubscription(customerId, 'canceled', subscription.id)
        }
        break
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
