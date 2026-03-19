import React, { useState, useEffect } from 'react';
import type { Personal } from '../data/types';
import { PERSONAL as INITIAL_PERSONAL } from '../data/mockData';
import { required, email as validateEmail, minLength, maxLength, validate } from '../utils/validation';
import Toast from './Toast';
import { getPersonalFirebase, addPersonalFirebase, updatePersonalFirebase, deletePersonalFirebase } from '../services/dataService';

const PersonalManagement: React.FC = () => {
    const [personal, setPersonal] = useState<Personal[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchPersonal = async () => {
            try {
                const fbData = await getPersonalFirebase();
                if (fbData.length > 0) {
                    setPersonal(fbData);
                } else {
                    const saved = localStorage.getItem('personal_data');
                    if (saved) {
                        const localData = JSON.parse(saved) as Personal[];
                        if (localData.length > 0) {
                            setPersonal(localData);
                            for (const item of localData) {
                                await addPersonalFirebase(item);
                            }
                        }
                    } else {
                        // Migrate mock data to Firebase
                        setPersonal(INITIAL_PERSONAL);
                        for (const item of INITIAL_PERSONAL) {
                            await addPersonalFirebase(item);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching personal:", error);
                const saved = localStorage.getItem('personal_data');
                if (saved) setPersonal(JSON.parse(saved));
            }
        };
        fetchPersonal();
    }, []);

    useEffect(() => {
        localStorage.setItem('personal_data', JSON.stringify(personal));
    }, [personal]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newMember, setNewMember] = useState<Omit<Personal, 'id'>>({
        nombre: '',
        especialidad: 'Médico',
        disponibilidad: true,
        correo: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const validateForm = (): boolean => {
        const validation = validate(
            required(newMember.nombre, 'Nombre'),
            minLength(newMember.nombre, 3, 'Nombre'),
            maxLength(newMember.nombre, 100, 'Nombre'),
            newMember.correo ? validateEmail(newMember.correo, 'Correo') : null
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
                const nombreError = required(newMember.nombre, 'Nombre') ||
                    minLength(newMember.nombre, 3, 'Nombre') ||
                    maxLength(newMember.nombre, 100, 'Nombre');
                if (nombreError) {
                    fieldErrors.nombre = nombreError.message;
                } else {
                    delete fieldErrors.nombre;
                }
                break;
            }
            case 'correo':
                if (newMember.correo) {
                    const emailError = validateEmail(newMember.correo, 'Correo');
                    if (emailError) {
                        fieldErrors.correo = emailError.message;
                    } else {
                        delete fieldErrors.correo;
                    }
                }
                break;
        }

        setErrors(fieldErrors);
    };

    const handleSavePersonal = async () => {
        setTouched({ nombre: true, correo: true, especialidad: true, disponibilidad: true });

        if (!validateForm()) {
            setToast({ message: 'Por favor corrija los errores en el formulario', type: 'error' });
            return;
        }

        // Verificar correo duplicado (excluyendo el actual si estamos editando)
        if (newMember.correo) {
            const correoDuplicado = personal.some(
                p => p.correo?.toLowerCase() === newMember.correo?.toLowerCase() && p.id !== editingId
            );

            if (correoDuplicado) {
                setErrors(prev => ({ ...prev, correo: 'Este correo ya está registrado' }));
                setToast({ message: 'El correo ya está registrado', type: 'error' });
                return;
            }
        }

        try {
            if (editingId) {
                const updatedP = { id: editingId, ...newMember } as Personal;
                await updatePersonalFirebase(updatedP);
                setPersonal(personal.map(p => p.id === editingId ? updatedP : p));
                setEditingId(null);
                setToast({ message: 'Profesional actualizado en la Nube', type: 'success' });
            } else {
                const p: Personal = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...newMember
                } as Personal;
                await addPersonalFirebase(p);
                setPersonal([...personal, p]);
                setToast({ message: 'Profesional registrado en la Nube', type: 'success' });
            }

            setNewMember({ nombre: '', especialidad: 'Médico', disponibilidad: true, correo: '' });
            setErrors({});
            setTouched({});
        } catch {
            setToast({ message: 'Hubo un error al guardar en la nube', type: 'error' });
        }
    };

    const handleEditPersonal = (p: Personal) => {
        setNewMember({
            nombre: p.nombre,
            especialidad: p.especialidad,
            disponibilidad: p.disponibilidad,
            correo: p.correo || ''
        });
        setEditingId(p.id);
        setErrors({});
        setTouched({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewMember({ nombre: '', especialidad: 'Médico', disponibilidad: true, correo: '' });
        setErrors({});
        setTouched({});
    };

    const handleDeletePersonal = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar a este funcionario de la nube?')) {
            try {
                await deletePersonalFirebase(id);
                const updated = personal.filter(p => p.id !== id);
                setPersonal(updated);
                setToast({ message: 'Profesional eliminado de la Nube', type: 'success' });

                // Adjust page if current page becomes empty
                const newTotalPages = Math.ceil(updated.length / itemsPerPage);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                }
            } catch {
                setToast({ message: 'Hubo un error al eliminar', type: 'error' });
            }
        }
    };

    const getSpecialtyClass = (specialty: string) => {
        switch (specialty) {
            case 'Médico': return 'specialty-medico';
            case 'TENS': return 'specialty-tens';
            case 'Matrona': return 'specialty-matrona';
            case 'Enfermero/a': return 'specialty-enfermero';
            case 'Kinesiólogo': return 'specialty-kinesiologo';
            case 'Odontólogo': return 'specialty-odontologo';
            case 'Nutricionista': return 'specialty-nutricionista';
            case 'Asistente Social': return 'specialty-asistente';
            case 'Educadora': return 'specialty-educadora';
            case 'Podóloga': return 'specialty-podologa';
            case 'Psicólogo': return 'specialty-psicologo';
            case 'Fonoaudiólogo': return 'specialty-fonoaudiologo';
            case 'Terapeuta': return 'specialty-terapeuta';
            case 'Conductor': return 'specialty-conductor';
            case 'Otros': return 'specialty-otros';
            default: return '';
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(personal.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPersonal = personal.slice(startIndex, startIndex + itemsPerPage);

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
                    <h3 className="card-title">Registrar Personal</h3>

                    <div className="form-field">
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre Completo</label>
                            <input
                                id="nombre"
                                type="text"
                                value={newMember.nombre}
                                onChange={e => setNewMember({ ...newMember, nombre: e.target.value })}
                                onBlur={() => handleFieldBlur('nombre')}
                                placeholder="Nombre del profesional"
                                className={touched.nombre && errors.nombre ? 'input-error' : ''}
                                maxLength={100}
                                aria-label="Nombre completo del profesional"
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
                            <label htmlFor="correo">Correo Electrónico</label>
                            <input
                                id="correo"
                                type="email"
                                value={newMember.correo || ''}
                                onChange={e => setNewMember({ ...newMember, correo: e.target.value })}
                                onBlur={() => handleFieldBlur('correo')}
                                placeholder="ejemplo@correo.cl"
                                className={touched.correo && errors.correo ? 'input-error' : ''}
                                aria-label="Correo electrónico del profesional"
                            />
                            {touched.correo && errors.correo && (
                                <div className="error-message">
                                    <span>⚠️</span> {errors.correo}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="especialidad">Especialidad</label>
                        <select
                            id="especialidad"
                            value={newMember.especialidad}
                            onChange={e => setNewMember({ ...newMember, especialidad: e.target.value })}
                            aria-label="Especialidad del profesional"
                        >
                            <option value="Médico">Médico</option>
                            <option value="TENS">TENS</option>
                            <option value="Matrona">Matrona</option>
                            <option value="Enfermero/a">Enfermero/a</option>
                            <option value="Kinesiólogo">Kinesiólogo</option>
                            <option value="Odontólogo">Odontólogo</option>
                            <option value="Nutricionista">Nutricionista</option>
                            <option value="Asistente Social">Asistente Social</option>
                            <option value="Educadora">Educadora</option>
                            <option value="Podóloga">Podóloga</option>
                            <option value="Psicólogo">Psicólogo</option>
                            <option value="Fonoaudiólogo">Fonoaudiólogo</option>
                            <option value="Terapeuta">Terapeuta</option>
                            <option value="Conductor">Conductor</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="disponibilidad">Disponibilidad</label>
                        <select
                            id="disponibilidad"
                            value={newMember.disponibilidad ? 'true' : 'false'}
                            onChange={e => setNewMember({ ...newMember, disponibilidad: e.target.value === 'true' })}
                            aria-label="Disponibilidad del profesional"
                        >
                            <option value="true">Disponible</option>
                            <option value="false">No Disponible</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSavePersonal}>
                            {editingId ? 'Actualizar Profesional' : 'Registrar Profesional'}
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
                    <h3 className="card-title">Nómina de Personal</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Especialidad</th>
                                <th>Estado</th>
                                <th className="col-actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPersonal.map(p => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>
                                        {p.correo ? (
                                            <a href={`mailto:${p.correo}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px' }}>
                                                {p.correo}
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge badge-specialty ${getSpecialtyClass(p.especialidad)}`}>
                                            {p.especialidad}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${p.disponibilidad ? 'badge-success' : 'badge-warning'}`}>
                                            {p.disponibilidad ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditPersonal(p)}
                                                title="Editar funcionario"
                                                style={{ color: '#0369a1', background: '#e0f2fe', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', padding: 0 }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDeletePersonal(p.id)}
                                                title="Eliminar funcionario"
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

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                &lt;
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                className="page-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PersonalManagement;
