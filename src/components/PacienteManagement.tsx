import React, { useState, useEffect } from 'react';
import type { Paciente } from '../data/types';
import { required, validate, minLength } from '../utils/validation';
import Toast from './Toast';
import { getPacientesFirebase, addPacienteFirebase, updatePacienteFirebase, deletePacienteFirebase } from '../services/dataService';

const PacienteManagement: React.FC = () => {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
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
        telefono: '',
        sector: '',
        establecimiento: '',
        urbanoRural: 'Urbano',
        dependencia: ''
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
            const data = await getPacientesFirebase();
            setPacientes(data);
        } catch (error) {
            console.error("Error fetching pacientes:", error);
            setToast({ message: 'Error al cargar pacientes', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const validation = validate(
            required(formData.rut, 'RUT'),
            required(formData.nombre, 'Nombre'),
            minLength(formData.nombre, 3, 'Nombre'),
            required(formData.sector, 'Sector'),
            required(formData.establecimiento, 'Establecimiento')
        );

        const newErrors: Record<string, string> = {};
        validation.errors.forEach(error => {
            newErrors[error.field] = error.message;
        });

        setErrors(newErrors);
        return validation.isValid;
    };

    const handleSave = async () => {
        setTouched({
            rut: true,
            nombre: true,
            sector: true,
            establecimiento: true
        });

        if (!validateForm()) {
            setToast({ message: 'Por favor corrija los errores', type: 'error' });
            return;
        }

        try {
            if (editingId) {
                const updated = { id: editingId, ...formData } as Paciente;
                await updatePacienteFirebase(updated);
                setPacientes(prev => prev.map(p => p.id === editingId ? updated : p));
                setToast({ message: 'Paciente actualizado correctamente', type: 'success' });
            } else {
                const newPaciente: Paciente = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...formData
                };
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
            telefono: p.telefono,
            sector: p.sector,
            establecimiento: p.establecimiento,
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
            telefono: '',
            sector: '',
            establecimiento: '',
            urbanoRural: 'Urbano',
            dependencia: ''
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input type="text" value={formData.telefono} placeholder="+569..." onChange={e => setFormData({...formData, telefono: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Sector *</label>
                            <input 
                                type="text" 
                                value={formData.sector} 
                                onChange={e => setFormData({...formData, sector: e.target.value})}
                                className={touched.sector && errors.sector ? 'input-error' : ''}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Establecimiento *</label>
                            <input 
                                type="text" 
                                value={formData.establecimiento} 
                                onChange={e => setFormData({...formData, establecimiento: e.target.value})}
                                className={touched.establecimiento && errors.establecimiento ? 'input-error' : ''}
                            />
                        </div>
                        <div className="form-group">
                            <label>Urbano / Rural</label>
                            <select value={formData.urbanoRural} onChange={e => setFormData({...formData, urbanoRural: e.target.value as any})}>
                                <option value="Urbano">Urbano</option>
                                <option value="Rural">Rural</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Dependencia</label>
                        <input type="text" value={formData.dependencia} onChange={e => setFormData({...formData, dependencia: e.target.value})} />
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
                                    <th>Establecimiento</th>
                                    <th className="col-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>Cargando...</td></tr>
                                ) : filteredPacientes.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>No se encontraron pacientes</td></tr>
                                ) : (
                                    filteredPacientes.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.rut}</td>
                                            <td>{p.nombre}</td>
                                            <td>{p.sector}</td>
                                            <td>{p.establecimiento}</td>
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
