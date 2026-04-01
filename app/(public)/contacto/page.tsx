'use client'

import { useState, FormEvent, useRef } from 'react'
import Script from 'next/script'

export default function ContactoPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const nombre = formData.get('nombre') as string
    const apellido = formData.get('apellido') as string
    const telefono = formData.get('telefono') as string
    const motivo = formData.get('motivo') as string
    const recaptcha = formData.get('g-recaptcha-response') as string | null

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, telefono, motivo, recaptcha }),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Ocurrió un error. Por favor intentá nuevamente.')
      }
    } catch {
      setError('Ocurrió un error de red. Por favor intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section className="py-20 px-4 bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-stone-200 shadow-sm p-10">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">¡Gracias por tu consulta!</h2>
          <p className="text-stone-500">Te contactaremos a la brevedad.</p>
        </div>
      </section>
    )
  }

  return (
    <>
      {siteKey && (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
      )}

      <section className="py-20 px-4 bg-stone-50 min-h-screen">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-stone-900">Contacto</h1>
            <p className="text-stone-500 mt-3 text-lg">
              Completá el formulario y te respondemos a la brevedad.
            </p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  required
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="García"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-stone-700 mb-1.5">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div>
              <label htmlFor="motivo" className="block text-sm font-medium text-stone-700 mb-1.5">
                Motivo de consulta <span className="text-red-500">*</span>
              </label>
              <textarea
                id="motivo"
                name="motivo"
                rows={4}
                required
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Contanos en qué podemos ayudarte..."
              />
            </div>

            {siteKey && (
              <div className="g-recaptcha" data-sitekey={siteKey} />
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Enviando…' : 'Enviar consulta'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
