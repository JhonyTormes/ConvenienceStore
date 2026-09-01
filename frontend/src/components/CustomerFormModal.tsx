import { useState, type FormEvent } from 'react'
import { api } from '../api'
import type { Customer } from '../types'
import Modal from './Modal'

interface CustomerFormModalProps {
  customer: Customer | null
  onClose: () => void
  onSaved: () => void
}

export default function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const isEditing = customer !== null
  const [name, setName] = useState(customer?.name ?? '')
  const [cpf, setCpf] = useState(customer?.cpf ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const data = {
        name,
        cpf: cpf || undefined,
        phone: phone || undefined,
      }
      if (isEditing) {
        await api.updateCustomer(customer.id, data)
      } else {
        await api.createCustomer(data)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label>
          Nome *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            autoFocus
          />
        </label>

        <label>
          CPF
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            maxLength={14}
            placeholder="Somente números"
          />
        </label>

        <label>
          Telefone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            placeholder="Ex.: (11) 99999-9999"
          />
        </label>

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
