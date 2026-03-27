'use client'

import { formatARS } from '@/lib/formatters'

export type ReservationFormState = {
  name: string
  phone: string
  checkin: string
  checkout: string
  guests: number
  cost: number
  sena: number
  status: 'confirmed' | 'contactada' | 'pending' | 'cancelled'
  source: 'booking' | 'airbnb' | 'particular'
  notes: string
}

type Props = {
  open: boolean
  editingId: number | null
  form: ReservationFormState
  setForm: React.Dispatch<React.SetStateAction<ReservationFormState>>
  onSave: () => void
  onClose: () => void
  exchangeRate: number | null
  exchangeRateLoading: boolean
  usdAmount: number | ''
  setUsdAmount: React.Dispatch<React.SetStateAction<number | ''>>
}

export default function ReservationModal({
  open, editingId, form, setForm, onSave, onClose,
  exchangeRate, exchangeRateLoading, usdAmount, setUsdAmount,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">
            {editingId !== null ? 'Editar reserva' : 'Nueva reserva'}
          </h2>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          <div className="space-y-4">
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Estado</label>
                <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option value="confirmed">Confirmada</option>
                  <option value="contactada">Contactada</option>
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
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onSave}
            className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
            Guardar reserva
          </button>
        </div>
      </div>
    </div>
  )
}
