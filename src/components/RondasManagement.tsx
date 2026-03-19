import React, { useState, useEffect } from 'react';
import { POSTAS, VEHICULOS, PERSONAL } from '../data/mockData';
import type { Ronda, Posta, Vehiculo, Personal, SolicitudSalida } from '../data/types';
import { getSolicitudesFirebase, updateSolicitudFirebase } from '../services/solicitudesService';
import { TIPO_CONFIG } from '../data/config';
import { required, validate, timeRange } from '../utils/validation';
import Toast from './Toast';
import VehicleSeatMap from './VehicleSeatMap';
import PrintableRonda from './PrintableRonda';
import { getRondasFirebase, addRondaFirebase, updateRondaFirebase, deleteRondaFirebase } from '../services/rondasService';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../context/AuthContext';




interface RondasManagementProps {
    viewMode?: 'form' | 'table';
    onSwitchTab?: () => void;
    prefillData?: Partial<Ronda> & { solicitanteName?: string };
    onClearPrefill?: () => void;
}

const RondasManagement: React.FC<RondasManagementProps> = ({ 
    viewMode = 'form', 
    onSwitchTab, 
    prefillData,
    onClearPrefill 
}) => {
    const { usuario } = useAuth();
    const isAdmin = usuario?.rol === 'admin';

    // Load dynamic data from localStorage
    const [postosList] = useState<Posta[]>(() => {
        const saved = localStorage.getItem('postas_data');
        return saved ? JSON.parse(saved) : POSTAS;
    });

    const [vehiculosList] = useState<Vehiculo[]>(() => {
        const saved = localStorage.getItem('vehiculos_data');
        return saved ? JSON.parse(saved) : VEHICULOS;
    });

    const [personalList] = useState<Personal[]>(() => {
        const saved = localStorage.getItem('personal_data');
        return saved ? JSON.parse(saved) : PERSONAL;
    });

    const [rondas, setRondas] = useState<Ronda[]>([]);

    useEffect(() => {
        const fetchRondas = async () => {
            try {
                const firebaseRondas = await getRondasFirebase();
                if (firebaseRondas.length > 0) {
                    // Firebase tiene datos
                    setRondas(firebaseRondas);
                } else {
                    // Firebase está vacío: Migrar datos locales si existen
                    const saved = localStorage.getItem('rondas_data');
                    if (saved) {
                        const localRondas = JSON.parse(saved) as Ronda[];
                        if (localRondas.length > 0) {
                            setRondas(localRondas);
                            for (const r of localRondas) {
                                await addRondaFirebase(r);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando rondas:", error);
                
                // Fallback a localStorage
                const saved = localStorage.getItem('rondas_data');
                if (saved) setRondas(JSON.parse(saved));
            }
        };

        fetchRondas();
    }, []);

    // Guardar respaldo local solo por si acaso
    useEffect(() => {
        localStorage.setItem('rondas_data', JSON.stringify(rondas));
    }, [rondas]);

    const [printingRonda, setPrintingRonda] = useState<Ronda | null>(null);
    const [editingRondaId, setEditingRondaId] = useState<string | null>(null);
    const [tableDisplayMode, setTableDisplayMode] = useState<'list' | 'calendar'>('list');

    // Handle cleanup after print
    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintingRonda(null);
        };

        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipoSalida: 'Ronda Rural',
        postaId: postosList.length > 0 ? postosList[0].id : '',
        paradasIntermediasIds: [] as string[],
        indicaciones: '',
        vehiculoId: vehiculosList.length > 0 ? vehiculosList[0].id : '',
        conductorId: '',
        selectedPersonal: [] as string[],
        horaSalida: '08:00',
        horaRetorno: '16:00',
        accionRetorno: 'Volver al CESFAM',
        viaticos: {} as Record<string, string>,
        solicitudesIds: [] as string[]
    });

    useEffect(() => {
        if (prefillData) {
            const passengers = [...(prefillData.pasajerosIds || [])];
            
            // Buscar al solicitante en la lista de personal por nombre o correo
            if (prefillData.solicitanteName) {
                const solicitanteEncontrado = personalList.find(p => 
                    p.nombre === prefillData.solicitanteName || 
                    p.correo === prefillData.solicitanteName
                );
                if (solicitanteEncontrado && !passengers.includes(solicitanteEncontrado.id)) {
                    passengers.push(solicitanteEncontrado.id);
                }
            }

            // Usar un timeout pequeño para no bloquear el renderizado actual
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    fecha: prefillData.fecha || prev.fecha,
                    indicaciones: prefillData.indicaciones || prev.indicaciones,
                    tipoSalida: prefillData.tipoSalida || prev.tipoSalida,
                    selectedPersonal: passengers,
                    solicitudesIds: prefillData.solicitudesIds || prev.solicitudesIds
                }));
                if (onClearPrefill) onClearPrefill();
            }, 0);
        }
    }, [prefillData, personalList, onClearPrefill]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [solicitudesAprobadas, setSolicitudesAprobadas] = useState<SolicitudSalida[]>([]);

    useEffect(() => {
        getSolicitudesFirebase().then(all => {
            setSolicitudesAprobadas(all.filter(s => s.estado === 'Aprobada' && !s.rondaId));
        });
    }, []);

    const selectedVehiculo = vehiculosList.find(v => v.id === formData.vehiculoId);
    const seatsAvailable = selectedVehiculo ? selectedVehiculo.capacidadTotal - formData.selectedPersonal.length : 0;

    const handleAddStaff = (staffId: string) => {
        if (formData.selectedPersonal.includes(staffId)) {
            setFormData({ ...formData, selectedPersonal: formData.selectedPersonal.filter(id => id !== staffId) });
        } else {
            if (seatsAvailable <= 0) {
                setToast({ message: '¡Capacidad máxima del vehículo alcanzada!', type: 'error' });
                return;
            }
            setFormData({ ...formData, selectedPersonal: [...formData.selectedPersonal, staffId] });
        }
    };

    const handleAddStop = (postaId: string) => {
        if (postaId === "") return;
        if (formData.paradasIntermediasIds.includes(postaId)) return;
        if (postaId === formData.postaId) {
            setToast({ message: 'La parada intermedia no puede ser el destino final', type: 'error' });
            return;
        }
        if (formData.paradasIntermediasIds.length >= 3) {
            setToast({ message: 'Máximo 3 paradas intermedias permitidas', type: 'error' });
            return;
        }
        setFormData({ ...formData, paradasIntermediasIds: [...formData.paradasIntermediasIds, postaId] });
    };

    const handleRemoveStop = (postaId: string) => {
        setFormData({ ...formData, paradasIntermediasIds: formData.paradasIntermediasIds.filter(id => id !== postaId) });
    };

    const validateForm = (): boolean => {
        const today = new Date().toISOString().split('T')[0];

        const validation = validate(
            required(formData.fecha, 'Fecha'),
            required(formData.conductorId, 'Conductor'),
            required(formData.postaId, 'Destino'),
            required(formData.vehiculoId, 'Vehículo'),
            formData.selectedPersonal.length === 0 ? { field: 'selectedPersonal', message: 'Debe seleccionar al menos 1 pasajero', type: 'required' as const } : null,
            formData.horaSalida && formData.horaRetorno ? timeRange(formData.horaSalida, formData.horaRetorno, 'Horario') : null,
            formData.fecha < today ? { field: 'fecha', message: 'La fecha no puede ser anterior a hoy', type: 'custom' as const } : null
        );

        const newErrors: Record<string, string> = {};
        validation.errors.forEach(error => {
            newErrors[error.field] = error.message;
        });

        setErrors(newErrors);
        return validation.isValid;
    };

    const handleFieldBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleCreateRonda = async () => {
        setTouched({
            fecha: true,
            conductorId: true,
            postaId: true,
            vehiculoId: true,
            selectedPersonal: true,
            horaSalida: true,
            horaRetorno: true
        });

        if (!validateForm()) {
            setToast({ message: 'Por favor corrija los errores en el formulario', type: 'error' });
            return;
        }

        // Verificar conflictos de horario con otras rondas del mismo día
        const rondasDelMismoDia = rondas.filter(
            r => r.fecha === formData.fecha &&
                r.vehiculoId === formData.vehiculoId &&
                r.id !== editingRondaId
        );

        for (const ronda of rondasDelMismoDia) {
            // Verificar superposición de horarios
            const existingStart = ronda.horaSalida || '00:00';
            const existingEnd = ronda.horaRetorno || '23:59';

            if (
                (formData.horaSalida >= existingStart && formData.horaSalida < existingEnd) ||
                (formData.horaRetorno > existingStart && formData.horaRetorno <= existingEnd) ||
                (formData.horaSalida <= existingStart && formData.horaRetorno >= existingEnd)
            ) {
                setToast({
                    message: 'El vehículo ya está programado para otra salida en este horario',
                    type: 'error'
                });
                return;
            }
        }

        try {
            if (editingRondaId) {
                const updatedRondas = rondas.map(r => r.id === editingRondaId ? {
                    ...r,
                    ...formData,
                    pasajerosIds: formData.selectedPersonal
                } : r);
                
                const updatedRondaRecord = updatedRondas.find(r => r.id === editingRondaId)!;
                // Update Firebase
                await updateRondaFirebase(updatedRondaRecord);
                
                setRondas(updatedRondas);
                setEditingRondaId(null);
                setToast({ message: 'Ronda actualizada correctamente en la Nube', type: 'success' });
            } else {
                const newRonda: Ronda = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...formData,
                    pasajerosIds: formData.selectedPersonal,
                    solicitudesIds: formData.solicitudesIds
                };
                
                // Save to Firebase
                await addRondaFirebase(newRonda);

                // Link each selected solicitud to this ronda
                for (const solId of formData.solicitudesIds) {
                    const sol = solicitudesAprobadas.find(s => s.id === solId);
                    if (sol) await updateSolicitudFirebase({ ...sol, rondaId: newRonda.id });
                }
                // Refresh available solicitudes
                getSolicitudesFirebase().then(all => setSolicitudesAprobadas(all.filter(s => s.estado === 'Aprobada' && !s.rondaId)));
                
                setRondas([newRonda, ...rondas]);
                setToast({ message: 'Ronda programada y guardada en la Nube', type: 'success' });
            }

            setFormData({
                ...formData,
                tipoSalida: 'Ronda Rural',
                selectedPersonal: [],
                paradasIntermediasIds: [],
                indicaciones: '',
                conductorId: '',
                horaSalida: '08:00',
                horaRetorno: '16:00',
                accionRetorno: 'Volver al CESFAM',
                viaticos: {},
                solicitudesIds: []
            });
            setErrors({});
            setTouched({});
        } catch {
            setToast({ message: 'Hubo un error al comunicarse con la Nube', type: 'error' });
        }
    };

    const handleCancelEdit = () => {
        setEditingRondaId(null);
        setFormData({
            ...formData,
            tipoSalida: 'Ronda Rural',
            selectedPersonal: [],
            paradasIntermediasIds: [],
            indicaciones: '',
            conductorId: '',
            horaSalida: '08:00',
            horaRetorno: '16:00',
            accionRetorno: 'Volver al CESFAM',
            viaticos: {}
        });
        setErrors({});
        setTouched({});
    };

    const handleEditRonda = (r: Ronda) => {
        setEditingRondaId(r.id);
        setFormData({
            ...formData,
            fecha: r.fecha,
            tipoSalida: r.tipoSalida,
            postaId: r.postaId,
            paradasIntermediasIds: r.paradasIntermediasIds || [],
            indicaciones: r.indicaciones || '',
            vehiculoId: r.vehiculoId,
            conductorId: r.conductorId,
            selectedPersonal: r.pasajerosIds,
            horaSalida: r.horaSalida || '08:00',
            horaRetorno: r.horaRetorno || '16:00',
            accionRetorno: r.accionRetorno || 'Volver al CESFAM',
            viaticos: r.viaticos || {}
        });
        if (onSwitchTab) onSwitchTab();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrint = (ronda: Ronda) => {
        setPrintingRonda(ronda);
        setTimeout(() => {
            window.print();
        }, 300);
    };
    


    const handleEmailRonda = (ronda: Ronda) => {
        const dest = postosList.find(pt => pt.id === ronda.postaId);
        const conductor = personalList.find(p => p.id === ronda.conductorId);
        const v = vehiculosList.find(vh => vh.id === ronda.vehiculoId);
        const pasajeros = personalList.filter(p => ronda.pasajerosIds.includes(p.id));
        
        // Recipient emails (including conductor and passengers)
        const recipientList = [conductor?.correo, ...pasajeros.map(p => p.correo)].filter(Boolean).join(',');
        
        const subject = `HOJA DE RUTA: ${ronda.fecha.split('-').reverse().join('-')} - ${dest?.nombre}`;
        
        const tripDetails = `DETALLES DE LA SALIDA:\n\n` +
            `– FECHA: ${ronda.fecha.split('-').reverse().join('-')}\n` +
            `– CONDUCTOR: ${conductor?.nombre}\n` +
            `– VEHÍCULO: ${v?.marcaModelo} (${v?.patente})\n` +
            `– DESTINO: ${dest?.nombre}\n\n` +
            `PASAJEROS:\n` +
            pasajeros.map(p => `• ${p.nombre} (${p.especialidad})`).join('\n') +
            `\n\n– INDICACIONES: ${ronda.indicaciones || 'Sin indicaciones particulares.'}\n\n` +
            `Enviado desde el Sistema de Gestión Logística – CESFAM Futrono.`;

        // Gmail specific base URL
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientList)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(tripDetails)}`;
        
        window.open(gmailUrl, '_blank');

        setToast({
            message: `Abriendo Gmail para enviar a ${pasajeros.length + 1} destinatarios...`,
            type: 'info'
        });
    };

    const handleDeleteRonda = async (rondaId: string) => {
        if (window.confirm('¿Está seguro que desea eliminar esta ronda permanentemente de la nube?')) {
            try {
                await deleteRondaFirebase(rondaId);
                setRondas(rondas.filter(r => r.id !== rondaId));
                setToast({ message: 'Ronda eliminada correctamente de la Nube', type: 'success' });
                if (editingRondaId === rondaId) {
                    handleCancelEdit();
                }
            } catch {
                setToast({ message: 'Hubo un error al eliminarla de la nube', type: 'error' });
            }
        }
    };

    const currentPassengers = personalList.filter(p => formData.selectedPersonal.includes(p.id));

    const renderPrintTemplate = () => {
        if (!printingRonda) return null;
        return (
            <div className="print-only">
                <PrintableRonda
                    ronda={printingRonda}
                    postosList={postosList}
                    vehiculosList={vehiculosList}
                    personalList={personalList}
                />
            </div>
        );
    };

    if (viewMode === 'table') {
        const calendarEvents = rondas.map(r => {
            const dest = postosList.find(pt => pt.id === r.postaId);
            const v = vehiculosList.find(vh => vh.id === r.vehiculoId);
            return {
                id: r.id,
                title: `${dest?.nombre} / ${v?.patente}`,
                start: `${r.fecha}T${r.horaSalida || '08:00'}:00`,
                end: `${r.fecha}T${r.horaRetorno || '16:00'}:00`,
                extendedProps: { ronda: r },
                backgroundColor: '#0ea5e9',
                borderColor: '#0284c7'
            };
        });

        return (
            <>
                {renderPrintTemplate()}
                <div className="card no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 className="card-title" style={{ margin: 0 }}>Salidas Programadas</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                className="btn"
                                onClick={() => setTableDisplayMode('list')}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: tableDisplayMode === 'list' ? 'var(--primary)' : '#f1f5f9', 
                                    color: tableDisplayMode === 'list' ? '#ffffff' : '#475569' 
                                }}
                            >
                                📋 Lista
                            </button>
                            <button 
                                className="btn"
                                onClick={() => setTableDisplayMode('calendar')}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: tableDisplayMode === 'calendar' ? 'var(--primary)' : '#f1f5f9', 
                                    color: tableDisplayMode === 'calendar' ? '#ffffff' : '#475569' 
                                }}
                            >
                                📅 Calendario
                            </button>
                        </div>
                    </div>

                    {tableDisplayMode === 'calendar' ? (
                        <div style={{ marginTop: '1rem', background: '#ffffff', padding: '1rem', borderRadius: '12px', minHeight: '600px' }}>
                            <style>{`
                                .fc .fc-toolbar-title { font-size: 1.25em; font-weight: 600; color: #1e293b; }
                                .fc .fc-button-primary { background-color: var(--primary); border-color: var(--primary); }
                                .fc .fc-button-primary:not(:disabled):active,
                                .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #0369a1; border-color: #0369a1; }
                                .fc-event { cursor: pointer; border-radius: 4px; padding: 2px 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                            `}</style>
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                }}
                                events={calendarEvents}
                                locale="es"
                                buttonText={{
                                    today: 'Hoy',
                                    month: 'Mes',
                                    week: 'Semana',
                                    day: 'Día'
                                }}
                                height="auto"
                                eventClick={(info) => {
                                    const r = info.event.extendedProps.ronda as Ronda;
                                    const dest = postosList.find(pt => pt.id === r.postaId);
                                    if (isAdmin) {
                                        if (window.confirm(`¿Editar la salida a ${dest?.nombre} programada para el ${r.fecha.split('-').reverse().join('-')}?`)) {
                                            handleEditRonda(r);
                                        }
                                    } else {
                                        setToast({ message: 'Solo los administradores pueden editar las salidas.', type: 'info' });
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Ruta (Postas)</th>
                                            <th>Vehículo</th>
                                            <th>Pax</th>
                                            <th className="col-actions"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rondas.map(r => {
                                            const dest = postosList.find(pt => pt.id === r.postaId);
                                            const intermediateNames = (r.paradasIntermediasIds || [])
                                                .map(id => postosList.find(pt => pt.id === id)?.nombre)
                                                .join(' → ');
                                            const v = vehiculosList.find(vh => vh.id === r.vehiculoId);
                                            const conductor = personalList.find(p => p.id === r.conductorId);
                                            return (
                                                <tr key={r.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{r.fecha.split('-').reverse().join('-')}</td>
                                                    <td>
                                                        <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                            {intermediateNames && <span style={{ color: '#64748b' }}>{intermediateNames} → </span>}
                                                            <strong>{dest?.nombre}</strong>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '500', marginLeft: '8px' }}>({r.tipoSalida})</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{v?.patente}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{conductor?.nombre}</span>
                                                    </td>
                                                    <td><span className="badge badge-success">{r.pasajerosIds.length}</span></td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                            {isAdmin && <button className="btn no-print" style={{ width: '30px', height: '30px', padding: 0, background: '#e0f2fe', color: '#0369a1' }} onClick={() => handleEditRonda(r)} title="Editar">✏️</button>}
                                                            <button className="btn no-print" style={{ width: '30px', height: '30px', padding: 0, background: '#f1f5f9', color: '#475569' }} onClick={() => handlePrint(r)} title="Imprimir">🖨️</button>
                                                            {isAdmin && <button className="btn no-print" style={{ width: '30px', height: '30px', padding: 0, background: '#dcfce7', color: '#166534' }} onClick={() => handleEmailRonda(r)} title="Enviar por Correo">📨</button>}
                                                            {isAdmin && <button className="btn no-print" style={{ width: '30px', height: '30px', padding: 0, background: '#fee2e2', color: '#991b1b' }} onClick={() => handleDeleteRonda(r.id)} title="Eliminar">🗑️</button>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {rondas.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📋</p>
                                    <p>No hay salidas programadas</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    }

    const today = new Date().toISOString().split('T')[0];

    return (
        <>
            {renderPrintTemplate()}


            <div className="dashboard-grid">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}

                <div className="card no-print">
                    <h3 className="card-title">{editingRondaId ? '✏️ Editar Salida Programada' : 'Programar Nueva Salida'}</h3>

                    {/* Row 1: Vehicle, Driver, Date */}
                    <div className="form-grid-3">
                        <div className="form-field">
                            <div className="form-group">
                                <label>Vehículo Asignado</label>
                                <select
                                    value={formData.vehiculoId}
                                    onChange={e => setFormData({ ...formData, vehiculoId: e.target.value })}
                                    onBlur={() => handleFieldBlur('vehiculoId')}
                                    className={touched.vehiculoId && errors.vehiculoId ? 'input-error' : ''}
                                >
                                    {vehiculosList.filter(v => v.estado === 'Disponible').map(v => (
                                        <option key={v.id} value={v.id}>{v.marcaModelo} - {v.patente} (Cap: {v.capacidadTotal})</option>
                                    ))}
                                </select>
                                {touched.vehiculoId && errors.vehiculoId && (
                                    <div className="error-message">
                                        <span>⚠️</span> {errors.vehiculoId}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-field">
                            <div className="form-group">
                                <label>Conductor Designado</label>
                                <select
                                    value={formData.conductorId}
                                    onChange={e => setFormData({ ...formData, conductorId: e.target.value })}
                                    onBlur={() => handleFieldBlur('conductorId')}
                                    className={touched.conductorId && errors.conductorId ? 'input-error' : ''}
                                >
                                    <option value="">Seleccionar conductor...</option>
                                    {personalList.filter(p => p.especialidad === 'Conductor').map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} ({p.especialidad})</option>
                                    ))}
                                </select>
                                {touched.conductorId && errors.conductorId && (
                                    <div className="error-message">
                                        <span>⚠️</span> {errors.conductorId}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-field">
                            <div className="form-group">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    min={today}
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                    onBlur={() => handleFieldBlur('fecha')}
                                    className={touched.fecha && errors.fecha ? 'input-error' : ''}
                                />
                                {touched.fecha && errors.fecha && (
                                    <div className="error-message">
                                        <span>⚠️</span> {errors.fecha}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fila Logística: Horas y Acciones */}
                    <div className="form-grid-3">
                        <div className="form-group">
                            <label>Hora Salida</label>
                            <input
                                type="time"
                                value={formData.horaSalida}
                                onChange={e => setFormData({ ...formData, horaSalida: e.target.value })}
                                onBlur={() => handleFieldBlur('horaSalida')}
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora Retorno</label>
                            <input
                                type="time"
                                value={formData.horaRetorno}
                                onChange={e => setFormData({ ...formData, horaRetorno: e.target.value })}
                                onBlur={() => handleFieldBlur('horaRetorno')}
                            />
                        </div>
                        <div className="form-group">
                            <label>Acciones</label>
                            <select value={formData.accionRetorno} onChange={e => setFormData({ ...formData, accionRetorno: e.target.value })}>
                                <option value="Volver al CESFAM">Volver al CESFAM</option>
                                <option value="Permanecer en Posta">Permanecer en Posta</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Type of Outing, Destination, Intermediate Stops */}
                    <div className="form-grid-3">
                        <div className="form-group">
                            <label>Tipo de Salida</label>
                            <select value={formData.tipoSalida} onChange={e => setFormData({ ...formData, tipoSalida: e.target.value })}>
                                <option value="Ronda Rural">Ronda Rural</option>
                                <option value="Visitas Domiciliarias">Visitas Domiciliarias</option>
                                <option value="Procedimiento en Domicilio">Procedimiento en Domicilio</option>
                                <option value="Toma de Muestras">Toma de Muestras</option>
                                <option value="Traslado de Pacientes">Traslado de Pacientes</option>
                                <option value="Area">Area</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <div className="form-group">
                                <label>Posta de Destino</label>
                                <select
                                    value={formData.postaId}
                                    onChange={e => setFormData({ ...formData, postaId: e.target.value, paradasIntermediasIds: formData.paradasIntermediasIds.filter(id => id !== e.target.value) })}
                                    onBlur={() => handleFieldBlur('postaId')}
                                    className={touched.postaId && errors.postaId ? 'input-error' : ''}
                                >
                                    {postosList.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.distanciaKm}km)</option>)}
                                </select>
                                {touched.postaId && errors.postaId && (
                                    <div className="error-message">
                                        <span>⚠️</span> {errors.postaId}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Paradas Intermedias (Máx 3)</label>
                            <select
                                onChange={e => handleAddStop(e.target.value)}
                                value=""
                                disabled={formData.paradasIntermediasIds.length >= 3}
                            >
                                <option value="">Seleccionar parada...</option>
                                {postosList.filter(p => p.id !== formData.postaId && !formData.paradasIntermediasIds.includes(p.id)).map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                                {formData.paradasIntermediasIds.map(id => (
                                    <span key={id} className="badge badge-specialty" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9' }}>
                                        {postosList.find(p => p.id === id)?.nombre}
                                        <span onClick={() => handleRemoveStop(id)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>✕</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Indications */}
                    <div className="form-group">
                        <label>Indicaciones / Instrucciones de Viaje</label>
                        <textarea
                            value={formData.indicaciones}
                            onChange={e => setFormData({ ...formData, indicaciones: e.target.value })}
                            placeholder="Ej: Pasar a buscar insumos médicos, cambio de chofer en paradero X, etc."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '200px', fontFamily: 'inherit' }}
                            maxLength={1000}
                        />
                        <div className="char-counter">
                            {formData.indicaciones.length}/1000 caracteres
                        </div>
                    </div>

                    {/* Solicitudes Aprobadas */}
                    {solicitudesAprobadas.length > 0 && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ fontWeight: 700 }}>📋 Solicitudes Aprobadas (opcional)</label>
                            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                Selecciona las solicitudes que se atenderán en esta salida
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                {solicitudesAprobadas.map(s => {
                                    const cfg = TIPO_CONFIG[s.tipoSalida];
                                    const selected = formData.solicitudesIds.includes(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                const ids = selected
                                                    ? formData.solicitudesIds.filter(id => id !== s.id)
                                                    : [...formData.solicitudesIds, s.id];
                                                setFormData({ ...formData, solicitudesIds: ids });
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                                                border: `2px solid ${selected ? cfg.color : '#e2e8f0'}`,
                                                background: selected ? cfg.bg : 'white',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>{selected ? '✅' : '⬜'}</span>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem',
                                                fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap'
                                            }}>
                                                {cfg.icon} {s.tipoSalida}
                                            </span>
                                            <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 500, flex: 1 }}>
                                                {s.solicitante}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {s.fechaSolicitud.split('-').reverse().join('/')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {formData.solicitudesIds.length > 0 && (
                                <p style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 600, marginTop: '6px' }}>
                                    ✅ {formData.solicitudesIds.length} solicitud(es) seleccionada(s)
                                </p>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={handleCreateRonda}
                            disabled={formData.selectedPersonal.length === 0}
                        >
                            {editingRondaId ? 'Actualizar Salida' : `Guardar Salida (${formData.selectedPersonal.length} pasajeros)`}
                        </button>
                        {editingRondaId && (
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                onClick={handleCancelEdit}
                            >
                                Cancelar Edición
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <div className="no-print">
                        {selectedVehiculo && (
                            <VehicleSeatMap
                                vehiculo={selectedVehiculo}
                                pasajeros={currentPassengers}
                                allPersonal={personalList}
                                viaticos={formData.viaticos}
                                onViaticoChange={(id, val) => setFormData({ ...formData, viaticos: { ...formData.viaticos, [id]: val } })}
                                conductor={personalList.find(p => p.id === formData.conductorId)}
                                onAddPersonal={(id) => handleAddStaff(id)}
                                onRemovePersonal={(id) => setFormData({ ...formData, selectedPersonal: formData.selectedPersonal.filter(sid => sid !== id) })}
                            />
                        )}
                    </div>

                    {errors.selectedPersonal && touched.selectedPersonal && (
                        <div className="error-message" style={{ marginTop: '1rem' }}>
                            <span>⚠️</span> {errors.selectedPersonal}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default RondasManagement;
