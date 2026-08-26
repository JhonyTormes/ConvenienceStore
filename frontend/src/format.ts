import type { PaymentMethod, StockMovementType } from './types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
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
      return 'Entrada'
    case 2:
      return 'Saída'
    case 3:
      return 'Ajuste'
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 1:
      return 'Dinheiro'
    case 2:
      return 'Cartão'
    case 3:
      return 'Pix'
  }
}

export function paymentMethodIcon(method: PaymentMethod): string {
  switch (method) {
    case 1:
      return '💵'
    case 2:
      return '💳'
    case 3:
      return '📱'
  }
}
