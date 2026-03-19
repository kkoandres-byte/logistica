import type { Posta, Vehiculo, Personal } from './types';

export const POSTAS: Posta[] = [
    { id: '1', nombre: 'Llifén', distanciaKm: 21, coordenadas: { x: 75, y: 65 } },
    { id: '2', nombre: 'Nontuelá', distanciaKm: 15, coordenadas: { x: 30, y: 40 } },
    { id: '3', nombre: 'Curriñe', distanciaKm: 38, coordenadas: { x: 85, y: 80 } },
    { id: '4', nombre: 'Maihue', distanciaKm: 45, coordenadas: { x: 90, y: 55 } },
    { id: '5', nombre: 'Chabranco', distanciaKm: 52, coordenadas: { x: 80, y: 30 } },
    { id: '6', nombre: 'Loncopán', distanciaKm: 28, coordenadas: { x: 45, y: 25 } },
    { id: '7', nombre: 'Isla Huapi', distanciaKm: 12, coordenadas: { x: 60, y: 50 } },
];

export const VEHICULOS: Vehiculo[] = [
    { id: 'v1', marcaModelo: 'Hyundai H1', patente: 'KRPB-42', capacidadTotal: 12, estado: 'Disponible' },
    { id: 'v2', marcaModelo: 'Toyota Hiace', patente: 'LXST-88', capacidadTotal: 15, estado: 'Disponible' },
    { id: 'v3', marcaModelo: 'Mitsubishi L200', patente: 'PJTY-11', capacidadTotal: 5, estado: 'En Mantención' },
];

export const PERSONAL: Personal[] = [
    { id: 'p1', nombre: 'Dr. Ricardo Soto', especialidad: 'Médico', disponibilidad: true },
    { id: 'p2', nombre: 'Ana María Rojas', especialidad: 'TENS', disponibilidad: true },
    { id: 'p3', nombre: 'Juan Pérez', especialidad: 'Kinesiólogo', disponibilidad: true },
    { id: 'p4', nombre: 'Clara Valenzuela', especialidad: 'Matrona', disponibilidad: true },
    { id: 'p5', nombre: 'Pedro Montes', especialidad: 'Odontólogo', disponibilidad: true },
    { id: 'p6', nombre: 'Lucía Méndez', especialidad: 'TENS', disponibilidad: true },
    { id: 'p7', nombre: 'Roberto Cuevas', especialidad: 'Médico', disponibilidad: true },
    { id: 'p8', nombre: 'Carlos Guzmán', especialidad: 'Conductor', disponibilidad: true },
];
