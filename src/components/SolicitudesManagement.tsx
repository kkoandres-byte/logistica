import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SolicitudSalida, TipoSolicitud, EstadoSolicitud } from '../data/types';
import {
    getSolicitudesFirebase,
    addSolicitudFirebase,
    updateSolicitudFirebase,
    deleteSolicitudFirebase
} from '../services/solicitudesService';

/* ─── colour coding ──────────────────────────────────────────── */
export const TIPO_CONFIG: Record<TipoSolicitud, { color: string; bg: string; icon: string }> = {
    'Visitas Domiciliarias':     { color: '#1d4ed8', bg: '#dbeafe', icon: '🏠' },
    'Traslado de Pacientes':     { color: '#b45309', bg: '#fef3c7', icon: '🚑' },
    'Toma de Muestras':          { color: '#065f46', bg: '#d1fae5', icon: '🧪' },
    'Procedimiento en Domicilio':{ color: '#7c3aed', bg: '#ede9fe', icon: '💉' },
};

const ESTADO_CONFIG: Record<EstadoSolicitud, { color: string; bg: string }> = {
    Pendiente:  { color: '#92400e', bg: '#fef3c7' },
    Aprobada:   { color: '#065f46', bg: '#d1fae5' },
    Rechazada:  { color: '#991b1b', bg: '#fee2e2' },
};

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
};

const SolicitudesManagement: React.FC = () => {
    const { usuario } = useAuth();
    const isAdmin = usuario?.rol === 'admin';
    const [solicitudes, setSolicitudes] = useState<SolicitudSalida[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<SolicitudSalida | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [filterEstado, setFilterEstado] = useState<EstadoSolicitud | 'Todas'>('Todas');
    const [filterTipo, setFilterTipo] = useState<TipoSolicitud | 'Todos'>('Todos');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        setLoading(true);
        const data = await getSolicitudesFirebase();
        // Sort newest first
        data.sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
        setSolicitudes(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (s: SolicitudSalida) => {
        setEditing(s);
        setForm({
            solicitante: s.solicitante,
            tipoSalida: s.tipoSalida,
            descripcion: s.descripcion,
            estado: s.estado,
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

    const filtered = solicitudes.filter(s =>
        (filterEstado === 'Todas' || s.estado === filterEstado) &&
        (filterTipo   === 'Todos' || s.tipoSalida === filterTipo)
    );

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
                                <th>Fecha</th>
                                <th>Solicitante</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Ronda</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const tipoCfg   = TIPO_CONFIG[s.tipoSalida];
                                const estadoCfg = ESTADO_CONFIG[s.estado];
                                return (
                                    <tr key={s.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                            {s.fechaSolicitud.split('-').reverse().join('/')}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{s.solicitante}</td>
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
                                        <td style={{ fontSize: '0.78rem', color: s.rondaId ? '#065f46' : '#94a3b8' }}>
                                            {s.rondaId ? `✅ Asignada` : '–'}
                                        </td>
                                        <td>
                                            {isAdmin && (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '5px 10px', fontSize: '0.78rem', background: '#e0f2fe', color: '#0369a1' }}
                                                        onClick={() => openEdit(s)}
                                                    >✏️ Editar</button>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '5px 10px', fontSize: '0.78rem', background: '#fee2e2', color: '#991b1b' }}
                                                        onClick={() => handleDelete(s.id)}
                                                    >🗑️</button>
                                                </div>
                                            )}
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
                            <div className="form-group">
                                <label>Solicitante *</label>
                                <input
                                    type="text"
                                    value={form.solicitante}
                                    onChange={e => setForm({ ...form, solicitante: e.target.value })}
                                    placeholder="Nombre del funcionario solicitante"
                                />
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
