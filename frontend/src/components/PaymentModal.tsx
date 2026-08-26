import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { formatCurrency, paymentMethodIcon, paymentMethodLabel } from '../format'
import type { PaymentMethod, Sale, SaleItemRequest } from '../types'
import Modal from './Modal'

interface PaymentModalProps {
  total: number
  items: SaleItemRequest[]
  onClose: () => void
  onComplete: (sale: Sale) => void
}

const METHODS: PaymentMethod[] = [1, 2, 3]

export default function PaymentModal({ total, items, onClose, onComplete }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>(1)
  const [received, setReceived] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isCash = method === 1
  const receivedValue = Number(received) || 0
  const change = isCash ? Math.max(0, receivedValue - total) : 0
  const amountPaid = isCash ? receivedValue : total
  const canConfirm = isCash ? receivedValue >= total : true

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canConfirm) return
    setError(null)
    setSaving(true)
    try {
      const sale = await api.createSale({
        items,
        paymentMethod: method,
        amountPaid,
      })
      onComplete(sale)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao finalizar a venda.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Pagamento" onClose={onClose}>
      <p className="payment-total">
        Total: <strong>{formatCurrency(total)}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <label>Forma de pagamento</label>
        <div className="payment-methods">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              className={`btn payment-method ${method === m ? 'payment-method-active' : ''}`}
              onClick={() => {
                setMethod(m)
                setError(null)
              }}
            >
              <span className="payment-method-icon">{paymentMethodIcon(m)}</span>
              {paymentMethodLabel(m)}
            </button>
          ))}
        </div>

        {isCash ? (
          <>
            <label>
              Valor recebido (R$)
              <input
                type="number"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Digite quanto o cliente pagou"
                autoFocus
              />
            </label>
            <div className={`change-box ${change > 0 ? 'change-box-positive' : ''}`}>
              <span>Troco</span>
              <strong>{formatCurrency(change)}</strong>
            </div>
            {receivedValue > 0 && receivedValue < total && (
              <p className="form-error">Faltam {formatCurrency(total - receivedValue)}.</p>
            )}
          </>
        ) : (
          <p className="field-hint">
            Pagamento via {paymentMethodLabel(method).toLowerCase()}: sem troco. Confira o valor e
            confirme.
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canConfirm || saving}>
            {saving ? 'Finalizando...' : '✅ Confirmar venda'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
