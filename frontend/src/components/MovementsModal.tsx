import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatDate, movementTypeLabel } from '../format'
import type { Product, StockMovement } from '../types'
import Modal from './Modal'

interface MovementsModalProps {
  product: Product
  onClose: () => void
}

export default function MovementsModal({ product, onClose }: MovementsModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getProductMovements(product.id)
      .then(setMovements)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load movements.'))
      .finally(() => setLoading(false))
  }, [product.id])

  return (
    <Modal title={`Stock history - ${product.name}`} onClose={onClose}>
      {loading && <p>Loading...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && movements.length === 0 && (
        <p className="empty">No stock movements for this product.</p>
      )}

      {!loading && movements.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
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
                <td>
                  <span className={`badge badge-${m.type}`}>{movementTypeLabel(m.type)}</span>
                </td>
                <td className={`align-right ${m.quantityChange > 0 ? 'text-green' : 'text-red'}`}>
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
    </Modal>
  )
}
