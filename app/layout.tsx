import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hospedando — Gestión de alojamientos',
  description: 'Sistema de administración de reservas para anfitriones argentinos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
