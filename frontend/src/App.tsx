import { useEffect, useState } from 'react'
import { api } from './api'
import MovementsModal from './components/MovementsModal'
import ProductFormModal from './components/ProductFormModal'
import StockAdjustModal from './components/StockAdjustModal'
import { formatCurrency, formatDate, movementTypeLabel } from './format'
import type { Product, StockMovement } from './types'

type Tab = 'products' | 'movements'

export default function App() {
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[] | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [movementsProduct, setMovementsProduct] = useState<Product | null>(null)

  const loading = products === null

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const data = await api.getProducts(search || undefined)
        if (!cancelled) {
          setProducts(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([])
          setError(err instanceof Error ? err.message : 'Failed to load products.')
        }
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  useEffect(() => {
    if (tab !== 'movements') return
    let cancelled = false
    api
      .getStockMovements()
      .then((data) => {
        if (!cancelled) setMovements(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load movements.')
      })
    return () => {
      cancelled = true
    }
  }, [tab])

  async function reloadProducts() {
    try {
      setProducts(await api.getProducts(search || undefined))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.')
    }
  }

  async function reloadMovements() {
    try {
      setMovements(await api.getStockMovements())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movements.')
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    try {
      await api.deleteProduct(product.id)
      await reloadProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product.')
    }
  }

  function openNewProduct() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Convenience Store</h1>
        <nav>
          <button
            className={`tab ${tab === 'products' ? 'tab-active' : ''}`}
            onClick={() => setTab('products')}
          >
            Products
          </button>
          <button
            className={`tab ${tab === 'movements' ? 'tab-active' : ''}`}
            onClick={() => setTab('movements')}
          >
            Stock Movements
          </button>
        </nav>
      </header>

      <main>
        {error && <p className="form-error">{error}</p>}

        {tab === 'products' && (
          <>
            <div className="toolbar">
              <input
                className="search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary" onClick={openNewProduct}>
                New product
              </button>
            </div>

            {loading ? (
              <p className="empty">Loading...</p>
            ) : products.length === 0 ? (
              <p className="empty">No products found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th className="align-right">Price</th>
                    <th className="align-right">Stock</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="product-name">{p.name}</td>
                      <td className="product-description">{p.description || '-'}</td>
                      <td className="align-right">{formatCurrency(p.price)}</td>
                      <td className={`align-right ${p.stockQuantity === 0 ? 'text-red' : ''}`}>
                        {p.stockQuantity}
                      </td>
                      <td className="align-right actions">
                        <button className="btn btn-small" onClick={() => openEditProduct(p)}>
                          Edit
                        </button>
                        <button className="btn btn-small" onClick={() => setAdjustProduct(p)}>
                          Adjust stock
                        </button>
                        <button className="btn btn-small" onClick={() => setMovementsProduct(p)}>
                          History
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDelete(p)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === 'movements' && (
          <div className="movements-panel">
            <div className="toolbar">
              <h2>Stock movement history</h2>
              <button className="btn" onClick={reloadMovements}>
                Refresh
              </button>
            </div>

            {movements.length === 0 ? (
              <p className="empty">No movements yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th className="align-right">Quantity</th>
                    <th className="align-right">Stock after</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.createdAt)}</td>
                      <td>{m.productName}</td>
                      <td>
                        <span className={`badge badge-${m.type}`}>{movementTypeLabel(m.type)}</span>
                      </td>
                      <td
                        className={`align-right ${m.quantityChange > 0 ? 'text-green' : 'text-red'}`}
                      >
                        {m.quantityChange > 0 ? '+' : ''}
                        {m.quantityChange}
                      </td>
                      <td className="align-right">{m.stockAfter}</td>
                      <td>{m.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {formOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            reloadProducts()
          }}
        />
      )}

      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSaved={() => {
            setAdjustProduct(null)
            reloadProducts()
          }}
        />
      )}

      {movementsProduct && (
        <MovementsModal product={movementsProduct} onClose={() => setMovementsProduct(null)} />
      )}
    </div>
  )
}
