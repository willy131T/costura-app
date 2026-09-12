import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, isMockMode } from './firebase.js';

let localQuotes = [
  {
    id: 'q1',
    projectName: 'Vestido de Fiesta en Lino y Encaje',
    clientName: 'Sra. Carmen Morales',
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('es-MX'),
    materialsCost: 450.00,
    laborCost: 400.00,
    overheadCost: 85.00,
    profitAmount: 280.50,
    totalQuote: 1215.50,
    suggestedDeposit: 607.75,
    laborHours: 5,
    hourlyRate: 80,
    profitMarginPercent: 30,
    breakdown: {
      toShopSupplies: 535.00,
      toPersonalSalary: 400.00,
      toBusinessProfit: 280.50
    }
  }
];

export const pricingService = {
  /**
   * Calcula el cobro integral asegurando un margen de ganancia real
   */
  calculate({
    materials = [],
    laborHours = 0,
    hourlyRate = 80, // Tarifa base sugerida por hora
    overheadPercent = 10, // 10% de desgaste de taller, agujas y luz
    profitMarginPercent = 30, // 30% de ganancia limpia
  }) {
    // 1. Costo total de materiales
    const materialsCost = materials.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    // 2. Costo de mano de obra
    const hours = Number(laborHours) || 0;
    const rate = Number(hourlyRate) || 0;
    const laborCost = hours * rate;

    // 3. Costo directo
    const directCost = materialsCost + laborCost;

    // 4. Desgaste de máquinas, luz, hilo e imprevistos
    const overheadPct = Number(overheadPercent) || 0;
    const overheadCost = directCost * (overheadPct / 100);

    // 5. Costo base de producción
    const baseCost = directCost + overheadCost;

    // 6. Ganancia neta para el negocio
    const profitPct = Number(profitMarginPercent) || 0;
    const profitAmount = baseCost * (profitPct / 100);

    // 7. Precio final total
    const totalQuote = Math.round((baseCost + profitAmount) * 100) / 100;

    // 8. Anticipo sugerido (50%) para cubrir materiales antes de coser
    const suggestedDeposit = Math.round((totalQuote * 0.5) * 100) / 100;

    // 9. Desglose pedagógico para la costurera
    const breakdown = {
      toShopSupplies: Math.round((materialsCost + overheadCost) * 100) / 100, // Dinero intocable para reponer
      toPersonalSalary: Math.round(laborCost * 100) / 100,                   // Sueldo por sus horas
      toBusinessProfit: Math.round(profitAmount * 100) / 100,                 // Ahorro y ganancia pura
    };

    return {
      materialsCost,
      laborCost,
      overheadCost,
      baseCost,
      profitAmount,
      totalQuote,
      suggestedDeposit,
      laborHours: hours,
      hourlyRate: rate,
      overheadPercent: overheadPct,
      profitMarginPercent: profitPct,
      breakdown,
    };
  },

  async getSavedQuotes() {
    if (isMockMode || !db) return [...localQuotes];
    try {
      const snap = await getDocs(collection(db, 'quotes'));
      if (snap.empty) return [...localQuotes];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback a cotizaciones locales:', e.message);
      return [...localQuotes];
    }
  },

  async saveQuote(quoteData) {
    const item = {
      ...quoteData,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    if (isMockMode || !db) {
      const saved = { id: 'q_' + Date.now(), ...item };
      localQuotes.unshift(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, 'quotes'), item);
      return { id: ref.id, ...item };
    } catch (e) {
      const saved = { id: 'q_' + Date.now(), ...item };
      localQuotes.unshift(saved);
      return saved;
    }
  }
};
