'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Precios', href: '/precios' },
  { label: 'Contacto', href: '/contacto' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-lg font-semibold text-stone-800 hover:text-emerald-700 transition-colors">
            Hospedando
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-emerald-700 border-b-2 border-emerald-600 pb-0.5'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* CTA */}
          <Link
            href="/panel/login"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Ingresar al panel
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-4 pb-3 border-t border-stone-100 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive ? 'text-emerald-700' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
