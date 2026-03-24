'use client'

import { useState, useEffect } from 'react'
import { Reservation } from '@/lib/types'
import { MsgType, MSG_LABELS } from '@/lib/constants'

type Props = {
  reservation: Reservation | null
  applyTemplate: (type: MsgType, r: Reservation) => string
  onClose: () => void
}

export default function MessageModal({ reservation, applyTemplate, onClose }: Props) {
  const [msgTab, setMsgTab] = useState<MsgType>('confirm')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (reservation) {
      setMsgTab('confirm')
      setCopied(false)
    }
  }, [reservation])

  if (!reservation) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">Generar mensaje</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Para <span className="font-medium text-stone-700">{reservation.name}</span>
        </p>

        <div className="flex rounded-lg border border-stone-200 overflow-hidden mb-4">
          {(['confirm', 'checkin', 'checkout'] as MsgType[]).map(type => (
            <button key={type} onClick={() => { setMsgTab(type); setCopied(false) }}
              className={`flex-1 text-xs px-3 py-2 transition-colors border-r border-stone-200 last:border-r-0 ${msgTab === type ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
              {MSG_LABELS[type]}
            </button>
          ))}
        </div>

        <textarea
          readOnly
          rows={10}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 font-mono bg-stone-50 resize-none focus:outline-none"
          value={applyTemplate(msgTab, reservation)}
        />

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
            Cerrar
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(applyTemplate(msgTab, reservation))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
            className="px-4 py-2 text-sm rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
