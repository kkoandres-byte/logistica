import React, { useState } from 'react';
import { POSTAS, VEHICULOS, PERSONAL } from '../data/mockData';
import type { Posta, Vehiculo, Personal, Ronda } from '../data/types';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const Map: React.FC = () => {
    const [postas] = useState<Posta[]>(() => {
        const saved = localStorage.getItem('postas_data');
        return saved ? JSON.parse(saved) : POSTAS;
    });

    const getMapCoords = (x: number, y: number): [number, number] => {
        // If values are already in percentage format
        if (x > 0 && y > 0) {
            const latMin = -40.35, latMax = -40.05; // Latitude bounds
            const lngMin = -72.60, lngMax = -72.10; // Longitude bounds

            const lng = lngMin + (x / 100) * (lngMax - lngMin);
            const lat = latMax - (y / 100) * (latMax - latMin);
            return [lat, lng];
        }
        // If x and y are actual lat, lng
        return [x, y];
    };

    const createCustomIcon = (color: string) => {
        return L.divIcon({
            className: 'custom-icon',
            html: `
                <div style="
                    background-color: ${color};
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
        });
    };

    // CESFAM center coordinates
    const cesfamCenter: [number, number] = [-40.1388, -72.3951]; 

    const cesfamIcon = L.divIcon({
        className: 'custom-icon',
        html: `
            <div style="
                background-color: var(--primary);
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
            <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });

    return (
        <div className="card">
            <h3 className="card-title">Mapa de Salidas</h3>
            <div className="map-container" style={{ borderRadius: '12px', overflow: 'hidden', height: '400px', border: 'none', boxShadow: 'none' }}>
                <MapContainer center={cesfamCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* CESFAM Marker */}
                    <Marker position={cesfamCenter} icon={cesfamIcon}>
                        <Popup>
                            <strong>CESFAM FUTRONO</strong>
                            <br/>Sede Central Logística
                        </Popup>
                        <div style={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            border: '1px solid var(--primary)',
                            color: 'var(--primary)',
                            zIndex: 1000
                        }}>
                            CESFAM FUTRONO
                        </div>
                    </Marker>

                    {/* Postas Markers */}
                    {postas.map((posta) => {
                        const coords = getMapCoords(posta.coordenadas.x, posta.coordenadas.y);
                        return (
                            <Marker 
                                key={posta.id} 
                                position={coords} 
                                icon={createCustomIcon('var(--danger)')}
                            >
                                <Popup>
                                    <strong>{posta.nombre}</strong><br/>
                                    Distancia: {posta.distanciaKm} km
                                </Popup>
                                <div style={{
                                    position: 'absolute',
                                    top: '-22px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    border: '1px solid #dc3545',
                                    color: '#333',
                                    zIndex: 1000
                                }}>
                                    {posta.nombre}
                                </div>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [postas] = useState<Posta[]>(() => {
        const saved = localStorage.getItem('postas_data');
        return saved ? JSON.parse(saved) : POSTAS;
    });

    const [vehiculos] = useState<Vehiculo[]>(() => {
        const saved = localStorage.getItem('vehiculos_data');
        return saved ? JSON.parse(saved) : VEHICULOS;
    });

    const [personal] = useState<Personal[]>(() => {
        const saved = localStorage.getItem('personal_data');
        return saved ? JSON.parse(saved) : PERSONAL;
    });

    const [rondas] = useState<Ronda[]>(() => {
        const saved = localStorage.getItem('rondas_data');
        return saved ? JSON.parse(saved) : [];
    });

    const todayRondas = rondas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);

    return (
        <div className="dashboard-grid">
            <div style={{ gridColumn: 'span 2' }}>
                <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #007bff, #00d2ff)', color: 'white', padding: '2rem' }}>
                    <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Sistema de Gestión Logística</h2>
                    <p style={{ opacity: 0.9 }}>CESFAM Futrono - Panel de Control Administrativo</p>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">Resumen de Activos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', padding: '10px 0' }}>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{postas.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Postas</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--success)' }}>{vehiculos.filter(v => v.estado === 'Disponible').length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flota OK</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--dark)' }}>{personal.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personal</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">Rondas Programadas (Hoy)</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    <table style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th style={{ fontSize: '11px' }}>Destino</th>
                            <th style={{ fontSize: '11px' }}>Vehículo</th>
                            <th style={{ fontSize: '11px' }}>Pax</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todayRondas.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '20px', fontSize: '13px' }}>No hay rondas para hoy</td>
                            </tr>
                        ) : (
                            todayRondas.slice(0, 5).map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontSize: '13px' }}>{postas.find(p => p.id === r.postaId)?.nombre}</td>
                                    <td style={{ fontSize: '13px' }}>{vehiculos.find(v => v.id === r.vehiculoId)?.patente}</td>
                                    <td><span className="badge badge-success">{r.pasajerosIds.length}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
                <Map />
            </div>

            <div className="card">
                <h3 className="card-title">Estado de Vehículos</h3>
                <div>
                    {[...vehiculos].sort((a, b) => (a.estado === 'Disponible' ? -1 : 1) - (b.estado === 'Disponible' ? -1 : 1)).map(v => (
                        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>{v.marcaModelo} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.patente}</span></span>
                            <span style={{ whiteSpace: 'nowrap' }} className={`badge ${v.estado === 'Disponible' ? 'badge-success' : 'badge-error'}`}>{v.estado}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">Postas de Mayor Distancia</h3>
                <div style={{ padding: '5px 0' }}>
                    {[...postas].sort((a, b) => b.distanciaKm - a.distanciaKm).slice(0, 5).map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.875rem' }}>{p.nombre}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>{p.distanciaKm} KM</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
