'use client'

import { useState, useEffect, FormEvent } from 'react'
import { User } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  propietario: 'Propietario',
}

const emptyForm = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role: 'propietario',
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  async function loadUsers() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  function openCreate() {
    setEditUser(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(user: User) {
    setEditUser(user)
    setForm({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      role: user.role,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body: Record<string, string> = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
    }
    if (form.password) body.password = form.password

    const res = editUser
      ? await fetch(`/api/admin/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    if (res.ok) {
      setShowModal(false)
      loadUsers()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteConfirm(null)
      loadUsers()
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Usuarios</h1>
          <p className="text-stone-500 text-sm mt-1">Gestión de acceso al sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo usuario
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Cargando…</p>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-sm">No hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide bg-stone-50">
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Email / Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Rol</th>
                <th className="px-4 py-3 text-left font-medium">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-800 font-medium">
                    {u.first_name || u.last_name
                      ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                      : <span className="text-stone-400 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {u.email || u.username}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-stone-500 hover:text-stone-900 text-xs px-2 py-1 rounded hover:bg-stone-100 transition-colors"
                      >
                        Editar
                      </button>
                      {deleteConfirm === u.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(u.id)}
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
                          onClick={() => setDeleteConfirm(u.id)}
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
              {editUser ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="García"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Contraseña {editUser && <span className="text-stone-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  required={!editUser}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="propietario">Propietario</option>
                  <option value="admin">Administrador</option>
                </select>
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
                  {saving ? 'Guardando…' : editUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
