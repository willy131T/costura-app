import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, isMockMode } from './firebase.js';

let localClients = [
  {
    id: 'c1',
    name: 'Sra. Carmen Morales',
    phone: '55 9876 5432',
    notes: 'Vestido de gala para boda en noviembre',
    measurements: {
      busto: '96 cm',
      cintura: '78 cm',
      cadera: '104 cm',
      largoTalle: '42 cm',
      largoFalda: '95 cm',
      espalda: '38 cm'
    }
  },
  {
    id: 'c2',
    name: 'Lucía Méndez',
    phone: '55 4321 8765',
    notes: 'Ajuste de vestidos y faldas escolares',
    measurements: {
      busto: '88 cm',
      cintura: '68 cm',
      cadera: '92 cm',
      largoTalle: '39 cm',
      largoFalda: '60 cm',
      espalda: '35 cm'
    }
  }
];

export const clientService = {
  async getClients() {
    if (isMockMode || !db) return [...localClients];
    try {
      const snap = await getDocs(collection(db, 'clients'));
      if (snap.empty) return [...localClients];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.log('ℹ️ Usando clientas locales:', e.message);
      return [...localClients];
    }
  },

  async addClient(clientData) {
    const item = {
      ...clientData,
      createdAt: new Date().toISOString(),
    };

    if (isMockMode || !db) {
      const created = { id: 'c_' + Date.now(), ...item };
      localClients.unshift(created);
      return created;
    }

    try {
      const ref = await addDoc(collection(db, 'clients'), item);
      return { id: ref.id, ...item };
    } catch (e) {
      const created = { id: 'c_' + Date.now(), ...item };
      localClients.unshift(created);
      return created;
    }
  },

  async deleteClient(id) {
    localClients = localClients.filter(c => c.id !== id);
    if (!isMockMode && db) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (e) {
        console.log('ℹ️ Error borrando clienta:', e.message);
      }
    }
    return true;
  }
};
