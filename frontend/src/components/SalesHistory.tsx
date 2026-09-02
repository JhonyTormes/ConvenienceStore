import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { formatCurrency, formatDate, paymentMethodIcon, paymentMethodLabel } from '../format'
import type { Sale } from '../types'
import Modal from './Modal'

function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <Modal title={`Venda #${sale.id}`} onClose={onClose}>
      <p className="sale-detail-meta">
        {formatDate(sale.createdAt)} · {paymentMethodIcon(sale.paymentMethod)}{' '}
        {paymentMethodLabel(sale.paymentMethod)}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Produto</th>
            <th className="align-right">Preço</th>
            <th className="align-right">Qtd</th>
            <th className="align-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item.id}>
              <td>{item.productName}</td>
              <td className="align-right">{formatCurrency(item.unitPrice)}</td>
              <td className="align-right">{item.quantity}</td>
              <td className="align-right">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sale-detail-footer">
        <p>
          Total: <strong>{formatCurrency(sale.totalAmount)}</strong>
        </p>
        <p>Pago: {formatCurrency(sale.amountPaid)}</p>
        {sale.changeAmount > 0 && <p>Troco: {formatCurrency(sale.changeAmount)}</p>}
        {sale.paymentSignature && (
          <p className="sale-detail-signature">Assinatura: {sale.paymentSignature}</p>
        )}
      </div>
    </Modal>
  )
}

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Sale | null>(null)

  const load = useCallback(() => {
    api
      .getSales()
      .then(setSales)
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar vendas.'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div className="toolbar">
        <h2>🧾 Histórico de vendas</h2>
        <button className="btn" onClick={load}>
          Atualizar
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {sales.length === 0 ? (
        <p className="empty">Nenhuma venda registrada ainda.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nº</th>
              <th>Pagamento</th>
              <th className="align-right">Itens</th>
              <th className="align-right">Total</th>
              <th className="align-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{formatDate(sale.createdAt)}</td>
                <td>#{sale.id}</td>
                <td>
                  {paymentMethodIcon(sale.paymentMethod)} {paymentMethodLabel(sale.paymentMethod)}
                </td>
                <td className="align-right">{sale.items.length}</td>
                <td className="align-right">{formatCurrency(sale.totalAmount)}</td>
                <td className="align-right">
                  <button className="btn btn-small" onClick={() => setSelected(sale)}>
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
