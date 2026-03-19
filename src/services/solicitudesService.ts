import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SolicitudSalida } from '../data/types';

const COLLECTION_NAME = 'solicitudes';

export const getSolicitudesFirebase = async (): Promise<SolicitudSalida[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as SolicitudSalida));
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        return [];
    }
};

export const addSolicitudFirebase = async (solicitud: Omit<SolicitudSalida, 'id'>): Promise<string> => {
    try {
        const ref = await addDoc(collection(db, COLLECTION_NAME), solicitud);
        return ref.id;
    } catch (error) {
        console.error('Error al añadir solicitud:', error);
        throw error;
    }
};

export const updateSolicitudFirebase = async (solicitud: SolicitudSalida): Promise<void> => {
    try {
        const ref = doc(db, COLLECTION_NAME, solicitud.id);
        const { id, ...data } = solicitud;
        await updateDoc(ref, data);
    } catch (error) {
        console.error('Error al actualizar solicitud:', error);
        throw error;
    }
};

export const deleteSolicitudFirebase = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        throw error;
    }
};
