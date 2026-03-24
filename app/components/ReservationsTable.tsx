'use client'

import { Reservation } from '@/lib/types'
import { nightsBetween, formatDate, formatARS } from '@/lib/formatters'
import { STATUS_LABELS, STATUS_STYLES, SOURCE_LABELS, SOURCE_STYLES } from '@/lib/constants'

type Totals = { nights: number; guests: number; sena: number; cost: number }

type Props = {
  filtered: Reservation[]
  selected: Set<number>
  allSelected: boolean
  someSelected: boolean
  totals: Totals
  onToggleSelectAll: () => void
  onToggleSelect: (id: number) => void
  onEdit: (r: Reservation) => void
  onDelete: (id: number) => void
  onMessage: (r: Reservation) => void
  onDeleteSelected: () => void
}

export default function ReservationsTable({
  filtered, selected, allSelected, someSelected, totals,
  onToggleSelectAll, onToggleSelect, onEdit, onDelete, onMessage, onDeleteSelected,
}: Props) {
  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        No hay reservas. Sincronizá con Booking o agregá una manualmente.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {someSelected && (
        <div className="px-5 py-2 border-b border-stone-100">
          <button onClick={onDeleteSelected}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
            Borrar seleccionadas ({selected.size})
          </button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-stone-400 uppercase tracking-wide border-b border-stone-100">
            <th className="px-4 py-3 w-8">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll}
                className="rounded border-stone-300 cursor-pointer" />
            </th>
            <th className="text-left px-4 py-3 font-medium">Huésped</th>
            <th className="text-left px-4 py-3 font-medium">Teléfono</th>
            <th className="text-left px-4 py-3 font-medium">Llegada</th>
            <th className="text-left px-4 py-3 font-medium">Salida</th>
            <th className="text-left px-4 py-3 font-medium">Noches</th>
            <th className="text-left px-4 py-3 font-medium">Personas</th>
            <th className="text-left px-4 py-3 font-medium">Seña</th>
            <th className="text-left px-4 py-3 font-medium">Total</th>
            <th className="text-left px-4 py-3 font-medium">Estado</th>
            <th className="text-left px-4 py-3 font-medium">Fuente</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id} className={`border-b border-stone-50 transition-colors ${selected.has(r.id) ? 'bg-stone-50' : 'hover:bg-stone-50'}`}>
              <td className="px-4 py-3">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => onToggleSelect(r.id)}
                  className="rounded border-stone-300 cursor-pointer" />
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-stone-800">{r.name}</span>
                {r.notes && <p className="text-xs text-stone-400 mt-0.5">{r.notes}</p>}
              </td>
              <td className="px-4 py-3 text-stone-500">{r.phone || '—'}</td>
              <td className="px-4 py-3 text-stone-600">{formatDate(r.checkin)}</td>
              <td className="px-4 py-3 text-stone-600">{formatDate(r.checkout)}</td>
              <td className="px-4 py-3 text-stone-600">{nightsBetween(r.checkin, r.checkout)}</td>
              <td className="px-4 py-3 text-stone-600">{r.guests}</td>
              <td className="px-4 py-3 text-stone-600">{Number(r.sena) > 0 ? formatARS(r.sena) : '—'}</td>
              <td className="px-4 py-3 text-stone-600">{Number(r.cost) > 0 ? formatARS(r.cost) : '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[r.status] || STATUS_STYLES.confirmed}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${SOURCE_STYLES[r.source] || SOURCE_STYLES.particular}`}>
                  {SOURCE_LABELS[r.source] || r.source}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(r)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => onMessage(r)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                    ✉ Mensaje
                  </button>
                  <button onClick={() => onDelete(r.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors">
                    Borrar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700">
            <td className="px-4 py-3" />
            <td className="px-4 py-3" colSpan={4}>Totales (sin canceladas)</td>
            <td className="px-4 py-3">{totals.nights}</td>
            <td className="px-4 py-3">{totals.guests}</td>
            <td className="px-4 py-3">{totals.sena > 0 ? formatARS(totals.sena) : '—'}</td>
            <td className="px-4 py-3">{totals.cost > 0 ? formatARS(totals.cost) : '—'}</td>
            <td className="px-4 py-3" colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
