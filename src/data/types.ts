export interface Posta {
  id: string;
  nombre: string;
  distanciaKm: number;
  coordenadas: { x: number; y: number };
}

export interface Vehiculo {
  id: string;
  marcaModelo: string;
  patente: string;
  capacidadTotal: number;
  estado: 'Disponible' | 'En Mantención';
}

export interface Personal {
  id: string;
  nombre: string;
  especialidad: string;
  disponibilidad: boolean;
  correo?: string;
}

export interface Ronda {
  id: string;
  fecha: string;
  tipoSalida: string;
  postaId: string;
  paradasIntermediasIds?: string[];
  vehiculoId: string;
  conductorId: string;
  pasajerosIds: string[];
  indicaciones?: string;
  horaSalida?: string;
  horaRetorno?: string;
  accionRetorno?: string;
  viaticos?: Record<string, string>;
  solicitudesIds?: string[];
}

export type TipoSolicitud =
  | 'Visitas Domiciliarias'
  | 'Traslado de Pacientes'
  | 'Toma de Muestras'
  | 'Procedimiento en Domicilio';

export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface SolicitudSalida {
  id: string;
  fechaSolicitud: string;
  solicitante: string;
  tipoSalida: TipoSolicitud;
  descripcion: string;
  estado: EstadoSolicitud;
  rondaId?: string;
  funcionariosIds?: string[]; // hasta 4, solo para Visitas Domiciliarias
}
