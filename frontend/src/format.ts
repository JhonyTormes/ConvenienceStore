import type { StockMovementType } from './types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function movementTypeLabel(type: StockMovementType): string {
  switch (type) {
    case 1:
      return 'Stock in'
    case 2:
      return 'Stock out'
    case 3:
      return 'Adjustment'
  }
}
