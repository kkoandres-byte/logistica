import React from 'react';
import { POSTAS } from '../data/mockData';

const Map: React.FC = () => {
    return (
        <div className="card">
            <h3 className="card-title">Mapa de Postas Rurales - Futrono</h3>
            <div className="map-container">
                {/* Simple visual background for the lake and area */}
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    width: '150px',
                    height: '100px',
                    background: '#bfdbfe',
                    borderRadius: '50% 60% 40% 50%',
                    filter: 'blur(10px)',
                    transform: 'translate(-50%, -50%) rotate(-15deg)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '30px',
                    height: '30px',
                    background: '#94a3b8',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1
                }}>
                    <span style={{ position: 'absolute', top: '-25px', left: '-15px', fontSize: '10px', fontWeight: 'bold' }}>CESFAM</span>
                </div>

                {POSTAS.map((posta) => (
                    <div
                        key={posta.id}
                        className="posta-marker"
                        data-name={posta.nombre}
                        style={{ left: `${posta.coordenadas.x}%`, top: `${posta.coordenadas.y}%` }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default Map;
