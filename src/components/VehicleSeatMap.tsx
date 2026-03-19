import React, { useState, useRef, useEffect } from 'react';
import type { Vehiculo, Personal } from '../data/types';

interface Props {
    vehiculo: Vehiculo;
    pasajeros: Personal[];
    allPersonal?: Personal[];
    viaticos?: Record<string, string>;
    onViaticoChange?: (pasajeroId: string, value: string) => void;
    conductor?: Personal;
    onAddPersonal?: (personalId: string) => void;
    onRemovePersonal?: (personalId: string) => void;
}

const VehicleSeatMap: React.FC<Props> = ({
    vehiculo, pasajeros, allPersonal = [], viaticos, onViaticoChange,
    conductor, onAddPersonal, onRemovePersonal
}) => {
    const totalSeats = vehiculo.capacidadTotal;
    const seats = Array.from({ length: totalSeats }, (_, i) => i);

    const [searchSeatIdx, setSearchSeatIdx] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    let numRows = 2;
    if (totalSeats <= 4) numRows = 1;
    else if (totalSeats >= 13) numRows = 3;
    else numRows = 2;

    const numCols = Math.ceil((totalSeats + 1) / numRows);

    const getAppEspecialidadAbbr = (especialidad: string): string => {
        const map: Record<string, string> = {
            'Médico': 'MED', 'MEDICO': 'MED',
            'Enfermero/a': 'ENF', 'ENFERMERA/O': 'ENF',
            'TENS': 'TENS',
            'Terapeuta': 'TER', 'TERAPEUTA OCUPACIONAL': 'TER',
            'Kinesiólogo': 'KINE', 'KINESIOLOGA/O': 'KINE',
            'Matrona': 'MAT', 'MATRONA/ÓN': 'MAT',
            'Odontólogo': 'ODON', 'ODONTOLOGO': 'ODON',
            'Nutricionista': 'NUT', 'NUTRICIONISTA': 'NUT',
            'Asistente Social': 'ASIS', 'TRABAJADORA/O SOCIAL': 'ASIS',
            'Psicólogo': 'PSI', 'PSICOLOGA/O': 'PSI',
            'FONOAUDIÓLOGA/O': 'FONO',
            'PODÓLOGA/O': 'PODO',
            'Conductor': 'COND'
        };
        return map[especialidad] || especialidad.substring(0, 4).toUpperCase();
    };

    // filter available personal (not already selected, not conductor)
    const available = allPersonal.filter(p =>
        p.especialidad !== 'Conductor' &&
        !pasajeros.find(pas => pas.id === p.id) &&
        (query.trim() === '' || p.nombre.toLowerCase().includes(query.toLowerCase()) ||
            p.especialidad.toLowerCase().includes(query.toLowerCase()))
    );

    const handleEmptySeatClick = (idx: number) => {
        if (!onAddPersonal) return;
        setSearchSeatIdx(idx);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleOccupiedSeatClick = (pasajero: Personal) => {
        if (!onRemovePersonal) return;
        if (window.confirm(`¿Quitar a ${pasajero.nombre} del asiento?`)) {
            onRemovePersonal(pasajero.id);
            if (searchSeatIdx !== null) setSearchSeatIdx(null);
        }
    };

    const handleSelectPersonal = (p: Personal) => {
        if (onAddPersonal) onAddPersonal(p.id);
        setSearchSeatIdx(null);
        setQuery('');
    };

    // close popover on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.seat-search-popover') && !target.closest('.seat')) {
                setSearchSeatIdx(null);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="card">
            <h3 className="card-title">Esquema de Asientos: {vehiculo.marcaModelo} ({vehiculo.patente})</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Capacidad: {vehiculo.capacidadTotal} | Ocupados: {pasajeros.length} | Disponibles: {vehiculo.capacidadTotal - pasajeros.length}
            </p>
            {onAddPersonal && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    💡 Haz clic en un asiento vacío para asignar un funcionario
                </p>
            )}

            <div style={{ position: 'relative' }}>
                <div
                    className="seat-grid"
                    style={{
                        gridTemplateColumns: `repeat(${numCols}, 1fr)`,
                        maxWidth: 'none',
                        width: 'fit-content',
                        margin: '0 auto',
                        gap: '20px 10px',
                        paddingBottom: '20px'
                    }}
                >
                    {/* Driver Seat */}
                    <div
                        className="seat driver"
                        title={conductor ? conductor.nombre : "Conductor"}
                        style={{ position: 'relative', background: conductor ? '#475569' : '#e2e8f0', color: conductor ? 'white' : 'inherit', borderStyle: 'dashed' }}
                    >
                        {conductor ? (
                            <>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: 'white' }}>COND</span>
                                <span style={{ fontSize: '9px', textAlign: 'center', lineHeight: '1', padding: '0 4px', color: 'white' }}>
                                    {conductor.nombre.split(' ')[0]}
                                </span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '10px' }}>👤</span>
                                <span style={{ position: 'absolute', bottom: '-15px', fontSize: '8px', color: 'var(--text-muted)' }}>Cond.</span>
                            </>
                        )}
                    </div>

                    {/* Passenger Seats */}
                    {seats.map((idx) => {
                        const pasajero = pasajeros[idx];
                        const isSearching = searchSeatIdx === idx;
                        return (
                            <div key={idx} style={{ position: 'relative' }}>
                                <div
                                    className={`seat ${pasajero ? 'occupied' : 'empty'}`}
                                    title={pasajero ? `${pasajero.nombre} (clic para quitar)` : 'Clic para asignar funcionario'}
                                    style={{
                                        position: 'relative',
                                        cursor: onAddPersonal ? 'pointer' : 'default',
                                        outline: isSearching ? '2px solid var(--primary)' : undefined
                                    }}
                                    onClick={() => pasajero ? handleOccupiedSeatClick(pasajero) : handleEmptySeatClick(idx)}
                                >
                                    {pasajero ? (
                                        <>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                                                {getAppEspecialidadAbbr(pasajero.especialidad)}
                                            </span>
                                            <span style={{ fontSize: '9px', textAlign: 'center', lineHeight: '1', padding: '0 4px' }}>
                                                {pasajero.nombre.split(' ')[0]}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>
                                            {idx + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Search Popover */}
                                {isSearching && (
                                    <div
                                        className="seat-search-popover"
                                        style={{
                                            position: 'absolute',
                                            top: '110%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            zIndex: 100,
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                            padding: '10px',
                                            minWidth: '240px',
                                            maxWidth: '280px'
                                        }}
                                    >
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                            placeholder="Buscar funcionario..."
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.85rem',
                                                marginBottom: '6px',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                            {available.length === 0 ? (
                                                <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                                                    {query ? 'Sin coincidencias' : 'No hay personal disponible'}
                                                </p>
                                            ) : available.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleSelectPersonal(p)}
                                                    style={{
                                                        padding: '7px 10px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        fontSize: '0.82rem',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        background: '#f1f5f9',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        color: '#475569',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {getAppEspecialidadAbbr(p.especialidad)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {(pasajeros.length > 0 || conductor) && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Personal Asignado:</h4>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', listStyle: 'none', padding: 0 }}>
                        {(conductor ? [conductor, ...pasajeros] : pasajeros).map(p => (
                            <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>{p.nombre} ({p.especialidad})</span>
                                {onViaticoChange && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)' }}>Viático:</label>
                                        <select
                                            value={viaticos?.[p.id] ? 'SI' : 'NO'}
                                            onChange={(e) => {
                                                if (e.target.value === 'NO') {
                                                    onViaticoChange(p.id, '');
                                                } else {
                                                    onViaticoChange(p.id, '100%');
                                                }
                                            }}
                                            style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="SI">SI</option>
                                        </select>
                                        {viaticos?.[p.id] && (
                                            <select
                                                value={viaticos[p.id]}
                                                onChange={(e) => onViaticoChange(p.id, e.target.value)}
                                                style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px' }}
                                            >
                                                <option value="20%">20%</option>
                                                <option value="40%">40%</option>
                                                <option value="100%">100%</option>
                                            </select>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default VehicleSeatMap;
