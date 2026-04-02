'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Plan } from '@/lib/types'

const emptyForm = {
  name: '',
  max_properties: '',
  description: '',
  cost: '',
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  async function loadPlans() {
    setLoading(true)
    const res = await fetch('/api/admin/plans')
    if (res.ok) {
      const data = await res.json()
      setPlans(data)
    }
    setLoading(false)
  }

  useEffect(() => { loadPlans() }, [])

  function openCreate() {
    setEditPlan(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(plan: Plan) {
    setEditPlan(plan)
    setForm({
      name: plan.name,
      max_properties: plan.max_properties != null ? String(plan.max_properties) : '',
      description: plan.description || '',
      cost: String(plan.cost),
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      name: form.name,
      max_properties: form.max_properties !== '' ? Number(form.max_properties) : null,
      description: form.description,
      cost: Number(form.cost),
    }

    const res = editPlan
      ? await fetch(`/api/admin/plans/${editPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    if (res.ok) {
      setShowModal(false)
      loadPlans()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteConfirm(null)
      loadPlans()
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Planes</h1>
          <p className="text-stone-400 text-sm mt-1">Gestión de planes de suscripción</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo plan
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm">Cargando…</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <p className="text-sm">No hay planes creados.</p>
        </div>
      ) : (
        <div className="bg-stone-900 rounded-xl border border-stone-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Alojamientos</th>
                <th className="px-4 py-3 text-left font-medium">Descripción</th>
                <th className="px-4 py-3 text-left font-medium">Costo / mes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-stone-800 last:border-0 hover:bg-stone-800/40">
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-stone-300">
                    {p.max_properties != null ? `Hasta ${p.max_properties}` : 'Sin límite'}
                  </td>
                  <td className="px-4 py-3 text-stone-400 max-w-xs truncate">
                    {p.description || <span className="text-stone-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-300">
                    {p.cost > 0 ? formatARS(p.cost) : <span className="text-stone-500">A consultar</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-stone-700 transition-colors"
                      >
                        Editar
                      </button>
                      {deleteConfirm === p.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-stone-700 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-stone-500 hover:text-stone-300 text-xs px-2 py-1 rounded hover:bg-stone-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="text-stone-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-stone-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-5">
              {editPlan ? 'Editar plan' : 'Nuevo plan'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Nombre del plan</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Esencial"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Cantidad de alojamientos admitidos
                  <span className="text-stone-600 ml-1">(dejar vacío = sin límite)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_properties}
                  onChange={(e) => setForm({ ...form, max_properties: e.target.value })}
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 3"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Descripción breve del plan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Costo mensual (ARS)
                  <span className="text-stone-600 ml-1">(0 = a consultar)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="4999"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-950 border border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-stone-700 text-stone-300 hover:text-white py-2 px-4 rounded-lg text-sm transition-colors hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 disabled:text-emerald-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  {saving ? 'Guardando…' : editPlan ? 'Guardar cambios' : 'Crear plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
