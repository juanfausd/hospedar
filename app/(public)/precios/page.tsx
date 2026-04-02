import Link from 'next/link'
import { query } from '@/lib/db'
import { Plan } from '@/lib/types'

export const dynamic = 'force-dynamic'

const COMMON_FEATURES = [
  'Reservas ilimitadas',
  'Sincronización automática con Booking.com',
  'Notificaciones por WhatsApp y email',
  'Vista de calendario y tabla de reservas',
  'Resumen financiero mensual',
  'Plantillas de mensajes personalizables',
  'Soporte por WhatsApp',
]

function propertyFeature(max: number | null): string {
  if (max == null) return 'Alojamientos ilimitados'
  return `Hasta ${max} alojamiento${max === 1 ? '' : 's'}`
}

function formatPrice(cost: number): string {
  if (cost <= 0) return 'A consultar'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(cost)
}

export default async function PreciosPage() {
  let plans: Plan[] = []
  try {
    const result = await query(
      'SELECT * FROM plans ORDER BY CASE WHEN cost = 0 THEN 999999 ELSE cost END ASC, created_at ASC'
    )
    plans = result.rows
  } catch {
    // DB not available during static build
  }

  const middleIndex = Math.floor((plans.length - 1) / 2)

  return (
    <section className="py-20 px-4 bg-stone-50 min-h-screen">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-stone-900">Planes y precios</h1>
        <p className="text-stone-500 mt-3 text-lg">Simple y sin sorpresas</p>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-stone-400 text-sm">Próximamente.</p>
      ) : (
        <div className={`mx-auto grid grid-cols-1 gap-6 ${
          plans.length === 1 ? 'max-w-sm' :
          plans.length === 2 ? 'max-w-2xl md:grid-cols-2' :
          'max-w-5xl md:grid-cols-3'
        }`}>
          {plans.map((plan, index) => {
            const highlight = plans.length > 1 && index === middleIndex
            const price = formatPrice(Number(plan.cost))
            const features = [propertyFeature(plan.max_properties), ...COMMON_FEATURES]

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border shadow-sm p-8 flex flex-col ${
                  highlight
                    ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500'
                    : 'border-stone-200'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}

                <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4 self-start">
                  Plan {plan.name}
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-stone-900">{price}</span>
                  {price !== 'A consultar' && (
                    <span className="text-stone-500 text-base ml-1">/ mes</span>
                  )}
                </div>
                {plan.description && (
                  <p className="text-stone-500 text-sm mb-6">{plan.description}</p>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-sm text-stone-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contacto"
                  className={`block w-full text-center font-semibold py-3 px-6 rounded-lg transition-colors ${
                    highlight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                  }`}
                >
                  Contactanos para empezar
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-stone-400 mt-8">
        Precios en pesos argentinos. IVA no incluido.
      </p>
    </section>
  )
}
