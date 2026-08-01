import type { CatalogItem } from '@/types/database'

export interface BuilderLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

const createItemId = () => Math.random().toString(36).slice(2, 10)

export function createBlankItem(): BuilderLineItem {
  return { id: createItemId(), description: '', quantity: 1, unitPrice: 0 }
}

export function addCatalogItem(
  items: BuilderLineItem[],
  catalogItem: CatalogItem
): BuilderLineItem[] {
  return [
    ...items,
    {
      id: createItemId(),
      description: catalogItem.title,
      quantity: 1,
      unitPrice: Number(catalogItem.default_unit_price) || 0,
    },
  ]
}

export function addCustomItem(items: BuilderLineItem[]): BuilderLineItem[] {
  return [...items, createBlankItem()]
}

export function updateItem(
  items: BuilderLineItem[],
  id: string,
  patch: Partial<Omit<BuilderLineItem, 'id'>>
): BuilderLineItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function removeItem(items: BuilderLineItem[], id: string): BuilderLineItem[] {
  return items.filter((item) => item.id !== id)
}

export function getValidItems(items: BuilderLineItem[]): BuilderLineItem[] {
  return items.filter((item) => item.description.trim().length > 0 && item.unitPrice > 0)
}

export function validateQuote(clientId: string, items: BuilderLineItem[]): string | null {
  if (!clientId) return 'Select a client before saving.'
  if (getValidItems(items).length === 0) {
    return 'Add at least one item with a description and price.'
  }
  return null
}
