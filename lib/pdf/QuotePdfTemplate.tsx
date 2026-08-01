import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Client, Document as QuoteDocument, DocumentItem, Profile } from '@/types/database'

export interface QuotePdfTemplateProps {
  document: QuoteDocument
  client: Client
  items: DocumentItem[]
  profile?: Profile
  contactLines?: string[]
  issueDate?: string
  signedAt?: string
}

const statusColors: Record<QuoteDocument['status'], string> = {
  draft: '#64748b',
  pending_signature: '#d97706',
  signed: '#2563eb',
  paid: '#16a34a',
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: '#0f172a',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  docType: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#2563eb',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  brandContact: {
    fontSize: 9,
    color: '#475569',
    marginTop: 3,
    lineHeight: 1.4,
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  metaLabel: {
    color: '#64748b',
    width: 62,
    fontSize: 9,
  },
  metaValue: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 9,
  },
  badge: {
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  billedTo: {
    marginBottom: 18,
  },
  billedName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  billedLine: {
    fontSize: 9,
    color: '#475569',
    marginTop: 1,
  },
  table: {
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  colDesc: { width: '48%' },
  colQty: { width: '14%', textAlign: 'center' },
  colUnit: { width: '19%', textAlign: 'right' },
  colTotal: { width: '19%', textAlign: 'right' },
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  summaryBox: {
    width: 190,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 10,
    color: '#0f172a',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: '#0f172a',
    paddingTop: 7,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  legal: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signatureBlock: {
    width: 230,
    marginBottom: 12,
  },
  signatureImg: {
    width: 210,
    height: 64,
    objectFit: 'contain',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 3,
  },
  signatureCaption: {
    fontSize: 8,
    color: '#64748b',
  },
  legalText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.5,
  },
})

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatQty = (quantity: number) =>
  Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2)

export default function QuotePdfTemplate({
  document,
  client,
  items,
  profile,
  contactLines,
  issueDate,
  signedAt,
}: QuotePdfTemplateProps) {
  const businessName = profile?.business_name ?? 'Your Business Name'
  const contact = contactLines ?? [profile?.phone].filter((line): line is string => Boolean(line))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.docType}>
              {document.doc_type === 'invoice' ? 'INVOICE' : 'QUOTE'}
            </Text>
            <Text style={styles.brandName}>{businessName}</Text>
            {contact.map((line) => (
              <Text key={line} style={styles.brandContact}>
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Number</Text>
              <Text style={styles.metaValue}>{document.doc_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(issueDate) || formatDate(new Date().toISOString())}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColors[document.status] }]}>
              <Text>{document.status.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.billedTo}>
          <Text style={styles.sectionLabel}>Billed To</Text>
          <Text style={styles.billedName}>{client.client_name}</Text>
          {client.address && <Text style={styles.billedLine}>{client.address}</Text>}
          {client.client_email && <Text style={styles.billedLine}>{client.client_email}</Text>}
          {client.client_phone && <Text style={styles.billedLine}>{client.client_phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>No line items.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>{formatQty(item.quantity)}</Text>
                <Text style={styles.colUnit}>{formatMoney(item.unit_price)}</Text>
                <Text style={styles.colTotal}>{formatMoney(item.subtotal)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatMoney(document.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatMoney(document.tax_amount)}</Text>
            </View>
            <View style={styles.summaryTotal}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>{formatMoney(document.total_amount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.legal}>
          {document.signature_png_url ? (
            <View style={styles.signatureBlock}>
              <Image src={document.signature_png_url} style={styles.signatureImg} />
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>
                {signedAt
                  ? `Electronically signed by customer on ${formatDateTime(signedAt)}`
                  : 'Electronically signed by customer'}
              </Text>
            </View>
          ) : (
            <Text style={styles.legalText}>Awaiting customer signature.</Text>
          )}
          <Text style={styles.legalText}>
            This {document.doc_type} is valid for 30 days. Work will begin upon customer acceptance
            via signature or payment. Amounts are due as stated above.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
