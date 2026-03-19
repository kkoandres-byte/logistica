import React, { useState, useEffect } from 'react';
import type { Posta } from '../data/types';
import { POSTAS as INITIAL_POSTAS } from '../data/mockData';
import { required, coordenadas, minNumber, maxNumber, validate, minLength, maxLength } from '../utils/validation';
import Toast from './Toast';
import { getPostasFirebase, addPostaFirebase, updatePostaFirebase, deletePostaFirebase } from '../services/dataService';

const PostasManagement: React.FC = () => {
    const [postas, setPostas] = useState<Posta[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fbData = await getPostasFirebase();
                if (fbData.length > 0) {
                    setPostas(fbData);
                } else {
                    const saved = localStorage.getItem('postas_data');
                    if (saved) {
                        const localData = JSON.parse(saved) as Posta[];
                        if (localData.length > 0) {
                            setPostas(localData);
                            for (const item of localData) {
                                await addPostaFirebase(item);
                            }
                        }
                    } else {
                        setPostas(INITIAL_POSTAS);
                        for (const item of INITIAL_POSTAS) {
                            await addPostaFirebase(item);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                const saved = localStorage.getItem('postas_data');
                if (saved) setPostas(JSON.parse(saved));
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        localStorage.setItem('postas_data', JSON.stringify(postas));
    }, [postas]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newPosta, setNewPosta] = useState({ nombre: '', distanciaKm: 0, coords: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const validateForm = (): boolean => {
        const validation = validate(
            required(newPosta.nombre, 'Nombre'),
            minLength(newPosta.nombre, 3, 'Nombre'),
            maxLength(newPosta.nombre, 100, 'Nombre'),
            required(newPosta.coords, 'Coordenadas'),
            coordenadas(newPosta.coords, 'Coordenadas'),
            minNumber(newPosta.distanciaKm, 0, 'Distancia'),
            maxNumber(newPosta.distanciaKm, 500, 'Distancia')
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

        const fieldErrors: Record<string, string> = { ...errors };

        switch (field) {
            case 'nombre': {
                const nombreError = required(newPosta.nombre, 'Nombre') ||
                    minLength(newPosta.nombre, 3, 'Nombre') ||
                    maxLength(newPosta.nombre, 100, 'Nombre');
                if (nombreError) {
                    fieldErrors.nombre = nombreError.message;
                } else {
                    delete fieldErrors.nombre;
                }
                break;
            }
            case 'coords': {
                const coordsError = required(newPosta.coords, 'Coordenadas') ||
                    coordenadas(newPosta.coords, 'Coordenadas');
                if (coordsError) {
                    fieldErrors.coords = coordsError.message;
                } else {
                    delete fieldErrors.coords;
                }
                break;
            }
            case 'distanciaKm': {
                const distanciaError = minNumber(newPosta.distanciaKm, 0, 'Distancia') ||
                    maxNumber(newPosta.distanciaKm, 500, 'Distancia');
                if (distanciaError) {
                    fieldErrors.distanciaKm = distanciaError.message;
                } else {
                    delete fieldErrors.distanciaKm;
                }
                break;
            }
        }

        setErrors(fieldErrors);
    };

    const handleSavePosta = async () => {
        setTouched({ nombre: true, coords: true, distanciaKm: true });

        if (!validateForm()) {
            setToast({ message: 'Por favor corrija los errores en el formulario', type: 'error' });
            return;
        }

        // Verificar nombre duplicado (excluyendo la posta actual si estamos editando)
        const nombreDuplicado = postas.some(
            p => p.nombre.toLowerCase() === newPosta.nombre.toLowerCase() && p.id !== editingId
        );

        if (nombreDuplicado) {
            setErrors(prev => ({ ...prev, nombre: 'Este nombre ya está registrado' }));
            setToast({ message: 'El nombre ya está registrado', type: 'error' });
            return;
        }

        const parts = newPosta.coords.split(',').map(c => parseFloat(c.trim()));

        try {
            if (editingId) {
                const updatedPosta: Posta = {
                    id: editingId,
                    nombre: newPosta.nombre,
                    distanciaKm: newPosta.distanciaKm,
                    coordenadas: { x: parts[0], y: parts[1] }
                };
                await updatePostaFirebase(updatedPosta);
                setPostas(postas.map(p => p.id === editingId ? updatedPosta : p));
                setEditingId(null);
                setToast({ message: 'Destino actualizado en la Nube', type: 'success' });
            } else {
                const posta: Posta = {
                    id: Math.random().toString(36).substr(2, 9),
                    nombre: newPosta.nombre,
                    distanciaKm: newPosta.distanciaKm,
                    coordenadas: { x: parts[0], y: parts[1] }
                };
                await addPostaFirebase(posta);
                setPostas([...postas, posta]);
                setToast({ message: 'Destino registrado en la Nube', type: 'success' });
            }

            setNewPosta({ nombre: '', distanciaKm: 0, coords: '' });
            setErrors({});
            setTouched({});
        } catch {
            setToast({ message: 'Hubo un error al guardar', type: 'error' });
        }
    };

    const handleEditPosta = (p: Posta) => {
        setNewPosta({
            nombre: p.nombre,
            distanciaKm: p.distanciaKm,
            coords: `${p.coordenadas.x}, ${p.coordenadas.y}`
        });
        setEditingId(p.id);
        setErrors({});
        setTouched({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewPosta({ nombre: '', distanciaKm: 0, coords: '' });
        setErrors({});
        setTouched({});
    };

    const handleDeletePosta = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta posta de la nube?')) {
            try {
                await deletePostaFirebase(id);
                setPostas(postas.filter(p => p.id !== id));
                setToast({ message: 'Posta eliminada en la Nube', type: 'success' });
            } catch {
                setToast({ message: 'Hubo un error al eliminar', type: 'error' });
            }
        }
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
                    <h3 className="card-title">{editingId ? 'Editar Destino' : 'Agregar Nuevo Destino'}</h3>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="posta-nombre">Nombre de la Posta</label>
                            <input
                                id="posta-nombre"
                                type="text"
                                value={newPosta.nombre}
                                onChange={e => setNewPosta({ ...newPosta, nombre: e.target.value })}
                                onBlur={() => handleFieldBlur('nombre')}
                                placeholder="Ej: Posta Llifén"
                                className={touched.nombre && errors.nombre ? 'input-error' : ''}
                                maxLength={100}
                                aria-label="Nombre de la posta"
                            />
                            {touched.nombre && errors.nombre && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.nombre}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="posta-distancia">Distancia desde CESFAM (KM)</label>
                            <input
                                id="posta-distancia"
                                type="number"
                                value={newPosta.distanciaKm}
                                onChange={e => setNewPosta({ ...newPosta, distanciaKm: Number(e.target.value) || 0 })}
                                onBlur={() => handleFieldBlur('distanciaKm')}
                                className={touched.distanciaKm && errors.distanciaKm ? 'input-error' : ''}
                                min={0}
                                max={500}
                                aria-label="Distancia en kilómetros"
                            />
                            {touched.distanciaKm && errors.distanciaKm && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.distanciaKm}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="posta-coords">Coordenadas (Latitud, Longitud)</label>
                            <input
                                id="posta-coords"
                                type="text"
                                value={newPosta.coords}
                                onChange={e => setNewPosta({ ...newPosta, coords: e.target.value })}
                                onBlur={() => handleFieldBlur('coords')}
                                placeholder="Ej: -40.123, -72.456"
                                className={touched.coords && errors.coords ? 'input-error' : ''}
                                aria-label="Coordenadas geográficas"
                            />
                            {touched.coords && errors.coords && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.coords}
                                </div>
                            )}
                            <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                                💡 Formato: latitud, longitud (ej: -40.1388, -72.3951)
                            </small>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSavePosta}>
                            {editingId ? 'Actualizar Posta' : 'Agregar Posta'}
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
                    <h3 className="card-title">Listado de Destinos</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Distancia</th>
                                <th>Coordenadas</th>
                                <th className="col-actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {postas.map(p => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>{p.distanciaKm} KM</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {p.coordenadas.x.toFixed(4)}, {p.coordenadas.y.toFixed(4)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditPosta(p)}
                                                title="Editar posta"
                                                style={{ color: '#0369a1', background: '#e0f2fe', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', padding: 0 }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDeletePosta(p.id)}
                                                title="Eliminar posta"
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

export default PostasManagement;
