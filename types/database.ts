export type DocumentStatus = 'draft' | 'pending_signature' | 'signed' | 'paid'
export type DocumentType = 'quote' | 'invoice'

export type SubscriptionStatus = 'trialing' | 'active' | 'canceled'

export type Profile = {
  id: string
  business_name: string | null
  phone: string | null
  default_tax_rate: number | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  created_at: string | null
}

export type ProfileInsert = Omit<
  Profile,
  'id' | 'created_at' | 'subscription_status'
> & {
  created_at?: string | null
  subscription_status?: SubscriptionStatus | null
}
export type ProfileUpdate = Partial<ProfileInsert>

export type Client = {
  id: string
  user_id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  address: string | null
  created_at: string | null
}

export type ClientInsert = Omit<Client, 'id' | 'created_at'> & {
  created_at?: string | null
}
export type ClientUpdate = Partial<ClientInsert>

export type CatalogItem = {
  id: string
  user_id: string
  title: string
  default_unit_price: number
  unit_type: string | null
  created_at: string | null
}

export type CatalogItemInsert = Omit<CatalogItem, 'id' | 'created_at'> & {
  created_at?: string | null
}
export type CatalogItemUpdate = Partial<CatalogItemInsert>

export type Document = {
  id: string
  user_id: string
  client_id: string
  doc_number: string
  doc_type: DocumentType
  status: DocumentStatus
  subtotal: number
  tax_amount: number
  total_amount: number
  signature_png_url: string | null
  stripe_payment_link: string | null
  paid_at: string | null
  created_at: string | null
}

export type DocumentInsert = Omit<
  Document,
  'id' | 'created_at' | 'paid_at'
> & {
  created_at?: string | null
  paid_at?: string | null
}
export type DocumentUpdate = Partial<DocumentInsert>

export type DocumentItem = {
  id: string
  document_id: string
  description: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string | null
}

export type DocumentItemInsert = Omit<DocumentItem, 'id' | 'created_at'> & {
  created_at?: string | null
}
export type DocumentItemUpdate = Partial<DocumentItemInsert>

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: ClientUpdate
        Relationships: [
          {
            foreignKeyName: 'Clients_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      catalog_items: {
        Row: CatalogItem
        Insert: CatalogItemInsert
        Update: CatalogItemUpdate
        Relationships: [
          {
            foreignKeyName: 'Catalog_Items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      documents: {
        Row: Document
        Insert: DocumentInsert
        Update: DocumentUpdate
        Relationships: [
          {
            foreignKeyName: 'Documents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Documents_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      document_items: {
        Row: DocumentItem
        Insert: DocumentItemInsert
        Update: DocumentItemUpdate
        Relationships: [
          {
            foreignKeyName: 'Document_Items_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
