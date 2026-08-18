import type {
  AdjustStockRequest,
  CreateProductRequest,
  Product,
  StockMovement,
  UpdateProductRequest,
} from './types'

const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.message) message = body.message
      else if (body.errors) {
        message = Object.values(body.errors as Record<string, string[]>)
          .flat()
          .join(', ')
      }
    } catch {
      // keep default message
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export const api = {
  getProducts: (search?: string) =>
    request<Product[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createProduct: (data: CreateProductRequest) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: number, data: UpdateProductRequest) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),

  adjustStock: (id: number, data: AdjustStockRequest) =>
    request<Product>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProductMovements: (id: number) =>
    request<StockMovement[]>(`/products/${id}/movements`),

  getStockMovements: (limit = 200) =>
    request<StockMovement[]>(`/stock-movements?limit=${limit}`),
}
