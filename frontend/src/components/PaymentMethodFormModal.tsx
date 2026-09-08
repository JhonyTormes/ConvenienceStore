import { useState, type FormEvent } from 'react'
import { api } from '../api'
import type { PaymentMethod } from '../types'
import Modal from './Modal'

interface PaymentMethodFormModalProps {
  paymentMethod: PaymentMethod | null
  onClose: () => void
  onSaved: () => void
}

export default function PaymentMethodFormModal({
  paymentMethod,
  onClose,
  onSaved,
}: PaymentMethodFormModalProps) {
  const isEditing = paymentMethod !== null
  const [name, setName] = useState(paymentMethod?.name ?? '')
  const [isActive, setIsActive] = useState(paymentMethod?.isActive ?? true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (isEditing) {
        await api.updatePaymentMethod(paymentMethod.id, { name, isActive })
      } else {
        await api.createPaymentMethod({ name })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEditing ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>
          Nome *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            autoFocus
            placeholder="Ex.: Vale-refeição"
          />
        </label>

        {isEditing && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Ativa no caixa
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
