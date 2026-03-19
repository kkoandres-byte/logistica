import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Posta, Vehiculo, Personal } from '../data/types';

// Generic function to retrieve data
const getCollectionData = async <T>(collectionName: string): Promise<T[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    } catch (error) {
        console.error(`Error al obtener datos de ${collectionName}: `, error);
        throw error;
    }
};

// --- POSTAS ---
export const getPostasFirebase = () => getCollectionData<Posta>('postas');
export const addPostaFirebase = async (posta: Posta) => setDoc(doc(db, 'postas', posta.id), posta);
export const updatePostaFirebase = async (posta: Posta) => updateDoc(doc(db, 'postas', posta.id), { ...posta });
export const deletePostaFirebase = async (id: string) => deleteDoc(doc(db, 'postas', id));

// --- VEHICULOS ---
export const getVehiculosFirebase = () => getCollectionData<Vehiculo>('vehiculos');
export const addVehiculoFirebase = async (vehiculo: Vehiculo) => setDoc(doc(db, 'vehiculos', vehiculo.id), vehiculo);
export const updateVehiculoFirebase = async (vehiculo: Vehiculo) => updateDoc(doc(db, 'vehiculos', vehiculo.id), { ...vehiculo });
export const deleteVehiculoFirebase = async (id: string) => deleteDoc(doc(db, 'vehiculos', id));

// --- PERSONAL ---
export const getPersonalFirebase = () => getCollectionData<Personal>('personal');
export const addPersonalFirebase = async (personal: Personal) => setDoc(doc(db, 'personal', personal.id), personal);
export const updatePersonalFirebase = async (personal: Personal) => updateDoc(doc(db, 'personal', personal.id), { ...personal });
export const deletePersonalFirebase = async (id: string) => deleteDoc(doc(db, 'personal', id));
