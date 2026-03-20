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
  | 'Procedimiento en Domicilio'
  | 'Ronda Rural'
  | 'Area';

export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface SolicitudSalida {
  id: string;
  fechaSolicitud: string;
  fechaViaje: string; // Fecha programada para el viaje
  solicitante: string;
  tipoSalida: TipoSolicitud;
  destinoId: string;
  paradasIntermediasIds?: string[];
  descripcion: string;
  estado: EstadoSolicitud;
  rondaId?: string;
  motivoRechazo?: string;
  funcionariosIds?: string[]; // hasta 4, solo para Visitas Domiciliarias
}

export interface Paciente {
  id: string; // UUID or Firebase Auto-ID
  rut: string;
  nombre: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F' | 'Otro';
  calle: string;
  numeroDomicilio: string;
  telefonos: string[]; // Up to 3
  sector: 'Sector 1' | 'Sector 2';
  establecimientoId: string; // Linked to Posta ID
  urbanoRural: 'Urbano' | 'Rural';
  dependencia: 'Leve' | 'Moderada' | 'Severa';
}
