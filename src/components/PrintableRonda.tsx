import React from 'react';
import type { Ronda, Posta, Vehiculo, Personal } from '../data/types';

interface PrintableRondaProps {
    ronda: Ronda;
    postosList: Posta[];
    vehiculosList: Vehiculo[];
    personalList: Personal[];
}

const PrintableRonda: React.FC<PrintableRondaProps> = ({
    ronda,
    postosList,
    vehiculosList,
    personalList
}) => {
    const conductor = personalList.find(p => p.id === ronda.conductorId);
    const vehiculo = vehiculosList.find(v => v.id === ronda.vehiculoId);
    const postaDestino = postosList.find(p => p.id === ronda.postaId);

    const pasajerosConConductor = personalList.filter(
        p => p.id === ronda.conductorId || ronda.pasajerosIds.includes(p.id)
    ).sort((a, b) => {
        if (a.id === ronda.conductorId) return -1;
        if (b.id === ronda.conductorId) return 1;
        return 0;
    });

    const totalPasajeros = pasajerosConConductor.length;

    return (
        <div className="printable-ronda" style={{
            padding: '40px',
            color: 'black',
            background: 'white',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Encabezado */}
            <div style={{
                textAlign: 'center',
                borderBottom: '3px solid black',
                paddingBottom: '20px',
                marginBottom: '30px'
            }}>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold' }}>
                    HOJA DE RUTA - TRASLADO DE PERSONAL
                </h1>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>
                    CESFAM FUTRONO
                </h2>
            </div>

            {/* Información del viaje */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '15px',
                marginBottom: '30px',
                padding: '20px',
                border: '2px solid #333',
                borderRadius: '8px'
            }}>
                <div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
                        <strong style={{ fontSize: '15px' }}>FECHA DE SALIDA:</strong>{' '}
                        <span>{ronda.fecha.split('-').reverse().join('-')}</span>
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
                        <strong style={{ fontSize: '15px' }}>CONDUCTOR:</strong>{' '}
                        <span>{conductor?.nombre || 'N/A'}</span>
                    </p>
                    <p style={{ margin: '0', fontSize: '15px' }}>
                        <strong style={{ fontSize: '15px' }}>VEHÍCULO:</strong>{' '}
                        <span>{vehiculo?.marcaModelo || 'N/A'} ({vehiculo?.patente || 'N/A'})</span>
                    </p>
                </div>
                <div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
                        <strong style={{ fontSize: '15px' }}>TIPO DE SALIDA:</strong>{' '}
                        <span>{ronda.tipoSalida}</span>
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
                        <strong style={{ fontSize: '15px' }}>HORARIO:</strong>{' '}
                        <span>{ronda.horaSalida} - {ronda.horaRetorno} ({ronda.accionRetorno})</span>
                    </p>
                    <p style={{ margin: '0', fontSize: '15px' }}>
                        <strong style={{ fontSize: '15px' }}>DESTINO:</strong>{' '}
                        <span>{postaDestino?.nombre || 'N/A'}</span>
                    </p>
                </div>
            </div>

            {/* Ruta con paradas intermedias */}
            {(ronda.paradasIntermediasIds && ronda.paradasIntermediasIds.length > 0) && (
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    border: '2px solid #333',
                    borderRadius: '8px'
                }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                        <strong>RUTA DEL VIAJE:</strong>
                    </p>
                    <div style={{ fontSize: '14px' }}>
                        <span style={{ color: '#666' }}>CESFAM → </span>
                        {ronda.paradasIntermediasIds.map((id, index) => {
                            const posta = postosList.find(p => p.id === id);
                            return (
                                <span key={id}>
                                    <strong>{posta?.nombre}</strong>
                                    {index < (ronda.paradasIntermediasIds?.length || 0) - 1 && <span style={{ color: '#666' }}> → </span>}
                                </span>
                            );
                        })}
                        {(ronda.paradasIntermediasIds?.length || 0) > 0 && <span style={{ color: '#666' }}> → </span>}
                        <strong style={{ fontSize: '16px' }}>{postaDestino?.nombre}</strong>
                    </div>
                </div>
            )}

            {/* Indicaciones */}
            {ronda.indicaciones && ronda.indicaciones.trim() !== '' && (
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb'
                }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                        <strong>⚠️ INDICACIONES PARA EL CONDUCTOR:</strong>
                    </p>
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                        {ronda.indicaciones}
                    </p>
                </div>
            )}

            {/* Nómina de pasajeros */}
            <div style={{ marginBottom: '40px' }}>
                <p style={{
                    borderBottom: '3px solid black',
                    paddingBottom: '10px',
                    marginBottom: '15px',
                    fontSize: '18px'
                }}>
                    <strong>NÓMINA DE PASAJEROS ({totalPasajeros})</strong>
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '3px solid #333' }}>
                            <th style={{
                                textAlign: 'left',
                                padding: '12px 10px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>N°</th>
                            <th style={{
                                textAlign: 'left',
                                padding: '12px 10px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>Nombre Completo</th>
                            <th style={{
                                textAlign: 'left',
                                padding: '12px 10px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>Especialidad</th>
                            <th style={{
                                textAlign: 'center',
                                padding: '12px 10px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>Viático</th>

                        </tr>
                    </thead>
                    <tbody>
                        {pasajerosConConductor.map((p, index) => {
                            const esConductor = p.id === ronda.conductorId;
                            const viatico = ronda.viaticos?.[p.id];
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{
                                        padding: '12px 10px',
                                        fontSize: '13px',
                                        textAlign: 'center'
                                    }}>{index + 1}</td>
                                    <td style={{
                                        padding: '12px 10px',
                                        fontSize: '13px',
                                        fontWeight: esConductor ? 'bold' : 'normal'
                                    }}>
                                        {p.nombre}
                                        {esConductor && <span style={{
                                            marginLeft: '8px',
                                            fontSize: '11px',
                                            backgroundColor: '#e0f2fe',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>CONDUCTOR</span>}
                                    </td>
                                    <td style={{
                                        padding: '12px 10px',
                                        fontSize: '13px'
                                    }}>{p.especialidad}</td>
                                    <td style={{
                                        padding: '12px 10px',
                                        fontSize: '13px',
                                        textAlign: 'center'
                                    }}>
                                        {viatico ? (
                                            <span style={{
                                                color: '#166534',
                                                fontWeight: 'bold'
                                            }}>✓ SÍ ({viatico})</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>NO</span>
                                        )}
                                    </td>

                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default PrintableRonda;
