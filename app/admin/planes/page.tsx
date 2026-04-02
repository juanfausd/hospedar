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
          <h1 className="text-2xl font-semibold text-stone-900">Planes</h1>
          <p className="text-stone-500 text-sm mt-1">Gestión de planes de suscripción</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo plan
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Cargando…</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-sm">No hay planes creados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide bg-stone-50">
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Alojamientos</th>
                <th className="px-4 py-3 text-left font-medium">Descripción</th>
                <th className="px-4 py-3 text-left font-medium">Costo / mes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-800 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.max_properties != null ? `Hasta ${p.max_properties}` : 'Sin límite'}
                  </td>
                  <td className="px-4 py-3 text-stone-500 max-w-xs truncate">
                    {p.description || <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {p.cost > 0 ? formatARS(p.cost) : <span className="text-stone-400">A consultar</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-stone-500 hover:text-stone-900 text-xs px-2 py-1 rounded hover:bg-stone-100 transition-colors"
                      >
                        Editar
                      </button>
                      {deleteConfirm === p.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded hover:bg-stone-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="text-stone-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-stone-100 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-stone-900 mb-5">
              {editPlan ? 'Editar plan' : 'Nuevo plan'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Nombre del plan</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ej: Esencial"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Cantidad de alojamientos admitidos
                  <span className="text-stone-400 font-normal ml-1">(dejar vacío = sin límite)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_properties}
                  onChange={(e) => setForm({ ...form, max_properties: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ej: 3"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Descripción breve del plan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Costo mensual (ARS)
                  <span className="text-stone-400 font-normal ml-1">(0 = a consultar)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="4999"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-stone-200 text-stone-600 hover:text-stone-900 py-2 px-4 rounded-lg text-sm transition-colors hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
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
