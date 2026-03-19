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
  tipoSalida: string; // Ronda Rural, Visita Domiciliaria, Treatment
  postaId: string;
  paradasIntermediasIds?: string[]; // Up to 2 intermediate stops
  vehiculoId: string;
  conductorId: string;
  pasajerosIds: string[]; // List of Staff IDs
  indicaciones?: string; // Travel instructions
  horaSalida?: string;
  horaRetorno?: string;
  accionRetorno?: string; // Permanecer en posta, Volver al CESFAM
  viaticos?: Record<string, string>; // Maps ID of passenger to their '20%', '40%', or '100%' 
}
