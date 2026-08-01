export interface MoneyRow {
  quantity: number
  unitPrice: number
}

export interface QuoteTotals {
  subtotal: number
  taxAmount: number
  totalAmount: number
}

export function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeTotals(rows: MoneyRow[], taxRate: number): QuoteTotals {
  const subtotalCents = rows.reduce(
    (sum, row) => sum + toCents(row.quantity * row.unitPrice),
    0
  )
  const taxCents = Math.round((subtotalCents * taxRate) / 100)
  const totalCents = subtotalCents + taxCents

  return {
    subtotal: fromCents(subtotalCents),
    taxAmount: fromCents(taxCents),
    totalAmount: fromCents(totalCents),
  }
}
