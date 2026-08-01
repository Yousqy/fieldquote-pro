import { supabase } from './supabaseClient'
import { computeTotals, roundMoney } from './money'
import type {
  CatalogItem,
  Client,
  Document,
  DocumentInsert,
  DocumentItemInsert,
} from '../types/database'

export async function fetchClients(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('client_name')

  if (error) throw new Error(error.message)

  return data ?? []
}

export async function fetchCatalog(userId: string): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('user_id', userId)
    .order('title')

  if (error) throw new Error(error.message)

  return data ?? []
}

export interface QuoteInsertData {
  user_id: string
  client_id: string
  doc_number: string
  doc_type: Document['doc_type']
  status?: Document['status']
  tax_rate?: number
  signature_png_url?: string | null
  stripe_payment_link?: string | null
}

export interface QuoteItemData {
  description: string
  quantity: number
  unit_price: number
}

export async function createQuoteWithItems(
  quoteData: QuoteInsertData,
  itemsArray: QuoteItemData[]
): Promise<Document> {
  const { subtotal, taxAmount, totalAmount } = computeTotals(
    itemsArray.map((item) => ({ quantity: item.quantity, unitPrice: item.unit_price })),
    quoteData.tax_rate ?? 0
  )

  const documentPayload: DocumentInsert = {
    user_id: quoteData.user_id,
    client_id: quoteData.client_id,
    doc_number: quoteData.doc_number,
    doc_type: quoteData.doc_type,
    status: quoteData.status ?? 'draft',
    subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    signature_png_url: quoteData.signature_png_url ?? null,
    stripe_payment_link: quoteData.stripe_payment_link ?? null,
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert(documentPayload)
    .select()
    .single()

  if (documentError) throw new Error(documentError.message)

  const itemRows: DocumentItemInsert[] = itemsArray.map((item) => ({
    document_id: document.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: roundMoney(item.quantity * item.unit_price),
  }))

  const { error: itemsError } = await supabase.from('document_items').insert(itemRows)

  if (itemsError) {
    await supabase.from('documents').delete().eq('id', document.id)
    throw new Error(itemsError.message)
  }

  return document
}

export async function updateQuoteStatus(
  quoteId: string,
  status: Document['status'],
  signatureUrl?: string
): Promise<Document> {
  const payload: { status: Document['status']; signature_png_url?: string | null } = {
    status,
  }

  if (signatureUrl !== undefined) {
    payload.signature_png_url = signatureUrl
  }

  const { data, error } = await supabase
    .from('documents')
    .update(payload)
    .eq('id', quoteId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}
