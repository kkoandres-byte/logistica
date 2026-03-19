import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Ronda } from '../data/types';

const COLLECTION_NAME = 'rondas';

export const getRondasFirebase = async (): Promise<Ronda[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ronda));
    } catch (error) {
        console.error("Error al obtener las rondas: ", error);
        return [];
    }
};

export const addRondaFirebase = async (ronda: Ronda): Promise<void> => {
    try {
        // We use setDoc with the existing ID if the ronda has one generated locally
        await setDoc(doc(db, COLLECTION_NAME, ronda.id), ronda);
    } catch (error) {
        console.error("Error al añadir la ronda: ", error);
        throw error;
    }
};

export const updateRondaFirebase = async (ronda: Ronda): Promise<void> => {
    try {
        const rondaRef = doc(db, COLLECTION_NAME, ronda.id);
        await updateDoc(rondaRef, { ...ronda });
    } catch (error) {
        console.error("Error al actualizar la ronda: ", error);
        throw error;
    }
};

export const deleteRondaFirebase = async (rondaId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, rondaId));
    } catch (error) {
        console.error("Error al eliminar la ronda: ", error);
        throw error;
    }
};
