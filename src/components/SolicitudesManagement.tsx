import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getSolicitudesFirebase,
    addSolicitudFirebase,
    updateSolicitudFirebase,
    deleteSolicitudFirebase
} from '../services/solicitudesService';
import { getPersonalFirebase } from '../services/dataService';
import type { SolicitudSalida, TipoSolicitud, EstadoSolicitud, Personal } from '../data/types';

import { TIPO_CONFIG, ESTADO_CONFIG } from '../data/config';


const TIPOS: TipoSolicitud[] = [
    'Visitas Domiciliarias',
    'Traslado de Pacientes',
    'Toma de Muestras',
    'Procedimiento en Domicilio',
];

const EMPTY_FORM = {
    solicitante: '',
    tipoSalida: 'Visitas Domiciliarias' as TipoSolicitud,
    descripcion: '',
    estado: 'Pendiente' as EstadoSolicitud,
    funcionariosIds: [] as string[],
    fechaViaje: new Date().toISOString().split('T')[0]
};

interface Props {
    onApprove?: (s: SolicitudSalida) => void;
}

const SolicitudesManagement: React.FC<Props> = ({ onApprove }) => {
    const { usuario } = useAuth();
    const isAdmin = usuario?.rol === 'admin';
    const [solicitudes, setSolicitudes] = useState<SolicitudSalida[]>([]);
    const [allPersonal, setAllPersonal] = useState<Personal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<SolicitudSalida | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [filterEstado, setFilterEstado] = useState<EstadoSolicitud | 'Todas'>('Todas');
    const [filterTipo, setFilterTipo] = useState<TipoSolicitud | 'Todos'>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        setLoading(true);
        const [solicitudesData, personalData] = await Promise.all([
            getSolicitudesFirebase(),
            getPersonalFirebase()
        ]);
        
        // Sort newest first
        solicitudesData.sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
        setSolicitudes(solicitudesData);
        setAllPersonal(personalData);
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            await load();
        };
        init();
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm({
            ...EMPTY_FORM,
            solicitante: usuario?.nombre || usuario?.email || '',
        });
        setShowForm(true);
    };

    const openEdit = (s: SolicitudSalida) => {
        setEditing(s);
        setForm({
            solicitante: s.solicitante,
            tipoSalida: s.tipoSalida,
            descripcion: s.descripcion,
            estado: s.estado,
            funcionariosIds: s.funcionariosIds || [],
            fechaViaje: s.fechaViaje || s.fechaSolicitud
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.solicitante.trim() || !form.descripcion.trim()) {
            showToast('Complete todos los campos requeridos', 'error');
            return;
        }
        try {
            if (editing) {
                await updateSolicitudFirebase({
                    ...editing,
                    ...form,
                });
                showToast('Solicitud actualizada');
            } else {
                await addSolicitudFirebase({
                    ...form,
                    fechaSolicitud: new Date().toISOString().split('T')[0],
                });
                showToast('Solicitud creada');
            }
            setShowForm(false);
            load();
        } catch {
            showToast('Error al guardar', 'error');
        }
    };

    const handleChangeEstado = async (s: SolicitudSalida, estado: EstadoSolicitud) => {
        try {
            await updateSolicitudFirebase({ ...s, estado });
            setSolicitudes(prev => prev.map(x => x.id === s.id ? { ...x, estado } : x));
            if (estado === 'Aprobada' && onApprove) {
                onApprove(s);
            }
        } catch {
            showToast('Error al cambiar estado', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar esta solicitud?')) return;
        try {
            await deleteSolicitudFirebase(id);
            showToast('Solicitud eliminada');
            load();
        } catch {
            showToast('Error al eliminar', 'error');
        }
    };

    /* stats */
    const stats = {
        total:     solicitudes.length,
        pendiente: solicitudes.filter(s => s.estado === 'Pendiente').length,
        aprobada:  solicitudes.filter(s => s.estado === 'Aprobada').length,
        rechazada: solicitudes.filter(s => s.estado === 'Rechazada').length,
    };

    const filtered = solicitudes.filter(s => {
        // If admin, show only 'Pendiente' or 'Aprobada' that are NOT yet assigned to a ronda
        // but user says "solo deben estar siempre las con estado pendiente" in his re-statement.
        // I will follow "solo pendiente" if that's what he truly wants, or "pending + approved WITHOUT ronda" 
        // given the 'una vez aprobada Y asignada' sentence.
        const isAdmin = usuario?.rol === 'admin';
        if (isAdmin) {
             // If he says "solo pendiente" then:
             // return s.estado === 'Pendiente' && ... 
             // But he also said "una vez aprobada Y asignado desaparece".
             // This suggests Aprobada + SIN asignar SI aparece.
             const isActionable = s.estado === 'Pendiente' || (s.estado === 'Aprobada' && !s.rondaId);
             if (!isActionable) return false;
        }

        return (filterEstado === 'Todas' || s.estado === filterEstado) &&
               (filterTipo   === 'Todos' || s.tipoSalida === filterTipo);
    });

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                    padding: '0.875rem 1.25rem', borderRadius: '10px',
                    background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: toast.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${toast.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                    fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total',     value: stats.total,     color: '#1d4ed8', bg: '#dbeafe' },
                    { label: 'Pendientes',value: stats.pendiente, color: '#92400e', bg: '#fef3c7' },
                    { label: 'Aprobadas', value: stats.aprobada,  color: '#065f46', bg: '#d1fae5' },
                    { label: 'Rechazadas',value: stats.rechazada, color: '#991b1b', bg: '#fee2e2' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ＋ Nueva Solicitud
                    </button>

                    {isAdmin && (
                        <>
                            <select
                                value={filterEstado}
                                onChange={e => setFilterEstado(e.target.value as EstadoSolicitud | 'Todas')}
                                style={{ flex: '0 0 auto', width: 'auto', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                            >
                                <option value="Todas">Todos los estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Rechazada">Rechazada</option>
                            </select>

                            <select
                                value={filterTipo}
                                onChange={e => setFilterTipo(e.target.value as TipoSolicitud | 'Todos')}
                                style={{ flex: '0 0 auto', width: 'auto', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                            >
                                <option value="Todos">Todos los tipos</option>
                                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </>
                    )}

                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b' }}>
                        {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''}
                    </div>
                </div>
            </div>

            {/* Colour legend */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {TIPOS.map(t => {
                    const cfg = TIPO_CONFIG[t];
                    return (
                        <span key={t} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 10px', borderRadius: '999px',
                            background: cfg.bg, color: cfg.color, fontSize: '0.78rem', fontWeight: 600
                        }}>
                            {cfg.icon} {t}
                        </span>
                    );
                })}
            </div>

            {/* Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando...</p>
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay solicitudes</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>F. Solicitud</th>
                                <th>F. Viaje</th>
                                <th>Solicitante</th>
                                <th>Acompañantes</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                {isAdmin && <th>Estado de solicitud</th>}
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const tipoCfg   = TIPO_CONFIG[s.tipoSalida];
                                const estadoCfg = ESTADO_CONFIG[s.estado];
                                return (
                                    <tr key={s.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#64748b' }}>
                                            {s.fechaSolicitud.split('-').reverse().join('/')}
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                                            {s.fechaViaje ? s.fechaViaje.split('-').reverse().join('/') : '–'}
                                        </td>
                                        <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                            {s.solicitante}
                                        </td>
                                        <td>
                                            {s.funcionariosIds && s.funcionariosIds.length > 0 ? (
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    background: '#f1f5f9', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '6px',
                                                    color: '#475569',
                                                    fontWeight: 600,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    👤 {s.funcionariosIds.length} funcionario{s.funcionariosIds.length > 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Solo</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '4px 10px', borderRadius: '999px',
                                                background: tipoCfg.bg, color: tipoCfg.color,
                                                fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap'
                                            }}>
                                                {tipoCfg.icon} {s.tipoSalida}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '260px', fontSize: '0.83rem', color: '#475569' }}>
                                            {s.descripcion}
                                        </td>
                                        <td>
                                            {isAdmin ? (
                                                <select
                                                    value={s.estado}
                                                    onChange={e => handleChangeEstado(s, e.target.value as EstadoSolicitud)}
                                                    style={{
                                                        padding: '4px 8px', fontSize: '0.78rem', borderRadius: '8px',
                                                        border: `1.5px solid ${estadoCfg.color}66`,
                                                        background: estadoCfg.bg, color: estadoCfg.color,
                                                        fontWeight: 700, cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="Aprobada">Aprobada</option>
                                                    <option value="Rechazada">Rechazada</option>
                                                </select>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-block', padding: '4px 10px',
                                                    borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                                                    background: estadoCfg.bg, color: estadoCfg.color
                                                }}>
                                                    {s.estado}
                                                </span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td style={{ fontSize: '0.78rem', color: s.rondaId ? '#065f46' : '#94a3b8' }}>
                                                {s.rondaId ? `✅ Asignada` : '–'}
                                            </td>
                                        )}
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {(isAdmin || s.solicitante === usuario?.nombre || s.solicitante === usuario?.email) && (
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '5px 10px', fontSize: '0.78rem', background: '#e0f2fe', color: '#0369a1' }}
                                                        onClick={() => openEdit(s)}
                                                    >✏️ Editar</button>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '5px 10px', fontSize: '0.78rem', background: '#fee2e2', color: '#991b1b' }}
                                                        onClick={() => handleDelete(s.id)}
                                                    >🗑️</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>
                            {editing ? '✏️ Editar Solicitud' : '➕ Nueva Solicitud de Salida'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Solicitante *</label>
                                    <input
                                        type="text"
                                        value={form.solicitante}
                                        onChange={e => setForm({ ...form, solicitante: e.target.value })}
                                        readOnly={!!(usuario?.nombre || usuario?.email)}
                                        style={{ 
                                            background: (usuario?.nombre || usuario?.email) ? '#f8fafc' : 'white', 
                                            color: (usuario?.nombre || usuario?.email) ? '#64748b' : 'inherit' 
                                        }}
                                        placeholder="Tu nombre completo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Fecha para el viaje *</label>
                                    <input
                                        type="date"
                                        value={form.fechaViaje}
                                        onChange={e => setForm({ ...form, fechaViaje: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tipo de Salida *</label>
                                <select
                                    value={form.tipoSalida}
                                    onChange={e => setForm({ ...form, tipoSalida: e.target.value as TipoSolicitud })}
                                >
                                    {TIPOS.map(t => (
                                        <option key={t} value={t}>{TIPO_CONFIG[t].icon} {t}</option>
                                    ))}
                                </select>
                                <div style={{
                                    marginTop: '6px', padding: '6px 12px', borderRadius: '8px',
                                    background: TIPO_CONFIG[form.tipoSalida].bg,
                                    color: TIPO_CONFIG[form.tipoSalida].color,
                                    fontSize: '0.78rem', fontWeight: 600, display: 'inline-block'
                                }}>
                                    {TIPO_CONFIG[form.tipoSalida].icon} {form.tipoSalida}
                                </div>

                                {form.tipoSalida === 'Visitas Domiciliarias' && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                                            Personal Acompañante ({form.funcionariosIds.length}/4)
                                        </label>
                                        
                                        {form.funcionariosIds.length < 4 && (
                                            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    placeholder="🔍 Buscar funcionario por nombre o especialidad..."
                                                    style={{ 
                                                        width: '100%', padding: '0.625rem 0.75rem', 
                                                        fontSize: '0.875rem', border: '1px solid #e2e8f0', 
                                                        borderRadius: '8px', background: 'white' 
                                                    }}
                                                />
                                                {searchTerm.trim() !== '' && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0, 
                                                        background: 'white', border: '1px solid #e2e8f0', 
                                                        borderRadius: '8px', marginTop: '4px', zIndex: 10,
                                                        maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {allPersonal
                                                            .filter(p => !form.funcionariosIds.includes(p.id))
                                                            .filter(p => 
                                                                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                                p.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
                                                            )
                                                            .map(p => (
                                                                <div 
                                                                    key={p.id} 
                                                                    onClick={() => {
                                                                        setForm({ ...form, funcionariosIds: [...form.funcionariosIds, p.id] });
                                                                        setSearchTerm('');
                                                                    }}
                                                                    style={{
                                                                        padding: '0.625rem 1rem', cursor: 'pointer',
                                                                        display: 'flex', flexDirection: 'column',
                                                                        borderBottom: '1px solid #f1f5f9'
                                                                    }}
                                                                    className="search-item-hover"
                                                                >
                                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.nombre}</span>
                                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.especialidad}</span>
                                                                </div>
                                                            ))
                                                        }
                                                        {allPersonal
                                                            .filter(p => !form.funcionariosIds.includes(p.id))
                                                            .filter(p => 
                                                                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                                p.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
                                                            ).length === 0 && (
                                                                <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                                    No se encontraron resultados
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {form.funcionariosIds.map(fid => {
                                                const p = allPersonal.find(x => x.id === fid);
                                                if (!p) return null;
                                                return (
                                                    <div key={fid} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px',
                                                        border: '1px solid #e2e8f0', fontSize: '0.85rem'
                                                    }}>
                                                        <span>{p.nombre}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setForm({ ...form, funcionariosIds: form.funcionariosIds.filter(x => x !== fid) })}
                                                            style={{
                                                                background: 'none', border: 'none', color: '#ef4444',
                                                                cursor: 'pointer', padding: '2px 6px', fontSize: '1rem'
                                                            }}
                                                        >✕</button>
                                                    </div>
                                                );
                                            })}
                                            {form.funcionariosIds.length === 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                                                    Ningún acompañante seleccionado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Descripción *</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                    placeholder="Describir el motivo y detalles de la solicitud..."
                                    rows={4}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
                                />
                            </div>

                            {editing && (
                                <div className="form-group">
                                    <label>Estado</label>
                                    <select
                                        value={form.estado}
                                        onChange={e => setForm({ ...form, estado: e.target.value as EstadoSolicitud })}
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Aprobada">Aprobada</option>
                                        <option value="Rechazada">Rechazada</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setShowForm(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editing ? 'Guardar Cambios' : 'Crear Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolicitudesManagement;
