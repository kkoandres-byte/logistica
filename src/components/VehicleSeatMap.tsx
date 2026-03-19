import type { Vehiculo, Personal } from '../data/types';

interface Props {
    vehiculo: Vehiculo;
    pasajeros: Personal[];
    viaticos?: Record<string, string>;
    onViaticoChange?: (pasajeroId: string, value: string) => void;
    conductor?: Personal;
}

const VehicleSeatMap: React.FC<Props> = ({ vehiculo, pasajeros, viaticos, onViaticoChange, conductor }) => {
    const totalSeats = vehiculo.capacidadTotal;
    const seats = Array.from({ length: totalSeats }, (_, i) => i);

    // Reglas de filas según capacidad
    let numRows = 2;
    if (totalSeats <= 4) numRows = 1;
    else if (totalSeats >= 13) numRows = 3;
    else numRows = 2;

    const numCols = Math.ceil((totalSeats + 1) / numRows);

    const getAppEspecialidadAbbr = (especialidad: string): string => {
        const map: Record<string, string> = {
            'Médico': 'MED',
            'Enfermero/a': 'ENF',
            'TENS': 'TENS',
            'Terapeuta': 'TER',
            'Kinesiólogo': 'KINE',
            'Matrona': 'MAT',
            'Odontólogo': 'ODON',
            'Odontóloga': 'ODON',
            'Nutricionista': 'NUT',
            'Asistente Social': 'ASIS',
            'Psicólogo': 'PSI',
            'Psicóloga': 'PSI',
            'Educadora': 'EDU',
            'Podóloga': 'PODO',
            'Fonoaudiólogo': 'FONO',
            'Conductor': 'COND'
        };
        return map[especialidad] || especialidad.substring(0, 4).toUpperCase();
    };

    return (
        <div className="card">
            <h3 className="card-title">Esquema de Asientos: {vehiculo.marcaModelo} ({vehiculo.patente})</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Capacidad: {vehiculo.capacidadTotal} | Ocupados: {pasajeros.length} | Disponibles: {vehiculo.capacidadTotal - pasajeros.length}
            </p>

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
                    return (
                        <div
                            key={idx}
                            className={`seat ${pasajero ? 'occupied' : 'empty'}`}
                            title={pasajero ? pasajero.nombre : 'Asiento Vacío'}
                            style={{ position: 'relative' }}
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
                    );
                })}
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
