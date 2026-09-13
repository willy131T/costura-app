import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, isMockMode } from './firebase.js';

let localPortfolio = [
  {
    id: 'port_1',
    title: 'Vestido de XV Años Corte Princesa',
    category: 'XV Años',
    approxPrice: 4500,
    description: 'Falda amplia en tul escarchado con corsé bordado a mano con pedrería y cintas ajustables en espalda.',
    photoUri: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'port_2',
    title: 'Vestido de Novia Encaje y Cauda',
    category: 'Novias',
    approxPrice: 6200,
    description: 'Corte sirena en satín nupcial, mangas ilusión con encaje chantilly y cauda desmontable de 2 metros.',
    photoUri: 'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'port_3',
    title: 'Vestido de Gala Escote Asimétrico',
    category: 'Gala / Fiesta',
    approxPrice: 2800,
    description: 'Confeccionado en satín stretch color esmeralda con abertura lateral y drapeado fino en cintura.',
    photoUri: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'port_4',
    title: 'Traje Sastre Dama Ejecutivo',
    category: 'Sastrería',
    approxPrice: 1950,
    description: 'Saco con solapa clásica, forro de tafetán y hombreras suaves, acompañado de pantalón recto de tiro alto.',
    photoUri: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  }
];

export const PORTFOLIO_CATEGORIES = [
  'Todos',
  'XV Años',
  'Novias',
  'Gala / Fiesta',
  'Sastrería',
  'Comunión / Bautizo',
  'Disfraces',
];

export const portfolioService = {
  async getPortfolio() {
    if (isMockMode || !db) return [...localPortfolio];
    try {
      const snap = await getDocs(collection(db, 'portfolio'));
      if (snap.empty) return [...localPortfolio];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.log('ℹ️ Usando portafolio local:', e.message);
      return [...localPortfolio];
    }
  },

  async addPortfolioItem(itemData) {
    const item = {
      ...itemData,
      createdAt: new Date().toISOString(),
      approxPrice: Number(itemData.approxPrice) || 0,
    };

    if (isMockMode || !db) {
      const created = { id: 'port_' + Date.now(), ...item };
      localPortfolio.unshift(created);
      return created;
    }

    try {
      const ref = await addDoc(collection(db, 'portfolio'), item);
      return { id: ref.id, ...item };
    } catch (e) {
      const created = { id: 'port_' + Date.now(), ...item };
      localPortfolio.unshift(created);
      return created;
    }
  },

  async deletePortfolioItem(id) {
    localPortfolio = localPortfolio.filter(p => p.id !== id);
    if (!isMockMode && db) {
      try {
        await deleteDoc(doc(db, 'portfolio', id));
      } catch (e) {
        console.log('ℹ️ Error borrando del portafolio:', e.message);
      }
    }
    return true;
  }
};
