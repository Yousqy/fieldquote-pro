import { describe, expect, it } from 'vitest'
import { computeTotals, fromCents, roundMoney, toCents } from '../lib/money'

describe('money precision', () => {
  it('avoids classic 0.1 + 0.2 float drift', () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30)
    expect(fromCents(30)).toBe(0.3)
  })

  it('rounds each line to cents before summing subtotal', () => {
    const totals = computeTotals(
      [
        { quantity: 0.1, unitPrice: 1 },
        { quantity: 0.2, unitPrice: 1 },
        { quantity: 1, unitPrice: 2.49 },
      ],
      0
    )
    expect(totals.subtotal).toBe(2.79)
  })

  it('computes tax and grand total with a fractional rate', () => {
    const totals = computeTotals([{ quantity: 2, unitPrice: 25 }], 8.875)
    expect(totals.subtotal).toBe(50)
    expect(totals.taxAmount).toBe(4.44)
    expect(totals.totalAmount).toBe(54.44)
  })

  it('grand total always equals subtotal plus tax exactly', () => {
    const items = [
      { quantity: 7, unitPrice: 12.99 },
      { quantity: 3, unitPrice: 0.1 },
    ]
    const totals = computeTotals(items, 7.5)
    expect(totals.totalAmount).toBe(roundMoney(totals.subtotal + totals.taxAmount))
    expect(totals.subtotal).toBe(91.23)
    expect(totals.taxAmount).toBe(6.84)
  })

  it('handles large quantities without accumulating error', () => {
    const totals = computeTotals([{ quantity: 1000, unitPrice: 9.99 }], 10)
    expect(totals.subtotal).toBe(9990)
    expect(totals.taxAmount).toBe(999)
    expect(totals.totalAmount).toBe(10989)
  })
})
