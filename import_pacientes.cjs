const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc } = require('firebase/firestore');

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

const excelDateToJSDate = (serial) => {
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
};

async function importData() {
    const filePath = path.join(process.cwd(), 'PACIENTES PAD.xlsx');
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    // 1. Get existing postas to map Establecimiento names to IDs
    const postasSnapshot = await getDocs(collection(db, 'postas'));
    const postasMap = {};
    postasSnapshot.forEach(doc => {
        postasMap[doc.data().nombre.toLowerCase()] = doc.id;
    });

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    let count = 0;
    for (const row of jsonData) {
        const rut = row['RUT'] ? row['RUT'].toString().trim() : '';
        if (!rut) continue;

        const nombre = row['NOMBRE USUARIO (A)'] || '';
        const fechaSerial = row['FECHA NACIMIENTO'];
        const fechaNacimiento = typeof fechaSerial === 'number' ? excelDateToJSDate(fechaSerial) : '';
        
        const sexoRaw = (row['SEXO'] || '').toUpperCase();
        const sexo = sexoRaw.startsWith('F') ? 'F' : sexoRaw.startsWith('M') ? 'M' : 'Otro';

        const calle = row['CALLE'] || '';
        const numDomicilio = row['N° \r\nDOMICILIO'] || row['N° DOMICILIO'] || row['DOMICILIO'] || '';

        // Handle telephones (split by ' - ', ',', or just string)
        const telRaw = (row['TELEFONO'] || '').toString();
        const telefonos = telRaw.split(/[-,\/]/).map(t => t.trim()).filter(t => t !== '').slice(0, 3);

        const sectorRaw = (row['SECTOR'] || '').toUpperCase();
        const sector = sectorRaw.includes('2') ? 'Sector 2' : 'Sector 1';

        const estNombre = (row['ESTABLECIMIENTO'] || '').toLowerCase();
        const establecimientoId = postasMap[estNombre] || '';

        const urRaw = (row['URBANO/\r\nRURAL'] || row['URBANO/RURAL'] || '').toUpperCase();
        const urbanoRural = urRaw.includes('RURAL') ? 'Rural' : 'Urbano';

        const depRaw = (row['DEPENDENCIA'] || '').toUpperCase();
        const dependencia = depRaw.includes('SEVERA') ? 'Severa' : depRaw.includes('MODERADA') ? 'Moderada' : 'Leve';

        const id = Math.random().toString(36).substr(2, 9);

        const paciente = {
            id,
            rut,
            nombre,
            fechaNacimiento,
            sexo,
            calle,
            numeroDomicilio: numDomicilio.toString(),
            telefonos,
            sector,
            establecimientoId,
            urbanoRural,
            dependencia
        };

        try {
            await setDoc(doc(db, 'pacientes', id), paciente);
            count++;
            if (count % 10 === 0) console.log(`Imported ${count} patients...`);
        } catch (err) {
            console.error(`Error importing RU ${rut}:`, err);
        }
    }

    console.log(`Successfully imported ${count} patients!`);
    process.exit(0);
}

importData();
