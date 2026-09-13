import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, isMockMode } from './firebase.js';

// Datos iniciales de demostración con insumos típicos de costura
let localFabrics = [
  { id: 'f1', name: 'Lino Rústico Crudo', category: 'tela', meters: 5.5, pricePerMeter: 140, supplier: 'Telas Parisina', color: 'Beige Arena' },
  { id: 'f2', name: 'Popelina 100% Algodón', category: 'tela', meters: 12.0, pricePerMeter: 65, supplier: 'Modatelas', color: 'Azul Marino' },
  { id: 'f3', name: 'Raso / Satín Novia', category: 'tela', meters: 3.2, pricePerMeter: 180, supplier: 'Distribuidora La Seda', color: 'Blanco Perla' },
];

let localThreads = [
  { id: 't1', name: 'Hilo Poliéster 40/2 (5000m)', category: 'hilo', quantity: 4, unitPrice: 45, color: 'Blanco' },
  { id: 't2', name: 'Hilo Poliéster 40/2 (5000m)', category: 'hilo', quantity: 2, unitPrice: 45, color: 'Negro' },
  { id: 't3', name: 'Cierre Invisible 20cm', category: 'merceria', quantity: 8, unitPrice: 12, color: 'Surtido' },
  { id: 't4', name: 'Botón Nácar 4 orificios', category: 'merceria', quantity: 30, unitPrice: 3.5, color: 'Natural' },
  { id: 't5', name: 'Entretela Termoadhesiva', category: 'merceria', quantity: 6.0, unitPrice: 28, color: 'Blanco' },
];

export const inventoryService = {
  // Telas
  async getFabrics() {
    if (isMockMode || !db) return [...localFabrics];
    try {
      const colRef = collection(db, 'fabrics');
      const snap = await getDocs(colRef);
      if (snap.empty) return [...localFabrics];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.log('ℹ️ Usando inventario local de telas:', e.message);
      return [...localFabrics];
    }
  },

  async addFabric(fabric) {
    const newFabric = {
      ...fabric,
      createdAt: new Date().toISOString(),
      meters: Number(fabric.meters) || 0,
      pricePerMeter: Number(fabric.pricePerMeter) || 0,
    };

    if (isMockMode || !db) {
      const item = { id: 'f_' + Date.now(), ...newFabric };
      localFabrics.unshift(item);
      return item;
    }

    try {
      const docRef = await addDoc(collection(db, 'fabrics'), newFabric);
      return { id: docRef.id, ...newFabric };
    } catch (e) {
      const item = { id: 'f_' + Date.now(), ...newFabric };
      localFabrics.unshift(item);
      return item;
    }
  },

  async deleteFabric(id) {
    localFabrics = localFabrics.filter(f => f.id !== id);
    if (!isMockMode && db) {
      try {
        await deleteDoc(doc(db, 'fabrics', id));
      } catch (e) {
        console.log('ℹ️ Error al borrar tela de Firestore:', e.message);
      }
    }
    return true;
  },

  // Hilos y Mercería
  async getThreads() {
    if (isMockMode || !db) return [...localThreads];
    try {
      const colRef = collection(db, 'threads');
      const snap = await getDocs(colRef);
      if (snap.empty) return [...localThreads];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.log('ℹ️ Usando hilos/mercería local:', e.message);
      return [...localThreads];
    }
  },

  async addThread(item) {
    const newItem = {
      ...item,
      createdAt: new Date().toISOString(),
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    };

    if (isMockMode || !db) {
      const created = { id: 't_' + Date.now(), ...newItem };
      localThreads.unshift(created);
      return created;
    }

    try {
      const docRef = await addDoc(collection(db, 'threads'), newItem);
      return { id: docRef.id, ...newItem };
    } catch (e) {
      const created = { id: 't_' + Date.now(), ...newItem };
      localThreads.unshift(created);
      return created;
    }
  },

  async deleteThread(id) {
    localThreads = localThreads.filter(t => t.id !== id);
    if (!isMockMode && db) {
      try {
        await deleteDoc(doc(db, 'threads', id));
      } catch (e) {
        console.log('ℹ️ Error al borrar insumo:', e.message);
      }
    }
    return true;
  },

  // Descuento automático de materiales por confección
  async deductMaterial({ name, quantity, isFabric = false }) {
    const qty = Number(quantity) || 0;
    if (qty <= 0) return;

    if (isFabric) {
      // Buscar en telas por coincidencia de nombre
      const fabric = localFabrics.find(f => f.name.toLowerCase().includes((name || '').toLowerCase()));
      if (fabric) {
        const newMeters = Math.max(0, Math.round((fabric.meters - qty) * 100) / 100);
        fabric.meters = newMeters;
        if (!isMockMode && db && fabric.id && !fabric.id.startsWith('f_')) {
          try {
            await updateDoc(doc(db, 'fabrics', fabric.id), { meters: newMeters });
          } catch (e) {
            console.log('Error descontando tela en Firestore:', e.message);
          }
        }
      }
    } else {
      // Buscar en hilos y mercería
      const thread = localThreads.find(t => t.name.toLowerCase().includes((name || '').toLowerCase()));
      if (thread) {
        const newQty = Math.max(0, Math.round((thread.quantity - qty) * 100) / 100);
        thread.quantity = newQty;
        if (!isMockMode && db && thread.id && !thread.id.startsWith('t_')) {
          try {
            await updateDoc(doc(db, 'threads', thread.id), { quantity: newQty });
          } catch (e) {
            console.log('Error descontando mercería en Firestore:', e.message);
          }
        }
      }
    }
  }
};
