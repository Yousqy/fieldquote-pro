import { describe, expect, it } from 'vitest'
import {
  addCatalogItem,
  addCustomItem,
  createBlankItem,
  getValidItems,
  removeItem,
  updateItem,
  validateQuote,
} from '../lib/quoteBuilderState'
import type { CatalogItem } from '../types/database'

const receptacle: CatalogItem = {
  id: 'c1',
  user_id: 'u1',
  title: 'Receptacle 20A',
  default_unit_price: 4.5,
  unit_type: 'ea',
  created_at: null,
}

const baseItem = { id: 'l1', description: 'Rough-in', quantity: 1, unitPrice: 25 }

describe('quote builder state', () => {
  it('inserts a catalog item as a ready-to-quote line item', () => {
    const items = addCatalogItem([], receptacle)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      description: 'Receptacle 20A',
      quantity: 1,
      unitPrice: 4.5,
    })
    expect(items[0].id).toBeTruthy()
  })

  it('appends blank rows for custom items', () => {
    const items = addCustomItem([])
    expect(items).toHaveLength(1)
    expect(items[0].description).toBe('')
  })

  it('updates quantity and unit price without mutating state', () => {
    const before = [{ ...baseItem }]
    const after = updateItem(before, 'l1', { quantity: 4, unitPrice: 3.5 })
    expect(before[0]).toEqual(baseItem)
    expect(after[0]).toMatchObject({ quantity: 4, unitPrice: 3.5 })
  })

  it('removes a line item by id', () => {
    const items = [
      { ...baseItem, id: 'a' },
      { ...baseItem, id: 'b' },
    ]
    expect(removeItem(items, 'a')).toHaveLength(1)
    expect(removeItem(items, 'a')[0].id).toBe('b')
  })

  it('filters to valid priced line items', () => {
    const items = [
      { ...baseItem, id: 'a', description: 'Wire', unitPrice: 5 },
      { ...baseItem, id: 'b', description: '', unitPrice: 25 },
      { ...baseItem, id: 'c', description: 'Breaker', unitPrice: 0 },
    ]
    expect(getValidItems(items)).toHaveLength(1)
  })

  it('validates client selection and at least one priced item', () => {
    expect(validateQuote('', [])).toBeTruthy()
    expect(validateQuote('client-1', [createBlankItem()])).toBeTruthy()
    expect(validateQuote('client-1', [{ ...baseItem, description: 'Wire', unitPrice: 5 }])).toBeNull()
  })
})
