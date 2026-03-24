'use client'

import { MonthlyCost } from '@/lib/types'
import { formatARS } from '@/lib/formatters'
import { COST_TYPES } from '@/lib/constants'

export type MonthlyCostFormState = {
  description: string
  type: string
  cost: number
  year_month: string
}

type Props = {
  open: boolean
  monthlyCosts: MonthlyCost[]
  monthlyCostForm: MonthlyCostFormState
  setMonthlyCostForm: React.Dispatch<React.SetStateAction<MonthlyCostFormState>>
  onAdd: () => void
  onDelete: (id: number) => void
  onClose: () => void
  monthLabel: string
}

export default function MonthlyCostsModal({
  open, monthlyCosts, monthlyCostForm, setMonthlyCostForm,
  onAdd, onDelete, onClose, monthLabel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">Costos del mes</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
        </div>
        <p className="text-xs text-stone-500 mb-4">{monthLabel}</p>

        {monthlyCosts.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">No hay costos registrados para este mes.</p>
        ) : (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-xs text-stone-400 uppercase tracking-wide border-b border-stone-100">
                <th className="text-left py-2">Descripción</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-right py-2">Importe</th>
                <th className="py-2 w-6" />
              </tr>
            </thead>
            <tbody>
              {monthlyCosts.map(c => (
                <tr key={c.id} className="border-b border-stone-50">
                  <td className="py-2 text-stone-700">{c.description}</td>
                  <td className="py-2 text-stone-500 text-xs">{c.type}</td>
                  <td className="py-2 text-right text-stone-700">{formatARS(c.cost)}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => onDelete(c.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-200 font-semibold text-stone-700">
                <td className="py-2" colSpan={2}>Total costos</td>
                <td className="py-2 text-right">{formatARS(monthlyCosts.reduce((s, c) => s + Number(c.cost), 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}

        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-medium text-stone-600 mb-3">Agregar costo</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-500 block mb-1">Mes</label>
              <input
                type="month"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                value={monthlyCostForm.year_month}
                onChange={e => setMonthlyCostForm(f => ({ ...f, year_month: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Descripción</label>
              <input
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                value={monthlyCostForm.description}
                onChange={e => setMonthlyCostForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Limpieza general"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Tipo</label>
                <select
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  value={monthlyCostForm.type}
                  onChange={e => setMonthlyCostForm(f => ({ ...f, type: e.target.value }))}>
                  {COST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Importe (ARS $)</label>
                <input
                  type="number" min={0}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  value={monthlyCostForm.cost}
                  onChange={e => setMonthlyCostForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
            Cerrar
          </button>
          <button onClick={onAdd}
            className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
