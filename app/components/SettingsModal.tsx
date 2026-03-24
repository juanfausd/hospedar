'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_TEMPLATE_CONFIRM, DEFAULT_TEMPLATE_CHECKIN, DEFAULT_TEMPLATE_CHECKOUT } from '@/lib/constants'

type Templates = { confirm: string; checkin: string; checkout: string }
type NotifPhone = { phone: string; apikey: string }
type ConfigForm = {
  ical_url: string
  template_confirm: string
  template_checkin: string
  template_checkout: string
  notification_email: string
}

type Props = {
  open: boolean
  onSaved: (templates: Templates) => void
  onClose: () => void
  showAlert: (msg: string, type: 'green' | 'red' | 'amber') => void
}

export default function SettingsModal({ open, onSaved, onClose, showAlert }: Props) {
  const [configForm, setConfigForm] = useState<ConfigForm>({
    ical_url: '',
    template_confirm: DEFAULT_TEMPLATE_CONFIRM,
    template_checkin: DEFAULT_TEMPLATE_CHECKIN,
    template_checkout: DEFAULT_TEMPLATE_CHECKOUT,
    notification_email: '',
  })
  const [notifPhones, setNotifPhones] = useState<NotifPhone[]>([])
  const [notifForm, setNotifForm] = useState({ phone: '', apikey: '' })
  const [configSaving, setConfigSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/settings').then(r => r.json()).then(data => {
      setConfigForm({
        ical_url: data.ical_url || '',
        template_confirm: data.template_confirm || DEFAULT_TEMPLATE_CONFIRM,
        template_checkin: data.template_checkin || DEFAULT_TEMPLATE_CHECKIN,
        template_checkout: data.template_checkout || DEFAULT_TEMPLATE_CHECKOUT,
        notification_email: data.notification_email || '',
      })
      try { setNotifPhones(data.notification_phones ? JSON.parse(data.notification_phones) : []) } catch { setNotifPhones([]) }
      setNotifForm({ phone: '', apikey: '' })
    }).catch(() => {})
  }, [open])

  async function saveNotifPhones(phones: NotifPhone[]) {
    try {
      const res = await fetch('/api/notification-phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (!res.ok) {
        const data = await res.json()
        showAlert(data.error || 'Error al guardar los teléfonos.', 'red')
      }
    } catch {
      showAlert('Error de red al guardar los teléfonos.', 'red')
    }
  }

  async function handleSave() {
    setConfigSaving(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configForm),
    })
    setConfigSaving(false)
    if (!res.ok) {
      const data = await res.json()
      showAlert(data.error || 'Error al guardar la configuración.', 'red')
      return
    }
    onSaved({
      confirm: configForm.template_confirm,
      checkin: configForm.template_checkin,
      checkout: configForm.template_checkout,
    })
    onClose()
    showAlert('Configuración guardada.', 'green')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">Ajustes</h2>
          <p className="text-xs text-stone-400 mt-0.5">La configuración se guarda en la base de datos y aplica a todos los usuarios.</p>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1 space-y-5">
          {/* iCal URL */}
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

          {/* Templates */}
          <div className="border-t border-stone-100 pt-4">
            <p className="text-xs font-medium text-stone-600 mb-1">Plantillas de mensajes (WhatsApp)</p>
            <p className="text-xs text-stone-400 mb-3">
              Variables: <code className="bg-stone-100 px-1 rounded">{'{nombre}'}</code> <code className="bg-stone-100 px-1 rounded">{'{checkin}'}</code> <code className="bg-stone-100 px-1 rounded">{'{checkout}'}</code> <code className="bg-stone-100 px-1 rounded">{'{noches}'}</code> <code className="bg-stone-100 px-1 rounded">{'{personas}'}</code> <code className="bg-stone-100 px-1 rounded">{'{seña}'}</code> <code className="bg-stone-100 px-1 rounded">{'{total}'}</code> <code className="bg-stone-100 px-1 rounded">{'{direccion}'}</code> <code className="bg-stone-100 px-1 rounded">{'{maps}'}</code> · Negrita: <code className="bg-stone-100 px-1 rounded">*texto*</code> Cursiva: <code className="bg-stone-100 px-1 rounded">_texto_</code>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'template_confirm', label: 'Confirmación' },
                { key: 'template_checkin', label: 'Ingreso' },
                { key: 'template_checkout', label: 'Egreso' },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-stone-500 block mb-1">{label}</label>
                  <textarea
                    rows={8}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 font-mono resize-y"
                    value={configForm[key]}
                    onChange={e => setConfigForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notification email */}
          <div className="border-t border-stone-100 pt-4">
            <p className="text-xs font-medium text-stone-600 mb-1">Notificación por email</p>
            <p className="text-xs text-stone-400 mb-3">
              Se envía un resumen por email el día anterior a cada reserva. Requiere configurar <code className="bg-stone-100 px-1 rounded">RESEND_API_KEY</code> en las variables de entorno de Vercel. Obtené tu API key gratis en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">resend.com</a>.
            </p>
            <input
              type="email"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="tucorreo@ejemplo.com"
              value={configForm.notification_email}
              onChange={e => setConfigForm(f => ({ ...f, notification_email: e.target.value }))}
            />
          </div>

          {/* Notification phones */}
          <div className="border-t border-stone-100 pt-4">
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
                className="w-32 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
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
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-white rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={configSaving}
            className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-50">
            {configSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
