'use client'

import { useState } from 'react'
import { Property } from '@/lib/types'

export type PropertyFormState = {
  name: string
  address: string
  rooms: number
  capacity: number
  google_maps_url: string
  instagram_url: string
}

const emptyPropertyForm: PropertyFormState = { name: '', address: '', rooms: 1, capacity: 2, google_maps_url: '', instagram_url: '' }

type Props = {
  open: boolean
  properties: Property[]
  selectedPropertyId: number | null
  onSave: (form: PropertyFormState, editingId: number | null) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onSelect: (id: number) => void
  onClose: () => void
}

export default function PropertiesModal({ open, properties, selectedPropertyId, onSave, onDelete, onSelect, onClose }: Props) {
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null)
  const [propertyForm, setPropertyForm] = useState<PropertyFormState>({ ...emptyPropertyForm })

  function handleClose() {
    setEditingPropertyId(null)
    setPropertyForm({ ...emptyPropertyForm })
    onClose()
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

  async function handleSave() {
    if (!propertyForm.name) { window.alert('El nombre es requerido.'); return }
    await onSave(propertyForm, editingPropertyId)
    setPropertyForm({ ...emptyPropertyForm })
    setEditingPropertyId(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-stone-900">Alojamientos</h2>
          <button onClick={handleClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
        </div>

        {properties.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4 mb-4">No hay alojamientos registrados.</p>
        ) : (
          <div className="space-y-3 mb-5">
            {properties.map(p => (
              <div key={p.id} className={`rounded-xl border p-4 ${selectedPropertyId === p.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button onClick={() => { onSelect(p.id); onClose() }}
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
                    <button onClick={() => onDelete(p.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
          <button onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
            Cerrar
          </button>
          <button onClick={handleSave}
            className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
            {editingPropertyId !== null ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
