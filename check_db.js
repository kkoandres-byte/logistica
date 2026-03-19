import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_UPlAIDxD4bcXKzS2v6fKcGspXNcjl9g",
  authDomain: "logistica-cesfam.firebaseapp.com",
  projectId: "logistica-cesfam",
  storageBucket: "logistica-cesfam.firebasestorage.app",
  messagingSenderId: "1013387789446",
  appId: "1:1013387789446:web:31811b89e9a9ace576bd07"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking Rondas...");
    const rondas = await getDocs(collection(db, "rondas"));
    console.log(`Rondas count: ${rondas.docs.length}`);

    console.log("Checking Postas...");
    const postas = await getDocs(collection(db, "postas"));
    console.log(`Postas count: ${postas.docs.length}`);

    if (postas.docs.length === 0) {
      console.log("Postas is empty. Uploading mock POSTAS as requested...");
      const MOCK_POSTAS = [
          { id: '1', nombre: 'Llifén', distanciaKm: 21, coordenadas: { x: 75, y: 65 } },
          { id: '2', nombre: 'Nontuelá', distanciaKm: 15, coordenadas: { x: 30, y: 40 } },
          { id: '3', nombre: 'Curriñe', distanciaKm: 38, coordenadas: { x: 85, y: 80 } },
          { id: '4', nombre: 'Maihue', distanciaKm: 45, coordenadas: { x: 90, y: 55 } },
          { id: '5', nombre: 'Chabranco', distanciaKm: 52, coordenadas: { x: 80, y: 30 } },
          { id: '6', nombre: 'Loncopán', distanciaKm: 28, coordenadas: { x: 45, y: 25 } },
          { id: '7', nombre: 'Isla Huapi', distanciaKm: 12, coordenadas: { x: 60, y: 50 } },
      ];
      for (const p of MOCK_POSTAS) {
          await setDoc(doc(db, "postas", p.id), p);
      }
      console.log("Uploaded mock POSTAS.");
    }

    console.log("Checking Vehiculos...");
    const vehiculos = await getDocs(collection(db, "vehiculos"));
    console.log(`Vehiculos count: ${vehiculos.docs.length}`);

    if (vehiculos.docs.length === 0) {
      console.log("Vehiculos is empty. Uploading mock VEHICULOS...");
      const MOCK_VEHICULOS = [
          { id: 'v1', marcaModelo: 'Hyundai H1', patente: 'KRPB-42', capacidadTotal: 12, estado: 'Disponible' },
          { id: 'v2', marcaModelo: 'Toyota Hiace', patente: 'LXST-88', capacidadTotal: 15, estado: 'Disponible' },
          { id: 'v3', marcaModelo: 'Mitsubishi L200', patente: 'PJTY-11', capacidadTotal: 5, estado: 'En Mantención' },
      ];
      for (const v of MOCK_VEHICULOS) {
          await setDoc(doc(db, "vehiculos", v.id), v);
      }
      console.log("Uploaded mock VEHICULOS.");
    }

    console.log("Checking Personal...");
    const personal = await getDocs(collection(db, "personal"));
    console.log(`Personal count: ${personal.docs.length}`);

    if (personal.docs.length === 0) {
      console.log("Personal is empty. Uploading mock PERSONAL...");
      const MOCK_PERSONAL = [
          { id: 'p1', nombre: 'Dr. Ricardo Soto', especialidad: 'Médico', disponibilidad: true },
          { id: 'p2', nombre: 'Ana María Rojas', especialidad: 'TENS', disponibilidad: true },
          { id: 'p3', nombre: 'Juan Pérez', especialidad: 'Kinesiólogo', disponibilidad: true },
          { id: 'p4', nombre: 'Clara Valenzuela', especialidad: 'Matrona', disponibilidad: true },
          { id: 'p5', nombre: 'Pedro Montes', especialidad: 'Odontólogo', disponibilidad: true },
          { id: 'p6', nombre: 'Lucía Méndez', especialidad: 'TENS', disponibilidad: true },
          { id: 'p7', nombre: 'Roberto Cuevas', especialidad: 'Médico', disponibilidad: true },
          { id: 'p8', nombre: 'Carlos Guzmán', especialidad: 'Conductor', disponibilidad: true },
      ];
      for (const p of MOCK_PERSONAL) {
          await setDoc(doc(db, "personal", p.id), p);
      }
      console.log("Uploaded mock PERSONAL.");
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
