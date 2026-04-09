'use client'

import { useMemo } from 'react'

export interface Holiday {
  fecha: string
  nombre: string
  tipo: string
}

const DOW_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const TIPO_LABELS: Record<string, string> = {
  inamovible: 'Inamovible',
  trasladable: 'Trasladable',
  puente: 'Puente',
  nolaborable: 'No laborable',
}

function formatDate(fecha: string) {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function getDow(fecha: string) {
  // Parse date as local to avoid timezone offsets
  const [y, m, d] = fecha.split('-').map(Number)
  return DOW_ES[new Date(y, m - 1, d).getDay()]
}

export default function HolidaysModal({
  open,
  holidays,
  onClose,
}: {
  open: boolean
  holidays: Holiday[]
  onClose: () => void
}) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const upcoming = useMemo(
    () => holidays.filter(h => h.fecha >= todayStr).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [holidays, todayStr]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Feriados en Argentina</h2>
            <p className="text-xs text-stone-400 mt-0.5">Próximos días no laborables</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg leading-none px-2 py-1 rounded hover:bg-stone-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {upcoming.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">No hay feriados disponibles.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {upcoming.map((h) => (
                <li key={h.fecha} className="flex items-center gap-4 px-6 py-3">
                  {/* Day indicator */}
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs text-amber-500 font-medium leading-none">
                      {h.fecha.slice(5, 7)}/{h.fecha.slice(0, 4)}
                    </span>
                    <span className="text-lg font-bold text-amber-700 leading-none mt-0.5">
                      {h.fecha.slice(8, 10)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{h.nombre}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {getDow(h.fecha)} · {formatDate(h.fecha)}
                    </p>
                  </div>

                  {/* Type badge */}
                  {h.tipo && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                      {TIPO_LABELS[h.tipo] ?? h.tipo}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
