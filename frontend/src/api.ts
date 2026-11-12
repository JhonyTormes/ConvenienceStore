import type {
  AdjustStockRequest,
  CreateCustomerRequest,
  CreatePaymentMethodRequest,
  CreateProductRequest,
  CreateSaleRequest,
  Customer,
  PaymentMethod,
  Product,
  Sale,
  StockMovement,
  UpdateCustomerRequest,
  UpdatePaymentMethodRequest,
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

  getByBarcode: (barcode: string) =>
    request<Product>(`/products/barcode/${encodeURIComponent(barcode)}`),

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

  createSale: (data: CreateSaleRequest, signal?: AbortSignal) =>
    request<Sale>('/sales', { method: 'POST', body: JSON.stringify(data), signal }),

  getSales: (limit = 100) => request<Sale[]>(`/sales?limit=${limit}`),

  getSale: (id: number) => request<Sale>(`/sales/${id}`),

  cancelSale: (id: number) =>
    request<Sale>(`/sales/${id}/cancel`, { method: 'POST' }),

  getCustomers: (search?: string) =>
    request<Customer[]>(
      `/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),

  createCustomer: (data: CreateCustomerRequest) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomer: (id: number, data: UpdateCustomerRequest) =>
    request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCustomer: (id: number) =>
    request<void>(`/customers/${id}`, { method: 'DELETE' }),

  getPaymentMethods: (activeOnly = false) =>
    request<PaymentMethod[]>(`/payment-methods${activeOnly ? '?activeOnly=true' : ''}`),

  createPaymentMethod: (data: CreatePaymentMethodRequest) =>
    request<PaymentMethod>('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePaymentMethod: (id: number, data: UpdatePaymentMethodRequest) =>
    request<PaymentMethod>(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePaymentMethod: (id: number) =>
    request<void>(`/payment-methods/${id}`, { method: 'DELETE' }),
}
