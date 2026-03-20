import React, { useState, useEffect } from 'react';
import { getSolicitudesFirebase } from '../services/solicitudesService';
import type { SolicitudSalida } from '../data/types';
import { TIPO_CONFIG } from '../data/config';

const SolicitudesReport: React.FC = () => {
    const [solicitudes, setSolicitudes] = useState<SolicitudSalida[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getSolicitudesFirebase();
            // Ordenar por fecha descendente
            const sorted = data.sort((a, b) => new Date(b.fechaViaje).getTime() - new Date(a.fechaViaje).getTime());
            setSolicitudes(sorted);
            setLoading(false);
        };
        load();
    }, []);

    const aprobadas = solicitudes.filter(s => s.estado === 'Aprobada');
    const rechazadas = solicitudes.filter(s => s.estado === 'Rechazada');

    const renderTable = (list: SolicitudSalida[], title: string, color: string) => (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ color, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{title === 'Aprobadas' ? ' ✅' : ' ❌'}</span> {title} ({list.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '12px' }}>F. Viaje</th>
                            <th style={{ padding: '12px' }}>Solicitante</th>
                            <th style={{ padding: '12px' }}>Tipo</th>
                            <th style={{ padding: '12px' }}>Destino / Paradas</th>
                            <th style={{ padding: '12px' }}>Descripción</th>
                            <th style={{ padding: '12px' }}>Estado Técnico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(s => {
                            const tipo = TIPO_CONFIG[s.tipoSalida];
                            return (
                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>{s.fechaViaje.split('-').reverse().join('/')}</td>
                                    <td style={{ padding: '12px' }}>{s.solicitante}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 8px', borderRadius: '6px',
                                            background: tipo?.bg, color: tipo?.color, fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            {tipo?.icon} {s.tipoSalida}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '0.83rem', color: '#1e293b', fontWeight: 600 }}>
                                        {s.destino || '–'}
                                        {s.paradasIntermedias && (
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', fontWeight: 400 }}>
                                                Paradas: {s.paradasIntermedias}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{s.descripcion}</td>
                                    <td style={{ padding: '12px' }}>
                                        {s.rondaId ? 
                                            <span style={{ color: '#059669', fontWeight: 600 }}>✅ Asignada</span> : 
                                            (s.motivoRechazo ? <span style={{ color: '#991b1b', fontSize: '0.75rem' }}>❌ {s.motivoRechazo}</span> : <span style={{ color: '#94a3b8' }}>–</span>)
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                        {list.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    No hay solicitudes en esta categoría
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando reporte...</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Reporte de Estado de Solicitudes</h2>
                <p style={{ color: '#64748b' }}>Resumen histórico de solicitudes gestionadas</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: '#ecfdf5', border: '1px solid #10b981', textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Total Aprobadas</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#065f46' }}>{aprobadas.length}</div>
                </div>
                <div className="card" style={{ background: '#fef2f2', border: '1px solid #ef4444', textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Rechazadas</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#991b1b' }}>{rechazadas.length}</div>
                </div>
            </div>

            {renderTable(aprobadas, 'Aprobadas', '#065f46')}
            {renderTable(rechazadas, 'Rechazadas', '#991b1b')}
        </div>
    );
};

export default SolicitudesReport;
