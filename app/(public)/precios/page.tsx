import Link from 'next/link'

const plans = [
  {
    name: 'Base',
    price: '$ 2.999',
    description: 'Ideal para empezar con un único alojamiento.',
    highlight: false,
    features: [
      'Hasta 1 alojamiento',
      'Reservas ilimitadas',
      'Sincronización automática con Booking.com',
      'Notificaciones por WhatsApp y email',
      'Vista de calendario y tabla de reservas',
      'Resumen financiero mensual',
      'Plantillas de mensajes personalizables',
      'Soporte por WhatsApp',
    ],
  },
  {
    name: 'Esencial',
    price: '$ 4.999',
    description: 'Para quienes tienen más de un alojamiento y quieren crecer.',
    highlight: true,
    features: [
      'Hasta 3 alojamientos',
      'Reservas ilimitadas',
      'Sincronización automática con Booking.com',
      'Notificaciones por WhatsApp y email',
      'Vista de calendario y tabla de reservas',
      'Resumen financiero mensual',
      'Plantillas de mensajes personalizables',
      'Soporte por WhatsApp',
    ],
  },
  {
    name: 'Avanzado',
    price: 'A consultar',
    description: 'Para operadores con múltiples propiedades. Sin límites.',
    highlight: false,
    features: [
      'Más de 3 alojamientos',
      'Reservas ilimitadas',
      'Sincronización automática con Booking.com',
      'Notificaciones por WhatsApp y email',
      'Vista de calendario y tabla de reservas',
      'Resumen financiero mensual',
      'Plantillas de mensajes personalizables',
      'Soporte prioritario por WhatsApp',
    ],
  },
]

export default function PreciosPage() {
  return (
    <section className="py-20 px-4 bg-stone-50 min-h-screen">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-stone-900">Planes y precios</h1>
        <p className="text-stone-500 mt-3 text-lg">Simple y sin sorpresas</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl border shadow-sm p-8 flex flex-col ${
              plan.highlight
                ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500'
                : 'border-stone-200'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                  Más popular
                </span>
              </div>
            )}

            {/* Badge */}
            <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4 self-start">
              Plan {plan.name}
            </div>

            {/* Price */}
            <div className="mb-2">
              <span className="text-3xl font-bold text-stone-900">{plan.price}</span>
              {plan.price !== 'A consultar' && (
                <span className="text-stone-500 text-base ml-1">/ mes</span>
              )}
            </div>
            <p className="text-stone-500 text-sm mb-6">{plan.description}</p>

            {/* Feature list */}
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-sm text-stone-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/contacto"
              className={`block w-full text-center font-semibold py-3 px-6 rounded-lg transition-colors ${
                plan.highlight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              }`}
            >
              Contactanos para empezar
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-stone-400 mt-8">
        Precios en pesos argentinos. IVA no incluido.
      </p>
    </section>
  )
}
