'use client'

import { useState, useMemo, useEffect } from 'react'
import { Reservation, MonthlyCost, Property } from '@/lib/types'
import { toDateStr, nightsBetween, formatDate, formatARS, monthKey } from '@/lib/formatters'
import { MONTHS, MONTHS_ES, DEFAULT_TEMPLATE_CONFIRM, DEFAULT_TEMPLATE_CHECKIN, DEFAULT_TEMPLATE_CHECKOUT, MsgType } from '@/lib/constants'
import CalendarView from './CalendarView'
import ReservationsTable from './ReservationsTable'
import ReservationModal, { ReservationFormState } from './ReservationModal'
import MessageModal from './MessageModal'
import MonthlyCostsModal, { MonthlyCostFormState } from './MonthlyCostsModal'
import PropertiesModal, { PropertyFormState } from './PropertiesModal'
import SettingsModal from './SettingsModal'

type View = 'table' | 'calendar'

const emptyForm: ReservationFormState = {
  name: '', phone: '', checkin: '', checkout: '',
  guests: 1, cost: 0, sena: 0, status: 'confirmed', source: 'particular', notes: '',
}
const emptyMonthlyCostForm: MonthlyCostFormState = { description: '', type: 'Limpieza', cost: 0, year_month: '' }

export default function ReservationsClient({
  initialReservations,
  initialProperties,
}: {
  initialReservations: Reservation[]
  initialProperties: Property[]
}) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(initialProperties[0]?.id ?? null)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [filterMonth, setFilterMonth] = useState(currentMonthKey)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ReservationFormState>({ ...emptyForm })
  const [syncing, setSyncing] = useState(false)
  const [alert, setAlert] = useState<{ msg: string; type: 'green' | 'red' | 'amber' } | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [view, setView] = useState<View>('table')
  const today = new Date()
  const [calMonth, setCalMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
  const [propertiesModal, setPropertiesModal] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [templates, setTemplates] = useState({
    confirm: DEFAULT_TEMPLATE_CONFIRM,
    checkin: DEFAULT_TEMPLATE_CHECKIN,
    checkout: DEFAULT_TEMPLATE_CHECKOUT,
  })
  const [msgReservation, setMsgReservation] = useState<Reservation | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false)
  const [usdAmount, setUsdAmount] = useState<number | ''>('')
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [monthlyMgmt, setMonthlyMgmt] = useState(false)
  const [monthlyCostForm, setMonthlyCostForm] = useState<MonthlyCostFormState>({ ...emptyMonthlyCostForm })

  useEffect(() => {
    const now = new Date()
    if (now.getDate() === 1) {
      setAlert({ msg: `Recordatorio: hoy es 1° de ${MONTHS_ES[now.getMonth()]}. Revisá las reservas y contactá a los huéspedes.`, type: 'amber' })
    }
    fetch('/api/settings').then(r => r.json()).then(data => {
      setTemplates({
        confirm: data.template_confirm || DEFAULT_TEMPLATE_CONFIRM,
        checkin: data.template_checkin || DEFAULT_TEMPLATE_CHECKIN,
        checkout: data.template_checkout || DEFAULT_TEMPLATE_CHECKOUT,
      })
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchMonthlyCosts(filterMonth) }, [filterMonth, selectedPropertyId])

  function applyTemplate(type: MsgType, r: Reservation): string {
    const sena = Number(r.sena || 0)
    const property = properties.find(p => p.id === (r.property_id ?? selectedPropertyId))
    let tpl = templates[type]
    if (sena <= 0) tpl = tpl.split('\n').filter(line => !line.includes('{seña}')).join('\n')
    if (!property?.address) tpl = tpl.split('\n').filter(line => !line.includes('{direccion}')).join('\n')
    if (!property?.google_maps_url) tpl = tpl.split('\n').filter(line => !line.includes('{maps}')).join('\n')
    return tpl
      .replace(/{nombre}/g, r.name)
      .replace(/{checkin}/g, formatDate(r.checkin))
      .replace(/{checkout}/g, formatDate(r.checkout))
      .replace(/{noches}/g, String(nightsBetween(r.checkin, r.checkout)))
      .replace(/{personas}/g, String(r.guests))
      .replace(/{seña}/g, formatARS(sena))
      .replace(/{total}/g, formatARS(Number(r.cost || 0)))
      .replace(/{direccion}/g, property?.address || '')
      .replace(/{maps}/g, property?.google_maps_url || '')
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
    const data = await fetch(url).then(r => r.json())
    setReservations(data)
    setSelected(new Set())
  }

  const allFilteredIds = filtered.map(r => r.id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(allFilteredIds))
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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

  async function fetchExchangeRate() {
    if (exchangeRate !== null) return
    setExchangeRateLoading(true)
    try {
      const data = await fetch('/api/exchange-rate').then(r => r.json())
      if (data.rate) setExchangeRate(data.rate)
    } catch {}
    setExchangeRateLoading(false)
  }

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
      status: r.status,
      source: (r.source || 'particular') as any,
      notes: r.notes || '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.checkin || !form.checkout) {
      window.alert('Completá nombre y fechas.'); return
    }
    const url = editingId !== null ? `/api/reservations/${editingId}` : '/api/reservations'
    const method = editingId !== null ? 'PUT' : 'POST'
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, property_id: selectedPropertyId }),
    })
    setModalOpen(false)
    await fetchReservations()
  }

  async function fetchMonthlyCosts(month: string) {
    if (month === 'all') { setMonthlyCosts([]); return }
    const pid = selectedPropertyId ? `&property_id=${selectedPropertyId}` : ''
    setMonthlyCosts(await fetch(`/api/monthly-costs?month=${month}${pid}`).then(r => r.json()))
  }

  async function handleAddMonthlyCost() {
    if (!monthlyCostForm.description) { window.alert('Ingresá una descripción.'); return }
    if (!monthlyCostForm.year_month) { window.alert('Seleccioná un mes.'); return }
    await fetch('/api/monthly-costs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...monthlyCostForm, property_id: selectedPropertyId }),
    })
    if (monthlyCostForm.year_month === filterMonth) await fetchMonthlyCosts(filterMonth)
    setMonthlyCostForm(f => ({ ...emptyMonthlyCostForm, year_month: f.year_month }))
  }

  async function handleDeleteMonthlyCost(id: number) {
    await fetch(`/api/monthly-costs/${id}`, { method: 'DELETE' })
    setMonthlyCosts(prev => prev.filter(c => c.id !== id))
  }

  async function fetchProperties() {
    const data: Property[] = await fetch('/api/properties').then(r => r.json())
    setProperties(data)
    setSelectedPropertyId(prev => prev ?? data[0]?.id ?? null)
  }

  async function handleSaveProperty(propertyForm: PropertyFormState, editingPropertyId: number | null) {
    if (editingPropertyId !== null) {
      await fetch(`/api/properties/${editingPropertyId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(propertyForm),
      })
    } else {
      const created = await fetch('/api/properties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(propertyForm),
      }).then(r => r.json())
      if (!selectedPropertyId) setSelectedPropertyId(created.id)
    }
    await fetchProperties()
  }

  async function handleDeleteProperty(id: number) {
    if (!window.confirm('¿Eliminás este alojamiento? Las reservas asociadas quedarán sin alojamiento asignado.')) return
    await fetch(`/api/properties/${id}`, { method: 'DELETE' })
    const remaining = properties.filter(p => p.id !== id)
    if (selectedPropertyId === id) setSelectedPropertyId(remaining[0]?.id ?? null)
    await fetchProperties()
  }

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

  const monthlyTotal = monthlyCosts.reduce((s, c) => s + Number(c.cost), 0)
  const netProfit = totals.cost - monthlyTotal
  const monthLabel = months.find(m => m.key === filterMonth)?.label ?? filterMonth

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight shrink-0">HospedAr</h1>
            <select
              value={selectedPropertyId ?? ''}
              onChange={e => { setSelectedPropertyId(Number(e.target.value)); setSelected(new Set()) }}
              className="text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-700 bg-white max-w-[220px] truncate">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => setPropertiesModal(true)}
              className="text-sm px-3 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors shrink-0">
              Alojamientos
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={openNew}
              className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors">
              + Nueva reserva
            </button>
            <button onClick={() => setConfigOpen(true)}
              className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors">
              Ajustes
            </button>
            <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }}
              className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors">
              Salir
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Reservas', value: metrics.count },
            { label: 'Noches ocupadas', value: metrics.nights },
            { label: 'Huéspedes', value: metrics.guests },
            { label: 'Ingresos', value: formatARS(metrics.revenue) },
            { label: 'Costos', value: filterMonth !== 'all' ? formatARS(monthlyTotal) : '—' },
            { label: 'Ganancia', value: filterMonth !== 'all' ? formatARS(netProfit) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">{label}</p>
              <p className="text-2xl font-semibold text-stone-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Table / Calendar */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-stone-100">
            <span className="text-sm font-medium text-stone-700">
              {view === 'table' ? 'Listado de reservas' : 'Calendario'}
            </span>
            <div className="flex items-center gap-2">
              {view === 'table' && (
                <>
                  <button onClick={handleSync} disabled={syncing}
                    className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
                    {syncing ? 'Sincronizando...' : '↻ Booking'}
                  </button>
                  <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setSelected(new Set()) }}
                    className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 bg-white">
                    <option value="all">Todos los meses</option>
                    {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </>
              )}
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
            <ReservationsTable
              filtered={filtered}
              selected={selected}
              allSelected={allSelected}
              someSelected={someSelected}
              totals={totals}
              onToggleSelectAll={toggleSelectAll}
              onToggleSelect={toggleSelect}
              onEdit={openEdit}
              onDelete={handleDelete}
              onMessage={r => setMsgReservation(r)}
              onDeleteSelected={handleDeleteSelected}
            />
          ) : (
            <CalendarView reservations={reservations} calMonth={calMonth} setCalMonth={setCalMonth} onEdit={openEdit} />
          )}
        </div>

        {/* Monthly financial summary */}
        {filterMonth !== 'all' && (
          <div className="mt-4 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <span className="text-sm font-medium text-stone-700">Resumen financiero — {monthLabel}</span>
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
        )}
      </div>

      <ReservationModal
        open={modalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        exchangeRate={exchangeRate}
        exchangeRateLoading={exchangeRateLoading}
        usdAmount={usdAmount}
        setUsdAmount={setUsdAmount}
      />

      <MessageModal
        reservation={msgReservation}
        applyTemplate={applyTemplate}
        onClose={() => setMsgReservation(null)}
      />

      <MonthlyCostsModal
        open={monthlyMgmt && filterMonth !== 'all'}
        monthlyCosts={monthlyCosts}
        monthlyCostForm={monthlyCostForm}
        setMonthlyCostForm={setMonthlyCostForm}
        onAdd={handleAddMonthlyCost}
        onDelete={handleDeleteMonthlyCost}
        onClose={() => setMonthlyMgmt(false)}
        monthLabel={monthLabel}
      />

      <PropertiesModal
        open={propertiesModal}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onSave={handleSaveProperty}
        onDelete={handleDeleteProperty}
        onSelect={id => { setSelectedPropertyId(id); setSelected(new Set()) }}
        onClose={() => setPropertiesModal(false)}
      />

      <SettingsModal
        open={configOpen}
        onSaved={t => setTemplates(t)}
        onClose={() => setConfigOpen(false)}
        showAlert={showAlert}
      />
    </main>
  )
}
