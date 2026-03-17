'use client'

import { useState, useMemo, useEffect } from 'react'
import { Reservation, MonthlyCost, Property } from '@/lib/types'

type View = 'table' | 'calendar'
type MsgType = 'confirm' | 'checkin' | 'checkout'

const DEFAULT_TEMPLATE_CONFIRM =
`Hola *{nombre}*! 😊

Te escribimos para confirmar tu reserva en *Hospedaje Colón*.

📅 *Ingreso:* {checkin}
📅 *Egreso:* {checkout}
🌙 *Noches:* {noches}
👥 *Personas:* {personas}

Por favor confirmanos si todo está correcto. ¡Muchas gracias!`

const DEFAULT_TEMPLATE_CHECKIN =
`Hola *{nombre}*! 😊

Te esperamos hoy en *Hospedaje Colón*.

📅 *Check-in:* {checkin}
🌙 *Noches:* {noches}
👥 *Personas:* {personas}

Ante cualquier consulta no dudes en escribirnos. ¡Bienvenido/a!`

const DEFAULT_TEMPLATE_CHECKOUT =
`Hola *{nombre}*! 😊

Te recordamos que mañana, *{checkout}*, es tu día de salida de *Hospedaje Colón*.

¡Esperamos que hayas disfrutado tu estadía! Fue un placer tenerte con nosotros. 🙏`

const MSG_LABELS: Record<MsgType, string> = {
  confirm: 'Confirmación',
  checkin: 'Ingreso',
  checkout: 'Egreso',
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function toDateStr(d: string | Date): string {
  if (!d) return ""
  if (typeof d === "string") return d
  return d.toISOString()
}

function nightsBetween(a: string | Date, b: string | Date) {
  return Math.max(0, Math.round((new Date(toDateStr(b)).getTime() - new Date(toDateStr(a)).getTime()) / 86400000))
}
function formatDate(d: string | Date) {
  if (!d) return "—"
  const s = toDateStr(d)
  const [y, m, day] = s.split("T")[0].split("-")
  return `${day}/${m}/${y}`
}
function formatARS(n: number) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function monthKey(d: string | Date) {
  const s = toDateStr(d)
  return s ? s.slice(0, 7) : ""
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
}
const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}
const SOURCE_LABELS: Record<string, string> = {
  booking: 'Booking',
  airbnb: 'Airbnb',
  particular: 'Particular',
}
const SOURCE_STYLES: Record<string, string> = {
  booking: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  airbnb: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  particular: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
}

