import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, isMockMode } from './firebase.js';

let localSuppliers = [
  {
    id: 's1',
    name: 'Telas Parisina Centro',
    phone: '55 1234 5678',
    address: 'Av. Hidalgo #104, Col. Centro',
    notes: 'Excelente precio en Popelinas y Tergal. Descuento con membresía.',
    catalog: [
      { material: 'Lino Rústico', price: 140, unit: 'metro' },
      { material: 'Popelina Algodón', price: 72, unit: 'metro' },
      { material: 'Tergal Catalán', price: 85, unit: 'metro' },
      { material: 'Hilo Cono 5000m', price: 48, unit: 'pieza' },
    ]
  },
  {
    id: 's2',
    name: 'Modatelas Sucursal Norte',
    phone: '55 8765 4321',
    address: 'Plaza del Sol, Local 12',
    notes: 'Mejor surtido en encajes, rasos y pedrería fina.',
    catalog: [
      { material: 'Lino Rústico', price: 155, unit: 'metro' },
      { material: 'Popelina Algodón', price: 65, unit: 'metro' },
      { material: 'Tergal Catalán', price: 82, unit: 'metro' },
      { material: 'Hilo Cono 5000m', price: 45, unit: 'pieza' },
    ]
  },
  {
    id: 's3',
    name: 'Mercería y Pasamanería El Dedal',
    phone: '55 5555 1212',
    address: 'Calle Mayor #45',
    notes: 'Tienen todos los botones, cierres metálicos e invisibles, y elásticos.',
    catalog: [
      { material: 'Cierre Invisible 20cm', price: 10, unit: 'pieza' },
      { material: 'Entretela Termoadhesiva', price: 24, unit: 'metro' },
      { material: 'Hilo Cono 5000m', price: 42, unit: 'pieza' },
    ]
  }
];

export const supplierService = {
  async getSuppliers() {
    if (isMockMode || !db) return [...localSuppliers];
    try {
      const snap = await getDocs(collection(db, 'suppliers'));
      if (snap.empty) return [...localSuppliers];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.log('ℹ️ Usando proveedores locales:', e.message);
      return [...localSuppliers];
    }
  },

  async addSupplier(supplier) {
    const newSup = {
      ...supplier,
      createdAt: new Date().toISOString(),
      pricePerUnit: Number(supplier.pricePerUnit) || 0,
    };

    if (isMockMode || !db) {
      const item = { id: 's_' + Date.now(), ...newSup };
      localSuppliers.unshift(item);
      return item;
    }

    try {
      const ref = await addDoc(collection(db, 'suppliers'), newSup);
      return { id: ref.id, ...newSup };
    } catch (e) {
      const item = { id: 's_' + Date.now(), ...newSup };
      localSuppliers.unshift(item);
      return item;
    }
  },

  async deleteSupplier(id) {
    localSuppliers = localSuppliers.filter(s => s.id !== id);
    if (!isMockMode && db) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
      } catch (e) {
        console.log('ℹ️ Error borrando proveedor:', e.message);
      }
    }
    return true;
  },

  /**
   * Compara los precios de un material entre todos los proveedores
   * Devuelve la lista ordenada del más barato al más costoso
   */
  async compareMaterialPrices(materialQuery) {
    const suppliers = await this.getSuppliers();
    const results = [];

    const queryLower = (materialQuery || '').toLowerCase().trim();

    suppliers.forEach(sup => {
      (sup.catalog || []).forEach(item => {
        if (!queryLower || item.material.toLowerCase().includes(queryLower)) {
          results.push({
            supplierId: sup.id,
            supplierName: sup.name,
            supplierPhone: sup.phone,
            material: item.material,
            price: item.price,
            unit: item.unit,
          });
        }
      });
    });

    // Ordenar de menor a mayor precio (mejor oferta primero)
    return results.sort((a, b) => a.price - b.price);
  }
};
