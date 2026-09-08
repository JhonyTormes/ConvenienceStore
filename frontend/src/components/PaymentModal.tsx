import { useEffect, useRef, useState, type FormEvent } from 'react'
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

const METHODS: PaymentMethod[] = [1, 2, 3, 4]

export default function PaymentModal({ total, items, onClose, onComplete }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>(1)
  const [received, setReceived] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const receivedRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const waitingRef = useRef<HTMLDivElement>(null)

  const isCash = method === 1
  const isSolana = method === 4
  const receivedValue = Number(received) || 0
  const change = isCash ? Math.max(0, receivedValue - total) : 0
  const amountPaid = isCash ? receivedValue : total
  const canConfirm = isCash ? receivedValue >= total : true

  function cancelWaiting() {
    abortRef.current?.abort()
    setWaiting(false)
  }

  async function submitSale() {
    if (!canConfirm || saving || waiting) return
    setError(null)

    if (isSolana) {
      const controller = new AbortController()
      abortRef.current = controller
      setWaiting(true)
      try {
        const sale = await api.createSale(
          { items, paymentMethod: method, amountPaid },
          controller.signal,
        )
        onComplete(sale)
      } catch (err) {
        if (controller.signal.aborted) {
          setWaiting(false)
          return
        }
        setError(err instanceof Error ? err.message : 'Falha ao finalizar a venda.')
        setWaiting(false)
      } finally {
        abortRef.current = null
      }
      return
    }

    setSaving(true)
    try {
      const sale = await api.createSale({ items, paymentMethod: method, amountPaid })
      onComplete(sale)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao finalizar a venda.')
      setSaving(false)
    }
  }

  const submitRef = useRef(submitSale)
  useEffect(() => {
    submitRef.current = submitSale
  })

  useEffect(() => {
    if (waiting) waitingRef.current?.focus()
    else formRef.current?.focus()
  }, [waiting])

  function selectMethod(m: PaymentMethod) {
    setMethod(m)
    setError(null)
    if (m === 1) receivedRef.current?.focus()
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (waiting) cancelWaiting()
        else onClose()
        return
      }

      if (waiting) return

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT') {
        if (e.key === 'Enter' && canConfirm) submitRef.current()
        return
      }

      const num = Number(e.key)
      if (num >= 1 && num <= METHODS.length) {
        e.preventDefault()
        selectMethod(num as PaymentMethod)
        return
      }

      if (e.key === 'Enter' && canConfirm) {
        e.preventDefault()
        submitRef.current()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [waiting, canConfirm, onClose])

  if (waiting) {
    return (
      <Modal title="Pagamento com Solana Pay" onClose={cancelWaiting}>
        <div className="solana-waiting" ref={waitingRef} tabIndex={-1}>
          <span className="solana-waiting-icon">⚡</span>
          <p className="solana-waiting-text">
            Peça ao cliente para escanear o <strong>QR Code na tela do caixa</strong> e pagar com a
            carteira Solana.
          </p>
          <p className="solana-waiting-total">
            Total: <strong>{formatCurrency(total)}</strong>
          </p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={cancelWaiting}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submitSale()
  }

  return (
    <Modal title="Pagamento" onClose={onClose}>
      <p className="payment-total">
        Total: <strong>{formatCurrency(total)}</strong>
      </p>

      <form className="payment-form" onSubmit={handleSubmit} ref={formRef} tabIndex={-1}>
        <label>Forma de pagamento</label>
        <div className="payment-methods">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              className={`btn payment-method ${method === m ? 'payment-method-active' : ''}`}
              onClick={() => selectMethod(m)}
            >
              <span className="payment-method-key">{m}</span>
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
                ref={receivedRef}
                type="number"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Digite quanto o cliente pagou"
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
            {isSolana
              ? 'O QR Code vai aparecer na tela do caixa. O cliente escaneia e paga com a carteira Solana.'
              : `Pagamento via ${paymentMethodLabel(method).toLowerCase()}: sem troco. Confira o valor e
            confirme.`}
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canConfirm || saving}>
            {saving ? 'Finalizando...' : isSolana ? '⚡ Mostrar QR Code' : '✅ Confirmar venda'}
          </button>
        </div>

        <p className="field-hint">
          Aperte 1 a 4 para escolher a forma de pagamento e Enter para confirmar. Em Dinheiro,
          digite o valor recebido.
        </p>
      </form>
    </Modal>
  )
}
