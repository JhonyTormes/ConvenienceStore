import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { formatCurrency, movementTypeLabel } from '../format'
import type { Product, StockMovementType } from '../types'
import Modal from './Modal'

interface StockAdjustModalProps {
  product: Product
  onClose: () => void
  onSaved: () => void
}

const TYPES: { value: StockMovementType; hint: string }[] = [
  { value: 1, hint: 'Adds to the current stock' },
  { value: 2, hint: 'Removes from the current stock' },
  { value: 3, hint: 'Sets the stock to the given quantity' },
]

export default function StockAdjustModal({ product, onClose, onSaved }: StockAdjustModalProps) {
  const [type, setType] = useState<StockMovementType>(1)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api.adjustStock(product.id, {
        type,
        quantity: Number(quantity),
        reason: reason || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Adjust stock - ${product.name}`} onClose={onClose}>
      <p className="stock-current">
        Current stock: <strong>{product.stockQuantity}</strong> ({formatCurrency(product.price)} each)
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Movement type
          <select value={type} onChange={(e) => setType(Number(e.target.value) as StockMovementType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {movementTypeLabel(t.value)}
              </option>
            ))}
          </select>
        </label>
        <p className="field-hint">{TYPES.find((t) => t.value === type)?.hint}</p>

        <label>
          Quantity
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="1"
            required
            autoFocus
          />
        </label>

        <label>
          Reason
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. supplier delivery, expired item, inventory count"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
