'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-stone-800 text-white'
          : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
      }`}
    >
      {label}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-stone-800 p-4">
        <div className="mb-8 px-3">
          <p className="text-white font-semibold text-base">HospedAr</p>
          <p className="text-stone-500 text-xs mt-0.5">Administración</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <NavItem href="/admin/usuarios" label="Usuarios" />
          <NavItem href="/admin/planes" label="Planes" />
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors text-left"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
