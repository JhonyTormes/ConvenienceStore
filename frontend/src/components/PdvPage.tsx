import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { formatCurrency } from '../format'
import type { Product, Sale } from '../types'
import PaymentModal from './PaymentModal'

interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
}

export default function PdvPage() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [finishedSale, setFinishedSale] = useState<Sale | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const search = term.trim()
      if (!search) {
        setResults([])
        return
      }
      try {
        setResults(await api.getProducts(search))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao buscar produtos.')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [term])

  async function handleScan() {
    const code = term.trim()
    if (!code) return
    try {
      const product = await api.getByBarcode(code)
      addToCart(product)
      setTerm('')
      setError(null)
    } catch {
      // no exact barcode match; keep showing name search results
    }
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        { productId: product.id, name: product.name, price: product.price, quantity: 1 },
      ]
    })
    setError(null)
    setResults([])
    setTerm('')
  }

  function changeQuantity(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function clearCart() {
    setCart([])
    setError(null)
  }

  if (finishedSale) {
    return (
      <div className="sale-success">
        <div className="sale-success-icon">✅</div>
        <h2>Venda finalizada!</h2>
        <p className="sale-success-total">
          Total: <strong>{formatCurrency(finishedSale.totalAmount)}</strong>
        </p>
        <p className="sale-success-payment">
          Pagamento: {formatCurrency(finishedSale.amountPaid)}
        </p>
        {finishedSale.changeAmount > 0 && (
          <p className="sale-success-change">
            Troco: <strong>{formatCurrency(finishedSale.changeAmount)}</strong>
          </p>
        )}
        <button
          className="btn btn-big btn-primary"
          onClick={() => {
            setFinishedSale(null)
            setCart([])
            setTerm('')
            setResults([])
            inputRef.current?.focus()
          }}
        >
          🛒 Nova venda
        </button>
      </div>
    )
  }

  return (
    <div className="pdv">
      <section className="pdv-left">
        <input
          ref={inputRef}
          className="pdv-search"
          placeholder="🔍 Buscar produto ou bipar código"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleScan()
            }
          }}
        />

        {error && <p className="form-error">{error}</p>}

        {results.length > 0 && (
          <div className="product-grid">
            {results.map((p) => (
              <button key={p.id} className="product-card" onClick={() => addToCart(p)}>
                <span className="product-card-name">{p.name}</span>
                <span className="product-card-price">{formatCurrency(p.price)}</span>
                <span
                  className={`product-card-stock ${p.stockQuantity === 0 ? 'text-red' : ''}`}
                >
                  Estoque: {p.stockQuantity}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="pdv-help">
          <p>💡 Digite o nome do produto e toque nele, ou bata o código de barras.</p>
        </div>
      </section>

      <section className="pdv-right">
        <div className="pdv-cart-header">
          <h2>🛒 Itens da venda</h2>
          {cart.length > 0 && (
            <button className="btn btn-small" onClick={clearCart}>
              Limpar
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <p className="empty">Nenhum item ainda.</p>
        ) : (
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.productId} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">
                    {formatCurrency(item.price)} x {item.quantity}
                  </span>
                </div>
                <div className="cart-item-controls">
                  <button
                    className="btn btn-round"
                    onClick={() => changeQuantity(item.productId, -1)}
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <span className="cart-item-qty">{item.quantity}</span>
                  <button
                    className="btn btn-round"
                    onClick={() => changeQuantity(item.productId, 1)}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                  <span className="cart-item-subtotal">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    className="btn btn-round btn-danger"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remover item"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="pdv-total">
          <span>TOTAL</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <button
          className="btn btn-big btn-primary"
          disabled={cart.length === 0}
          onClick={() => setPaymentOpen(true)}
        >
          💰 Finalizar venda
        </button>
      </section>

      {paymentOpen && (
        <PaymentModal
          total={total}
          items={cart.map((i) => ({ productId: i.productId, quantity: i.quantity }))}
          onClose={() => setPaymentOpen(false)}
          onComplete={(sale) => {
            setPaymentOpen(false)
            setFinishedSale(sale)
          }}
        />
      )}
    </div>
  )
}
