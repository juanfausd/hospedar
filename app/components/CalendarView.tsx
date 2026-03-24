'use client'

import { useMemo } from 'react'
import { Reservation } from '@/lib/types'
import { toDateStr } from '@/lib/formatters'
import { MONTHS, SOURCE_LABELS, CAL_SOURCE_STYLES, DOW_LABELS } from '@/lib/constants'

export default function CalendarView({
  reservations, calMonth, setCalMonth, onEdit,
}: {
  reservations: Reservation[]
  calMonth: string
  setCalMonth: (m: string) => void
  onEdit: (r: Reservation) => void
}) {
  const [year, month] = calMonth.split('-').map(Number)

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const startDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dayStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '00')}`
  }

  function reservationsForDay(day: number) {
    const d = dayStr(day)
    return reservations.filter(r => {
      if (r.status === 'cancelled') return false
      const cin = toDateStr(r.checkin).slice(0, 10)
      const cout = toDateStr(r.checkout).slice(0, 10)
      return cin <= d && d < cout
    })
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  const monthsWithReservations = useMemo(() => {
    const set = new Set<string>()
    for (const r of reservations) {
      if (r.status === 'cancelled') continue
      set.add(toDateStr(r.checkin).slice(0, 7))
    }
    return [...set].sort()
  }, [reservations])

  function goToNextMonthWithReservations() {
    const next = monthsWithReservations.find(m => m > calMonth)
    if (next) setCalMonth(next)
  }
  function goToPrevMonthWithReservations() {
    const prev = [...monthsWithReservations].reverse().find(m => m < calMonth)
    if (prev) setCalMonth(prev)
  }

  const hasReservationsThisMonth = monthsWithReservations.includes(calMonth)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">‹</button>
        <span className="text-sm font-semibold text-stone-800">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const ds = dayStr(day)
          const isToday = ds === todayStr
          const dayRes = reservationsForDay(day)
          return (
            <div key={i} className={`min-h-[80px] rounded-lg p-1 border ${isToday ? 'border-stone-400 bg-stone-50' : 'border-stone-100'}`}>
              <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-stone-900' : 'text-stone-400'}`}>{day}</span>
              <div className="space-y-0.5">
                {dayRes.slice(0, 3).map(r => (
                  <button key={r.id} onClick={() => onEdit(r)}
                    className={`w-full text-left text-xs px-1 py-0.5 rounded truncate ${CAL_SOURCE_STYLES[r.source] || CAL_SOURCE_STYLES.particular}`}>
                    {r.name.split(' ')[0]}
                  </button>
                ))}
                {dayRes.length > 3 && (
                  <span className="text-xs text-stone-400 px-1">+{dayRes.length - 3} más</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!hasReservationsThisMonth && (
        <div className="mt-4 p-3 rounded-lg bg-stone-50 border border-stone-100 text-center">
          <p className="text-xs text-stone-400 mb-2">No hay reservas en este mes.</p>
          <div className="flex items-center justify-center gap-2">
            {monthsWithReservations.some(m => m < calMonth) && (
              <button onClick={goToPrevMonthWithReservations}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                ‹ Mes anterior con reservas
              </button>
            )}
            {monthsWithReservations.some(m => m > calMonth) && (
              <button onClick={goToNextMonthWithReservations}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                Próximo mes con reservas ›
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
        {Object.entries(SOURCE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm ${CAL_SOURCE_STYLES[key]}`} />
            <span className="text-xs text-stone-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