const CAL_SOURCE_STYLES: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-700 border-l-2 border-blue-400',
  airbnb: 'bg-rose-100 text-rose-700 border-l-2 border-rose-400',
  particular: 'bg-stone-100 text-stone-700 border-l-2 border-stone-400',
}
const DOW_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function CalendarView({
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
  // Monday=0 offset
  const startDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  function dayStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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

  // Find months that have at least one reservation
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
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">‹</button>
        <span className="text-sm font-semibold text-stone-800">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">›</button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
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

      {/* Empty month notice */}
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

      {/* Legend */}
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

const COST_TYPES = ['Comisión Booking', 'Limpieza', 'Otro', 'Productos', 'Reparaciones']

const emptyForm = {
  name: '', phone: '', checkin: '', checkout: '',
  guests: 1, cost: 0, sena: 0, status: 'confirmed' as const,
  source: 'particular' as const, notes: '',
}

const emptyMonthlyCostForm = { description: '', type: 'Limpieza', cost: 0, year_month: '' }

const emptyPropertyForm = { name: '', address: '', rooms: 1, capacity: 2, google_maps_url: '', instagram_url: '' }

export default function ReservationsClient({
  initialReservations,
  initialProperties,
}: {
  initialReservations: Reservation[]
  initialProperties: Property[]
}) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    initialProperties[0]?.id ?? null
  )
  const [propertiesModal, setPropertiesModal] = useState(false)
  const [propertyForm, setPropertyForm] = useState({ ...emptyPropertyForm })
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null)

  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [filterMonth, setFilterMonth] = useState(currentMonthKey)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [syncing, setSyncing] = useState(false)
  const [alert, setAlert] = useState<{ msg: string; type: 'green' | 'red' | 'amber' } | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [view, setView] = useState<View>('table')
  const today2 = new Date()
  const [calMonth, setCalMonth] = useState(`${today2.getFullYear()}-${String(today2.getMonth() + 1).padStart(2, '0')}`)
  const [configOpen, setConfigOpen] = useState(false)
  const [configForm, setConfigForm] = useState({
    ical_url: '',
    template_confirm: DEFAULT_TEMPLATE_CONFIRM,
    template_checkin: DEFAULT_TEMPLATE_CHECKIN,
    template_checkout: DEFAULT_TEMPLATE_CHECKOUT,
  })
  const [configSaving, setConfigSaving] = useState(false)
  const [notifPhones, setNotifPhones] = useState<{ phone: string; apikey: string }[]>([])
  const [notifForm, setNotifForm] = useState({ phone: '', apikey: '' })
  const [templates, setTemplates] = useState({
    confirm: DEFAULT_TEMPLATE_CONFIRM,
    checkin: DEFAULT_TEMPLATE_CHECKIN,
    checkout: DEFAULT_TEMPLATE_CHECKOUT,
  })
  const [msgReservation, setMsgReservation] = useState<Reservation | null>(null)
  const [msgTab, setMsgTab] = useState<MsgType>('confirm')
  const [copied, setCopied] = useState(false)

  // Exchange rate
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false)
  const [usdAmount, setUsdAmount] = useState<number | ''>('')

  // Monthly costs
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [monthlyMgmt, setMonthlyMgmt] = useState(false)
  const [monthlyCostForm, setMonthlyCostForm] = useState({ ...emptyMonthlyCostForm })

  useEffect(() => {
    const today = new Date()
    if (today.getDate() === 1) {
      setAlert({ msg: `Recordatorio: hoy es 1° de ${MONTHS_ES[today.getMonth()]}. Revisá las reservas y contactá a los huéspedes.`, type: 'amber' })
    }
    fetch('/api/settings').then(r => r.json()).then(data => {
      setTemplates({
        confirm: data.template_confirm || DEFAULT_TEMPLATE_CONFIRM,
        checkin: data.template_checkin || DEFAULT_TEMPLATE_CHECKIN,
        checkout: data.template_checkout || DEFAULT_TEMPLATE_CHECKOUT,
      })
    }).catch(() => {})
  }, [])

  function applyTemplate(type: MsgType, r: Reservation): string {
    const sena = Number(r.sena || 0)
    let tpl = templates[type]
    // If no deposit, remove any line that contains {seña} entirely
    if (sena <= 0) {
      tpl = tpl.split('\n').filter(line => !line.includes('{seña}')).join('\n')
    }
    return tpl
      .replace(/{nombre}/g, r.name)
      .replace(/{checkin}/g, formatDate(r.checkin))
      .replace(/{checkout}/g, formatDate(r.checkout))
      .replace(/{noches}/g, String(nightsBetween(r.checkin, r.checkout)))
      .replace(/{personas}/g, String(r.guests))
      .replace(/{seña}/g, formatARS(sena))
      .replace(/{total}/g, formatARS(Number(r.cost || 0)))
  }

  const months = useMemo(() => {
    const keys = [...new Set(reservations.map(r => monthKey(r.checkin)).filter(Boolean))].sort().reverse()
    return keys.map(k => {
      const [y, m] = k.split('-')
      return { key: k, label: `${MONTHS[parseInt(m) - 1]} ${y}` }
    })
  }, [reservations])

  const filtered = useMemo(() => {
    return reservations
      .filter(r => selectedPropertyId === null || r.property_id === selectedPropertyId)
      .filter(r => filterMonth === 'all' || monthKey(r.checkin) === filterMonth)
      .sort((a, b) => a.checkin > b.checkin ? 1 : -1)
  }, [reservations, filterMonth, selectedPropertyId])

  const metrics = useMemo(() => {
    const active = filtered.filter(r => r.status !== 'cancelled')
    return {
      count: active.length,
      nights: active.reduce((s, r) => s + nightsBetween(r.checkin, r.checkout), 0),
      guests: active.reduce((s, r) => s + Number(r.guests), 0),
      revenue: active.reduce((s, r) => s + Number(r.cost), 0),
    }
  }, [filtered])

  const totals = useMemo(() => {
    const rows = filtered.filter(r => r.status !== 'cancelled')
    return {
      nights: rows.reduce((s, r) => s + nightsBetween(r.checkin, r.checkout), 0),
      guests: rows.reduce((s, r) => s + Number(r.guests), 0),
      sena: rows.reduce((s, r) => s + Number(r.sena || 0), 0),
      cost: rows.reduce((s, r) => s + Number(r.cost || 0), 0),
    }
  }, [filtered])

  function showAlert(msg: string, type: 'green' | 'red' | 'amber') {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 6000)
  }

  async function fetchReservations() {
    const url = selectedPropertyId ? `/api/reservations?property_id=${selectedPropertyId}` : '/api/reservations'
    const res = await fetch(url)
    const data = await res.json()
    setReservations(data)
    setSelected(new Set())
  }

  // Selection
  const allFilteredIds = filtered.map(r => r.id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allFilteredIds))
    }
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Delete
  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminás esta reserva?')) return
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    setReservations(prev => prev.filter(r => r.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  async function handleDeleteSelected() {
    if (!window.confirm(`¿Eliminás las ${selected.size} reservas seleccionadas?`)) return
    await Promise.all([...selected].map(id => fetch(`/api/reservations/${id}`, { method: 'DELETE' })))
    setReservations(prev => prev.filter(r => !selected.has(r.id)))
    setSelected(new Set())
    showAlert(`${selected.size} reservas eliminadas.`, 'green')
  }

  // Exchange rate fetch
  async function fetchExchangeRate() {
    if (exchangeRate !== null) return // already loaded
    setExchangeRateLoading(true)
    try {
      const res = await fetch('/api/exchange-rate')
      const data = await res.json()
      if (data.rate) setExchangeRate(data.rate)
    } catch {}
    setExchangeRateLoading(false)
  }

  // Modal
  function openNew() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setUsdAmount('')
    fetchExchangeRate()
    setModalOpen(true)
  }

  function openEdit(r: Reservation) {
    setEditingId(r.id)
    setUsdAmount('')
    fetchExchangeRate()
    setForm({
      name: r.name,
      phone: r.phone || '',
      checkin: toDateStr(r.checkin).split('T')[0],
      checkout: toDateStr(r.checkout).split('T')[0],
      guests: r.guests,
      cost: r.cost,
      sena: r.sena || 0,
      status: r.status as any,
      source: (r.source || 'particular') as any,
      notes: r.notes || '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.checkin || !form.checkout) {
      window.alert('Completá nombre y fechas.'); return
    }
    if (editingId !== null) {
      await fetch(`/api/reservations/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, property_id: selectedPropertyId }),
      })
    } else {
      await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, property_id: selectedPropertyId }),
      })
    }
    setModalOpen(false)
    await fetchReservations()
  }

  // Config
  async function openConfig() {
    const res = await fetch('/api/settings')
    const data = await res.json()
    setConfigForm({
      ical_url: data.ical_url || '',
      template_confirm: data.template_confirm || DEFAULT_TEMPLATE_CONFIRM,
      template_checkin: data.template_checkin || DEFAULT_TEMPLATE_CHECKIN,
      template_checkout: data.template_checkout || DEFAULT_TEMPLATE_CHECKOUT,
    })
    try { setNotifPhones(data.notification_phones ? JSON.parse(data.notification_phones) : []) } catch { setNotifPhones([]) }
    setNotifForm({ phone: '', apikey: '' })
    setConfigOpen(true)
  }

  async function handleSaveConfig() {
    setConfigSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configForm),
    })
    setConfigSaving(false)
    if (!res.ok) {
      const data = await res.json()
      showAlert(data.error || 'Error al guardar la configuración.', 'red')
      return
    }
    setTemplates({
      confirm: configForm.template_confirm,
      checkin: configForm.template_checkin,
      checkout: configForm.template_checkout,
    })
    setConfigOpen(false)
    showAlert('Configuración guardada.', 'green')
  }

  async function saveNotifPhones(phones: { phone: string; apikey: string }[]) {
    const res = await fetch('/api/notification-phones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones }),
    })
    if (res.status === 401) { window.location.href = '/login'; return }
    if (!res.ok) showAlert('Error al guardar los teléfonos.', 'red')
  }

  // Monthly costs
  async function fetchMonthlyCosts(month: string) {
    if (month === 'all') { setMonthlyCosts([]); return }
    const pid = selectedPropertyId ? `&property_id=${selectedPropertyId}` : ''
    const res = await fetch(`/api/monthly-costs?month=${month}${pid}`)
    setMonthlyCosts(await res.json())
  }

  useEffect(() => { fetchMonthlyCosts(filterMonth) }, [filterMonth, selectedPropertyId])

  async function handleAddMonthlyCost() {
    if (!monthlyCostForm.description) { window.alert('Ingresá una descripción.'); return }
    if (!monthlyCostForm.year_month) { window.alert('Seleccioná un mes.'); return }
    await fetch('/api/monthly-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...monthlyCostForm, property_id: selectedPropertyId }),
    })
    if (monthlyCostForm.year_month === filterMonth) await fetchMonthlyCosts(filterMonth)
    setMonthlyCostForm(f => ({ ...emptyMonthlyCostForm, year_month: f.year_month }))
  }

  async function handleDeleteMonthlyCost(id: number) {
    await fetch(`/api/monthly-costs/${id}`, { method: 'DELETE' })
    setMonthlyCosts(prev => prev.filter(c => c.id !== id))
  }

  // Properties
  async function fetchProperties() {
    const res = await fetch('/api/properties')
    const data: Property[] = await res.json()
    setProperties(data)
    setSelectedPropertyId(prev => prev ?? data[0]?.id ?? null)
  }

  async function handleSaveProperty() {
    if (!propertyForm.name) { window.alert('El nombre es requerido.'); return }
    if (editingPropertyId !== null) {
      await fetch(`/api/properties/${editingPropertyId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(propertyForm),
      })
    } else {
      const res = await fetch('/api/properties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(propertyForm),
      })
      const created = await res.json()
      if (!selectedPropertyId) setSelectedPropertyId(created.id)
    }
    await fetchProperties()
    setPropertyForm({ ...emptyPropertyForm })
    setEditingPropertyId(null)
  }

  async function handleDeleteProperty(id: number) {
    if (!window.confirm('¿Eliminás este alojamiento? Las reservas asociadas quedarán sin alojamiento asignado.')) return
    await fetch(`/api/properties/${id}`, { method: 'DELETE' })
    const remaining = properties.filter(p => p.id !== id)
    if (selectedPropertyId === id) setSelectedPropertyId(remaining[0]?.id ?? null)
    await fetchProperties()
  }

  function openEditProperty(p: Property) {
    setEditingPropertyId(p.id)
    setPropertyForm({
      name: p.name,
      address: p.address || '',
      rooms: p.rooms || 1,
      capacity: p.capacity || 2,
      google_maps_url: p.google_maps_url || '',
      instagram_url: p.instagram_url || '',
    })
  }

  // Sync
  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-ical', {
        method: 'POST',
        headers: selectedPropertyId ? { 'X-Property-Id': String(selectedPropertyId) } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchReservations()
      const skippedMsg = data.skipped > 0 ? `, ${data.skipped} sin modificar (editadas manualmente)` : ''
      showAlert(`Sincronización exitosa: ${data.added} nuevas, ${data.updated} actualizadas${skippedMsg}.`, 'green')
    } catch (err: any) {
      showAlert('Error al sincronizar: ' + err.message, 'red')
    }
    setSyncing(false)
  }

  async function handleIcsUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const res = await fetch('/api/sync-ical', {
      method: 'POST',
      headers: {
        'X-ICS-Content': encodeURIComponent(text),
        ...(selectedPropertyId ? { 'X-Property-Id': String(selectedPropertyId) } : {}),
      },
    })
    const data = await res.json()
    if (!res.ok) { showAlert('Error: ' + data.error, 'red'); return }
    await fetchReservations()
    showAlert(`Importación exitosa: ${data.added} nuevas, ${data.updated} actualizadas.`, 'green')
    e.target.value = ''
  }

  return (
    <main className="min-h-screen bg-stone-50 font-sans">
      <div className="px-6 py-8">

        {alert && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            alert.type === 'green' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            alert.type === 'red' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {alert.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight shrink-0">HospedAr</h1>
            <div className="flex items-center gap-2 min-w-0">
              <select
                value={selectedPropertyId ?? ''}
                onChange={e => {
                  setSelectedPropertyId(Number(e.target.value))
                  setSelected(new Set())
                }}
                className="text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-700 bg-white max-w-[220px] truncate">
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => { setPropertiesModal(true); setPropertyForm({ ...emptyPropertyForm }); setEditingPropertyId(null) }}
                className="text-sm px-3 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors shrink-0">
                Alojamientos
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={openNew}
              className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors">
              + Nueva reserva
            </button>
            <button onClick={openConfig}
              className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors">
              Ajustes
            </button>
            <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }}
              className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors">
              Salir
            </button>
          </div>
        </div>

        {/* Sync bar */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-stone-200">
          <span className="text-sm text-stone-500 flex-1">Sincronizar con Booking.com</span>
          <button onClick={handleSync} disabled={syncing}
            className="text-sm px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
            {syncing ? 'Sincronizando...' : '↻ Sincronizar'}
          </button>
          <span className="text-stone-300">|</span>
          <label className="cursor-pointer text-sm px-4 py-2 rounded-lg bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 transition-colors">
            Subir .ics
            <input type="file" accept=".ics" className="hidden" onChange={handleIcsUpload} />
          </label>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Reservas', value: metrics.count },
            { label: 'Noches ocupadas', value: metrics.nights },
            { label: 'Huéspedes', value: metrics.guests },
            { label: 'Ingresos', value: formatARS(metrics.revenue) },
            { label: 'Costos', value: filterMonth !== 'all' ? formatARS(monthlyCosts.reduce((s, c) => s + Number(c.cost), 0)) : '—' },
            { label: 'Ganancia', value: filterMonth !== 'all' ? formatARS(metrics.revenue - monthlyCosts.reduce((s, c) => s + Number(c.cost), 0)) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">{label}</p>
              <p className="text-2xl font-semibold text-stone-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Table / Calendar */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-stone-700">
                {view === 'table' ? 'Listado de reservas' : 'Calendario'}
              </span>
              {view === 'table' && someSelected && (
                <button onClick={handleDeleteSelected}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                  Borrar seleccionadas ({selected.size})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {view === 'table' && (
                <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setSelected(new Set()) }}
                  className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 bg-white">
                  <option value="all">Todos los meses</option>
                  {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              )}
              {/* View toggle */}
              <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                <button onClick={() => setView('table')}
                  className={`text-xs px-3 py-1.5 transition-colors ${view === 'table' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
                  Tabla
                </button>
                <button onClick={() => setView('calendar')}
                  className={`text-xs px-3 py-1.5 border-l border-stone-200 transition-colors ${view === 'calendar' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
                  Calendario
                </button>
              </div>
            </div>
          </div>

          {view === 'table' ? (
            filtered.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-sm">
                No hay reservas. Sincronizá con Booking o agregá una manualmente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-stone-400 uppercase tracking-wide border-b border-stone-100">
                      <th className="px-4 py-3 w-8">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
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
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
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
                            <button onClick={() => openEdit(r)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                              Editar
                            </button>
                            <button onClick={() => { setMsgReservation(r); setMsgTab('confirm'); setCopied(false) }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                              ✉ Mensaje
                            </button>
                            <button onClick={() => handleDelete(r.id)}
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
          ) : (
            <CalendarView reservations={reservations} calMonth={calMonth} setCalMonth={setCalMonth} onEdit={openEdit} />
          )}
        </div>

        {/* Monthly financial summary */}
        {filterMonth !== 'all' && (() => {
          const monthlyTotal = monthlyCosts.reduce((s, c) => s + Number(c.cost), 0)
          const netProfit = totals.cost - monthlyTotal
          const monthLabel2 = months.find(m => m.key === filterMonth)?.label ?? filterMonth
          return (
            <div className="mt-4 bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <span className="text-sm font-medium text-stone-700">Resumen financiero — {monthLabel2}</span>
                <button onClick={() => { setMonthlyMgmt(true); setMonthlyCostForm({ ...emptyMonthlyCostForm, year_month: filterMonth }) }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                  Gestionar costos del mes
                </button>
              </div>
              <div className="px-5 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Ingresos del mes</span>
                  <span className="font-medium text-stone-800">{formatARS(totals.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Costos del mes</span>
                  <span className="font-medium text-red-600">
                    {monthlyTotal > 0 ? `- ${formatARS(monthlyTotal)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-100 font-semibold">
                  <span className="text-stone-700">Ganancia neta</span>
                  <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatARS(netProfit)}</span>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 border-b border-stone-100">
              <h2 className="text-lg font-semibold text-stone-900">
                {editingId !== null ? 'Editar reserva' : 'Nueva reserva'}
              </h2>
            </div>

            <div className="overflow-y-auto px-6 py-4 flex-1">
              <div className="space-y-4">
                {/* Row 1: Nombre + Teléfono */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-stone-500 block mb-1">Nombre del huésped</label>
                    <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Juan Pérez" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Teléfono</label>
                    <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+54 11 1234-5678" />
                  </div>
                </div>

                {/* Row 2: Fechas + Personas */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Fecha de llegada</label>
                    <input type="date" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.checkin} onChange={e => setForm(f => ({ ...f, checkin: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Fecha de salida</label>
                    <input type="date" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.checkout} onChange={e => setForm(f => ({ ...f, checkout: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Personas</label>
                    <input type="number" min={1} max={20} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.guests} onChange={e => setForm(f => ({ ...f, guests: parseInt(e.target.value) || 1 }))} />
                  </div>
                </div>

                {/* Row 3: Seña + Costo ARS + USD */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Seña (ARS $)</label>
                    <input type="number" min={0} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.sena} onChange={e => setForm(f => ({ ...f, sena: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Costo total (ARS $)</label>
                    <input type="number" min={0} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.cost} onChange={e => { setUsdAmount(''); setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 })) }} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Total en USD</label>
                    <input type="number" min={0} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={usdAmount}
                      placeholder="0"
                      onChange={e => {
                        const usd = parseFloat(e.target.value) || 0
                        setUsdAmount(e.target.value === '' ? '' : usd)
                        if (exchangeRate && usd > 0) {
                          setForm(f => ({ ...f, cost: Math.round(usd * exchangeRate) }))
                        }
                      }} />
                  </div>
                </div>
                <div className="text-xs text-stone-400 -mt-2">
                  {exchangeRateLoading && 'Obteniendo tipo de cambio BNA…'}
                  {!exchangeRateLoading && exchangeRate && (
                    <>TC BNA mid: <span className="font-medium text-stone-500">{formatARS(exchangeRate)}</span>{usdAmount !== '' && Number(usdAmount) > 0 && <> · USD {usdAmount} = <span className="font-medium text-stone-500">{formatARS(Math.round(Number(usdAmount) * exchangeRate))}</span></>}</>
                  )}
                  {!exchangeRateLoading && !exchangeRate && 'No se pudo obtener el tipo de cambio.'}
                </div>

                {/* Row 4: Estado + Fuente + Notas */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Estado</label>
                    <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                      <option value="confirmed">Confirmada</option>
                      <option value="pending">Pendiente</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Fuente</label>
                    <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as any }))}>
                      <option value="booking">Booking</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="particular">Particular</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Notas (opcional)</label>
                    <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Solicitaron cuna" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-white rounded-b-2xl">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
                Guardar reserva
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message modal */}
      {msgReservation && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setMsgReservation(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">Generar mensaje</h2>
              <button onClick={() => setMsgReservation(null)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Para <span className="font-medium text-stone-700">{msgReservation.name}</span>
            </p>

            {/* Tabs */}
            <div className="flex rounded-lg border border-stone-200 overflow-hidden mb-4">
              {(['confirm', 'checkin', 'checkout'] as MsgType[]).map(type => (
                <button key={type} onClick={() => { setMsgTab(type); setCopied(false) }}
                  className={`flex-1 text-xs px-3 py-2 transition-colors border-r border-stone-200 last:border-r-0 ${msgTab === type ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
                  {MSG_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Message preview */}
            <textarea
              readOnly
              rows={10}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 font-mono bg-stone-50 resize-none focus:outline-none"
              value={applyTemplate(msgTab, msgReservation)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setMsgReservation(null)}
                className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                Cerrar
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText(applyTemplate(msgTab, msgReservation))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
                className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly costs modal */}
      {monthlyMgmt && filterMonth !== 'all' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setMonthlyMgmt(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">Costos del mes</h2>
              <button onClick={() => setMonthlyMgmt(false)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
            </div>
            <p className="text-xs text-stone-500 mb-4">{months.find(m => m.key === filterMonth)?.label ?? filterMonth}</p>

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
                        <button onClick={() => handleDeleteMonthlyCost(c.id)}
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
              <button onClick={() => setMonthlyMgmt(false)}
                className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                Cerrar
              </button>
              <button onClick={handleAddMonthlyCost}
                className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties modal */}
      {propertiesModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setPropertiesModal(false); setEditingPropertyId(null); setPropertyForm({ ...emptyPropertyForm }) } }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-stone-900">Alojamientos</h2>
              <button onClick={() => { setPropertiesModal(false); setEditingPropertyId(null); setPropertyForm({ ...emptyPropertyForm }) }}
                className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
            </div>

            {/* List */}
            {properties.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4 mb-4">No hay alojamientos registrados.</p>
            ) : (
              <div className="space-y-3 mb-5">
                {properties.map(p => (
                  <div key={p.id} className={`rounded-xl border p-4 ${selectedPropertyId === p.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button onClick={() => { setSelectedPropertyId(p.id); setPropertiesModal(false) }}
                          className="font-medium text-stone-800 text-sm hover:text-stone-600 text-left">
                          {p.name}{selectedPropertyId === p.id && <span className="ml-2 text-xs text-stone-400">(activo)</span>}
                        </button>
                        {p.address && <p className="text-xs text-stone-500 mt-0.5 truncate">📍 {p.address}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          {p.rooms && <span className="text-xs text-stone-400">{p.rooms} hab.</span>}
                          {p.capacity && <span className="text-xs text-stone-400">{p.capacity} personas</span>}
                          {p.google_maps_url && <a href={p.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Maps</a>}
                          {p.instagram_url && <a href={p.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-500 hover:underline">Instagram</a>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditProperty(p)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleDeleteProperty(p.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <div className="border-t border-stone-100 pt-4">
              <p className="text-xs font-medium text-stone-600 mb-3">
                {editingPropertyId !== null ? 'Editar alojamiento' : 'Agregar alojamiento'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Nombre *</label>
                  <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    value={propertyForm.name} onChange={e => setPropertyForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Casa del Mar" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Dirección</label>
                  <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    value={propertyForm.address} onChange={e => setPropertyForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Ej: Av. Del Mar 123, Mar del Plata" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Habitaciones</label>
                    <input type="number" min={1} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={propertyForm.rooms} onChange={e => setPropertyForm(f => ({ ...f, rooms: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Capacidad (personas)</label>
                    <input type="number" min={1} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      value={propertyForm.capacity} onChange={e => setPropertyForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Link Google Maps</label>
                  <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    value={propertyForm.google_maps_url} onChange={e => setPropertyForm(f => ({ ...f, google_maps_url: e.target.value }))}
                    placeholder="https://maps.google.com/..." />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Link Instagram</label>
                  <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    value={propertyForm.instagram_url} onChange={e => setPropertyForm(f => ({ ...f, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {editingPropertyId !== null && (
                <button onClick={() => { setEditingPropertyId(null); setPropertyForm({ ...emptyPropertyForm }) }}
                  className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                  Cancelar edición
                </button>
              )}
              <button onClick={() => { setPropertiesModal(false); setEditingPropertyId(null); setPropertyForm({ ...emptyPropertyForm }) }}
                className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                Cerrar
              </button>
              <button onClick={handleSaveProperty}
                className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
                {editingPropertyId !== null ? 'Guardar cambios' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config modal */}
      {configOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setConfigOpen(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-1">Ajustes</h2>
            <p className="text-xs text-stone-400 mb-5">La configuración se guarda en la base de datos y aplica a todos los usuarios.</p>

            <div className="space-y-5">
              <div>
                <label className="text-xs text-stone-500 block mb-1">URL iCal de Booking.com</label>
                <input
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 font-mono"
                  value={configForm.ical_url}
                  onChange={e => setConfigForm(f => ({ ...f, ical_url: e.target.value }))}
                  placeholder="https://ical.booking.com/v1/export?t=..."
                />
                <p className="text-xs text-stone-400 mt-1">Encontrala en Booking.com → Propiedades → Calendario → Exportar.</p>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-medium text-stone-600 mb-3">Plantillas de mensajes (WhatsApp)</p>
                <p className="text-xs text-stone-400 mb-3">Variables disponibles: <code className="bg-stone-100 px-1 rounded">{'{nombre}'}</code> <code className="bg-stone-100 px-1 rounded">{'{checkin}'}</code> <code className="bg-stone-100 px-1 rounded">{'{checkout}'}</code> <code className="bg-stone-100 px-1 rounded">{'{noches}'}</code> <code className="bg-stone-100 px-1 rounded">{'{personas}'}</code> <code className="bg-stone-100 px-1 rounded">{'{seña}'}</code> <code className="bg-stone-100 px-1 rounded">{'{total}'}</code> — Negrita: <code className="bg-stone-100 px-1 rounded">*texto*</code> Cursiva: <code className="bg-stone-100 px-1 rounded">_texto_</code></p>
                {([
                  { key: 'template_confirm', label: 'Solicitud de Confirmación' },
                  { key: 'template_checkin', label: 'Mensaje de Ingreso' },
                  { key: 'template_checkout', label: 'Mensaje de Egreso' },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="mb-3">
                    <label className="text-xs text-stone-500 block mb-1">{label}</label>
                    <textarea
                      rows={5}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 font-mono resize-y"
                      value={configForm[key]}
                      onChange={e => setConfigForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notification phones */}
            <div className="border-t border-stone-100 pt-4 mt-2">
              <p className="text-xs font-medium text-stone-600 mb-1">Notificaciones por WhatsApp</p>
              <p className="text-xs text-stone-400 mb-3">
                Se envía un mensaje el día anterior a cada reserva. Requiere <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">CallMeBot</a>: enviá <code className="bg-stone-100 px-1 rounded">I allow callmebot to send me messages</code> al <strong>+34 644 71 98 98</strong> por WhatsApp para obtener tu API key.
              </p>
              {notifPhones.length > 0 && (
                <div className="space-y-2 mb-3">
                  {notifPhones.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-stone-50 rounded-lg px-3 py-2">
                      <span className="text-stone-700 font-medium flex-1">+{p.phone}</span>
                      <span className="text-stone-400">key: {p.apikey}</span>
                      <button onClick={() => { const updated = notifPhones.filter((_, j) => j !== i); setNotifPhones(updated); saveNotifPhones(updated) }}
                        className="text-stone-300 hover:text-red-500 transition-colors ml-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  placeholder="Teléfono (ej: 5491112345678)"
                  value={notifForm.phone}
                  onChange={e => setNotifForm(f => ({ ...f, phone: e.target.value }))}
                />
                <input
                  className="w-28 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  placeholder="API key"
                  value={notifForm.apikey}
                  onChange={e => setNotifForm(f => ({ ...f, apikey: e.target.value }))}
                />
                <button
                  onClick={() => {
                    if (!notifForm.phone || !notifForm.apikey) return
                    const newPhone = { phone: notifForm.phone.replace(/\D/g, ''), apikey: notifForm.apikey.trim() }
                    const updated = [...notifPhones, newPhone]
                    setNotifPhones(updated)
                    setNotifForm({ phone: '', apikey: '' })
                    saveNotifPhones(updated)
                  }}
                  className="px-3 py-2 text-sm rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors shrink-0">
                  + Agregar
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfigOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveConfig} disabled={configSaving}
                className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-50">
                {configSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
