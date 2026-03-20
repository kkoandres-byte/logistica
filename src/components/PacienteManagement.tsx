import React, { useState, useEffect } from 'react';
import type { Paciente, Posta } from '../data/types';
import { required, validate, minLength } from '../utils/validation';
import Toast from './Toast';
import { getPacientesFirebase, addPacienteFirebase, updatePacienteFirebase, deletePacienteFirebase, getPostasFirebase } from '../services/dataService';

const PacienteManagement: React.FC = () => {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [postas, setPostas] = useState<Posta[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState<Omit<Paciente, 'id'>>({
        rut: '',
        nombre: '',
        fechaNacimiento: '',
        sexo: 'M',
        calle: '',
        numeroDomicilio: '',
        telefonos: [''],
        sector: 'Sector 1',
        establecimientoId: '',
        urbanoRural: 'Urbano',
        dependencia: 'Leve'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, postasData] = await Promise.all([
                getPacientesFirebase(),
                getPostasFirebase()
            ]);
            setPacientes(pData);
            setPostas(postasData);
        } catch (error) {
            console.error("Error fetching data:", error);
            setToast({ message: 'Error al cargar datos', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const validation = validate(
            required(formData.rut, 'RUT'),
            required(formData.nombre, 'Nombre'),
            minLength(formData.nombre, 3, 'Nombre'),
            required(formData.establecimientoId, 'Establecimiento')
        );

        const newErrors: Record<string, string> = {};
        validation.errors.forEach(error => {
            newErrors[error.field] = error.message;
        });

        // Validar que haya al menos un teléfono no vacío
        if (formData.telefonos.every(t => !t.trim())) {
            newErrors.telefonos = 'Debe ingresar al menos un teléfono';
            validation.isValid = false;
        }

        setErrors(newErrors);
        return validation.isValid;
    };

    const handleSave = async () => {
        setTouched({
            rut: true,
            nombre: true,
            establecimientoId: true
        });

        if (!validateForm()) {
            setToast({ message: 'Por favor corrija los errores', type: 'error' });
            return;
        }

        try {
            // Limpiar teléfonos vacíos antes de guardar
            const cleanTelefonos = formData.telefonos.filter(t => t.trim() !== '');
            const dataToSave = { ...formData, telefonos: cleanTelefonos };

            if (editingId) {
                const updated = { id: editingId, ...dataToSave } as Paciente;
                await updatePacienteFirebase(updated);
                setPacientes(prev => prev.map(p => p.id === editingId ? updated : p));
                setToast({ message: 'Paciente actualizado correctamente', type: 'success' });
            } else {
                const newPaciente: Paciente = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...dataToSave
                } as Paciente;
                await addPacienteFirebase(newPaciente);
                setPacientes(prev => [newPaciente, ...prev]);
                setToast({ message: 'Paciente registrado correctamente', type: 'success' });
            }
            handleCancel();
        } catch (error) {
            setToast({ message: 'Error al guardar en la base de datos', type: 'error' });
        }
    };

    const handleEdit = (p: Paciente) => {
        setEditingId(p.id);
        setFormData({
            rut: p.rut,
            nombre: p.nombre,
            fechaNacimiento: p.fechaNacimiento,
            sexo: p.sexo,
            calle: p.calle,
            numeroDomicilio: p.numeroDomicilio,
            telefonos: p.telefonos.length > 0 ? [...p.telefonos] : [''],
            sector: p.sector,
            establecimientoId: p.establecimientoId,
            urbanoRural: p.urbanoRural,
            dependencia: p.dependencia
        });
        setErrors({});
        setTouched({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            rut: '',
            nombre: '',
            fechaNacimiento: '',
            sexo: 'M',
            calle: '',
            numeroDomicilio: '',
            telefonos: [''],
            sector: 'Sector 1',
            establecimientoId: '',
            urbanoRural: 'Urbano',
            dependencia: 'Leve'
        });
        setErrors({});
        setTouched({});
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este paciente?')) {
            try {
                await deletePacienteFirebase(id);
                setPacientes(prev => prev.filter(p => p.id !== id));
                setToast({ message: 'Paciente eliminado', type: 'success' });
            } catch (error) {
                setToast({ message: 'Error al eliminar', type: 'error' });
            }
        }
    };

    const handleAddPhone = () => {
        if (formData.telefonos.length < 3) {
            setFormData({ ...formData, telefonos: [...formData.telefonos, ''] });
        }
    };

    const handlePhoneChange = (index: number, value: string) => {
        const newPhones = [...formData.telefonos];
        newPhones[index] = value;
        setFormData({ ...formData, telefonos: newPhones });
    };

    const handleRemovePhone = (index: number) => {
        if (formData.telefonos.length > 1) {
            const newPhones = formData.telefonos.filter((_, i) => i !== index);
            setFormData({ ...formData, telefonos: newPhones });
        } else {
            setFormData({ ...formData, telefonos: [''] });
        }
    };

    const filteredPacientes = pacientes.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.rut.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="dashboard-grid">
                <div className="card">
                    <h3 className="card-title">{editingId ? '✏️ Editar Paciente' : '➕ Ingreso de Paciente'}</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>RUT *</label>
                            <input 
                                type="text" 
                                value={formData.rut} 
                                onChange={e => setFormData({...formData, rut: e.target.value})}
                                className={touched.rut && errors.rut ? 'input-error' : ''}
                            />
                        </div>
                        <div className="form-group">
                            <label>Nombre Usuario (a) *</label>
                            <input 
                                type="text" 
                                value={formData.nombre} 
                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                className={touched.nombre && errors.nombre ? 'input-error' : ''}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Fecha Nacimiento</label>
                            <input type="date" value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Sexo</label>
                            <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value as any})}>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Calle</label>
                            <input type="text" value={formData.calle} onChange={e => setFormData({...formData, calle: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>N° Domicilio</label>
                            <input type="text" value={formData.numeroDomicilio} onChange={e => setFormData({...formData, numeroDomicilio: e.target.value})} />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                            Teléfonos (Hasta 3)
                            {formData.telefonos.length < 3 && (
                                <button onClick={handleAddPhone} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                                    + Agregar otro
                                </button>
                            )}
                        </label>
                        {formData.telefonos.map((phone, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                <input 
                                    type="text" 
                                    value={phone} 
                                    placeholder={`Teléfono ${idx + 1}`} 
                                    onChange={e => handlePhoneChange(idx, e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                {formData.telefonos.length > 1 && (
                                    <button onClick={() => handleRemovePhone(idx)} style={{ padding: '0 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                                )}
                            </div>
                        ))}
                        {errors.telefonos && <div className="error-message">{errors.telefonos}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Sector *</label>
                            <select value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value as any})}>
                                <option value="Sector 1">Sector 1</option>
                                <option value="Sector 2">Sector 2</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Urbano / Rural</label>
                            <select value={formData.urbanoRural} onChange={e => setFormData({...formData, urbanoRural: e.target.value as any})}>
                                <option value="Urbano">Urbano</option>
                                <option value="Rural">Rural</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Establecimiento *</label>
                            <select 
                                value={formData.establecimientoId} 
                                onChange={e => setFormData({...formData, establecimientoId: e.target.value})}
                                className={touched.establecimientoId && errors.establecimientoId ? 'input-error' : ''}
                            >
                                <option value="">Seleccione Destino...</option>
                                {postas.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Dependencia</label>
                            <select value={formData.dependencia} onChange={e => setFormData({...formData, dependencia: e.target.value as any})}>
                                <option value="Leve">Leve</option>
                                <option value="Moderada">Moderada</option>
                                <option value="Severa">Severa</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                            {editingId ? 'Actualizar Paciente' : 'Guardar Paciente'}
                        </button>
                        {editingId && (
                            <button className="btn" style={{ background: '#f1f5f9', color: '#475569' }} onClick={handleCancel}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="card-title" style={{ margin: 0 }}>Listado de Pacientes</h3>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o RUT..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '250px' }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>RUT</th>
                                    <th>Nombre</th>
                                    <th>Sector</th>
                                    <th>Dependencia</th>
                                    <th>Establecimiento</th>
                                    <th className="col-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>Cargando...</td></tr>
                                ) : filteredPacientes.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>No se encontraron pacientes</td></tr>
                                ) : (
                                    filteredPacientes.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.rut}</td>
                                            <td>{p.nombre}</td>
                                            <td>{p.sector}</td>
                                            <td>
                                                <span style={{ 
                                                    padding: '2px 8px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    background: p.dependencia === 'Leve' ? '#dcfce7' : p.dependencia === 'Moderada' ? '#fef9c3' : '#fee2e2',
                                                    color: p.dependencia === 'Leve' ? '#166534' : p.dependencia === 'Moderada' ? '#854d0e' : '#991b1b'
                                                }}>
                                                    {p.dependencia}
                                                </span>
                                            </td>
                                            <td>{postas.find(pt => pt.id === p.establecimientoId)?.nombre || '–'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-icon" onClick={() => handleEdit(p)} title="Editar">✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(p.id)} title="Eliminar" style={{ color: '#991b1b', background: '#fee2e2' }}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PacienteManagement;
