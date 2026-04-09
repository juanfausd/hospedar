export type MsgType = 'confirm' | 'checkin' | 'checkout'

export const DEFAULT_TEMPLATE_CONFIRM =
`Hola *{nombre}*! 😊

Te escribimos para confirmar tu reserva en *Hospedando*.

📅 *Ingreso:* {checkin}
📅 *Egreso:* {checkout}
🌙 *Noches:* {noches}
👥 *Personas:* {personas}

Por favor confirmanos si todo está correcto. ¡Muchas gracias!`

export const DEFAULT_TEMPLATE_CHECKIN =
`Hola *{nombre}*! 😊

Te esperamos hoy en *Hospedando*.

📅 *Check-in:* {checkin}
🌙 *Noches:* {noches}
👥 *Personas:* {personas}

Ante cualquier consulta no dudes en escribirnos. ¡Bienvenido/a!`

export const DEFAULT_TEMPLATE_CHECKOUT =
`Hola *{nombre}*! 😊

Te recordamos que mañana, *{checkout}*, es tu día de salida de *Hospedando*.

¡Esperamos que hayas disfrutado tu estadía! Fue un placer tenerte con nosotros. 🙏`

export const MSG_LABELS: Record<MsgType, string> = {
  confirm: 'Confirmación',
  checkin: 'Ingreso',
  checkout: 'Egreso',
}

export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
export const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  contactada: 'Contactada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
}
export const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  contactada: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}
export const SOURCE_LABELS: Record<string, string> = {
  booking: 'Booking',
  airbnb: 'Airbnb',
  particular: 'Particular',
}
export const SOURCE_STYLES: Record<string, string> = {
  booking: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  airbnb: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  particular: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
}
export const CAL_SOURCE_STYLES: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-700 border-l-2 border-blue-400',
  airbnb: 'bg-rose-100 text-rose-700 border-l-2 border-rose-400',
  particular: 'bg-stone-100 text-stone-700 border-l-2 border-stone-400',
}
export const DOW_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const COST_TYPES = ['Comisión Booking', 'Limpieza', 'Otro', 'Productos', 'Reparaciones']
