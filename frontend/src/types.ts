export interface Product {
  id: number
  name: string
  description?: string | null
  barcode?: string | null
  price: number
  stockQuantity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type StockMovementType = 1 | 2 | 3

export interface StockMovement {
  id: number
  productId: number
  productName: string
  type: StockMovementType
  quantityChange: number
  stockAfter: number
  reason?: string | null
  createdAt: string
}

export interface CreateProductRequest {
  name: string
  description?: string
  barcode?: string
  price: number
  initialStock: number
}

export interface UpdateProductRequest {
  name: string
  description?: string
  barcode?: string
  price: number
}

export interface AdjustStockRequest {
  type: StockMovementType
  quantity: number
  reason?: string
}

export type PaymentMethod = 1 | 2 | 3 | 4

export interface SaleItem {
  id: number
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Sale {
  id: number
  createdAt: string
  totalAmount: number
  paymentMethod: PaymentMethod
  amountPaid: number
  changeAmount: number
  paymentSignature?: string | null
  items: SaleItem[]
}

export interface SaleItemRequest {
  productId: number
  quantity: number
}

export interface CreateSaleRequest {
  items: SaleItemRequest[]
  paymentMethod: PaymentMethod
  amountPaid: number
}

export interface Customer {
  id: number
  name: string
  cpf?: string | null
  phone?: string | null
  createdAt: string
}

export interface CreateCustomerRequest {
  name: string
  cpf?: string
  phone?: string
}

export interface UpdateCustomerRequest {
  name: string
  cpf?: string
  phone?: string
}
