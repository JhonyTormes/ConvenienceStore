export interface Product {
  id: number
  name: string
  description?: string | null
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
  price: number
  initialStock: number
}

export interface UpdateProductRequest {
  name: string
  description?: string
  price: number
}

export interface AdjustStockRequest {
  type: StockMovementType
  quantity: number
  reason?: string
}
