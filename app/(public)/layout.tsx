import NavBar from '@/app/components/public/NavBar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <footer className="bg-stone-900 text-stone-400 text-sm py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          &copy; 2025 HospedAr. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
