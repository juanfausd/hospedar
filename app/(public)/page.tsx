import Link from 'next/link'

const features = [
  {
    icon: '🔄',
    title: 'Sincronización con Booking.com',
    description: 'Importá tus reservas automáticamente mediante el feed iCal de Booking.com, sin esfuerzo manual.',
  },
  {
    icon: '📅',
    title: 'Vista de calendario y tabla',
    description: 'Visualizá todas tus reservas en un calendario interactivo o en una tabla detallada con filtros.',
  },
  {
    icon: '💬',
    title: 'Mensajes de WhatsApp personalizados',
    description: 'Plantillas listas para confirmar reservas, recordar el check-in y despedir huéspedes al checkout.',
  },
  {
    icon: '📊',
    title: 'Resumen financiero mensual',
    description: 'Seguí tus ingresos, costos y ganancia neta mes a mes con reportes claros y simples.',
  },
  {
    icon: '🏠',
    title: 'Gestión de múltiples alojamientos',
    description: 'Administrá hasta 3 propiedades desde un solo panel, con filtros por alojamiento.',
  },
  {
    icon: '🔔',
    title: 'Notificaciones automáticas',
    description: 'Recibí alertas el día anterior al check-in para estar siempre preparado para recibir huéspedes.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-stone-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Administrá tus alojamientos desde un solo lugar
          </h1>
          <p className="text-stone-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            HospedAr es el sistema de gestión de reservas pensado para anfitriones argentinos. Sincronizá con
            Booking.com, enviá mensajes por WhatsApp y llevá el control financiero de tu negocio, todo desde un panel
            simple y rápido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/precios"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base transition-colors"
            >
              Ver planes
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-stone-500 hover:border-stone-300 text-stone-200 hover:text-white font-semibold text-base transition-colors"
            >
              Contactanos
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-stone-900">Todo lo que necesitás</h2>
            <p className="text-stone-500 mt-3 text-lg">
              Herramientas diseñadas para simplificar la gestión de tu alojamiento.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-stone-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-base font-semibold text-stone-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-stone-900 text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-stone-300 mb-8 text-lg">
            Escribinos y te ayudamos a configurar tu cuenta en minutos.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base transition-colors"
          >
            Contactanos
          </Link>
        </div>
      </section>
    </>
  )
}
