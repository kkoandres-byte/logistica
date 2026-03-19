import React, { useState, useEffect } from 'react';
import type { Vehiculo } from '../data/types';
import { VEHICULOS as INITIAL_VEHICULOS } from '../data/mockData';
import { required, minLength, maxLength, patente as validatePatente, minNumber, maxNumber, validate } from '../utils/validation';
import Toast from './Toast';
import { getVehiculosFirebase, addVehiculoFirebase, updateVehiculoFirebase, deleteVehiculoFirebase } from '../services/dataService';

const VehiculosManagement: React.FC = () => {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fbData = await getVehiculosFirebase();
                if (fbData.length > 0) {
                    setVehiculos(fbData);
                } else {
                    const saved = localStorage.getItem('vehiculos_data');
                    if (saved) {
                        const localData = JSON.parse(saved) as Vehiculo[];
                        if (localData.length > 0) {
                            setVehiculos(localData);
                            for (const item of localData) {
                                await addVehiculoFirebase(item);
                            }
                        }
                    } else {
                        setVehiculos(INITIAL_VEHICULOS);
                        for (const item of INITIAL_VEHICULOS) {
                            await addVehiculoFirebase(item);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                const saved = localStorage.getItem('vehiculos_data');
                if (saved) setVehiculos(JSON.parse(saved));
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        localStorage.setItem('vehiculos_data', JSON.stringify(vehiculos));
    }, [vehiculos]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newVehiculo, setNewVehiculo] = useState<Omit<Vehiculo, 'id'>>({
        marcaModelo: '',
        patente: '',
        capacidadTotal: 5,
        estado: 'Disponible'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const validateForm = (): boolean => {
        const validation = validate(
            required(newVehiculo.marcaModelo, 'Marca/Modelo'),
            required(newVehiculo.patente, 'Patente'),
            minLength(newVehiculo.marcaModelo, 3, 'Marca/Modelo'),
            maxLength(newVehiculo.marcaModelo, 50, 'Marca/Modelo'),
            validatePatente(newVehiculo.patente, 'Patente'),
            minNumber(newVehiculo.capacidadTotal, 2, 'Capacidad'),
            maxNumber(newVehiculo.capacidadTotal, 50, 'Capacidad')
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

        // Validación individual del campo
        const fieldErrors: Record<string, string> = { ...errors };

        switch (field) {
            case 'marcaModelo': {
                const marcaError = required(newVehiculo.marcaModelo, 'Marca/Modelo') ||
                    minLength(newVehiculo.marcaModelo, 3, 'Marca/Modelo') ||
                    maxLength(newVehiculo.marcaModelo, 50, 'Marca/Modelo');
                if (marcaError) {
                    fieldErrors.marcaModelo = marcaError.message;
                } else {
                    delete fieldErrors.marcaModelo;
                }
                break;
            }
            case 'patente': {
                const patenteError = required(newVehiculo.patente, 'Patente') ||
                    validatePatente(newVehiculo.patente, 'Patente');
                if (patenteError) {
                    fieldErrors.patente = patenteError.message;
                } else {
                    delete fieldErrors.patente;
                }
                break;
            }
            case 'capacidadTotal': {
                const capacidadError = minNumber(newVehiculo.capacidadTotal, 2, 'Capacidad') ||
                    maxNumber(newVehiculo.capacidadTotal, 50, 'Capacidad');
                if (capacidadError) {
                    fieldErrors.capacidadTotal = capacidadError.message;
                } else {
                    delete fieldErrors.capacidadTotal;
                }
                break;
            }
        }

        setErrors(fieldErrors);
    };

    const handleSaveVehiculo = async () => {
        // Marcar todos los campos como tocados
        setTouched({ marcaModelo: true, patente: true, capacidadTotal: true, estado: true });

        if (!validateForm()) {
            setToast({ message: 'Por favor corrija los errores en el formulario', type: 'error' });
            return;
        }

        // Verificar patente duplicada (excluyendo el vehículo actual si estamos editando)
        const patenteDuplicada = vehiculos.some(
            v => v.patente.toUpperCase() === newVehiculo.patente.toUpperCase() && v.id !== editingId
        );

        if (patenteDuplicada) {
            setErrors(prev => ({ ...prev, patente: 'Esta patente ya está registrada' }));
            setToast({ message: 'La patente ya está registrada', type: 'error' });
            return;
        }

        try {
            if (editingId) {
                const updatedVehiculo = { id: editingId, ...newVehiculo } as Vehiculo;
                await updateVehiculoFirebase(updatedVehiculo);
                setVehiculos(vehiculos.map(v => v.id === editingId ? updatedVehiculo : v));
                setEditingId(null);
                setToast({ message: 'Vehículo actualizado en la Nube', type: 'success' });
            } else {
                const v: Vehiculo = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...newVehiculo
                };
                await addVehiculoFirebase(v);
                setVehiculos([...vehiculos, v]);
                setToast({ message: 'Vehículo registrado en la Nube', type: 'success' });
            }

            setNewVehiculo({ marcaModelo: '', patente: '', capacidadTotal: 5, estado: 'Disponible' });
            setErrors({});
            setTouched({});
        } catch {
            setToast({ message: 'Hubo un error al guardar en la nube', type: 'error' });
        }
    };

    const handleEditVehiculo = (v: Vehiculo) => {
        setNewVehiculo({
            marcaModelo: v.marcaModelo,
            patente: v.patente,
            capacidadTotal: v.capacidadTotal,
            estado: v.estado
        });
        setEditingId(v.id);
        setErrors({});
        setTouched({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewVehiculo({ marcaModelo: '', patente: '', capacidadTotal: 5, estado: 'Disponible' });
        setErrors({});
        setTouched({});
    };

    const handleDeleteVehiculo = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este vehículo de la nube?')) {
            try {
                await deleteVehiculoFirebase(id);
                setVehiculos(vehiculos.filter(v => v.id !== id));
                setToast({ message: 'Vehículo eliminado de la Nube', type: 'success' });
            } catch {
                setToast({ message: 'Hubo un error al eliminar', type: 'error' });
            }
        }
    };

    const formatPatente = (value: string): string => {
        // Formatea la patente mientras se escribe
        const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length <= 4) {
            return clean;
        }
        return `${clean.slice(0, 4)}-${clean.slice(4, 6)}`;
    };

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="dashboard-grid">
                <div className="card">
                    <h3 className="card-title">{editingId ? 'Editar Vehículo' : 'Registrar Vehículo'}</h3>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="marca-modelo">Marca / Modelo</label>
                            <input
                                id="marca-modelo"
                                type="text"
                                value={newVehiculo.marcaModelo}
                                onChange={e => setNewVehiculo({ ...newVehiculo, marcaModelo: e.target.value })}
                                onBlur={() => handleFieldBlur('marcaModelo')}
                                placeholder="Ej: Toyota Hiace"
                                className={touched.marcaModelo && errors.marcaModelo ? 'input-error' : ''}
                                maxLength={50}
                            />
                            {touched.marcaModelo && errors.marcaModelo && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.marcaModelo}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="patente">Patente</label>
                            <input
                                id="patente"
                                type="text"
                                value={newVehiculo.patente}
                                onChange={e => setNewVehiculo({ ...newVehiculo, patente: formatPatente(e.target.value) })}
                                onBlur={() => handleFieldBlur('patente')}
                                placeholder="Ej: ABCD-12"
                                className={touched.patente && errors.patente ? 'input-error' : ''}
                                style={{ textTransform: 'uppercase' }}
                                maxLength={7}
                            />
                            {touched.patente && errors.patente && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.patente}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="capacidad">Capacidad de Asientos</label>
                            <input
                                id="capacidad"
                                type="number"
                                value={newVehiculo.capacidadTotal}
                                onChange={e => setNewVehiculo({ ...newVehiculo, capacidadTotal: parseInt(e.target.value) || 0 })}
                                onBlur={() => handleFieldBlur('capacidadTotal')}
                                className={touched.capacidadTotal && errors.capacidadTotal ? 'input-error' : ''}
                                min={2}
                                max={50}
                            />
                            {touched.capacidadTotal && errors.capacidadTotal && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.capacidadTotal}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="estado-inicial">Estado Inicial</label>
                        <select
                            id="estado-inicial"
                            value={newVehiculo.estado}
                            onChange={e => setNewVehiculo({ ...newVehiculo, estado: e.target.value as Vehiculo['estado'] })}
                            aria-label="Estado inicial del vehículo"
                        >
                            <option value="Disponible">Disponible</option>
                            <option value="En Mantención">En Mantención</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveVehiculo}>
                            {editingId ? 'Actualizar Vehículo' : 'Registrar Vehículo'}
                        </button>
                        {editingId && (
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

                <div className="card">
                    <h3 className="card-title">Flota de Vehículos</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Vehículo</th>
                                <th>Patente</th>
                                <th>Capacidad</th>
                                <th>Estado</th>
                                <th className="col-actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...vehiculos].sort((a, b) => (a.estado === 'Disponible' ? -1 : 1) - (b.estado === 'Disponible' ? -1 : 1)).map(v => (
                                <tr key={v.id}>
                                    <td>{v.marcaModelo}</td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{v.patente}</td>
                                    <td>{v.capacidadTotal} asientos</td>
                                    <td>
                                        <span className={`badge ${v.estado === 'Disponible' ? 'badge-success' : 'badge-error'}`}>
                                            {v.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditVehiculo(v)}
                                                title="Editar vehículo"
                                                style={{ color: '#0369a1', background: '#e0f2fe', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', padding: 0 }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDeleteVehiculo(v.id)}
                                                title="Eliminar vehículo"
                                                style={{ color: '#991b1b', background: '#fee2e2', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18"></path>
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default VehiculosManagement;
