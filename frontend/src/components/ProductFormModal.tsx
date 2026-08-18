import { useState, type FormEvent } from 'react'
import { api } from '../api'
import type { Product } from '../types'
import Modal from './Modal'

interface ProductFormModalProps {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

export default function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const isEditing = product !== null
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [initialStock, setInitialStock] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (isEditing) {
        await api.updateProduct(product.id, {
          name,
          description: description || undefined,
          price: Number(price),
        })
      } else {
        await api.createProduct({
          name,
          description: description || undefined,
          price: Number(price),
          initialStock: Number(initialStock),
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEditing ? 'Edit product' : 'New product'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label>
          Name *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            autoFocus
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </label>

        <label>
          Price *
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </label>

        {!isEditing && (
          <label>
            Initial stock
            <input
              type="number"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              min="0"
              step="1"
            />
          </label>
        )}

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
