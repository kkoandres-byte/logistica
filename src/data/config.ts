import type { TipoSolicitud, EstadoSolicitud } from './types';

export const TIPO_CONFIG: Record<TipoSolicitud, { icon: string; bg: string; color: string }> = {
    'Visitas Domiciliarias':     { icon: '🏠', bg: '#eff6ff', color: '#1d4ed8' },
    'Traslado de Pacientes':     { icon: '🚑', bg: '#fff7ed', color: '#9a3412' },
    'Toma de Muestras':          { icon: '🧪', bg: '#f0fdf4', color: '#15803d' },
    'Procedimiento en Domicilio':{ icon: '💉', bg: '#f5f3ff', color: '#6d28d9' },
    'Ronda Rural':               { icon: '🚐', bg: '#ecfdf5', color: '#047857' },
    'Area':                      { icon: '📍', bg: '#fff1f2', color: '#be123c' }
};

export const ESTADO_CONFIG: Record<EstadoSolicitud, { bg: string; color: string }> = {
    'Pendiente': { bg: '#fef3c7', color: '#92400e' },
    'Aprobada':  { bg: '#d1fae5', color: '#065f46' },
    'Rechazada': { bg: '#fee2e2', color: '#991b1b' }
};
