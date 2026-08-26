import { useEffect, useState } from 'react'
import { api } from './api'
import MovementsModal from './components/MovementsModal'
import PdvPage from './components/PdvPage'
import ProductFormModal from './components/ProductFormModal'
import SalesHistory from './components/SalesHistory'
import StockAdjustModal from './components/StockAdjustModal'
import { formatCurrency, formatDate, movementTypeLabel } from './format'
import type { Product, StockMovement } from './types'

type Tab = 'pdv' | 'products' | 'sales' | 'movements'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pdv', label: '🛒 Caixa' },
  { id: 'products', label: '📦 Produtos' },
  { id: 'sales', label: '🧾 Vendas' },
  { id: 'movements', label: '📊 Estoque' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('pdv')
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
          setError(err instanceof Error ? err.message : 'Falha ao carregar produtos.')
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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar movimentos.')
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
      setError(err instanceof Error ? err.message : 'Falha ao carregar produtos.')
    }
  }

  async function reloadMovements() {
    try {
      setMovements(await api.getStockMovements())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar movimentos.')
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Excluir "${product.name}"?`)) return
    try {
      await api.deleteProduct(product.id)
      await reloadProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir produto.')
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
        <h1>🏪 Convenience Store</h1>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && tab !== 'pdv' && <p className="form-error">{error}</p>}

        {tab === 'pdv' && <PdvPage />}

        {tab === 'products' && (
          <>
            <div className="toolbar">
              <input
                className="search"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary" onClick={openNewProduct}>
                ➕ Novo produto
              </button>
            </div>

            {loading ? (
              <p className="empty">Carregando...</p>
            ) : products.length === 0 ? (
              <p className="empty">Nenhum produto encontrado.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th>Código de barras</th>
                    <th className="align-right">Preço</th>
                    <th className="align-right">Estoque</th>
                    <th className="align-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="product-name">{p.name}</td>
                      <td className="product-description">{p.description || '-'}</td>
                      <td>{p.barcode || '-'}</td>
                      <td className="align-right">{formatCurrency(p.price)}</td>
                      <td className={`align-right ${p.stockQuantity === 0 ? 'text-red' : ''}`}>
                        {p.stockQuantity}
                      </td>
                      <td className="align-right actions">
                        <button className="btn btn-small" onClick={() => openEditProduct(p)}>
                          Editar
                        </button>
                        <button className="btn btn-small" onClick={() => setAdjustProduct(p)}>
                          Ajustar estoque
                        </button>
                        <button className="btn btn-small" onClick={() => setMovementsProduct(p)}>
                          Histórico
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDelete(p)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === 'sales' && <SalesHistory />}

        {tab === 'movements' && (
          <div className="movements-panel">
            <div className="toolbar">
              <h2>📊 Histórico de estoque</h2>
              <button className="btn" onClick={reloadMovements}>
                Atualizar
              </button>
            </div>

            {movements.length === 0 ? (
              <p className="empty">Nenhum movimento ainda.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th className="align-right">Quantidade</th>
                    <th className="align-right">Saldo</th>
                    <th>Motivo</th>
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
