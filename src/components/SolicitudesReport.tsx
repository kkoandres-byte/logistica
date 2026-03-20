import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSolicitudesFirebase, deleteSolicitudFirebase } from '../services/solicitudesService';
import { getPostasFirebase } from '../services/dataService';
import type { SolicitudSalida, Posta } from '../data/types';
import { TIPO_CONFIG } from '../data/config';
import { POSTAS } from '../data/mockData';

const SolicitudesReport: React.FC = () => {
    const { usuario } = useAuth();
    const isAdmin = usuario?.rol === 'admin';
    const [solicitudes, setSolicitudes] = useState<SolicitudSalida[]>([]);
    const [allPostas, setAllPostas] = useState<Posta[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const [solicitudesData, postasData] = await Promise.all([
            getSolicitudesFirebase(),
            getPostasFirebase()
        ]);
        
        // Ordenar por fecha descendente
        const sorted = solicitudesData.sort((a, b) => new Date(b.fechaViaje).getTime() - new Date(a.fechaViaje).getTime());
        setSolicitudes(sorted);
        setAllPostas(postasData || POSTAS);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro del reporte?')) return;
        try {
            await deleteSolicitudFirebase(id);
            await loadData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar la solicitud');
        }
    };

    const aprobadas = solicitudes.filter(s => s.estado === 'Aprobada');
    const rechazadas = solicitudes.filter(s => s.estado === 'Rechazada');

    const renderTable = (list: SolicitudSalida[], title: string, color: string) => (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{title === 'Aprobadas' ? ' ✅' : ' ❌'}</span> {title} ({list.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '8px', fontSize: '0.7rem' }}>F. Viaje</th>
                            <th style={{ padding: '8px', fontSize: '0.7rem' }}>Solicitante</th>
                            <th style={{ padding: '8px', fontSize: '0.7rem' }}>Tipo</th>
                            <th style={{ padding: '8px', fontSize: '0.7rem' }}>Destino / Paradas</th>
                            <th style={{ padding: '8px', fontSize: '0.7rem' }}>Descripción</th>
                            <th style={{ padding: '8px', fontSize: '0.7rem' }}>Estado Técnico</th>
                            {isAdmin && <th style={{ padding: '8px', fontSize: '0.7rem' }}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(s => {
                            const tipo = TIPO_CONFIG[s.tipoSalida];
                            return (
                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px', fontWeight: 600, fontSize: '0.8rem' }}>{s.fechaViaje.split('-').reverse().join('/')}</td>
                                    <td style={{ padding: '8px', fontSize: '0.8rem' }}>{s.solicitante}</td>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{ 
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '2px 6px', borderRadius: '6px',
                                            background: tipo?.bg, color: tipo?.color, fontSize: '0.7rem', fontWeight: 600
                                        }}>
                                            {tipo?.icon} {s.tipoSalida}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px', fontSize: '0.78rem', color: '#1e293b', fontWeight: 600 }}>
                                        {allPostas.find(p => p.id === s.destinoId)?.nombre || '–'}
                                        {s.paradasIntermediasIds && s.paradasIntermediasIds.length > 0 && (
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px', fontWeight: 400 }}>
                                                {s.paradasIntermediasIds.map(id => allPostas.find(p => p.id === id)?.nombre).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '8px', fontSize: '0.75rem', maxWidth: '300px' }}>{s.descripcion}</td>
                                    <td style={{ padding: '8px', fontSize: '0.75rem' }}>
                                        {s.rondaId ? 
                                            <span style={{ color: '#059669', fontWeight: 600 }}>✅ Asignada</span> : 
                                            (s.motivoRechazo ? <span style={{ color: '#991b1b', fontSize: '0.65rem' }}>❌ {s.motivoRechazo}</span> : <span style={{ color: '#94a3b8' }}>–</span>)
                                        }
                                    </td>
                                    {isAdmin && (
                                        <td style={{ padding: '8px' }}>
                                            <button 
                                                onClick={() => handleDelete(s.id)}
                                                style={{ 
                                                    border: 'none', background: '#fef2f2', color: '#ef4444', 
                                                    padding: '4px', borderRadius: '4px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Eliminar del reporte"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {list.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
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
        <div style={{ padding: '0 0.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Reporte de Estado de Solicitudes</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Resumen histórico de solicitudes gestionadas</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: '#ecfdf5', border: '1px solid #10b981', textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Aprobadas</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46' }}>{aprobadas.length}</div>
                </div>
                <div className="card" style={{ background: '#fef2f2', border: '1px solid #ef4444', textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Rechazadas</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#991b1b' }}>{rechazadas.length}</div>
                </div>
            </div>

            {renderTable(aprobadas, 'Aprobadas', '#065f46')}
            {renderTable(rechazadas, 'Rechazadas', '#991b1b')}
        </div>
    );
};

export default SolicitudesReport;
