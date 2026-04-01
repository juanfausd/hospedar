import Link from 'next/link'

const features = [
  'Reservas ilimitadas',
  'Hasta 3 alojamientos',
  'Sincronización automática con Booking.com',
  'Notificaciones por WhatsApp y email',
  'Vista de calendario y tabla de reservas',
  'Resumen financiero mensual',
  'Plantillas de mensajes personalizables',
  'Soporte por WhatsApp',
]

export default function PreciosPage() {
  return (
    <section className="py-20 px-4 bg-stone-50 min-h-screen">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-stone-900">Planes y precios</h1>
        <p className="text-stone-500 mt-3 text-lg">Simple y sin sorpresas</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          {/* Badge */}
          <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Plan Base
          </div>

          {/* Price */}
          <div className="mb-2">
            <span className="text-4xl font-bold text-stone-900">$ 4.999</span>
            <span className="text-stone-500 text-base ml-1">/ mes</span>
          </div>
          <p className="text-stone-500 text-sm mb-8">
            Todo lo que necesitás para gestionar tus alojamientos de manera profesional.
          </p>

          {/* Feature list */}
          <ul className="space-y-3 mb-8">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-sm text-stone-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href="/contacto"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Contactanos para empezar
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Precios en pesos argentinos. IVA no incluido.
        </p>
      </div>
    </section>
  )
}
